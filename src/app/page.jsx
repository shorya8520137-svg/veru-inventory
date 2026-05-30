"use client";

import dynamic from 'next/dynamic'
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, LockKeyhole, LogIn, Package, Brain, Shield,
  Repeat, LayoutGrid, ShoppingCart, BarChart2, Truck,
  Headphones, BrainCircuit, Star, Receipt, MessageSquare, Globe,
  Zap, TrendingUp, Layers, Users, Sparkles, Cpu,
  Route, MapPin, Activity, Radio,
   RefreshCw
} from "lucide-react";
import Image from "next/image";

const BrainNetwork = dynamic(() => import('@/app/components/BrainNetwork'), { ssr: false })
const Pricing = dynamic(() => import('@/app/components/Pricing'), { ssr: false })


const iconMap = {
  sync_alt: Repeat, grid_view: LayoutGrid, shopping_cart: ShoppingCart,
  analytics: BarChart2, local_shipping: Truck, support_agent: Headphones,
  neurology: BrainCircuit, rate_review: Star, receipt_long: Receipt
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const brainRef = useRef(null);
  const servicesRef = useRef(null);
  const metricsRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.92]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const brainY = useTransform(scrollYProgress, [0, 0.5], [0, -120]);
  const servicesY = useTransform(scrollYProgress, [0.2, 0.5], [80, 0]);
  const metricsScale = useTransform(scrollYProgress, [0.15, 0.3], [0.9, 1]);
  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const orbLeftY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const orbRightY = useTransform(scrollYProgress, [0, 1], [0, -140]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const services = [
    { icon: "sync_alt", title: "Advanced Stock Transfer", text: "W2W, W2S, S2S, and S2W transfers with source/destination control and automated AWB tracking." },
    { icon: "grid_view", title: "Website Product Catalog", text: "Centralized product administration with SKU management, categories, and AI-powered SEO descriptions." },
    { icon: "shopping_cart", title: "Flipkart & Amazon Integration", text: "Connect Flipkart and Amazon directly — no multiple dashboards. Manage all orders, inventory, and fulfillment from Insora.in in one place." },
    { icon: "analytics", title: "User And Order Tracking", text: "Granular visibility into order lifecycles and customer behavior with predictive delivery timelines." },
    { icon: "local_shipping", title: "Delivery & ShipRocket", text: "ShipRocket-powered logistics — automated manifest generation, real-time tracking, and delivery status sync from a single dashboard." },
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
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.06 } }
  };

  const staggerItem = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <main className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden">
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { transform: translateY(-80px) translateX(30px); }
        }
        @keyframes parallaxDrift {
          0% { transform: translateY(0); }
          100% { transform: translateY(-40px); }
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
          {Array.from({ length: 20 }).map((_, i) => {
            const s = (seed) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x) }
            const dur = (8 + s(i * 5 + 7) * 10).toFixed(3)
            const delay = (s(i * 11) * 5).toFixed(3)
            return (
            <div key={i} className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
              style={{
                left: `${(5 + s(i * 7 + 1) * 90).toFixed(4)}%`,
                top: `${(10 + s(i * 13 + 3) * 80).toFixed(4)}%`,
                animationDuration: `${dur}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationName: 'float',
                animationDelay: `${delay}s`
              }}
            />
            )
          })}
        </div>

        {/* Gradient orbs with parallax */}
        <motion.div style={{ y: orbLeftY }} className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <motion.div style={{ y: orbRightY }} className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        {/* InventoryGPT AI Orchestration Network */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <BrainNetwork />
        </div>

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
          </div>
        </motion.div>
      </section>

      {/* METRICS */}
      <motion.section style={{ scale: metricsScale }} className="bg-white border-y border-slate-200">
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
      </motion.section>

      {/* SERVICES */}
      <section className="py-32 px-6 md:px-20 bg-slate-50 relative overflow-hidden" id="services">
        <motion.div style={{ y: servicesY }} className="absolute top-20 left-1/4 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl" />
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

      {/* LOGISTICS TREE - EventGPT */}
      <Pricing />

      <section className="relative py-32 px-6 md:px-20 overflow-hidden bg-white" id="logistics">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <span className="text-xs font-bold tracking-widest text-emerald-600 mb-4 block uppercase">Logistics Intelligence</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              InventoryGPT <span className="text-emerald-600">Logistics Mesh</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              A self-optimizing logistics network powered by neural event processing — from warehouse to last mile, with ShipRocket-powered delivery sync.
            </p>
          </motion.div>

          {/* Data Pipeline Infographic */}
          <div className="relative mb-24">
            {/* Pipeline track */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 -translate-y-1/2 hidden lg:block" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start relative">
              {/* Stage 1: Data Sources */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center mx-auto">
                    <Radio size={28} className="text-white" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 w-16 h-16 rounded-2xl bg-emerald-400/30 -z-10"
                  />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Data Sources</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Warehouse Sensors', val: '12,000+' },
                    { label: 'GPS Fleet Data', val: '8.4M pts/day' },
                    { label: 'Marketplace API', val: '6 platforms' },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-sm">
                      <span className="text-slate-500">{s.label}</span>
                      <span className="font-semibold text-slate-800">{s.val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Pipeline flow arrow (desktop) */}
              <div className="hidden lg:flex items-center justify-center self-center">
                <motion.div
                  animate={{ x: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={28} className="text-emerald-500" />
                </motion.div>
                <motion.div
                  animate={{ x: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                >
                  <ArrowRight size={28} className="text-emerald-400" />
                </motion.div>
                <motion.div
                  animate={{ x: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                >
                  <ArrowRight size={28} className="text-emerald-300" />
                </motion.div>
              </div>

              {/* Mobile arrow */}
              <div className="flex lg:hidden justify-center">
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={24} className="text-emerald-400 rotate-90" />
                </motion.div>
              </div>

              {/* Stage 2: InventoryGPT Core */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                {/* Holographic core */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    {/* Outer rings */}
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-6 border border-emerald-300/40 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: [360, 0] }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-3 border border-emerald-400/30 rounded-full border-dashed"
                    />
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)] flex items-center justify-center mx-auto">
                      <Cpu size={34} className="text-emerald-400" />
                    </div>
                    {/* Data packet dots orbiting */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          rotate: [i * 120, i * 120 + 360],
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ width: 90, height: 90 }}
                      >
                        <div
                          className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          style={{
                            position: 'absolute',
                            top: '0%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-8">InventoryGPT Core</h3>
                  <p className="text-sm text-slate-500 mt-1">Neural Event Processor</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Events/sec', val: '24K' },
                    { label: 'Avg Latency', val: '12ms' },
                    { label: 'Routes Optimized', val: '8.2M' },
                    { label: 'AI Accuracy', val: '97.3%' },
                  ].map((m, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-slate-900">{m.val}</div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{m.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Pipeline flow arrow */}
              <div className="hidden lg:flex items-center justify-center self-center">
                <motion.div
                  animate={{ x: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={28} className="text-emerald-500" />
                </motion.div>
                <motion.div
                  animate={{ x: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                >
                  <ArrowRight size={28} className="text-emerald-400" />
                </motion.div>
                <motion.div
                  animate={{ x: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                >
                  <ArrowRight size={28} className="text-emerald-300" />
                </motion.div>
              </div>

              <div className="flex lg:hidden justify-center">
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={24} className="text-emerald-400 rotate-90" />
                </motion.div>
              </div>

              {/* Stage 3: Intelligent Actions */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center mx-auto">
                    <Zap size={28} className="text-white" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 w-16 h-16 rounded-2xl bg-emerald-400/30 -z-10"
                  />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Intelligent Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: 'ShipRocket Sync', val: 'Auto' },
                    { label: 'Auto-Reroute', val: '2.4s avg' },
                    { label: 'Driver Dispatch', val: 'AI assigned' },
                  ].map((a, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-sm">
                      <span className="text-slate-500">{a.label}</span>
                      <span className="font-semibold text-emerald-600">{a.val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sci-Fi Capabilities Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-12">Neural Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Route, title: 'Real-Time Routing', desc: 'AI optimizes every route against traffic, weather, and priority in under 50ms.' },
                { icon: Activity, title: 'Event Stream AI', desc: 'Processes 20+ logistics event types — dispatch, pickup, transit, delivery, POD.' },
                { icon: MapPin, title: 'Geo-Spatial Intel', desc: 'Geo-fencing alerts, automated ETAs, and zone-based dispatch orchestration.' },
                { icon: Users, title: 'Workload Balancing', desc: 'AI distributes deliveries across drivers using skill scores and capacity data.' },
              ].map((c, i) => {
                const colors = [
                  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
                  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
                  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
                  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
                ];
                const clr = colors[i];
                return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
                >
                  <div className={`w-10 h-10 rounded-xl ${clr.bg} ${clr.border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <c.icon size={18} className={clr.text} />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1.5 text-sm">{c.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <motion.div
                      animate={{ width: [0, 40, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      className="h-px bg-gradient-to-r from-emerald-400 to-transparent"
                    />
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  </div>
                </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 border border-slate-200 rounded-3xl p-8"
          >
            {[
              { val: '99.97%', label: 'Uptime SLA' },
              { val: '24K/sec', label: 'Events Processed' },
              { val: '12ms', label: 'Avg Response' },
              { val: '8.2M+', label: 'Routes Optimized' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {s.val}
                </div>
                <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
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

      {/* AI INVENTORY INTELLIGENCE - BENEFITS */}
      <section className="relative py-32 px-6 md:px-20 overflow-hidden bg-[#020B1F]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 mb-4 block uppercase">Intelligence Layer</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Everything your eCommerce needs in{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">one AI brain.</span>
            </h2>
            <p className="text-slate-400 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
              InventoryGPT connects every part of your business — from warehouse shelves to customer chat — through a single neural intelligence layer.
            </p>
          </motion.div>

          <div className="relative">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '600px' }}>
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <line x1="50%" y1="0" x2="25%" y2="33%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="50%" y1="0" x2="75%" y2="33%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="25%" y1="33%" x2="12%" y2="66%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="25%" y1="33%" x2="38%" y2="66%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="75%" y1="33%" x2="62%" y2="66%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="75%" y1="33%" x2="88%" y2="66%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="12%" y1="66%" x2="25%" y2="100%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="38%" y1="66%" x2="50%" y2="100%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="62%" y1="66%" x2="50%" y2="100%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="88%" y1="66%" x2="75%" y2="100%" stroke="url(#lg1)" strokeWidth="1.5" />
              <line x1="38%" y1="66%" x2="62%" y2="66%" stroke="url(#lg1)" strokeWidth="1.5" />
            </svg>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div className="md:col-start-2 text-center mb-8 md:mb-0" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 mb-4">
                  <Cpu size={36} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">InventoryGPT</h3>
                <p className="text-slate-500 text-sm mt-1">Neural Intelligence Core</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
              {[
                { icon: Package, title: 'Smart Inventory', text: 'Auto-track stock across warehouses, stores, and marketplaces with real-time sync and low-stock alerts.', idx: 0 },
                { icon: TrendingUp, title: 'Demand Forecasting', text: 'AI predicts what to stock, when to reorder, and how much — reducing dead stock by up to 30%.', idx: 1 },
                { icon: Truck, title: 'Logistics Automation', text: 'Route orders to the nearest fulfillment center, auto-generate manifests, and track deliveries end-to-end.', idx: 2 },
              ].map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.12, duration: 0.5 }}
                  className="group relative p-6 md:p-8 rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-emerald-500/20 hover:from-emerald-500/5 hover:to-transparent transition-all duration-500"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <c.icon size={18} className="text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2 text-base">{c.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{c.text}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-5">
              {[
                { icon: MessageSquare, title: 'Multi-Language Chat Support', text: 'AI agents handle customer queries in Hindi, English, Tamil, Kannada, Telugu, Malayalam, Bengali, Marathi, and more — 24/7 with zero wait time.' },
                { icon: BarChart2, title: 'Real-Time Analytics', text: 'Live dashboards showing sell-through rates, inventory turns, margin analysis, and channel performance.' },
                { icon: RefreshCw, title: 'Auto Redistribution', text: 'Move excess stock between locations based on real-time demand signals — no manual intervention.' },
                { icon: Headphones, title: 'Omnichannel Support', text: 'Unified view of customer queries across WhatsApp, website chat, email, and phone with AI-assisted replies.' },
              ].map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="group relative p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-cyan-500/20 hover:from-cyan-500/5 hover:to-transparent transition-all duration-500"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <c.icon size={18} className="text-cyan-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2 text-sm">{c.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{c.text}</p>
                </motion.div>
              ))}
            </div>
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

      {/* TEAM */}
      <section className="relative py-32 px-6 md:px-20 overflow-hidden bg-white" id="team">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <span className="text-xs font-bold tracking-widest text-emerald-600 mb-4 block uppercase">The Team</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Built by <span className="text-emerald-600">engineers, operators &amp; defenders.</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Insora was founded at the intersection of full-stack AI engineering, cybersecurity, and business operations — three minds, one mission.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Shorya Singh */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-5 ring-4 ring-emerald-100 shadow-lg shadow-emerald-500/20">
                <Image
                  src="https://res.cloudinary.com/df3l7ppo6/image/upload/v1779003207/ChatGPT_Image_May_17_2026_01_01_30_PM_sg8ulc.png"
                  alt="Shorya Singh"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Shorya Singh</h3>
              <div className="text-xs font-bold tracking-widest text-emerald-600 uppercase mt-1 mb-3">Founder</div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full mb-4">
                Full Stack Developer · Gen AI
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Architects the entire Insora platform — from real-time inventory engines and AI prediction layers to logistics mesh orchestration. Shorya brings deep expertise in Next.js, Python-based AI agents, and production-grade system design.
              </p>
            </motion.div>

            {/* Nikhil Sharma */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-500/20">
                <span className="text-2xl font-bold text-white">NS</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Nikhil Sharma</h3>
              <div className="text-xs font-bold tracking-widest text-emerald-600 uppercase mt-1 mb-3">Co-Founder</div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full mb-4">
                Cyber Security Analyst
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Secures every layer of the Insora ecosystem — from 2FA authentication and role-based access controls to encrypted data pipelines and real-time threat detection. Nikhil ensures that client operations stay protected at scale.
              </p>
            </motion.div>

            {/* Bhushan Geidhar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-5 ring-4 ring-amber-100 shadow-lg shadow-amber-500/20">
                <Image
                  src="https://res.cloudinary.com/df3l7ppo6/image/upload/v1780085168/ChatGPT_Image_May_30_2026_01_35_33_AM_blgdrq.png"
                  alt="Bhushan Geidhar"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Bhushan Geidhar</h3>
              <div className="text-xs font-bold tracking-widest text-emerald-600 uppercase mt-1 mb-3">COO</div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full mb-4">
                Business Operations
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Drives Insora's business strategy, client partnerships, and operational growth. Bhushan bridges the gap between product engineering and real-world inventory operations — ensuring every feature solves a real business problem.
              </p>
            </motion.div>
          </div>
        </div>
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
