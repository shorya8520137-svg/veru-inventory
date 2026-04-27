"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./returnModal.module.css";

const API = `${process.env.NEXT_PUBLIC_API_BASE}/api/dispatch`;
const RETURNS_API = `${process.env.NEXT_PUBLIC_API_BASE}/api/returns`;

export default function ReturnModal({ onClose, prefilledProduct = null, prefilledWarehouse = null }) {
    const [locationType, setLocationType] = useState("WAREHOUSE"); // WAREHOUSE or STORE
    const [selectedLocationId, setSelectedLocationId] = useState("");
    const [locations, setLocations] = useState([]);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productSearch, setProductSearch] = useState("");
    const [productSuggestions, setProductSuggestions] = useState([]);
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    const [qty, setQty] = useState(1);
    const [awb, setAwb] = useState("");
    const [subtype, setSubtype] = useState("");
    const [processedBy, setProcessedBy] = useState("");
    const [processedByOptions, setProcessedByOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    /* ------------------------------
       FETCH PROCESSED BY OPTIONS (USERS API)
    -------------------------------- */
    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    setProcessedByOptions(data.data);
                } else if (data.success && Array.isArray(data.users)) {
                    setProcessedByOptions(data.users);
                } else if (Array.isArray(data)) {
                    setProcessedByOptions(data);
                }
            })
            .catch(err => console.error('Error fetching users:', err));
    }, []);

    /* ------------------------------
       FETCH LOCATIONS (WAREHOUSE OR STORE)
    -------------------------------- */
    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (locationType === "WAREHOUSE") {
            // Fetch warehouses
            fetch(`${API}/warehouses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(data => {
                    const allWarehouses = Array.isArray(data) ? data : [];
                    const formattedWarehouses = allWarehouses.map(code => ({ 
                        id: code, 
                        warehouse_code: code, 
                        Warehouse_name: code,
                        display_name: code
                    }));
                    setLocations(formattedWarehouses);
                })
                .catch(() => setLocations([]));
        } else {
            // Fetch stores
            fetch(`${RETURNS_API.replace('/returns', '')}/warehouse-management/stores`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success && Array.isArray(data.stores)) {
                        const formattedStores = data.stores.map(store => ({
                            id: store.store_code,
                            store_code: store.store_code,
                            store_name: store.store_name,
                            city: store.city,
                            display_name: `${store.store_name} - ${store.city} (${store.store_code})`
                        }));
                        setLocations(formattedStores);
                    } else {
                        setLocations([]);
                    }
                })
                .catch(() => setLocations([]));
        }
        
        // Reset selection when location type changes
        setSelectedLocationId("");
    }, [locationType]);

    /* ------------------------------
       PRODUCT SEARCH WITH AUTOCOMPLETE
    -------------------------------- */
    useEffect(() => {
        if (productSearch.length < 2) {
            setProductSuggestions([]);
            return;
        }

        const token = localStorage.getItem('token');
        const timeoutId = setTimeout(() => {
            fetch(`${API}/search-products?query=${encodeURIComponent(productSearch)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(data => {
                    const allProducts = Array.isArray(data) ? data : (data.data || []);
                    setProductSuggestions(allProducts.slice(0, 10)); // Limit to 10 suggestions
                })
                .catch(() => setProductSuggestions([]));
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [productSearch]);

    /* ------------------------------
       CLOSE SUGGESTIONS ON CLICK OUTSIDE
    -------------------------------- */
    useEffect(() => {
        function handleClickOutside(event) {
            if (showProductSuggestions && !event.target.closest('.product-search-container')) {
                setShowProductSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProductSuggestions]);

    /* ------------------------------
       SUBMIT RETURN
    -------------------------------- */
    async function submit() {
        if (!selectedLocationId || !selectedProduct || !qty) {
            setMsg("Please complete all required fields");
            return;
        }

        const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

        if (!selectedLocation) {
            setMsg("Invalid location selection");
            return;
        }

        try {
            setLoading(true);
            setMsg("");

            const token = localStorage.getItem('token');
            const payload = {
                return_type: locationType, // 'WAREHOUSE' or 'STORE'
                source_location: selectedLocation.id,
                destination_location: selectedLocation.id, // Same location for now
                product_type: selectedProduct.product_name,
                barcode: selectedProduct.barcode,
                quantity: Number(qty),
                condition: 'good', // Default condition
                awb: awb || undefined,
                return_reason: subtype || undefined,
                processed_by: processedBy ? Number(processedBy) : undefined,
                notes: subtype || undefined,
                // Legacy support
                warehouse: locationType === "WAREHOUSE" ? selectedLocation.id : undefined
            };

            const res = await fetch(RETURNS_API, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Failed");

            setMsg("✔ Return created successfully");
            setTimeout(onClose, 900);

        } catch (e) {
            setMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            <motion.div 
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <motion.div 
                    className={styles.panel}
                    initial={{ scale: 0.92, y: 10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.92, y: 10, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                >
                <button className={styles.close} onClick={onClose}>✕</button>

                <div className={styles.header}>Product Return</div>

                {/* Location Type Radio Buttons */}
                <div className={styles.field}>
                    <label className={styles.label}>Location Type</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                checked={locationType === "WAREHOUSE"}
                                onChange={() => {
                                    setLocationType("WAREHOUSE");
                                    setSelectedLocationId("");
                                }}
                                style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>Warehouse</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                checked={locationType === "STORE"}
                                onChange={() => {
                                    setLocationType("STORE");
                                    setSelectedLocationId("");
                                }}
                                style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>Store</span>
                        </label>
                    </div>
                </div>

                {/* Location Search */}
                <div className={styles.field}>
                    <label className={styles.label}>{locationType === "WAREHOUSE" ? "Warehouse" : "Store"}</label>
                    <select
                        className={styles.input}
                        value={selectedLocationId}
                        onChange={e => setSelectedLocationId(e.target.value)}
                        style={{ cursor: 'pointer' }}
                    >
                        <option value="">Select {locationType.toLowerCase()}</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                                {loc.display_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Product Search with Autocomplete */}
                <div className={styles.field}>
                    <label className={styles.label}>Product</label>
                    <div className="product-search-container" style={{ position: 'relative' }}>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Search product by name or barcode..."
                            value={selectedProduct ? `${selectedProduct.product_name} (${selectedProduct.barcode})` : productSearch}
                            onChange={e => {
                                setProductSearch(e.target.value);
                                setSelectedProduct(null);
                                setShowProductSuggestions(true);
                            }}
                            onFocus={() => setShowProductSuggestions(true)}
                            style={{ paddingRight: selectedProduct ? '40px' : '12px' }}
                        />
                        {selectedProduct && (
                            <button
                                onClick={() => {
                                    setSelectedProduct(null);
                                    setProductSearch("");
                                    setShowProductSuggestions(false);
                                }}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    color: '#666',
                                    padding: '4px'
                                }}
                            >
                                ✕
                            </button>
                        )}
                        {showProductSuggestions && productSuggestions.length > 0 && !selectedProduct && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                marginTop: '4px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                zIndex: 1000,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                {productSuggestions.map(product => (
                                    <div
                                        key={product.p_id}
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            setProductSearch("");
                                            setShowProductSuggestions(false);
                                        }}
                                        style={{
                                            padding: '12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f0f0f0',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                    >
                                        <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                            {product.product_name}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                            Barcode: {product.barcode}
                                            {product.product_variant && ` • ${product.product_variant}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quantity */}
                <div className={styles.field}>
                    <label className={styles.label}>Quantity</label>
                    <input
                        className={styles.input}
                        type="number"
                        min="1"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                    />
                </div>

                {/* AWB Number */}
                <div className={styles.field}>
                    <label className={styles.label}>AWB Number (optional)</label>
                    <input
                        className={styles.input}
                        placeholder="Enter AWB number"
                        value={awb}
                        onChange={e => setAwb(e.target.value)}
                    />
                </div>

                {/* Subtype */}
                <div className={styles.field}>
                    <label className={styles.label}>Part / Subtype (optional)</label>
                    <input
                        className={styles.input}
                        placeholder="e.g. cover, handle"
                        value={subtype}
                        onChange={e => setSubtype(e.target.value)}
                    />
                </div>

                {/* Processed By */}
                <div className={styles.field}>
                    <label className={styles.label}>Processed By (optional)</label>
                    <select
                        className={styles.input}
                        value={processedBy}
                        onChange={e => setProcessedBy(e.target.value)}
                        style={{ cursor: 'pointer' }}
                    >
                        <option value="">Select user</option>
                        {processedByOptions.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.submit}
                        onClick={submit}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Submit Return"}
                    </button>
                </div>

                {msg && <div className={styles.msg}>{msg}</div>}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
