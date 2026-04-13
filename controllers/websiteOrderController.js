const db = require('../db/connection');

class WebsiteOrderController {
    // Create new order
    async createOrder(req, res) {
        try {
            const {
                cartItems,
                shippingAddress,
                billingAddress,
                paymentMethod,
                notes
            } = req.body;

            // Validate required fields
            if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart items are required'
                });
            }

            if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || !shippingAddress.addressLine1) {
                return res.status(400).json({
                    success: false,
                    message: 'Complete shipping address is required'
                });
            }

            if (!paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment method is required'
                });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // Generate order number
            const timestamp = Date.now();
            const orderNumber = `ORD-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;

            // Calculate total amount
            let totalAmount = 0;
            const orderItems = [];

            // Validate cart items and calculate total
            for (const item of cartItems) {
                if (!item.productId || !item.quantity || item.quantity <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid cart item data'
                    });
                }

                // Get product details
                const productQuery = `
                    SELECT id, product_name, price, offer_price, image_url, stock_quantity
                    FROM website_products 
                    WHERE id = ? AND is_active = TRUE
                `;

                const productResult = await new Promise((resolve, reject) => {
                    db.query(productQuery, [item.productId], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                if (productResult.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Product not found: ${item.productId}`
                    });
                }

                const product = productResult[0];

                // Check stock availability
                if (product.stock_quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for product: ${product.product_name}`
                    });
                }

                const unitPrice = product.offer_price && product.offer_price < product.price 
                    ? product.offer_price 
                    : product.price;
                const itemTotal = unitPrice * item.quantity;

                orderItems.push({
                    productId: item.productId,
                    productName: product.product_name,
                    productImage: product.image_url,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                    totalPrice: itemTotal,
                    customization: item.customization || null
                });

                totalAmount += itemTotal;
            }

            // Create order
            const orderQuery = `
                INSERT INTO website_orders (
                    id, user_id, order_number, status, total_amount, currency,
                    payment_status, payment_method, shipping_address, billing_address,
                    order_date, estimated_delivery, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const orderId = `order_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 7); // 7 days from now

            const orderResult = await new Promise((resolve, reject) => {
                db.query(orderQuery, [
                    orderId,
                    userId,
                    orderNumber,
                    'pending',
                    totalAmount,
                    'USD',
                    'pending',
                    paymentMethod,
                    JSON.stringify(shippingAddress),
                    JSON.stringify(billingAddress || shippingAddress),
                    new Date(),
                    estimatedDelivery,
                    notes || null,
                    new Date()
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            // Create order items
            for (const item of orderItems) {
                const itemQuery = `
                    INSERT INTO website_order_items (
                        id, order_id, product_id, product_name, product_image,
                        quantity, unit_price, total_price, customization, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const itemId = `item_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;

                await new Promise((resolve, reject) => {
                    db.query(itemQuery, [
                        itemId,
                        orderId,
                        item.productId,
                        item.productName,
                        item.productImage,
                        item.quantity,
                        item.unitPrice,
                        item.totalPrice,
                        item.customization ? JSON.stringify(item.customization) : null,
                        new Date()
                    ], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                // Update product stock
                const updateStockQuery = `
                    UPDATE website_products 
                    SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                await new Promise((resolve, reject) => {
                    db.query(updateStockQuery, [item.quantity, item.productId], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            }

            res.status(201).json({
                success: true,
                data: {
                    orderId: orderId,
                    orderNumber: orderNumber,
                    totalAmount: totalAmount,
                    status: 'pending',
                    estimatedDelivery: estimatedDelivery.toISOString()
                }
            });

        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create order',
                error: error.message
            });
        }
    }

    // Get user orders with pagination
    async getUserOrders(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                status = '',
                sortBy = 'order_date',
                sortOrder = 'DESC'
            } = req.query;

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            const offset = (page - 1) * limit;
            
            let whereConditions = ['o.user_id = ?'];
            let queryParams = [userId];

            // Status filter
            if (status) {
                whereConditions.push('o.status = ?');
                queryParams.push(status);
            }

            const whereClause = whereConditions.join(' AND ');

            // Valid sort columns
            const validSortColumns = ['order_date', 'total_amount', 'status', 'order_number'];
            const validSortOrders = ['ASC', 'DESC'];
            
            const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'order_date';
            const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

            // Count query
            const countQuery = `
                SELECT COUNT(*) as total
                FROM website_orders o
                WHERE ${whereClause}
            `;

            const countResult = await new Promise((resolve, reject) => {
                db.query(countQuery, queryParams, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            const total = countResult[0]?.total || 0;

            // Main query
            const mainQueryParams = [...queryParams, parseInt(limit), parseInt(offset)];

            const query = `
                SELECT 
                    o.id,
                    o.order_number,
                    o.status,
                    o.total_amount,
                    o.currency,
                    o.payment_status,
                    o.payment_method,
                    o.order_date,
                    o.estimated_delivery,
                    o.actual_delivery,
                    o.tracking_number,
                    o.notes,
                    o.created_at,
                    o.updated_at,
                    COUNT(oi.id) as item_count
                FROM website_orders o
                LEFT JOIN website_order_items oi ON o.id = oi.order_id
                WHERE ${whereClause}
                GROUP BY o.id
                ORDER BY o.${sortColumn} ${sortDirection}
                LIMIT ? OFFSET ?
            `;

            const orders = await new Promise((resolve, reject) => {
                db.query(query, mainQueryParams, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            res.json({
                success: true,
                data: {
                    orders: orders || [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalOrders: total,
                        hasNext: (page * limit) < total,
                        hasPrev: page > 1
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching user orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders',
                error: error.message
            });
        }
    }

    // Get order details
    async getOrderDetails(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // Get order details
            const orderQuery = `
                SELECT 
                    o.*,
                    COALESCE(u.name, u.email) as username,
                    u.email as user_email
                FROM website_orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ? AND o.user_id = ?
            `;

            const orderResult = await new Promise((resolve, reject) => {
                db.query(orderQuery, [orderId, userId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            if (orderResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const order = orderResult[0];

            // Parse JSON fields
            if (order.shipping_address) {
                order.shipping_address = JSON.parse(order.shipping_address);
            }
            if (order.billing_address) {
                order.billing_address = JSON.parse(order.billing_address);
            }

            // Get order items
            const itemsQuery = `
                SELECT 
                    oi.*,
                    p.image_url as current_product_image,
                    p.is_active as product_active
                FROM website_order_items oi
                LEFT JOIN website_products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
                ORDER BY oi.created_at
            `;

            const items = await new Promise((resolve, reject) => {
                db.query(itemsQuery, [orderId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            // Parse customization JSON
            order.items = items.map(item => ({
                ...item,
                customization: item.customization ? JSON.parse(item.customization) : null
            }));

            res.json({
                success: true,
                data: order
            });

        } catch (error) {
            console.error('Error fetching order details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order details',
                error: error.message
            });
        }
    }

    // Update order status (Admin only)
    async updateOrderStatus(req, res) {
        try {
            const { orderId } = req.params;
            const { status, trackingNumber, notes } = req.body;

            // Validate status
            const validStatuses = [
                'pending', 
                'confirmed', 
                'payment_verification',
                'processing', 
                'shipped', 
                'in_transit',
                'out_for_delivery',
                'delivered', 
                'cancelled',
                'refunded'
            ];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order status'
                });
            }

            // Check if order exists
            const orderCheck = await new Promise((resolve, reject) => {
                db.query('SELECT id, status FROM website_orders WHERE id = ?', [orderId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            if (orderCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Update order
            const updateQuery = `
                UPDATE website_orders 
                SET status = ?, tracking_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await new Promise((resolve, reject) => {
                db.query(updateQuery, [status, trackingNumber || null, notes || null, orderId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            res.json({
                success: true,
                data: {
                    orderId: orderId,
                    status: status,
                    updatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error.message
            });
        }
    }

    // Cancel order
    async cancelOrder(req, res) {
        try {
            const { orderId } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // Check if order exists and belongs to user
            const orderCheck = await new Promise((resolve, reject) => {
                db.query('SELECT id, status, user_id FROM website_orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            if (orderCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const order = orderCheck[0];

            // Check if order can be cancelled
            if (!['pending', 'confirmed'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Order cannot be cancelled at this stage'
                });
            }

            // Update order status
            const updateQuery = `
                UPDATE website_orders 
                SET status = 'cancelled', notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await new Promise((resolve, reject) => {
                db.query(updateQuery, [reason || 'Cancelled by customer', orderId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            // Restore product stock
            const itemsQuery = 'SELECT product_id, quantity FROM website_order_items WHERE order_id = ?';
            const items = await new Promise((resolve, reject) => {
                db.query(itemsQuery, [orderId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            for (const item of items) {
                const restoreStockQuery = `
                    UPDATE website_products 
                    SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                await new Promise((resolve, reject) => {
                    db.query(restoreStockQuery, [item.quantity, item.product_id], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            }

            res.json({
                success: true,
                data: {
                    orderId: orderId,
                    status: 'cancelled',
                    refundStatus: 'pending',
                    cancelledAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error cancelling order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order',
                error: error.message
            });
        }
    }

    // Track order
    async trackOrder(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // Get order tracking info
            const orderQuery = `
                SELECT 
                    id, order_number, status, tracking_number, 
                    estimated_delivery, actual_delivery, created_at, updated_at
                FROM website_orders 
                WHERE id = ? AND user_id = ?
            `;

            const orderResult = await new Promise((resolve, reject) => {
                db.query(orderQuery, [orderId, userId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            if (orderResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const order = orderResult[0];

            // Generate tracking history based on status
            const trackingHistory = this.generateTrackingHistory(order);

            res.json({
                success: true,
                data: {
                    orderId: order.id,
                    orderNumber: order.order_number,
                    status: order.status,
                    trackingNumber: order.tracking_number,
                    trackingUrl: order.tracking_number ? `https://tracking.example.com/${order.tracking_number}` : null,
                    estimatedDelivery: order.estimated_delivery,
                    trackingHistory: trackingHistory
                }
            });

        } catch (error) {
            console.error('Error tracking order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to track order',
                error: error.message
            });
        }
    }

    // Helper method to generate tracking history
    generateTrackingHistory(order) {
        const history = [];
        const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
        const currentStatusIndex = statuses.indexOf(order.status);

        for (let i = 0; i <= currentStatusIndex; i++) {
            const status = statuses[i];
            let description = '';
            let timestamp = order.created_at;

            switch (status) {
                case 'pending':
                    description = 'Order placed and awaiting confirmation';
                    timestamp = order.created_at;
                    break;
                case 'confirmed':
                    description = 'Order confirmed and payment verified';
                    timestamp = new Date(new Date(order.created_at).getTime() + 30 * 60000); // +30 minutes
                    break;
                case 'processing':
                    description = 'Order is being prepared';
                    timestamp = new Date(new Date(order.created_at).getTime() + 2 * 60 * 60000); // +2 hours
                    break;
                case 'shipped':
                    description = 'Order has been shipped';
                    timestamp = new Date(new Date(order.created_at).getTime() + 24 * 60 * 60000); // +1 day
                    break;
                case 'delivered':
                    description = 'Order has been delivered';
                    timestamp = order.actual_delivery || new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60000); // +7 days
                    break;
            }

            history.push({
                status: status,
                description: description,
                location: 'Processing Center',
                timestamp: timestamp
            });
        }

        return history;
    }

    // Get order statistics (Admin only)
    async getOrderStats(req, res) {
        try {
            const statsQuery = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                    SUM(CASE WHEN status = 'completed' OR status = 'delivered' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                    SUM(total_amount) as total_revenue
                FROM website_orders
            `;

            const result = await new Promise((resolve, reject) => {
                db.query(statsQuery, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            const stats = result[0] || {
                total: 0,
                pending: 0,
                processing: 0,
                completed: 0,
                cancelled: 0,
                total_revenue: 0
            };

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error fetching order stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order statistics',
                error: error.message
            });
        }
    }

    // Get all orders (Admin only)
    async getAllOrders(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                status = '',
                sortBy = 'order_date',
                sortOrder = 'DESC',
                search = ''
            } = req.query;

            const offset = (page - 1) * limit;
            
            let whereConditions = [];
            let queryParams = [];

            // Status filter
            if (status) {
                whereConditions.push('o.status = ?');
                queryParams.push(status);
            }

            // Search filter
            if (search) {
                whereConditions.push('(o.order_number LIKE ? OR wc.name LIKE ? OR wc.email LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Valid sort columns
            const validSortColumns = ['order_date', 'total_amount', 'status', 'order_number'];
            const validSortOrders = ['ASC', 'DESC'];
            
            const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'order_date';
            const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

            // Count query
            const countQuery = `
                SELECT COUNT(*) as total
                FROM website_orders o
                LEFT JOIN website_customers wc ON CAST(o.user_id AS UNSIGNED) = wc.id
                ${whereClause}
            `;

            const countResult = await new Promise((resolve, reject) => {
                db.query(countQuery, queryParams, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            const total = countResult[0]?.total || 0;

            // Main query
            const mainQueryParams = [...queryParams, parseInt(limit), parseInt(offset)];

            const query = `
                SELECT 
                    o.id,
                    o.order_number,
                    o.status,
                    o.total_amount,
                    o.currency,
                    o.payment_status,
                    o.payment_method,
                    o.order_date,
                    o.estimated_delivery,
                    o.actual_delivery,
                    o.tracking_number,
                    o.shipping_address,
                    o.billing_address,
                    o.created_at,
                    o.updated_at,
                    o.user_id,
                    wc.name as username,
                    wc.email as user_email,
                    wc.phone as user_phone,
                    COUNT(oi.id) as item_count
                FROM website_orders o
                LEFT JOIN website_customers wc ON CAST(o.user_id AS UNSIGNED) = wc.id
                LEFT JOIN website_order_items oi ON o.id = oi.order_id
                ${whereClause}
                GROUP BY o.id, o.order_number, o.status, o.total_amount, o.currency, 
                         o.payment_status, o.payment_method, o.order_date, o.estimated_delivery, 
                         o.actual_delivery, o.tracking_number, o.shipping_address, o.billing_address, 
                         o.created_at, o.updated_at, o.user_id, wc.name, wc.email, wc.phone
                ORDER BY o.${sortColumn} ${sortDirection}
                LIMIT ? OFFSET ?
            `;

            const orders = await new Promise((resolve, reject) => {
                db.query(query, mainQueryParams, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            // Fetch product details for each order
            // Note: product_name is already stored in website_order_items table
            const ordersWithProducts = await Promise.all(orders.map(async (order) => {
                const productsQuery = `
                    SELECT 
                        product_id,
                        product_name,
                        quantity,
                        unit_price,
                        total_price,
                        customization
                    FROM website_order_items
                    WHERE order_id = ?
                `;
                
                const products = await new Promise((resolve, reject) => {
                    db.query(productsQuery, [order.id], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                // Parse customization JSON for each product
                const productsWithCustomization = products.map(product => {
                    let customization = null;
                    
                    if (product.customization) {
                        try {
                            // Check if it's already an object or a string
                            if (typeof product.customization === 'object' && product.customization !== null) {
                                // Already an object, use as-is
                                customization = product.customization;
                            } else if (typeof product.customization === 'string') {
                                // Try to parse string
                                customization = JSON.parse(product.customization);
                            }
                        } catch (error) {
                            console.error(`[ERROR] Failed to parse customization for product ${product.product_id}:`, error);
                            // If parsing fails, keep as null
                            customization = null;
                        }
                    }
                    
                    return {
                        ...product,
                        customization
                    };
                });

                console.log(`[DEBUG] Order ${order.order_number} products:`, JSON.stringify(productsWithCustomization));

                return {
                    ...order,
                    products: productsWithCustomization || []
                };
            }));

            // Parse shipping address JSON and extract customer info
            const ordersWithCustomerInfo = ordersWithProducts.map(order => {
                let customerName = order.username || 'N/A';
                let customerEmail = order.user_email || 'N/A';
                let customerPhone = 'N/A';
                let shippingAddressText = 'N/A';

                if (order.shipping_address) {
                    try {
                        const shippingAddr = typeof order.shipping_address === 'string' 
                            ? JSON.parse(order.shipping_address) 
                            : order.shipping_address;
                        
                        console.log(`[DEBUG] Order ${order.order_number} shipping_address:`, shippingAddr);
                        
                        // Try multiple possible field names for customer data
                        customerName = shippingAddr.name || shippingAddr.fullName || shippingAddr.customerName || 
                                      shippingAddr.firstName + ' ' + (shippingAddr.lastName || '') || 
                                      order.username || 'N/A';
                        
                        customerEmail = shippingAddr.email || shippingAddr.customerEmail || 
                                       order.user_email || 'N/A';
                        
                        customerPhone = shippingAddr.phone || shippingAddr.phoneNumber || 
                                       shippingAddr.mobile || shippingAddr.contactNumber || 'N/A';
                        
                        // Build full address string - try multiple field name variations
                        const addressParts = [
                            shippingAddr.addressLine1 || shippingAddr.address1 || shippingAddr.street,
                            shippingAddr.addressLine2 || shippingAddr.address2,
                            shippingAddr.city,
                            shippingAddr.state || shippingAddr.province,
                            shippingAddr.postalCode || shippingAddr.zipCode || shippingAddr.zip,
                            shippingAddr.country
                        ].filter(Boolean);
                        
                        shippingAddressText = addressParts.join(', ') || 'N/A';
                    } catch (e) {
                        console.error(`[ERROR] Error parsing shipping address for order ${order.order_number}:`, e);
                    }
                }

                return {
                    ...order,
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                    shipping_address_text: shippingAddressText,
                    // Remove the raw JSON from response
                    shipping_address: undefined,
                    billing_address: undefined
                };
            });

            console.log(`[DEBUG] Final response sample:`, JSON.stringify(ordersWithCustomerInfo[0], null, 2));

            res.json({
                success: true,
                data: {
                    orders: ordersWithCustomerInfo || [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalOrders: total,
                        hasNext: (page * limit) < total,
                        hasPrev: page > 1
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching all orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders',
                error: error.message
            });
        }
    }
}

module.exports = new WebsiteOrderController();