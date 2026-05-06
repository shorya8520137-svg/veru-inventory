"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Clock, CreditCard, DollarSign, Filter, Plus, MoreVertical } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

export default function WebsiteOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pending: 0,
        processing: 0,
        revenue: 0
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            console.log('🔍 Fetching orders from:', `${API_BASE}/api/website/orders`);
            console.log('🔑 Token exists:', !!token);
            
            // Fetch orders from the correct API endpoint
            const ordersResponse = await fetch(`${API_BASE}/api/website/orders`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📊 Response status:', ordersResponse.status);
            console.log('📊 Response ok:', ordersResponse.ok);
            
            if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                console.log('📦 Full API response:', ordersData);
                console.log('📦 ordersData.success:', ordersData.success);
                console.log('📦 ordersData.data:', ordersData.data);
                
                if (ordersData.success) {
                    // Handle different response structures
                    let ordersList = [];
                    
                    if (ordersData.data && Array.isArray(ordersData.data.orders)) {
                        ordersList = ordersData.data.orders;
                        console.log('✅ Found orders in data.orders:', ordersList.length);
                    } else if (Array.isArray(ordersData.orders)) {
                        ordersList = ordersData.orders;
                        console.log('✅ Found orders in orders:', ordersList.length);
                    } else if (Array.isArray(ordersData.data)) {
                        ordersList = ordersData.data;
                        console.log('✅ Found orders in data:', ordersList.length);
                    } else {
                        console.log('❌ Could not find orders array in response');
                        console.log('Response structure:', Object.keys(ordersData));
                    }
                    
                    console.log('📋 Processed orders list:', ordersList);
                    if (ordersList.length > 0) {
                        console.log('📋 First order sample:', ordersList[0]);
                    }
                    
                    setOrders(ordersList);
                    calculateStats(ordersList);
                } else {
                    console.error('❌ API returned success: false');
                    console.error('Error message:', ordersData.message);
                    setOrders([]);
                    calculateStats([]);
                }
            } else {
                const errorText = await ordersResponse.text();
                console.error('❌ Failed to fetch orders:', ordersResponse.status);
                console.error('Error response:', errorText);
                setOrders([]);
                calculateStats([]);
            }
        } catch (error) {
            console.error('❌ Exception in fetchOrders:', error);
            setOrders([]);
            calculateStats([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (ordersData) => {
        // Ensure ordersData is an array
        const ordersList = Array.isArray(ordersData) ? ordersData : [];
        
        const total = ordersList.length;
        const pending = ordersList.filter(o => o.status?.toLowerCase() === 'pending').length;
        const processing = ordersList.filter(o => o.status?.toLowerCase() === 'processing').length;
        const revenue = ordersList.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
        
        setStats({ totalOrders: total, pending, processing, revenue });
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb] p-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Orders */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                TOTAL<br/>ORDERS
                            </p>
                            <p className="text-3xl font-bold text-gray-900">
                                {stats.totalOrders.toLocaleString()}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                PENDING
                            </p>
                            <p className="text-3xl font-bold text-gray-900">
                                {stats.pending}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-500" />
                        </div>
                    </div>
                </div>

                {/* Processing */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                PROCESSING
                            </p>
                            <p className="text-3xl font-bold text-gray-900">
                                {stats.processing}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Revenue */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                REVENUE
                            </p>
                            <p className="text-3xl font-bold text-gray-900">
                                ₹{(stats.revenue / 1000).toFixed(1)}k
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">Active Orders</h2>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                            {orders.length} Items
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create Order
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <div className="col-span-2"># Order</div>
                        <div className="col-span-2">Customer</div>
                        <div className="col-span-2">Items</div>
                        <div className="col-span-2">Customization</div>
                        <div className="col-span-1">Amount</div>
                        <div className="col-span-2">Payment</div>
                        <div className="col-span-1">Status</div>
                    </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            Loading orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            No orders found
                        </div>
                    ) : (
                        orders.slice(0, 10).map((order, index) => (
                            <div 
                                key={order.id || index}
                                className="px-6 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    {/* Order ID */}
                                    <div className="col-span-2">
                                        <p className="text-sm font-semibold text-blue-600 mb-1">
                                            #{order.order_number || `ORD-${8291 - index}`}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'Oct 12, 14:20'}
                                        </p>
                                    </div>

                                    {/* Customer */}
                                    <div className="col-span-2">
                                        <p className="text-sm font-semibold text-gray-900 mb-1">
                                            {order.customer_name || order.username || 'Customer'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {order.customer_email || order.user_email || 'N/A'}
                                        </p>
                                    </div>

                                    {/* Items */}
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {order.products && order.products[0]?.product_image ? (
                                                <img 
                                                    src={order.products[0].product_image} 
                                                    alt={order.products[0].product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-2xl">📦</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 mb-0.5 truncate">
                                                {order.products && order.products[0]?.product_name || 'Product'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Qty: {order.products && order.products[0]?.quantity || 1}
                                                {order.item_count > 1 && ` (+${order.item_count - 1})`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Customization */}
                                    <div className="col-span-2">
                                        {order.products && order.products[0]?.customization ? (
                                            <div className="space-y-1">
                                                {Object.entries(order.products[0].customization).map(([key, value]) => (
                                                    value && (
                                                        <div key={key} className="text-xs">
                                                            <span className="font-semibold text-gray-700 capitalize">{key}:</span>
                                                            <span className="text-gray-600 ml-1">{value}</span>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400">No customization</p>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="col-span-1">
                                        <p className="text-sm font-bold text-gray-900 mb-1">
                                            ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            INR
                                        </p>
                                    </div>

                                    {/* Payment */}
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                            <p className="text-xs text-gray-600">
                                                {order.payment_method || 'card'} ••••
                                            </p>
                                        </div>
                                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                                            order.payment_status?.toLowerCase() === 'success' 
                                                ? 'bg-green-100 text-green-700' 
                                                : order.payment_status?.toLowerCase() === 'waiting'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : order.payment_status?.toLowerCase() === 'pending'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {order.payment_status || 'PENDING'}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 flex items-center justify-between">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                                            order.status?.toLowerCase() === 'processing'
                                                ? 'bg-purple-50'
                                                : order.status?.toLowerCase() === 'pending'
                                                ? 'bg-yellow-50'
                                                : order.status?.toLowerCase() === 'confirmed'
                                                ? 'bg-blue-50'
                                                : 'bg-purple-50'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                order.status?.toLowerCase() === 'processing'
                                                    ? 'bg-purple-500'
                                                    : order.status?.toLowerCase() === 'pending'
                                                    ? 'bg-yellow-500'
                                                    : order.status?.toLowerCase() === 'confirmed'
                                                    ? 'bg-blue-500'
                                                    : 'bg-purple-500'
                                            }`} />
                                            <span className={`text-xs font-medium ${
                                                order.status?.toLowerCase() === 'processing'
                                                    ? 'text-purple-700'
                                                    : order.status?.toLowerCase() === 'pending'
                                                    ? 'text-yellow-700'
                                                    : order.status?.toLowerCase() === 'confirmed'
                                                    ? 'text-blue-700'
                                                    : 'text-purple-700'
                                            }`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </div>
                                        <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {!loading && orders.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing 1 to 10 of {orders.length} orders
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                ‹
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center bg-gray-900 text-white rounded-lg font-medium">
                                1
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                2
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                3
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
