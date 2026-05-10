"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Clock3,
    PackageCheck,
    Search,
    Send,
    ShoppingBag,
    Truck,
    UploadCloud
} from "lucide-react";
import styles from "./marketplace.module.css";

const products = [
    { sku: "HH-CRIB-101", name: "Convertible Baby Crib", stock: 42, price: 18999, status: "Ready", category: "Nursery" },
    { sku: "HH-STROL-220", name: "Compact Travel Stroller", stock: 18, price: 12999, status: "Draft", category: "Travel" },
    { sku: "HH-MAT-084", name: "Organic Baby Mattress", stock: 35, price: 5499, status: "Needs Images", category: "Sleep" },
    { sku: "HH-CHAIR-310", name: "Feeding High Chair", stock: 26, price: 7499, status: "Ready", category: "Feeding" },
    { sku: "HH-MON-405", name: "Smart Baby Monitor", stock: 12, price: 8999, status: "Ready", category: "Electronics" },
    { sku: "HH-BATH-150", name: "Infant Bath Tub", stock: 55, price: 1499, status: "Draft", category: "Bath" },
    { sku: "HH-TOY-890", name: "Educational Play Mat", stock: 104, price: 2999, status: "Ready", category: "Toys" },
    { sku: "HH-BAG-234", name: "Premium Diaper Bag", stock: 48, price: 3499, status: "Needs Images", category: "Travel" },
    { sku: "HH-BOT-111", name: "Anti-Colic Bottle Set", stock: 89, price: 1299, status: "Ready", category: "Feeding" },
    { sku: "HH-CAR-500", name: "Convertible Car Seat", stock: 15, price: 24999, status: "Ready", category: "Travel" },
    { sku: "HH-SWIN-300", name: "Automatic Baby Swing", stock: 22, price: 11999, status: "Draft", category: "Nursery" },
    { sku: "HH-CLO-050", name: "Organic Cotton Onesie", stock: 150, price: 899, status: "Ready", category: "Clothing" }
];

const orders = [
    { id: "MK-10482", item: "Convertible Baby Crib", buyer: "Aarav Sharma", status: "Packed", sla: "Today, 6 PM", value: 18999 },
    { id: "MK-10479", item: "Organic Baby Mattress", buyer: "Priya Mehra", status: "Shipped", sla: "In transit", value: 5499 },
    { id: "MK-10471", item: "Compact Travel Stroller", buyer: "Neha Kapoor", status: "Pending", sla: "Tomorrow, 11 AM", value: 12999 },
    { id: "MK-10463", item: "Feeding High Chair", buyer: "Rohan Sethi", status: "Delivered", sla: "Completed", value: 7499 }
];

const nestedTabs = [
    { id: "listing", label: "Product Listing" },
    { id: "orders", label: "Order Tracking" },
    { id: "settings", label: "Channel Setup" }
];

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(value);
}

export default function MarketplaceDashboard({ marketplace }) {
    const [activeTab, setActiveTab] = useState("listing");
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [showListingForm, setShowListingForm] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState(["HH-CRIB-101", "HH-CHAIR-310"]);
    const [listingForm, setListingForm] = useState({
        sku: "HH-CRIB-101",
        marketplaceCategory: "Baby Furniture",
        listingPrice: "18999",
        stockBuffer: "5",
        fulfillment: "Marketplace Fulfilled"
    });

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        let result = products;
        if (query) {
            result = products.filter((product) =>
                [product.name, product.sku, product.category, product.status].some((field) =>
                    field.toLowerCase().includes(query)
                )
            );
        }
        return result;
    }, [search]);

    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page on search
    useMemo(() => setCurrentPage(1), [search]);

    const listedCount = selectedProducts.length;
    const readyCount = products.filter((product) => product.status === "Ready").length;
    const pendingOrders = orders.filter((order) => order.status === "Pending" || order.status === "Packed").length;

    const toggleProduct = (sku) => {
        setSelectedProducts((current) =>
            current.includes(sku)
                ? current.filter((item) => item !== sku)
                : [...current, sku]
        );
    };

    const updateListingForm = (field, value) => {
        setListingForm((current) => ({ ...current, [field]: value }));
    };

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.kicker}>{marketplace.badge}</div>
                    <h1>{marketplace.name} Integration</h1>
                    <p>{marketplace.description}</p>
                </div>
                <div className={styles.heroActions}>
                    <button className={styles.secondaryButton}>
                        <UploadCloud size={17} />
                        Bulk Sync
                    </button>
                    <button
                        className={styles.primaryButton}
                        style={{ background: marketplace.color }}
                        onClick={() => setShowListingForm(true)}
                    >
                        <Send size={17} />
                        List Selected
                    </button>
                </div>
            </section>

            <section className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <ShoppingBag size={18} />
                    <span>Listed SKUs</span>
                    <strong>{listedCount}</strong>
                </div>
                <div className={styles.metricCard}>
                    <PackageCheck size={18} />
                    <span>Ready To Publish</span>
                    <strong>{readyCount}</strong>
                </div>
                <div className={styles.metricCard}>
                    <Truck size={18} />
                    <span>Open Orders</span>
                    <strong>{pendingOrders}</strong>
                </div>
                <div className={styles.metricCard}>
                    <BarChart3 size={18} />
                    <span>Channel Health</span>
                    <strong>92%</strong>
                </div>
            </section>

            <section className={styles.workspace}>
                <div className={styles.tabs}>
                    {nestedTabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={activeTab === tab.id ? styles.activeTab : ""}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "listing" && (
                    <div className={styles.panel}>
                        <div className={styles.panelToolbar}>
                            <div>
                                <h2>List dashboard products to {marketplace.name}</h2>
                                <p>Select products, review readiness, then publish them to the marketplace catalog.</p>
                            </div>
                            <div className={styles.searchBox}>
                                <Search size={16} />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search SKU, product, category..."
                                />
                            </div>
                        </div>

                        <div className={styles.listingActionBar}>
                            <div>
                                <strong>{selectedProducts.length} products selected</strong>
                                <span>Open the form to map category, price, buffer stock and fulfillment before publishing.</span>
                            </div>
                            <button
                                type="button"
                                className={styles.formSubmit}
                                style={{ background: marketplace.color }}
                                onClick={() => setShowListingForm(true)}
                            >
                                <Send size={16} />
                                Create Listing Form
                            </button>
                        </div>

                        <div className={styles.productTable}>
                            <div className={styles.tableHeader}>
                                <span>Product</span>
                                <span>Category</span>
                                <span>Stock</span>
                                <span>Price</span>
                                <span>Status</span>
                                <span>List</span>
                            </div>
                            {paginatedProducts.map((product) => (
                                <div key={product.sku} className={styles.tableRow}>
                                    <div>
                                        <strong>{product.name}</strong>
                                        <small>{product.sku}</small>
                                    </div>
                                    <span>{product.category}</span>
                                    <span>{product.stock}</span>
                                    <span>{formatCurrency(product.price)}</span>
                                    <span className={styles.statusPill}>{product.status}</span>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product.sku)}
                                            onChange={() => toggleProduct(product.sku)}
                                        />
                                        <span></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                        
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "orders" && (
                    <div className={styles.panel}>
                        <div className={styles.panelToolbar}>
                            <div>
                                <h2>{marketplace.name} order tracking</h2>
                                <p>Track marketplace order stage, SLA, buyer, and handoff status from one SaaS view.</p>
                            </div>
                        </div>
                        <div className={styles.orderBoard}>
                            {orders.map((order) => (
                                <article key={order.id} className={styles.orderCard}>
                                    <div className={styles.orderTop}>
                                        <strong>{order.id}</strong>
                                        <span>{order.status}</span>
                                    </div>
                                    <h3>{order.item}</h3>
                                    <p>{order.buyer}</p>
                                    <div className={styles.orderMeta}>
                                        <span><Clock3 size={14} /> {order.sla}</span>
                                        <span>{formatCurrency(order.value)}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className={styles.panel}>
                        <div className={styles.setupGrid}>
                            <div className={styles.setupCard}>
                                <CheckCircle2 size={18} />
                                <h3>Seller Account</h3>
                                <p>Connect seller ID, warehouse mapping, tax profile, and catalog permissions.</p>
                            </div>
                            <div className={styles.setupCard}>
                                <AlertCircle size={18} />
                                <h3>Listing Rules</h3>
                                <p>Define price markup, stock buffer, image rules, and category mapping before publishing.</p>
                            </div>
                            <div className={styles.setupCard}>
                                <Truck size={18} />
                                <h3>Order Sync</h3>
                                <p>Configure order pull frequency, SLA warnings, invoice flow, and fulfillment handoff.</p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {showListingForm && (
                <div className={styles.modalOverlay} onClick={() => setShowListingForm(false)}>
                    <form className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <span>{marketplace.name} Listing Form</span>
                                <h2>Create Marketplace Listing</h2>
                            </div>
                            <button type="button" onClick={() => setShowListingForm(false)}>Close</button>
                        </div>

                        <div className={styles.modalGrid}>
                            <div className={styles.formField}>
                                <label>Product</label>
                                <select value={listingForm.sku} onChange={(event) => updateListingForm("sku", event.target.value)}>
                                    {products.map((product) => (
                                        <option key={product.sku} value={product.sku}>{product.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formField}>
                                <label>{marketplace.name} Category</label>
                                <input
                                    value={listingForm.marketplaceCategory}
                                    onChange={(event) => updateListingForm("marketplaceCategory", event.target.value)}
                                    placeholder="Marketplace category"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label>Listing Price</label>
                                <input
                                    type="number"
                                    value={listingForm.listingPrice}
                                    onChange={(event) => updateListingForm("listingPrice", event.target.value)}
                                    placeholder="Price"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label>Stock Buffer</label>
                                <input
                                    type="number"
                                    value={listingForm.stockBuffer}
                                    onChange={(event) => updateListingForm("stockBuffer", event.target.value)}
                                    placeholder="Buffer"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label>Fulfillment</label>
                                <select value={listingForm.fulfillment} onChange={(event) => updateListingForm("fulfillment", event.target.value)}>
                                    <option>Marketplace Fulfilled</option>
                                    <option>Seller Fulfilled</option>
                                    <option>Warehouse Pickup</option>
                                </select>
                            </div>
                            <div className={styles.formField}>
                                <label>Listing Notes</label>
                                <input placeholder="Optional launch note" />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.secondaryButton} onClick={() => setShowListingForm(false)}>
                                Cancel
                            </button>
                            <button type="button" className={styles.primaryButton} style={{ background: marketplace.color }} onClick={() => setShowListingForm(false)}>
                                <Send size={16} />
                                Save Listing Draft
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
