import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
    let connection;
    
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { bill_type, customer, gst_details, products, payment, discount, shipping, totals } = body;

        if (!customer?.name || !customer?.phone || !products || products.length === 0) {
            return NextResponse.json({ 
                success: false, 
                message: 'Missing required fields' 
            }, { status: 400 });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Insert bill
        const [billResult] = await connection.execute(
            `INSERT INTO bills (
                invoice_number,
                bill_type,
                customer_name, 
                customer_phone, 
                customer_email,
                billing_address,
                shipping_address,
                gstin,
                business_name,
                place_of_supply,
                subtotal,
                discount,
                shipping,
                gst_amount,
                grand_total,
                payment_mode,
                payment_status,
                items,
                total_items,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                invoiceNumber,
                bill_type || 'B2C',
                customer.name,
                customer.phone,
                customer.email || null,
                customer.billing_address || null,
                customer.shipping_address || null,
                gst_details?.gstin || null,
                gst_details?.business_name || null,
                gst_details?.place_of_supply || null,
                totals.subtotal,
                discount || 0,
                shipping || 0,
                totals.gstAmount,
                totals.grandTotal,
                payment.mode,
                payment.status,
                JSON.stringify(products),
                products.length
            ]
        );

        const billId = billResult.insertId;

        // Update store inventory - reduce stock for each product
        for (const product of products) {
            // Check current stock
            const [stockCheck] = await connection.execute(
                `SELECT stock FROM store_inventory WHERE barcode = ?`,
                [product.barcode]
            );

            if (stockCheck.length === 0) {
                await connection.rollback();
                return NextResponse.json({ 
                    success: false, 
                    message: `Product ${product.product_name} not found in store inventory` 
                }, { status: 400 });
            }

            const currentStock = stockCheck[0].stock;
            
            if (currentStock < product.quantity) {
                await connection.rollback();
                return NextResponse.json({ 
                    success: false, 
                    message: `Insufficient stock for ${product.product_name}. Available: ${currentStock}, Required: ${product.quantity}` 
                }, { status: 400 });
            }

            // Reduce stock
            await connection.execute(
                `UPDATE store_inventory 
                SET stock = stock - ?, 
                    last_updated = NOW() 
                WHERE barcode = ?`,
                [product.quantity, product.barcode]
            );

            // Log inventory movement
            await connection.execute(
                `INSERT INTO store_inventory_logs (
                    barcode,
                    product_name,
                    movement_type,
                    quantity,
                    reference_id,
                    reference_type,
                    created_at
                ) VALUES (?, ?, 'SALE', ?, ?, 'BILL', NOW())`,
                [product.barcode, product.product_name, product.quantity, invoiceNumber]
            );
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: 'Invoice generated successfully',
            data: {
                bill_id: billId,
                invoice_number: invoiceNumber
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error generating invoice:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to generate invoice',
            error: error.message 
        }, { status: 500 });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
