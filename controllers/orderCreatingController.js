/**
 * ORDER CREATING CONTROLLER
 * Connects to Shiprocket API to create orders
 * POST https://apiv2.shiprocket.in/v1/external/orders/create/adhoc
 */

const db     = require('../db/connection');
const https  = require('https');

const SHIPROCKET_BASE = 'apiv2.shiprocket.in';
const SHIPROCKET_PATH = '/v1/external/orders/create/adhoc';

/* ── Call Shiprocket API ── */
function callShiprocket(payload, token) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const options = {
            hostname: SHIPROCKET_BASE,
            path:     SHIPROCKET_PATH,
            method:   'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Shiprocket timeout')); });
        req.write(body);
        req.end();
    });
}

/* ── Generate internal order ID ── */
function genOrderId() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

class OrderCreatingController {

    /**
     * POST /api/orders/create
     * Create order locally + push to Shiprocket
     */
    async createOrder(req, res) {
        try {
            const {
                customer_name, customer_phone, customer_email,
                customer_address, customer_city, customer_state,
                customer_pincode, customer_landmark,
                product_name, unit_price, quantity,
                discount, tax, hsn_code,
                dead_weight, package_type,
                length_cm, breadth_cm, height_cm,
                payment_method, order_type,
            } = req.body;

            // Validate required fields
            if (!customer_name || !customer_phone || !customer_address ||
                !customer_city || !customer_state || !customer_pincode || !product_name) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const order_id     = genOrderId();
            const qty          = Number(quantity) || 1;
            const price        = Number(unit_price) || 0;
            const order_value  = price * qty;
            const vol_weight   = ((Number(length_cm)||10) * (Number(breadth_cm)||10) * (Number(height_cm)||10) / 5000);
            const cod_amount   = payment_method === 'COD' ? order_value : 0;

            // 1. Save to DB first
            await new Promise((resolve, reject) => {
                db.query(
                    `INSERT INTO orders (
                        order_id, customer_name, customer_phone, customer_email,
                        customer_address, customer_city, customer_state, customer_pincode, customer_landmark,
                        product_name, unit_price, quantity, discount, tax, hsn_code,
                        dead_weight, package_type, length_cm, breadth_cm, height_cm, volumetric_weight,
                        payment_method, order_type, order_value, cod_amount, status
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Pending')`,
                    [
                        order_id, customer_name, customer_phone, customer_email || null,
                        customer_address, customer_city, customer_state, customer_pincode, customer_landmark || null,
                        product_name, price, qty, Number(discount)||0, Number(tax)||18, hsn_code || null,
                        Number(dead_weight)||0.5, package_type || 'Standard Corrugated Box',
                        Number(length_cm)||10, Number(breadth_cm)||10, Number(height_cm)||10, vol_weight,
                        payment_method === 'COD' ? 'COD' : 'Prepaid',
                        order_type || 'domestic', order_value, cod_amount,
                    ],
                    (err, result) => err ? reject(err) : resolve(result)
                );
            });

            // 2. Push to Shiprocket
            const token = process.env.SHIPROCKET_API_TOKEN || process.env.DELIVERY_API_TOKEN;

            if (!token) {
                return res.json({
                    success: true,
                    message: 'Order saved locally. Shiprocket token not configured.',
                    data: { order_id, shiprocket: null }
                });
            }

            const srPayload = {
                order_id,
                order_date:        new Date().toISOString().split('T')[0],
                pickup_location:   'Primary',
                channel_id:        '',
                comment:           '',
                billing_customer_name:  customer_name,
                billing_last_name:      '',
                billing_address:        customer_address,
                billing_address_2:      customer_landmark || '',
                billing_city:           customer_city,
                billing_pincode:        customer_pincode,
                billing_state:          customer_state,
                billing_country:        'India',
                billing_email:          customer_email || '',
                billing_phone:          customer_phone,
                shipping_is_billing:    true,
                order_items: [{
                    name:       product_name,
                    sku:        hsn_code || order_id,
                    units:      qty,
                    selling_price: price,
                    discount:   Number(discount) || 0,
                    tax:        Number(tax) || 18,
                    hsn:        hsn_code || '',
                }],
                payment_method:    payment_method === 'COD' ? 'COD' : 'Prepaid',
                shipping_charges:  0,
                giftwrap_charges:  0,
                transaction_charges: 0,
                total_discount:    0,
                sub_total:         order_value,
                length:            Number(length_cm) || 10,
                breadth:           Number(breadth_cm) || 10,
                height:            Number(height_cm) || 10,
                weight:            Number(dead_weight) || 0.5,
            };

            const srResult = await callShiprocket(srPayload, token);
            console.log('[Shiprocket] Response:', srResult.status, JSON.stringify(srResult.body).substring(0, 300));

            // 3. Update DB with Shiprocket response
            if (srResult.status === 200 || srResult.status === 201) {
                const srBody = srResult.body;
                await new Promise((resolve) => {
                    db.query(
                        `UPDATE orders SET
                            shiprocket_order_id = ?,
                            shiprocket_shipment_id = ?,
                            channel_order_id = ?,
                            status = 'Created',
                            shiprocket_response = ?
                         WHERE order_id = ?`,
                        [
                            srBody.order_id || null,
                            srBody.shipment_id || null,
                            srBody.channel_order_id || null,
                            JSON.stringify(srBody),
                            order_id,
                        ],
                        (err) => { if (err) console.error('[DB] Update error:', err); resolve(); }
                    );
                });

                return res.json({
                    success: true,
                    message: 'Order created successfully',
                    data: {
                        order_id,
                        shiprocket_order_id:    srBody.order_id,
                        shiprocket_shipment_id: srBody.shipment_id,
                        status: 'Created',
                    }
                });
            } else {
                // Shiprocket failed — order still saved locally
                await new Promise((resolve) => {
                    db.query(
                        `UPDATE orders SET shiprocket_response = ?, status = 'SR_Failed' WHERE order_id = ?`,
                        [JSON.stringify(srResult.body), order_id],
                        () => resolve()
                    );
                });

                return res.json({
                    success: true,
                    message: 'Order saved locally. Shiprocket error: ' + (srResult.body?.message || srResult.status),
                    data: { order_id, shiprocket_error: srResult.body }
                });
            }

        } catch (error) {
            console.error('[createOrder] Error:', error);
            res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
        }
    }

    /**
     * GET /api/orders
     * Get all orders with pagination
     */
    async getOrders(req, res) {
        try {
            const page   = parseInt(req.query.page  || 1);
            const limit  = parseInt(req.query.limit || 20);
            const search = req.query.search || '';
            const status = req.query.status || '';
            const offset = (page - 1) * limit;

            let where = 'WHERE 1=1';
            const params = [];

            if (search) {
                where += ' AND (customer_name LIKE ? OR customer_phone LIKE ? OR order_id LIKE ? OR product_name LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (status) {
                where += ' AND status = ?';
                params.push(status);
            }

            const rows = await new Promise((resolve, reject) => {
                db.query(
                    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
                    [...params, limit, offset],
                    (err, results) => err ? reject(err) : resolve(results)
                );
            });

            const total = await new Promise((resolve, reject) => {
                db.query(
                    `SELECT COUNT(*) AS total FROM orders ${where}`,
                    params,
                    (err, results) => err ? reject(err) : resolve(results[0].total)
                );
            });

            res.json({
                success: true,
                data: {
                    orders: rows,
                    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
                }
            });
        } catch (error) {
            console.error('[getOrders] Error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
        }
    }

    /**
     * GET /api/orders/:id
     * Get single order
     */
    async getOrder(req, res) {
        try {
            const { id } = req.params;
            const rows = await new Promise((resolve, reject) => {
                db.query('SELECT * FROM orders WHERE order_id = ? OR id = ?', [id, id],
                    (err, results) => err ? reject(err) : resolve(results));
            });
            if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
            res.json({ success: true, data: rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new OrderCreatingController();
