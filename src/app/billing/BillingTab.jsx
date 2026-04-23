"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, User, Building2, CreditCard, Wallet, Banknote, Smartphone } from "lucide-react";

const API_BASE = ""; // Use relative URLs for local API routes

export default function BillingTab() {
    const [billType, setBillType] = useState("B2C"); // B2B or B2C
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [countryCode, setCountryCode] = useState("+91"); // Default India
    const [showCountryCodes, setShowCountryCodes] = useState(false);
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [billingAddress, setBillingAddress] = useState("");
    const [shippingAddress, setShippingAddress] = useState("");
    const [sameAsBilling, setSameAsBilling] = useState(true);

    const [gstin, setGstin] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [placeOfSupply, setPlaceOfSupply] = useState("New York (NY)");

    const [productSearch, setProductSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);

    const [paymentMode, setPaymentMode] = useState("cash");
    const [paymentStatus, setPaymentStatus] = useState("paid");

    const [itemDiscount, setItemDiscount] = useState(0);
    const [shipping, setShipping] = useState(0);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Country codes list
    const countryCodes = [
        { code: "+91", country: "India", flag: "🇮🇳" },
        { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
        { code: "+44", country: "UK", flag: "🇬🇧" },
        { code: "+971", country: "UAE", flag: "🇦🇪" },
        { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
        { code: "+65", country: "Singapore", flag: "🇸🇬" },
        { code: "+61", country: "Australia", flag: "🇦🇺" },
        { code: "+81", country: "Japan", flag: "🇯🇵" },
        { code: "+86", country: "China", flag: "🇨🇳" },
        { code: "+49", country: "Germany", flag: "🇩🇪" },
        { code: "+33", country: "France", flag: "🇫🇷" },
        { code: "+39", country: "Italy", flag: "🇮🇹" },
        { code: "+34", country: "Spain", flag: "🇪🇸" },
        { code: "+7", country: "Russia", flag: "🇷🇺" },
        { code: "+55", country: "Brazil", flag: "🇧🇷" },
        { code: "+27", country: "South Africa", flag: "🇿🇦" },
        { code: "+20", country: "Egypt", flag: "🇪🇬" },
        { code: "+234", country: "Nigeria", flag: "🇳🇬" },
        { code: "+254", country: "Kenya", flag: "🇰🇪" },
        { code: "+92", country: "Pakistan", flag: "🇵🇰" },
        { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
        { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
        { code: "+977", country: "Nepal", flag: "🇳🇵" },
        { code: "+60", country: "Malaysia", flag: "🇲🇾" },
        { code: "+62", country: "Indonesia", flag: "🇮🇩" },
        { code: "+63", country: "Philippines", flag: "🇵🇭" },
        { code: "+66", country: "Thailand", flag: "🇹🇭" },
        { code: "+84", country: "Vietnam", flag: "🇻🇳" },
        { code: "+82", country: "South Korea", flag: "🇰🇷" },
        { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
        { code: "+64", country: "New Zealand", flag: "🇳🇿" },
        { code: "+52", country: "Mexico", flag: "🇲🇽" },
        { code: "+54", country: "Argentina", flag: "🇦🇷" },
        { code: "+56", country: "Chile", flag: "🇨🇱" },
        { code: "+57", country: "Colombia", flag: "🇨🇴" },
        { code: "+51", country: "Peru", flag: "🇵🇪" },
        { code: "+90", country: "Turkey", flag: "🇹🇷" },
        { code: "+98", country: "Iran", flag: "🇮🇷" },
        { code: "+964", country: "Iraq", flag: "🇮🇶" },
        { code: "+962", country: "Jordan", flag: "🇯🇴" },
        { code: "+961", country: "Lebanon", flag: "🇱🇧" },
        { code: "+972", country: "Israel", flag: "🇮🇱" },
        { code: "+974", country: "Qatar", flag: "🇶🇦" },
        { code: "+965", country: "Kuwait", flag: "🇰🇼" },
        { code: "+968", country: "Oman", flag: "🇴🇲" },
        { code: "+973", country: "Bahrain", flag: "🇧🇭" },
        { code: "+212", country: "Morocco", flag: "🇲🇦" },
        { code: "+213", country: "Algeria", flag: "🇩🇿" },
        { code: "+216", country: "Tunisia", flag: "🇹🇳" },
        { code: "+218", country: "Libya", flag: "🇱🇾" }
    ];

    // Search products
    const searchProducts = async (query) => {
        if (query.length < 2) {
            setProducts([]);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/dispatch/search-products?query=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setProducts(Array.isArray(data) ? data : (data.data || []));
        } catch (err) {
            console.error('Error searching products:', err);
            setProducts([]);
        }
    };

    useEffect(() => {
        searchProducts(productSearch);
    }, [productSearch]);

    // Add product to bill
    const addProduct = (product) => {
        const existing = selectedProducts.find(p => p.barcode === product.barcode);
        if (existing) {
            setSelectedProducts(selectedProducts.map(p => 
                p.barcode === product.barcode 
                    ? { ...p, quantity: p.quantity + 1 }
                    : p
            ));
        } else {
            setSelectedProducts([...selectedProducts, {
                ...product,
                quantity: 1,
                price: product.price || 0,
                gst: product.gst_percentage || 18
            }]);
        }
        setProductSearch("");
        setProducts([]);
    };

    // Update quantity
    const updateQuantity = (barcode, qty) => {
        setSelectedProducts(selectedProducts.map(p => 
            p.barcode === barcode ? { ...p, quantity: Math.max(1, qty) } : p
        ));
    };

    // Remove product
    const removeProduct = (barcode) => {
        setSelectedProducts(selectedProducts.filter(p => p.barcode !== barcode));
    };

    // Calculate totals
    const calculateTotals = () => {
        const subtotal = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const discount = itemDiscount;
        const afterDiscount = subtotal - discount;
        const gstAmount = selectedProducts.reduce((sum, p) => {
            const itemTotal = p.price * p.quantity;
            return sum + (itemTotal * (p.gst / 100));
        }, 0);
        const grandTotal = afterDiscount + gstAmount + shipping;

        return { subtotal, discount, afterDiscount, gstAmount, shipping, grandTotal };
    };

    const totals = calculateTotals();

    // Generate Invoice
    const generateInvoice = async () => {
        if (!customerName || !customerPhone) {
            setMessage("Please enter customer name and phone");
            return;
        }

        if (selectedProducts.length === 0) {
            setMessage("Please add at least one product");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/billing/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bill_type: billType, // B2B or B2C
                    customer: {
                        name: customerName,
                        phone: `${countryCode} ${customerPhone}`,
                        email: customerEmail,
                        billing_address: billingAddress,
                        shipping_address: sameAsBilling ? billingAddress : shippingAddress
                    },
                    gst_details: {
                        gstin,
                        business_name: businessName,
                        place_of_supply: placeOfSupply
                    },
                    products: selectedProducts.map(p => ({
                        product_id: p.p_id,
                        barcode: p.barcode,
                        product_name: p.product_name,
                        quantity: p.quantity,
                        price: p.price,
                        gst_percentage: p.gst
                    })),
                    payment: {
                        mode: paymentMode,
                        status: paymentStatus
                    },
                    discount: itemDiscount,
                    shipping: shipping,
                    totals: totals
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage("✓ Invoice generated successfully!");
                // Reset form
                setTimeout(() => {
                    setCustomerName("");
                    setCustomerPhone("");
                    setCustomerEmail("");
                    setBillingAddress("");
                    setShippingAddress("");
                    setGstin("");
                    setBusinessName("");
                    setSelectedProducts([]);
                    setItemDiscount(0);
                    setShipping(0);
                    setMessage("");
                }, 2000);
            } else {
                setMessage("Failed to generate invoice: " + (data.message || "Unknown error"));
            }
        } catch (err) {
            console.error('Error generating invoice:', err);
            setMessage("Error generating invoice");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height:'100%', overflow:'auto', scrollbarWidth:'none', msOverflowStyle:'none' }}>
            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <div style={{ width:'100%' }}>
                {/* Customer Details */}
                <div style={{ background:'#fff', padding:24, marginBottom:0, border:'none', borderBottom:'1px solid #E5E7EB' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <User size={20} color="#1E40AF" />
                            <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0 }}>Customer Details</h2>
                        </div>
                        
                        {/* Bill Type Toggle - Inside Form */}
                        <div style={{ display:'flex', gap:8, background:'#F3F4F6', padding:4, borderRadius:8 }}>
                            <button 
                                onClick={() => setBillType("B2C")}
                                style={{ 
                                    padding:'8px 20px', 
                                    borderRadius:6, 
                                    border:'none', 
                                    background:billType==="B2C"?'#1E40AF':'transparent', 
                                    color:billType==="B2C"?'#fff':'#6B7280', 
                                    fontSize:13, 
                                    fontWeight:600, 
                                    cursor:'pointer',
                                    transition:'all 0.2s'
                                }}>
                                B2C
                            </button>
                            <button 
                                onClick={() => setBillType("B2B")}
                                style={{ 
                                    padding:'8px 20px', 
                                    borderRadius:6, 
                                    border:'none', 
                                    background:billType==="B2B"?'#1E40AF':'transparent', 
                                    color:billType==="B2B"?'#fff':'#6B7280', 
                                    fontSize:13, 
                                    fontWeight:600, 
                                    cursor:'pointer',
                                    transition:'all 0.2s'
                                }}>
                                B2B
                            </button>
                        </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                        <div>
                            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 }}>NAME</label>
                            <input 
                                type="text"
                                placeholder="Acme Corporation"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB' }}
                            />
                        </div>
                        <div>
                            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 }}>PHONE</label>
                            <div style={{ display:'flex', gap:8 }}>
                                <div style={{ position:'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCountryCodes(!showCountryCodes)}
                                        style={{ 
                                            padding:'10px 12px', 
                                            borderRadius:8, 
                                            border:'1px solid #E5E7EB', 
                                            fontSize:14, 
                                            outline:'none', 
                                            background:'#F9FAFB',
                                            cursor:'pointer',
                                            display:'flex',
                                            alignItems:'center',
                                            gap:6,
                                            minWidth:100
                                        }}>
                                        <span>{countryCodes.find(c => c.code === countryCode)?.flag}</span>
                                        <span>{countryCode}</span>
                                    </button>
                                    
                                    {showCountryCodes && (
                                        <div style={{ 
                                            position:'absolute', 
                                            top:'100%', 
                                            left:0, 
                                            marginTop:4, 
                                            background:'#fff', 
                                            border:'1px solid #E5E7EB', 
                                            borderRadius:8, 
                                            boxShadow:'0 4px 6px rgba(0,0,0,0.1)', 
                                            maxHeight:300, 
                                            overflowY:'auto', 
                                            zIndex:100,
                                            minWidth:250
                                        }}>
                                            {countryCodes.map((item) => (
                                                <div
                                                    key={item.code}
                                                    onClick={() => {
                                                        setCountryCode(item.code);
                                                        setShowCountryCodes(false);
                                                    }}
                                                    style={{ 
                                                        padding:'10px 14px', 
                                                        cursor:'pointer', 
                                                        borderBottom:'1px solid #F3F4F6',
                                                        display:'flex',
                                                        alignItems:'center',
                                                        gap:10
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                                                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                                    <span style={{ fontSize:18 }}>{item.flag}</span>
                                                    <span style={{ fontSize:13, fontWeight:600, color:'#111827', flex:1 }}>{item.country}</span>
                                                    <span style={{ fontSize:13, color:'#6B7280' }}>{item.code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input 
                                    type="text"
                                    placeholder="9876543210"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    style={{ flex:1, padding:'10px 14px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom:16 }}>
                        <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 }}>EMAIL</label>
                        <input 
                            type="email"
                            placeholder="billing@acme.co"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB' }}
                        />
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                        <div>
                            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 }}>BILLING ADDRESS</label>
                            <textarea 
                                placeholder="123 Industrial Way, Suite 400, New York, NY 10001"
                                value={billingAddress}
                                onChange={(e) => setBillingAddress(e.target.value)}
                                style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB', minHeight:80, resize:'vertical' }}
                            />
                        </div>
                        <div>
                            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 }}>
                                SHIPPING ADDRESS
                                <input 
                                    type="checkbox"
                                    checked={sameAsBilling}
                                    onChange={(e) => setSameAsBilling(e.target.checked)}
                                    style={{ cursor:'pointer' }}
                                />
                                <span style={{ fontWeight:400 }}>Same as billing</span>
                            </label>
                            <textarea 
                                placeholder="123 Industrial Way, Suite 400, New York, NY 10001"
                                value={sameAsBilling ? billingAddress : shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                                disabled={sameAsBilling}
                                style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:sameAsBilling?'#F3F4F6':'#F9FAFB', minHeight:80, resize:'vertical', opacity:sameAsBilling?0.6:1 }}
                            />
                        </div>
                    </div>
                </div>

                {/* GST Details - Only for B2B */}
                {billType === "B2B" && (
                    <div style={{ background:'#fff', padding:24, marginBottom:0, border:'none', borderBottom:'1px solid #E5E7EB' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                            <Building2 size={20} color="#1E40AF" />
                            <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0 }}>GST Details</h2>
                            <span style={{ fontSize:12, color:'#6B7280', background:'#FEF3C7', padding:'2px 8px', borderRadius:4, fontWeight:600 }}>B2B Required</span>
                        </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                        <div>
                            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 }}>GSTIN</label>
                            <input 
                                type="text"
                                placeholder="22AAAAA0000A1Z5"
                                value={gstin}
                                onChange={(e) => setGstin(e.target.value)}
                                style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB' }}
                            />
                        </div>
                        <div>
                            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 }}>BUSINESS NAME</label>
                            <input 
                                type="text"
                                placeholder="Acme Industrial Solutions"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB' }}
                            />
                        </div>
                        <div>
                            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:6 }}>PLACE OF SUPPLY</label>
                            <select 
                                value={placeOfSupply}
                                onChange={(e) => setPlaceOfSupply(e.target.value)}
                                style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, outline:'none', background:'#F9FAFB', cursor:'pointer' }}>
                                <option>New York (NY)</option>
                                <option>California (CA)</option>
                                <option>Texas (TX)</option>
                                <option>Florida (FL)</option>
                            </select>
                        </div>
                    </div>
                </div>
                )}

                {/* Product Search */}
                <div style={{ background:'#fff', padding:24, marginBottom:0, border:'none', borderBottom:'1px solid #E5E7EB' }}>
                    <div style={{ position:'relative', marginBottom:20, maxWidth:600 }}>
                        <Search size={18} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
                        <input 
                            type="text"
                            placeholder="Search products or type SKU..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            style={{ width:'100%', padding:'12px 14px 12px 46px', borderRadius:10, border:'2px solid #1E40AF', fontSize:14, outline:'none', background:'#F9FAFB' }}
                        />
                        {products.length > 0 && (
                            <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, marginTop:4, maxHeight:200, overflow:'auto', zIndex:100, boxShadow:'0 4px 6px rgba(0,0,0,0.1)' }}>
                                {products.map(product => (
                                    <div 
                                        key={product.p_id}
                                        onClick={() => addProduct(product)}
                                        style={{ padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #F3F4F6' }}
                                        onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                        <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{product.product_name}</div>
                                        <div style={{ fontSize:12, color:'#6B7280' }}>SKU: {product.barcode} | Price: ₹{product.price}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Products Table */}
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr style={{ background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
                                <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>PRODUCT</th>
                                <th style={{ padding:'12px 16px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>QUANTITY</th>
                                <th style={{ padding:'12px 16px', textAlign:'right', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>PRICE</th>
                                <th style={{ padding:'12px 16px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>GST %</th>
                                <th style={{ padding:'12px 16px', textAlign:'right', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>TOTAL</th>
                                <th style={{ padding:'12px 16px', textAlign:'center', fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding:48, textAlign:'center', color:'#9CA3AF' }}>
                                        No products added yet
                                    </td>
                                </tr>
                            ) : (
                                selectedProducts.map((product, idx) => (
                                    <tr key={idx} style={{ borderBottom:'1px solid #F3F4F6' }}>
                                        <td style={{ padding:'14px 16px' }}>
                                            <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{product.product_name}</div>
                                            <div style={{ fontSize:12, color:'#9CA3AF' }}>SKU: {product.barcode}</div>
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'center' }}>
                                            <input 
                                                type="number"
                                                min="1"
                                                value={product.quantity}
                                                onChange={(e) => updateQuantity(product.barcode, parseInt(e.target.value) || 1)}
                                                style={{ width:60, padding:'6px 10px', borderRadius:6, border:'1px solid #E5E7EB', textAlign:'center', fontSize:14, fontWeight:600 }}
                                            />
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'right', fontSize:14, fontWeight:600, color:'#111827' }}>
                                            ₹{product.price.toFixed(2)}
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'center', fontSize:14, fontWeight:600, color:'#059669' }}>
                                            {product.gst}%
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'right', fontSize:15, fontWeight:700, color:'#1E40AF' }}>
                                            ₹{(product.price * product.quantity).toFixed(2)}
                                        </td>
                                        <td style={{ padding:'14px 16px', textAlign:'center' }}>
                                            <button 
                                                onClick={() => removeProduct(product.barcode)}
                                                style={{ padding:'6px 12px', borderRadius:6, border:'none', background:'#FEE2E2', color:'#DC2626', fontSize:12, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}>
                                                <Trash2 size={14} />
                                                delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Payment & Summary */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                    {/* Payment Mode */}
                    <div style={{ background:'#fff', padding:24, border:'none', borderRight:'1px solid #E5E7EB' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                            <CreditCard size={20} color="#1E40AF" />
                            <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0 }}>Payment Mode</h2>
                        </div>

                        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
                            {[
                                { value:'cash', label:'Cash' },
                                { value:'upi', label:'UPI' },
                                { value:'card', label:'Card' },
                                { value:'bank', label:'Bank' }
                            ].map(mode => (
                                <button 
                                    key={mode.value}
                                    onClick={() => setPaymentMode(mode.value)}
                                    style={{ 
                                        padding:'10px 16px', 
                                        borderRadius:6, 
                                        border:paymentMode===mode.value?'2px solid #1E40AF':'1px solid #E5E7EB', 
                                        background:paymentMode===mode.value?'#EFF6FF':'#fff', 
                                        color:paymentMode===mode.value?'#1E40AF':'#6B7280', 
                                        fontSize:13, 
                                        fontWeight:600, 
                                        cursor:'pointer',
                                        transition:'all 0.2s'
                                    }}>
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:8 }}>PAYMENT STATUS</label>
                            <div style={{ display:'flex', gap:8 }}>
                                {['paid', 'partial', 'unpaid'].map(status => (
                                    <button 
                                        key={status}
                                        onClick={() => setPaymentStatus(status)}
                                        style={{ 
                                            flex:1,
                                            padding:'8px 16px', 
                                            borderRadius:6, 
                                            border:'none', 
                                            background:paymentStatus===status?(status==='paid'?'#D1FAE5':status==='partial'?'#FEF3C7':'#FEE2E2'):'#F3F4F6', 
                                            color:paymentStatus===status?(status==='paid'?'#059669':status==='partial'?'#D97706':'#DC2626'):'#6B7280', 
                                            fontSize:12, 
                                            fontWeight:600, 
                                            cursor:'pointer',
                                            textTransform:'capitalize',
                                            transition:'all 0.2s'
                                        }}>
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{ background:'#fff', padding:24, border:'none' }}>
                        <div style={{ marginBottom:16 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                                <span style={{ fontSize:14, color:'#6B7280' }}>Subtotal</span>
                                <span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>₹{totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, alignItems:'center' }}>
                                <span style={{ fontSize:14, color:'#6B7280' }}>Item Discount</span>
                                <input 
                                    type="number"
                                    min="0"
                                    value={itemDiscount}
                                    onChange={(e) => setItemDiscount(parseFloat(e.target.value) || 0)}
                                    style={{ width:100, padding:'6px 10px', borderRadius:6, border:'1px solid #E5E7EB', textAlign:'right', fontSize:14, fontWeight:600, color:'#DC2626' }}
                                />
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, alignItems:'center' }}>
                                <span style={{ fontSize:14, color:'#6B7280' }}>Shipping</span>
                                <input 
                                    type="number"
                                    min="0"
                                    value={shipping}
                                    onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                                    style={{ width:100, padding:'6px 10px', borderRadius:6, border:'1px solid #E5E7EB', textAlign:'right', fontSize:14, fontWeight:600 }}
                                />
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                                <span style={{ fontSize:14, color:'#6B7280' }}>GST</span>
                                <span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>₹{totals.gstAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ borderTop:'2px solid #E5E7EB', paddingTop:16, marginBottom:20 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <span style={{ fontSize:18, fontWeight:700, color:'#111827' }}>Grand Total</span>
                                <span style={{ fontSize:28, fontWeight:700, color:'#1E40AF' }}>₹{totals.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button 
                            onClick={generateInvoice}
                            disabled={loading}
                            style={{ 
                                width:'100%', 
                                padding:'12px 24px', 
                                borderRadius:8, 
                                border:'none', 
                                background:loading?'#9CA3AF':'#1E40AF', 
                                color:'#fff', 
                                fontSize:15, 
                                fontWeight:600, 
                                cursor:loading?'not-allowed':'pointer',
                                transition:'all 0.2s'
                            }}>
                            {loading ? 'Generating...' : 'Generate Invoice'}
                        </button>

                        {message && (
                            <div style={{ 
                                marginTop:12, 
                                padding:'10px 14px', 
                                borderRadius:8, 
                                background:message.includes('✓')?'#D1FAE5':'#FEE2E2', 
                                color:message.includes('✓')?'#059669':'#DC2626', 
                                fontSize:13, 
                                fontWeight:600,
                                textAlign:'center'
                            }}>
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
