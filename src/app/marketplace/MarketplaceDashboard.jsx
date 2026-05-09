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
    { sku: "HH-CHAIR-310", name: "Feeding High Chair", stock: 26, price: 7499, status: "Ready", category: "Feeding" }
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
    const [search, setSearch] = useState("");
    const [selectedProducts, setSelectedProducts] = useState(["HH-CRIB-101", "HH-CHAIR-310"]);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return products;
        return products.filter((product) =>
            [product.name, product.sku, product.category, product.status].some((field) =>
                field.toLowerCase().includes(query)
            )
        );
    }, [search]);

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
                    <button className={styles.primaryButton} style={{ background: marketplace.color }}>
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

                        <div className={styles.productTable}>
                            <div className={styles.tableHeader}>
                                <span>Product</span>
                                <span>Category</span>
                                <span>Stock</span>
                                <span>Price</span>
                                <span>Status</span>
                                <span>List</span>
                            </div>
                            {filteredProducts.map((product) => (
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
        </div>
    );
}
