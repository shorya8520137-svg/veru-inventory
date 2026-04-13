"use client";
import React, { useEffect, useState } from "react";

const API = `${process.env.NEXT_PUBLIC_API_BASE}/api/website/orders`;

export default function WebsiteOrderNew() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('🚀 NEW WEBSITE ORDERS PAGE LOADED!');
        
        fetch(`${API}?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(res => {
                console.log('📦 API Response:', res);
                const ordersData = res.data?.orders || res.orders || [];
                console.log('📋 Orders:', ordersData);
                setOrders(ordersData);
            })
            .catch(err => {
                console.error('❌ Error:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{padding: '20px'}}>Loading...</div>;

    return (
        <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
            <h1>🛍️ Website Orders - NEW VERSION</h1>
            <p>This is a test page to verify product names are working.</p>
            
            <div style={{marginTop: '20px'}}>
                {orders.length === 0 ? (
                    <p>No orders found</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} style={{
                            border: '1px solid #ddd',
                            padding: '15px',
                            margin: '10px 0',
                            borderRadius: '8px',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <h3>Order: {order.order_number}</h3>
                            <p><strong>Customer:</strong> {order.customer_name}</p>
                            <p><strong>Amount:</strong> {order.currency}{order.total_amount}</p>
                            <p><strong>Item Count:</strong> {order.item_count}</p>
                            
                            <div style={{marginTop: '10px'}}>
                                <strong>Products:</strong>
                                {order.products && order.products.length > 0 ? (
                                    <ul style={{marginTop: '5px'}}>
                                        {order.products.map((product, index) => (
                                            <li key={index} style={{color: 'green', fontWeight: 'bold'}}>
                                                ✅ {product.product_name} (Qty: {product.quantity}, Price: ${product.unit_price})
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{color: 'red'}}>❌ NO PRODUCTS FOUND!</p>
                                )}
                            </div>
                            
                            <details style={{marginTop: '10px'}}>
                                <summary>Raw Order Data</summary>
                                <pre style={{fontSize: '12px', backgroundColor: '#eee', padding: '10px', overflow: 'auto'}}>
                                    {JSON.stringify(order, null, 2)}
                                </pre>
                            </details>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}