"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, LockKeyhole, LogIn, Package, Brain, Shield,
  Repeat, LayoutGrid, ShoppingCart, BarChart2, Truck,
  Headphones, BrainCircuit, Star, Receipt, MessageSquare, Globe,
  Zap, TrendingUp, Layers, Users, Sparkles, Cpu
} from "lucide-react";

const iconMap = {
  sync_alt: Repeat, grid_view: LayoutGrid, shopping_cart: ShoppingCart,
  analytics: BarChart2, local_shipping: Truck, support_agent: Headphones,
  neurology: BrainCircuit, rate_review: Star, receipt_long: Receipt
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const brainRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const brainY = useTransform(scrollYProgress, [0, 0.5], [0, -120]);

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
    { icon: "neurology", title: "InventoryGPT AI", text: "The core intelligence engine predicting demand signals and optimizing stock distribution levels." },
    { icon: "rate_review", title: "Review Management", text: "Aggregate and analyze customer feedback across all channels to identify operational blind spots." },
    { icon: "receipt_long", title: "Offline Store Billing", text: "Unified POS system that bridges the gap between physical storefronts and digital inventory." }
  ];

  const clients = [
    { name: "Insora", icon: Globe }, { name: "Sera", icon: Globe },
    { name: "Twist&Spin", icon: Globe }, { name: "Trading India", icon: Globe },
    { name: "D Mall", icon: Globe }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  const staggerItem = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <main className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { transform: translateY(-80px) translateX(30px); }
        }
        .parallax {
          background-attachment: fixed;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }
        @media (max-width: 768px) {
          .parallax { background-attachment: scroll; }
        }
        .gradient-text {
          background: linear-gradient(135deg, #059669, #10b981, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* NAVBAR */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-20 h-20 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <span className={`font-bold text-xl tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>Insora</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#services" className={`text-sm font-medium ${scrolled ? 'text-slate-500 hover:text-emerald-600' : 'text-white/70 hover:text-white'} transition-colors`}>Services</a>
          <a href="#brain" className={`text-sm font-medium border-b-2 border-emerald-500 pb-1 ${scrolled ? 'text-emerald-600' : 'text-emerald-400'}`}>InventoryGPT AI</a>
          <a href="#clients" className={`text-sm font-medium ${scrolled ? 'text-slate-500 hover:text-emerald-600' : 'text-white/70 hover:text-white'} transition-colors`}>Clients</a>
          <a href="#contact" className={`text-sm font-medium ${scrolled ? 'text-slate-500 hover:text-emerald-600' : 'text-white/70 hover:text-white'} transition-colors`}>Contact</a>
        </nav>
        <Link
          href="/login"
          className={`text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
            scrolled
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'border border-white/30 text-white hover:bg-white/10'
          }`}
        >
          <LockKeyhole size={14} />
          Login
        </Link>
      </motion.header>

      {/* HERO SECTION with parallax */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-slate-900">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "80px 80px"
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${10 + Math.random() * 80}%`,
                animation: `float ${8 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="relative z-10 w-full px-6 md:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div className="flex items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase">
                  <Zap size={12} /> AI Operations Platform
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight">
                Inventory, commerce, delivery, billing, and AI in{" "}
                <span className="gradient-text">one operating brain.</span>
              </h1>
              <p className="text-lg text-slate-300 mb-10 max-w-xl leading-relaxed">
                Insora builds enterprise-grade inventory systems for warehouses, stores, marketplaces, delivery teams, support teams, and AI-powered decision making.
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.a href="#brain"
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-shadow"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                  Enter InventoryGPT AI <ArrowRight size={18} />
                </motion.a>
                <Link href="/login"
                  className="border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  Open client login <LogIn size={18} />
                </Link>
              </div>

              <motion.div className="mt-12 flex flex-wrap gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                {["Multi-warehouse", "AI Intelligence", "Secure Workspace"].map((tag, i) => (
                  <span key={i} className="text-xs font-semibold tracking-wider text-slate-400 border border-slate-700 px-3 py-1.5 rounded-full uppercase">
                    {tag}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - AI Brain visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }} className="relative flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute w-[420px] h-[420px] border border-emerald-500/10 rounded-full"
              />
              <motion.div
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute w-[340px] h-[340px] border border-emerald-500/15 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative bg-gradient-to-br from-emerald-500/10 to-green-600/5 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-8 shadow-2xl"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <BrainCircuit size={40} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">InventoryGPT</h3>
                  <p className="text-sm text-slate-400 text-center">Artificial Intelligence Engine</p>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3].map((_, i) => (
                      <motion.div key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                        className="w-2 h-2 rounded-full bg-emerald-400"
                      />
                    ))}
                  </div>
                </div>
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-500/40 rounded-br-xl" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* METRICS */}
      <section className="bg-white border-y border-slate-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200 max-w-6xl mx-auto">
          {[
            { value: "12+", label: "PRODUCT MODULES" },
            { value: "4", label: "TRANSFER TYPES" },
            { value: "AI", label: "INVENTORYGPT" },
            { value: "B2B", label: "CLIENT OPS" }
          ].map((m, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
              className="px-8 py-16 group hover:bg-slate-50 transition-colors text-center"
            >
              <div className="text-5xl font-extrabold text-slate-900 mb-2">{m.value}</div>
              <div className="text-xs font-bold tracking-widest text-emerald-600 uppercase">{m.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-32 px-6 md:px-20 bg-slate-50" id="services">
        <motion.div className="max-w-6xl mx-auto" {...fadeInUp}>
          <div className="mb-16">
            <span className="text-xs font-bold tracking-widest text-emerald-600 mb-4 block uppercase">Product Services</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 max-w-2xl mb-6 tracking-tight">
              Insora covers the full inventory operations loop.
            </h2>
            <p className="text-slate-500 max-w-xl text-lg">
              Built from real warehouse, store, marketplace, delivery, billing, support, and AI workflows.
            </p>
          </div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}
          >
            {services.map((s, idx) => {
              const Icon = iconMap[s.icon] || BrainCircuit;
              return (
                <motion.div key={idx} variants={staggerItem}
                  whileHover={{ y: -4, borderColor: "#10b981" }}
                  className="bg-white border border-slate-200 p-8 hover:border-emerald-400 hover:shadow-lg transition-all rounded-xl group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                    <Icon className="text-emerald-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{s.text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* INVENTORYGPT AI - HERO SECTION */}
      <section ref={brainRef} id="brain" className="relative py-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <span className="text-xs font-bold tracking-widest text-emerald-400 mb-4 block uppercase">Core Intelligence</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
                InventoryGPT is not a bot.<br />
                <span className="gradient-text">It is an AI.</span>
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                A neural intelligence layer that understands your entire inventory ecosystem — predicting demand, optimizing stock distribution, and automating decisions across warehouses, stores, and marketplaces.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Demand forecasting across 12+ product modules",
                  "Real-time stock optimization recommendations",
                  "Natural language query interface for operators",
                  "Automated transfer suggestions between locations"
                ].map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-3 text-slate-300"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </ul>
              <motion.a href="/inventorygpt"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-shadow"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              >
                Launch InventoryGPT AI <ArrowRight size={18} />
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute w-[300px] h-[300px] border border-emerald-500/10 rounded-full"
              />
              <motion.div style={{ y: brainY }} className="relative">
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/5 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-10 shadow-2xl">
                  <Cpu size={80} className="text-emerald-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white text-center">InventoryGPT</h3>
                  <p className="text-slate-400 text-center mt-2">Neural Inventory Intelligence</p>
                  <div className="flex justify-center gap-3 mt-6">
                    {["Demand", "Stock", "Transfer"].map((label, i) => (
                      <span key={i} className="text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-center gap-1.5 mt-6">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <motion.div key={i}
                        animate={{ height: [12, 32, 12] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 bg-gradient-to-t from-emerald-400 to-green-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CLIENTS */}
      <section className="py-32 px-6 md:px-20 bg-white" id="clients">
        <motion.div className="max-w-6xl mx-auto" {...fadeInUp}>
          <div className="mb-16 text-center">
            <span className="text-xs font-bold tracking-widest text-emerald-600 mb-4 block uppercase">Client Ecosystem</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Built for real operators and client brands.
            </h2>
          </div>
          <motion.div className="flex flex-wrap justify-center gap-6"
            variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}
          >
            {clients.map((c, idx) => {
              const Icon = c.icon;
              return (
                <motion.div key={idx} variants={staggerItem}
                  whileHover={{ y: -4, borderColor: "#10b981" }}
                  className="flex items-center gap-4 bg-white border border-slate-200 px-8 py-6 hover:border-emerald-400 hover:shadow-lg transition-all rounded-xl"
                >
                  <Icon className="text-emerald-600" size={24} />
                  <span className="text-lg font-semibold text-slate-900">{c.name}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* CONTACT */}
      <section className="py-32 px-6 md:px-20 bg-slate-50" id="contact">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeInUp}>
            <span className="text-xs font-bold tracking-widest text-emerald-600 mb-4 block uppercase">Work With Insora</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Build a smarter inventory operations layer.
            </h2>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
              For inventory software, InventoryGPT AI, warehouse workflows, marketplace integrations, delivery systems, billing, support, and automation.
            </p>
          </motion.div>

          <motion.div className="bg-white border border-slate-200 p-10 rounded-xl shadow-sm space-y-4" {...fadeInUp}>
            <div className="flex items-start gap-5 p-5 border border-slate-100 rounded-lg bg-slate-50">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="text-emerald-600" size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-widest text-slate-900 mb-1 uppercase">Contact</h4>
                <a href="mailto:contact@insora.in" className="text-lg text-emerald-600 hover:underline font-medium">contact@insora.in</a>
              </div>
            </div>
            <div className="flex items-start gap-5 p-5 border border-slate-100 rounded-lg bg-slate-50">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Headphones className="text-emerald-600" size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-widest text-slate-900 mb-1 uppercase">Support</h4>
                <a href="mailto:support@insora.in" className="text-lg text-emerald-600 hover:underline font-medium">support@insora.in</a>
              </div>
            </div>
            <Link href="/login"
              className="w-full bg-slate-900 text-white font-semibold py-4 rounded-lg flex justify-center items-center gap-3 mt-6 hover:bg-slate-800 transition-colors"
            >
              Client login <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-10 px-6 md:px-20 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <Package size={12} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">Insora</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 Insora AI Operations Platform. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Security", "API", "Status"].map((l, i) => (
              <a key={i} href="#" className="text-xs font-semibold tracking-wider text-slate-400 hover:text-emerald-400 transition-colors uppercase">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
