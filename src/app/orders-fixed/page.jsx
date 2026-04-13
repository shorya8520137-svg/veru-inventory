"use client";
import React, { useEffect, useState } from "react";

export default function OrdersFixed() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const apiUrl = 'http://api.giftgala.in/api/website/orders?page=1&limit=10';
        
        console.log('🚀 NEW ORDERS PAGE - CALLING API:', apiUrl);
        
        fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(res => {
                console.log('✅ API RESPONSE:', res);
                const ordersData = res.data?.orders || res.orders || [];
                console.log('📦 ORDERS:', ordersData);
                setOrders(ordersData);
            })
            .catch(err => console.error('❌ ERROR:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{padding: '20px'}}>Loading orders...</div>;

    return (
        <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
            <h1>🛍️ Website Orders - FIXED VERSION</h1>
            <p>This page directly calls the API and displays product names.</p>
            
            <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
                <thead>
                    <tr style={{backgroundColor: '#f8f9fa'}}>
                        <th style={{border: '1px solid #ddd', padding: '12px'}}>Order Number</th>
                        <th style={{border: '1px solid #ddd', padding: '12px'}}>Customer</th>
                        <th style={{border: '1px solid #ddd', padding: '12px'}}>Amount</th>
                        <th style={{border: '1px solid #ddd', padding: '12px'}}>Products</th>
                        <th style={{border: '1px solid #ddd', padding: '12px'}}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td style={{border: '1px solid #ddd', padding: '12px'}}>{order.order_number}</td>
                            <td style={{border: '1px solid #ddd', padding: '12px'}}>{order.customer_name}</td>
                            <td style={{border: '1px solid #ddd', padding: '12px'}}>{order.currency}{order.total_amount}</td>
                            <td style={{border: '1px solid #ddd', padding: '12px', backgroundColor: '#e8f5e8', color: '#27ae60', fontWeight: 'bold'}}>
                                {order.products && order.products.length > 0 
                                    ? order.products.map(p => p.product_name).join(', ')
                                    : `${order.item_count || 0} item(s)`
                                }
                            </td>
                            <td style={{border: '1px solid #ddd', padding: '12px'}}>{order.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {orders.length === 0 && <p>No orders found</p>}
        </div>
    );
}