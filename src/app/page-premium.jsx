"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    LockKeyhole,
    Login,
    Inventory2,
    Psychology,
    ShieldCheck,
    SyncAlt,
    Grid3X3,
    ShoppingCart,
    SearchCheck,
    Truck,
    HeadsetMic,
    BrainCircuit,
    RateReview,
    ReceiptLong,
    ContactSupport,
    Headphones,
    BarChart3,
    Globe2
} from "lucide-react";

// Icon mapping for services
const iconMap = {
    sync_alt: SyncAlt,
    grid_view: Grid3X3,
    shopping_cart: ShoppingCart,
    analytics: SearchCheck,
    local_shipping: Truck,
    support_agent: HeadsetMic,
    neurology: BrainCircuit,
    rate_review: RateReview,
    receipt_long: ReceiptLong
};

export default function Home() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const services = [
        { icon: "sync_alt", title: "Advanced Stock Transfer", text: "W2W, W2S, S2S, and S2W transfers with source/destination control and automated AWB tracking." },
        { icon: "grid_view", title: "Website Product Catalog", text: "Centralized product administration with SKU management, categories, and AI-powered SEO descriptions." },
        { icon: "shopping_cart", title: "Marketplace Integrations", text: "Operational connectors for Amazon and Flipkart workflows, syncing orders and stock in real-time." },
        { icon: "analytics", title: "User And Order Tracking", text: "Granular visibility into order lifecycles and customer behavior with predictive delivery timelines." },
        { icon: "local_shipping", title: "Delivery And Shiprocket", text: "Deep integration with logistics partners to automate manifest generation and delivery status updates." },
        { icon: "support_agent", title: "Multilingual Chat Support", text: "AI-driven support system capable of handling complex queries in multiple regional languages." },
        { icon: "neurology", title: "InventoryGPT Brain", text: "The core intelligence engine predicting demand signals and optimizing stock distribution levels." },
        { icon: "rate_review", title: "Review Management", text: "Aggregate and analyze customer feedback across all channels to identify operational blind spots." },
        { icon: "receipt_long", title: "Offline Store Billing", text: "Unified POS system that bridges the gap between physical storefronts and digital inventory." }
    ];

    const clients = [
        { name: "GiftGala", icon: Globe2 },
        { name: "Sera", icon: Globe2 },
        { name: "Twist&Spin", icon: Globe2 },
        { name: "Trading India", icon: Globe2 },
        { name: "D Mall", icon: Globe2 }
    ];

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    };

    const staggerContainer = {
        animate: {
            transition: { staggerChildren: 0.1 }
        }
    };

    const staggerItem = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <main className="min-h-screen bg-[#081423] text-[#d7e3f9] font-sans selection:bg-[#00f0ff]/30 overflow-x-hidden">
            {/* TopNavBar */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6 }}
                className={`fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-16 h-20 transition-all duration-300 ${
                    scrolled
                        ? "bg-[#081423]/90 backdrop-blur-xl border-b border-[#3b494b]"
                        : "bg-[#081423]/80 backdrop-blur-xl"
                }`}
            >
                <div className="flex items-center gap-2">
                    <span className="font-bold text-2xl text-[#dbfcff] tracking-tighter">Insora</span>
                </div>
                <nav className="hidden md:flex items-center gap-6">
                    <a href="#services" className="text-xs font-bold tracking-widest text-[#b9cacb] hover:text-[#00f0ff] transition-colors uppercase">
                        Services
                    </a>
                    <a href="#brain" className="text-xs font-bold tracking-widest text-[#00f0ff] border-b-2 border-[#00f0ff] pb-1 uppercase">
                        InventoryGPT Brain
                    </a>
                    <a href="#clients" className="text-xs font-bold tracking-widest text-[#b9cacb] hover:text-[#00f0ff] transition-colors uppercase">
                        Clients
                    </a>
                    <a href="#contact" className="text-xs font-bold tracking-widest text-[#b9cacb] hover:text-[#00f0ff] transition-colors uppercase">
                        Contact
                    </a>
                </nav>
                <div className="flex items-center gap-6">
                    <Link
                        href="/login"
                        className="text-xs font-bold tracking-widest px-6 py-3 border border-[#3b494b] rounded flex items-center gap-2 hover:bg-[#2a3546]/50 transition-all uppercase"
                    >
                        <LockKeyhole size={14} />
                        Login
                    </Link>
                </div>
            </motion.header>

            {/* Hero Section */}
            <section className="relative min-h-[921px] flex items-center overflow-hidden px-4 md:px-16">
                {/* Grid Mesh Background */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(132, 148, 149, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(132, 148, 149, 0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: "40px 40px"
                    }}
                />
                
                {/* Brain Image Background */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full md:w-1/2 h-full z-0 opacity-60">
                    <img
                        className="w-full h-full object-contain filter hue-rotate-180 brightness-125"
                        src="/homepage/inventorygpt-ai-brain.png"
                        alt="AI Brain Network"
                    />
                </div>

                {/* Hero Content */}
                <motion.div
                    className="relative z-10 max-w-3xl"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <span className="text-xs font-bold tracking-widest text-[#00f0ff] mb-6 block uppercase">
                        insora.in AI operations platform
                    </span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-[1.05] tracking-tight">
                        Inventory, commerce, delivery, billing, and AI in{" "}
                        <span className="text-[#00f0ff]">one operating brain.</span>
                    </h1>
                    <p className="text-lg text-[#b9cacb] mb-12 max-w-xl leading-relaxed">
                        Insora builds enterprise-grade inventory systems for warehouses, stores, marketplaces, delivery teams, support teams, and AI-powered decision making.
                    </p>
                    <div className="flex flex-wrap gap-6">
                        <motion.a
                            href="#brain"
                            className="bg-[#00f0ff] text-[#00363a] font-semibold px-10 py-5 rounded flex items-center gap-2 hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Enter InventoryGPT
                            <ArrowRight size={20} />
                        </motion.a>
                        <Link
                            href="/login"
                            className="border border-[#3b494b] text-white font-semibold px-10 py-5 rounded hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                            Open client login
                            <Login size={20} />
                        </Link>
                    </div>
                    <motion.div
                        className="mt-16 flex flex-wrap gap-6 opacity-70"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 1, duration: 0.8 }}
                    >
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest border border-[#3b494b]/30 px-4 py-2 rounded-full uppercase">
                            <Inventory2 size={14} /> Multi-warehouse operations
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest border border-[#3b494b]/30 px-4 py-2 rounded-full uppercase">
                            <Psychology size={14} /> AI inventory intelligence
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest border border-[#3b494b]/30 px-4 py-2 rounded-full uppercase">
                            <ShieldCheck size={14} /> Secure client workspace
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Impact Metrics */}
            <motion.section
                className="border-y border-[#3b494b] bg-[#040f1e]"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
            >
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#3b494b]">
                    {[
                        { value: "12+", label: "PRODUCT MODULES" },
                        { value: "4", label: "TRANSFER TYPES" },
                        { value: "AI", label: "INVENTORYGPT BRAIN" },
                        { value: "B2B", label: "CLIENT OPERATIONS" }
                    ].map((metric, idx) => (
                        <motion.div
                            key={idx}
                            variants={staggerItem}
                            className="px-4 md:px-16 py-12 group hover:bg-[#152030] transition-colors"
                        >
                            <div className="text-5xl font-extrabold text-white mb-2">{metric.value}</div>
                            <div className="text-xs font-bold tracking-widest text-[#00f0ff] uppercase">{metric.label}</div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Product Services Overview */}
            <section className="py-32 px-4 md:px-16" id="services">
                <motion.div
                    className="mb-20"
                    {...fadeInUp}
                >
                    <span className="text-xs font-bold tracking-widest text-[#00f0ff] mb-4 block uppercase">
                        PRODUCT SERVICES
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white max-w-2xl mb-6 tracking-tight">
                        Insora covers the full inventory operations loop.
                    </h2>
                    <p className="text-[#b9cacb] max-w-xl">
                        The product scope is built from real warehouse, store, marketplace, delivery, billing, support, and AI workflows.
                    </p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                >
                    {services.map((service, idx) => {
                        const IconComponent = iconMap[service.icon] || BrainCircuit;
                        return (
                            <motion.div
                                key={idx}
                                variants={staggerItem}
                                whileHover={{ scale: 1.02, borderColor: "rgba(0, 240, 255, 0.5)" }}
                                className="bg-[#081423]/60 backdrop-blur-xl border border-[#ffffff1a] p-10 group hover:border-[#00f0ff]/50 transition-all rounded"
                            >
                                <IconComponent className="text-[#00f0ff] text-4xl mb-6" />
                                <h3 className="text-xl font-semibold text-white mb-4">{service.title}</h3>
                                <p className="text-[#b9cacb] leading-relaxed">{service.text}</p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </section>

            {/* Client Ecosystem */}
            <section className="py-32 px-4 md:px-16 bg-[#111c2c] border-t border-[#3b494b]" id="clients">
                <motion.div className="mb-16" {...fadeInUp}>
                    <span className="text-xs font-bold tracking-widest text-[#00f0ff] mb-4 block uppercase">
                        CLIENT ECOSYSTEM
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                        Built for real operators and client brands.
                    </h2>
                </motion.div>

                <motion.div
                    className="flex flex-wrap items-center justify-between gap-6"
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                >
                    {clients.map((client, idx) => {
                        const Icon = client.icon;
                        return (
                            <motion.div
                                key={idx}
                                variants={staggerItem}
                                whileHover={{ scale: 1.05, filter: "grayscale(0)" }}
                                className="flex items-center gap-4 bg-[#081423] px-10 py-8 border border-[#3b494b] grayscale hover:grayscale-0 transition-all"
                            >
                                <Icon className="text-[#00f0ff]" size={24} />
                                <span className="text-xl font-semibold text-white">{client.name}</span>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </section>

            {/* Contact/CTA Footer Section */}
            <section className="py-32 px-4 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center" id="contact">
                <motion.div {...fadeInUp}>
                    <span className="text-xs font-bold tracking-widest text-[#00f0ff] mb-4 block uppercase">
                        WORK WITH INSORA.IN
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">
                        Build a smarter inventory operations layer.
                    </h2>
                    <p className="text-lg text-[#b9cacb] max-w-xl leading-relaxed">
                        For inventory software, InventoryGPT, warehouse workflows, marketplace integrations, delivery systems, billing, support, and automation, connect with Insora.
                    </p>
                </motion.div>

                <motion.div
                    className="bg-[#081423]/60 backdrop-blur-xl border border-[#ffffff1a] p-12 space-y-4 rounded"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(132, 148, 149, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(132, 148, 149, 0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: "40px 40px"
                    }}
                    {...fadeInUp}
                >
                    <div className="flex items-start gap-6 p-6 border border-[#3b494b]/30 bg-[#152030]/50">
                        <div className="bg-[#00f0ff]/10 p-3 rounded">
                            <ContactSupport className="text-[#00f0ff]" size={24} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold tracking-widest text-white mb-2 uppercase">CONTACT</h4>
                            <a href="mailto:contact@insora.in" className="text-xl text-[#00f0ff] hover:underline font-medium">
                                contact@insora.in
                            </a>
                        </div>
                    </div>
                    <div className="flex items-start gap-6 p-6 border border-[#3b494b]/30 bg-[#152030]/50">
                        <div className="bg-[#00f0ff]/10 p-3 rounded">
                            <HeadsetMic className="text-[#00f0ff]" size={24} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold tracking-widest text-white mb-2 uppercase">SUPPORT</h4>
                            <a href="mailto:support@insora.in" className="text-xl text-[#00f0ff] hover:underline font-medium">
                                support@insora.in
                            </a>
                        </div>
                    </div>
                    <Link
                        href="/login"
                        className="w-full bg-[#00f0ff] text-[#00363a] font-semibold py-6 rounded flex justify-center items-center gap-3 mt-8 hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all"
                    >
                        Client login
                        <ArrowRight size={20} />
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="w-full py-8 px-4 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8 bg-[#040f1e] border-t border-[#3b494b]">
                <div className="flex flex-col gap-2">
                    <span className="text-2xl font-bold text-[#00f0ff]">Insora</span>
                    <p className="text-sm text-[#b9cacb]">
                        © 2026 Insora AI Operations Platform. All rights reserved.
                    </p>
                </div>
                <div className="flex flex-wrap gap-6">
                    <a href="#" className="text-xs font-bold tracking-widest text-[#b9cacb] hover:text-[#00f0ff] transition-colors uppercase">
                        Privacy Policy
                    </a>
                    <a href="#" className="text-xs font-bold tracking-widest text-[#b9cacb] hover:text-[#00f0ff] transition-colors uppercase">
                        Terms of Service
                    </a>
                    <a href="#" className="text-xs font-bold tracking-widest text-[#b9cacb] hover:text-[#00f0ff] transition-colors uppercase">
                        Security
                    </a>
                    <a href="#" className="text-xs font-bold tracking-widest text-[#b9cacb] hover:text-[#00f0ff] transition-colors uppercase">
                        API Documentation
                    </a>
                    <a href="#" className="text-xs font-bold tracking-widest text-[#b9cacb] hover:text-[#00f0ff] transition-colors uppercase">
                        System Status
                    </a>
                </div>
            </footer>
        </main>
    );
}
