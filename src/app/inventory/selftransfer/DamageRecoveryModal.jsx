"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./damageRecovery.module.css";

const API = `${process.env.NEXT_PUBLIC_API_BASE}/api/dispatch`;

export default function DamageRecoveryModal({ onClose, initialMode = 'damage', prefilledProduct = null, prefilledLocation = null }) {
    const [locationType, setLocationType] = useState(prefilledLocation ? "STORE" : "WAREHOUSE");
    const [selectedLocationId, setSelectedLocationId] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locationQuery, setLocationQuery] = useState("");
    const [locations, setLocations] = useState([]);

    const [action, setAction] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const locationRef = useRef(null);

    /* ---------- MULTI PRODUCT ROWS ---------- */
    const [rows, setRows] = useState([
        {
            selectedProductId: "",
            qty: 1,
            productQuery: "",
            products: [],
            selectedProduct: null,
        },
    ]);
    
    const [products, setProducts] = useState([]);
    const [processedByOptions, setProcessedByOptions] = useState([]);
    const [processedBy, setProcessedBy] = useState("");

    /* ---------------- FETCH PROCESSED BY OPTIONS ---------------- */
    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${API}/processed-persons`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProcessedByOptions(data);
                }
            })
            .catch(err => console.error('Error fetching processed persons:', err));
    }, []);

    /* ---------------- FETCH WAREHOUSES/STORES ---------------- */
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
            fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/warehouse-management/stores`, {
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
        setSelectedLocation(null);
    }, [locationType]);

    /* ---------------- PRODUCT SEARCH ---------------- */
    function searchProduct(value, rowIndex) {
        const updated = [...rows];
        updated[rowIndex].productQuery = value;

        if (value.length < 2) {
            updated[rowIndex].products = [];
            setRows(updated);
            return;
        }

        const token = localStorage.getItem('token');
        fetch(`${API}/search-products?query=${encodeURIComponent(value)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                updated[rowIndex].products = Array.isArray(data) ? data : (data.data || []);
                setRows([...updated]);
            })
            .catch(() => {
                updated[rowIndex].products = [];
                setRows([...updated]);
            });
    }

    /* ---------------- SUBMIT ---------------- */
    async function submit() {
        if (!selectedLocationId) {
            setMsg("Please select location");
            return;
        }

        const validRows = rows.filter(r => r.selectedProduct && r.qty);

        if (!validRows.length) {
            setMsg("Please select at least one product");
            return;
        }

        const selectedLoc = locations.find(loc => loc.id === selectedLocationId);
        if (!selectedLoc) {
            setMsg("Invalid location selection");
            return;
        }

        try {
            setLoading(true);
            setMsg("");

            const token = localStorage.getItem('token');
            await Promise.all(
                validRows.map(r => {
                    const endpoint = action === "damage" 
                        ? `${process.env.NEXT_PUBLIC_API_BASE}/api/damage-recovery/damage`
                        : `${process.env.NEXT_PUBLIC_API_BASE}/api/damage-recovery/recover`;
                    return fetch(endpoint, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            product_type: r.selectedProduct.product_name,
                            barcode: r.selectedProduct.barcode,
                            inventory_location: selectedLoc.id,
                            quantity: Number(r.qty),
                            action_type: action === "recovery" ? "recover" : action,
                            processed_by: processedBy || undefined
                        }),
                    });
                })
            );

            setMsg("✔ Successfully processed");
            setTimeout(onClose, 900);

        } catch (err) {
            console.error(err);
            setMsg("Operation failed");
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

                <div className={styles.header}>Damage / Recovery</div>

                {/* LOCATION TYPE - CHECKBOXES */}
                <div className={styles.field}>
                    <label className={styles.label}>Location Type</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                checked={locationType === "WAREHOUSE"}
                                onChange={() => setLocationType("WAREHOUSE")}
                                style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>Warehouse</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                checked={locationType === "STORE"}
                                onChange={() => setLocationType("STORE")}
                                style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>Store</span>
                        </label>
                    </div>
                </div>

                {/* LOCATION DROPDOWN */}
                <div className={styles.field}>
                    <label className={styles.label}>{locationType === "WAREHOUSE" ? "Warehouse" : "Store"}</label>
                    <select
                        className={styles.select}
                        value={selectedLocationId}
                        onChange={e => setSelectedLocationId(e.target.value)}
                    >
                        <option value="">Select {locationType.toLowerCase()}</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                                {loc.display_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* PRODUCT ROWS */}
                {rows.map((row, idx) => (
                    <div key={idx}>
                        <div className={styles.field}>
                            <label className={styles.label}>Product</label>
                            <div className={styles.suggestWrap}>
                                <input
                                    className={styles.input}
                                    placeholder="Search product"
                                    value={row.productQuery}
                                    onChange={e => searchProduct(e.target.value, idx)}
                                />

                                {row.products.length > 0 && (
                                    <div className={styles.suggestBox}>
                                        {row.products.map(p => (
                                            <div
                                                key={p.p_id}
                                                className={styles.suggestItem}
                                                onMouseDown={() => {
                                                    const updated = [...rows];
                                                    updated[idx].selectedProduct = p;
                                                    updated[idx].productQuery = p.product_name;
                                                    updated[idx].products = [];
                                                    setRows(updated);
                                                }}
                                            >
                                                <span className={styles.primary}>
                                                    {p.product_name}
                                                </span>
                                                <span className={styles.secondary}>
                                                    {p.barcode}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Quantity</label>
                            <input
                                className={styles.input}
                                type="number"
                                min="1"
                                value={row.qty}
                                onChange={e => {
                                    const updated = [...rows];
                                    updated[idx].qty = e.target.value;
                                    setRows(updated);
                                }}
                            />
                        </div>
                    </div>
                ))}

                {/* ADD PRODUCT */}
                <button
                    className={styles.addRow}
                    onClick={() =>
                        setRows([...rows, {
                            productQuery: "",
                            products: [],
                            selectedProduct: null,
                            qty: 1,
                        }])
                    }
                >
                    + Add Product
                </button>

                {/* PROCESSED BY */}
                <div className={styles.field}>
                    <label className={styles.label}>Processed By (optional)</label>
                    <select
                        className={styles.select}
                        value={processedBy}
                        onChange={e => setProcessedBy(e.target.value)}
                    >
                        <option value="">Select Executive</option>
                        {processedByOptions.map(name => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ACTION */}
                <div className={styles.actionRow}>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            checked={action === "damage"}
                            onChange={() => setAction("damage")}
                        />
                        Damage
                    </label>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            checked={action === "recovery"}
                            onChange={() => setAction("recovery")}
                        />
                        Recovery
                    </label>
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.submit}
                        onClick={submit}
                        disabled={loading}
                    >
                        {loading ? "Processing…" : "Submit"}
                    </button>
                </div>

                {msg && <div className={styles.msg}>{msg}</div>}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
