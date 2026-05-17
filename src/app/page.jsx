"use client";

import Link from "next/link";
import {
    ArrowRight,
    BarChart3,
    Bot,
    BrainCircuit,
    Building2,
    ClipboardList,
    DatabaseZap,
    Globe2,
    Headphones,
    Languages,
    LayoutDashboard,
    LockKeyhole,
    Network,
    PackageCheck,
    Receipt,
    RefreshCw,
    SearchCheck,
    ShieldCheck,
    ShoppingCart,
    Truck,
    Warehouse,
    Workflow,
    Zap
} from "lucide-react";
import styles from "./page.module.css";

const productServices = [
    {
        icon: RefreshCw,
        title: "Advanced Stock Transfer",
        text: "W2W, W2S, S2S, and S2W transfers with source/destination control, logistics partner details, AWB tracking, parcel dimensions, payment mode, executive assignment, and internal notes."
    },
    {
        icon: LayoutDashboard,
        title: "Website Product Catalog",
        text: "Centralized product administration with SKU management, categories, bulk upload, featured products, pricing, inventory status filters, low-stock alerts, and fulfillment visibility."
    },
    {
        icon: ShoppingCart,
        title: "Marketplace Integrations",
        text: "Operational connectors for Amazon and Flipkart workflows, product visibility, order operations, and multichannel inventory coordination."
    },
    {
        icon: SearchCheck,
        title: "User And Order Tracking",
        text: "Website user tracking, website order management, order timeline visibility, delivery status views, and customer-facing tracking dashboards."
    },
    {
        icon: Truck,
        title: "Delivery And Shiprocket",
        text: "Create orders, connect delivery flows, integrate Shiprocket, track fulfillment progress, and keep dispatch teams aligned with live movement data."
    },
    {
        icon: Headphones,
        title: "Multilingual Chat Support",
        text: "Website chat support with multilingual translation support for customer service teams and faster issue resolution."
    },
    {
        icon: BrainCircuit,
        title: "InventoryGPT Brain",
        text: "AI inventory intelligence for natural-language questions, operational recommendations, demand signals, stock optimization, and decision support."
    },
    {
        icon: ClipboardList,
        title: "Review Management",
        text: "Website review dashboard for monitoring product feedback, operational quality, and customer experience signals."
    },
    {
        icon: Receipt,
        title: "Offline Store Billing",
        text: "Store billing workflows connected with inventory, stock movement, customer data, and operations visibility."
    },
    {
        icon: Warehouse,
        title: "Store Inventory Timeline",
        text: "Store inventory, product movement records, and inventory timeline views that help teams understand where stock moved and why."
    },
    {
        icon: Building2,
        title: "Multi-Warehouse Inventory",
        text: "Inventory operations across multiple warehouses, stores, and business locations with stock balancing and structured movement control."
    },
    {
        icon: Workflow,
        title: "AI Automation Pipeline",
        text: "LangChain-style AI pipelines, n8n automation, SEO workflow routing, and language translation routing for smarter operations."
    }
];

const brainFlow = [
    {
        label: "Collect",
        title: "Products, stock, orders, reviews, and support events enter the Insora data layer.",
        icon: DatabaseZap
    },
    {
        label: "Connect",
        title: "Warehouses, stores, marketplaces, delivery partners, billing, and storefront APIs become one network.",
        icon: Network
    },
    {
        label: "Think",
        title: "InventoryGPT reads operational context and turns movement data into useful intelligence.",
        icon: BrainCircuit
    },
    {
        label: "Act",
        title: "Teams execute transfers, dispatch, billing, support, approvals, and audits from the same workspace.",
        icon: Zap
    }
];

const clients = [
    "GiftGala",
    "Sera",
    "Twist&Spin",
    "Trading India",
    "D Mall"
];

const metrics = [
    { value: "12+", label: "Product Modules" },
    { value: "4", label: "Transfer Types" },
    { value: "AI", label: "InventoryGPT Brain" },
    { value: "B2B", label: "Client Operations" }
];

export default function Home() {
    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <img
                    className={styles.heroImage}
                    src="/homepage/inventorygpt-ai-brain.png"
                    alt="Holographic InventoryGPT brain for insora.in"
                />
                <div className={styles.heroShade} />
                <div className={styles.scanLayer} />
                <div className={styles.signalOne} />
                <div className={styles.signalTwo} />
                <div className={styles.orbitRing} />

                <nav className={styles.nav} aria-label="insora.in homepage navigation">
                    <Link className={styles.brand} href="/">
                        <span className={styles.brandMark}>IN</span>
                        <span>insora.in</span>
                    </Link>
                    <div className={styles.navLinks}>
                        <a href="#services">Services</a>
                        <a href="#brain">InventoryGPT Brain</a>
                        <a href="#clients">Clients</a>
                        <a href="#contact">Contact</a>
                    </div>
                    <Link className={styles.loginButton} href="/login">
                        <LockKeyhole size={16} />
                        Login
                    </Link>
                </nav>

                <div className={styles.heroContent}>
                    <p className={styles.eyebrow}>insora.in AI operations platform</p>
                    <h1>Inventory, commerce, delivery, billing, and AI in one operating brain.</h1>
                    <p className={styles.heroText}>
                        Insora builds enterprise-grade inventory systems for warehouses, stores,
                        marketplaces, delivery teams, support teams, and AI-powered decision making.
                    </p>
                    <div className={styles.heroActions}>
                        <a className={styles.primaryCta} href="#brain">
                            Enter InventoryGPT
                            <ArrowRight size={18} />
                        </a>
                        <Link className={styles.secondaryCta} href="/login">
                            Open client login
                            <LockKeyhole size={18} />
                        </Link>
                    </div>
                    <div className={styles.heroMeta}>
                        <span><Warehouse size={15} /> Multi-warehouse operations</span>
                        <span><Bot size={15} /> AI inventory intelligence</span>
                        <span><ShieldCheck size={15} /> Secure client workspace</span>
                    </div>
                </div>

                <div className={styles.nextHint}>
                    <span>Scroll into the brain</span>
                    <i />
                </div>
            </section>

            <section className={styles.metricsBand} aria-label="insora.in product metrics">
                {metrics.map((metric) => (
                    <div className={styles.metric} key={metric.label}>
                        <strong>{metric.value}</strong>
                        <span>{metric.label}</span>
                    </div>
                ))}
            </section>

            <section className={styles.services} id="services">
                <div className={styles.sectionIntro}>
                    <p className={styles.eyebrow}>Product services</p>
                    <h2>Insora covers the full inventory operations loop.</h2>
                    <p>
                        The product scope is built from real warehouse, store, marketplace, delivery,
                        billing, support, and AI workflows. Commercial website and developer-extension
                        items are intentionally excluded from this public product page.
                    </p>
                </div>

                <div className={styles.serviceGrid}>
                    {productServices.map((service) => {
                        const Icon = service.icon;
                        return (
                            <article className={styles.serviceCard} key={service.title}>
                                <Icon size={22} />
                                <h3>{service.title}</h3>
                                <p>{service.text}</p>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section className={styles.brainSection} id="brain">
                <div className={styles.brainSticky}>
                    <div className={styles.brainVisual}>
                        <img src="/homepage/inventorygpt-ai-brain.png" alt="" />
                        <div className={styles.brainTunnel} />
                        <div className={styles.brainPulse} />
                        <div className={styles.brainCore}>
                            <BrainCircuit size={28} />
                            <span>InventoryGPT</span>
                        </div>
                    </div>
                </div>
                <div className={styles.brainStory}>
                    <p className={styles.eyebrow}>Infographic journey</p>
                    <h2>Scroll down and enter the InventoryGPT brain.</h2>
                    <p>
                        The page moves from visible business modules into the intelligence layer where
                        operational signals become AI-readable context and executable recommendations.
                    </p>
                    <div className={styles.flowList}>
                        {brainFlow.map((step) => {
                            const Icon = step.icon;
                            return (
                                <article className={styles.flowCard} key={step.label}>
                                    <div>
                                        <Icon size={22} />
                                        <span>{step.label}</span>
                                    </div>
                                    <p>{step.title}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className={styles.clients} id="clients">
                <div className={styles.sectionIntro}>
                    <p className={styles.eyebrow}>Client ecosystem</p>
                    <h2>Built for real operators and client brands.</h2>
                    <p>
                        Client names are shown only as client references. The platform brand remains
                        insora.in across the public page.
                    </p>
                </div>
                <div className={styles.clientGrid}>
                    {clients.map((client) => (
                        <div className={styles.clientCard} key={client}>
                            <Globe2 size={18} />
                            <span>{client}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.contactBand} id="contact">
                <div className={styles.contactCopy}>
                    <p className={styles.eyebrow}>Work with insora.in</p>
                    <h2>Build a smarter inventory operations layer.</h2>
                    <p>
                        For inventory software, InventoryGPT, warehouse workflows, marketplace
                        integrations, delivery systems, billing, support, and automation, connect with Insora.
                    </p>
                </div>
                <div className={styles.contactPanel}>
                    <a href="mailto:contact@insora.in" className={styles.contactAction}>
                        <BarChart3 size={18} />
                        <span>
                            <strong>Contact</strong>
                            contact@insora.in
                        </span>
                    </a>
                    <a href="mailto:support@insora.in" className={styles.contactAction}>
                        <Headphones size={18} />
                        <span>
                            <strong>Support</strong>
                            support@insora.in
                        </span>
                    </a>
                    <Link className={styles.primaryCta} href="/login">
                        Client login
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>
        </main>
    );
}
