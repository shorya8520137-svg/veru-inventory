"use client";
import React, { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

export default function OrdersNew() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = `${API_BASE}/api/website/orders?page=1&limit=20`;
                
                console.log('🚀 NEW PAGE - Fetching from:', apiUrl);
                console.log('🔑 Token exists:', !!token);
                
                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                console.log('📦 API Response:', data);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${data.message}`);
                }

                const ordersData = data.data?.orders || data.orders || [];
                console.log('📋 Orders loaded:', ordersData.length);
                
                // Debug each order
                ordersData.forEach((order, index) => {
                    console.log(`Order ${index + 1}: ${order.order_number}`);
                    console.log(`  Products: ${order.products?.length || 0}`);
                    if (order.products && order.products.length > 0) {
                        order.products.forEach(p => {
                            console.log(`    - ${p.product_name}`);
                        });
                    }
                });

                setOrders(ordersData);
            } catch (err) {
                console.error('❌ Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) return <div style={{padding: '20px'}}>Loading orders...</div>;
    if (error) return <div style={{padding: '20px', color: 'red'}}>Error: {error}</div>;

    return (
        <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
            <h1>🛍️ Website Orders - NEW PAGE (No Cache)</h1>
            <p>This is a fresh page to bypass Vercel caching issues.</p>
            
            <div style={{marginBottom: '20px'}}>
                <strong>Total Orders:</strong> {orders.length}
            </div>

            <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd'}}>
                <thead>
                    <tr style={{backgroundColor: '#f5f5f5'}}>
                        <th style={{border: '1px solid #ddd', padding: '12px', textAlign: 'left'}}>Order Number</th>
                        <th style={{border: '1px solid #ddd', padding: '12px', textAlign: 'left'}}>Customer</th>
                        <th style={{border: '1px solid #ddd', padding: '12px', textAlign: 'left'}}>Products</th>
                        <th style={{border: '1px solid #ddd', padding: '12px', textAlign: 'left'}}>Amount</th>
                        <th style={{border: '1px solid #ddd', padding: '12px', textAlign: 'left'}}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td style={{border: '1px solid #ddd', padding: '12px'}}>{order.order_number}</td>
                            <td style={{border: '1px solid #ddd', padding: '12px'}}>{order.customer_name || 'N/A'}</td>
                            <td style={{border: '1px solid #ddd', padding: '12px'}}>
                                {order.products && order.products.length > 0 ? (
                                    <div style={{backgroundColor: '#e8f5e8', padding: '8px', borderRadius: '4px', color: '#27ae60', fontWeight: 'bold'}}>
                                        {order.products.map(p => p.product_name).join(', ')}
                                    </div>
                                ) : (
                                    <div style={{backgroundColor: '#fdf2f2', padding: '8px', borderRadius: '4px', color: '#e74c3c', fontStyle: 'italic'}}>
                                        {order.item_count || 0} item(s)
                                    </div>
                                )}
                            </td>
                            <td style={{border: '1px solid #ddd', padding: '12px'}}>{order.currency || '$'}{order.total_amount}</td>
                            <td style={{border: '1px solid #ddd', padding: '12px'}}>{order.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px'}}>
                <h3>🔍 Debug Info:</h3>
                <p><strong>API Base:</strong> {API_BASE}</p>
                <p><strong>Orders Count:</strong> {orders.length}</p>
                <p><strong>Orders with Products:</strong> {orders.filter(o => o.products && o.products.length > 0).length}</p>
                <p><strong>Orders without Products:</strong> {orders.filter(o => !o.products || o.products.length === 0).length}</p>
            </div>
        </div>
    );
}