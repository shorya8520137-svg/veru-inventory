'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check, ArrowRight, BrainCircuit, Cpu,
  Warehouse, BarChart2, RefreshCw, Eye
} from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 999,
    badge: null,
    desc: 'Perfect for businesses beginning their inventory management journey.',
    bestFor: 'Small businesses and new D2C brands.',
    features: [
      'Inventory Dashboard',
      'Stock Monitoring',
      'Low Stock Alerts',
      'Basic Analytics',
      'Product Tracking',
      'Order Tracking',
      'Barcode Management',
      'Return Tracking',
      'Email Support',
      'Up to 2 Team Members',
      'Single Warehouse',
      '500 Orders/month',
    ],
    benefits: 'Reduce manual inventory errors, track stock efficiently, and gain visibility into daily operations.',
    gradient: 'from-slate-800 to-slate-900',
    border: 'border-slate-700/50',
    accent: 'text-slate-300',
  },
  {
    name: 'Growth',
    price: 3999,
    badge: 'Most Popular',
    desc: 'Advanced inventory intelligence for scaling operations.',
    bestFor: 'Growing brands managing multiple products.',
    features: [
      'Multi-Warehouse Management',
      'Advanced Analytics Dashboard',
      'AI Stock Recommendations',
      'Sales Performance Tracking',
      'Reorder Suggestions',
      'RTO Analytics',
      'Return Analysis',
      'WhatsApp Alerts',
      'API Integrations',
      'CSV Export',
      'Delhivery Integration',
      'Team Collaboration',
      'Up to 5,000 Orders/month',
    ],
    benefits: 'Optimize stock allocation, reduce inventory waste, and improve operational efficiency.',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
    popular: true,
  },
  {
    name: 'Scale',
    price: 9999,
    badge: null,
    desc: 'AI-powered operational intelligence and automation.',
    bestFor: 'Established brands handling high-volume inventory.',
    features: [
      'AI Demand Forecasting',
      'Inventory Prediction Engine',
      'Dead Stock Detection',
      'Overstock Detection',
      'Auto Inventory Redistribution',
      'Multi-Brand Management',
      'Custom Dashboards',
      'ERP Integrations',
      'Warehouse Performance Analytics',
      'Priority Support',
      'Dedicated Account Manager',
      'Advanced Automation Rules',
      'Up to 50,000 Orders/month',
    ],
    benefits: 'Increase profitability through predictive inventory planning and operational automation.',
    gradient: 'from-indigo-500/10 to-violet-600/5',
    border: 'border-indigo-500/30',
    accent: 'text-indigo-400',
  },
  {
    name: 'Enterprise',
    price: null,
    badge: null,
    desc: 'Customized infrastructure and dedicated support for large-scale operations.',
    bestFor: 'Large enterprises, retail chains, distributors.',
    features: [
      'Unlimited Warehouses',
      'Unlimited Users',
      'Dedicated Infrastructure',
      'Custom AI Models',
      'Advanced Security Controls',
      'SLA Support',
      'Dedicated Success Manager',
      'Custom Integrations',
      'Private API Access',
      'Enterprise Analytics',
      'Role-Based Permissions',
      'Data Migration Assistance',
    ],
    benefits: 'Build a centralized inventory operating system across multiple locations and business units.',
    gradient: 'from-amber-500/10 to-orange-600/5',
    border: 'border-amber-500/30',
    accent: 'text-amber-400',
    contact: true,
  },
]

const whyCards = [
  { icon: BrainCircuit, title: 'AI Demand Forecasting', text: 'Predict future inventory requirements using historical sales and demand trends.' },
  { icon: Cpu, title: 'Inventory Intelligence', text: 'Identify dead stock, fast-moving products, and inventory risks instantly.' },
  { icon: Warehouse, title: 'Warehouse Optimization', text: 'Monitor warehouse performance and inventory movement in real time.' },
  { icon: RefreshCw, title: 'Automated Redistribution', text: 'Move excess inventory between locations based on demand patterns.' },
  { icon: Eye, title: 'Real-Time Visibility', text: 'Track products across stores, warehouses, and fulfillment centers.' },
  { icon: BarChart2, title: 'Business Insights', text: 'Make data-driven inventory decisions with actionable analytics.' },
]

const roiMetrics = [
  { value: '40%', label: 'Reduce Stockouts' },
  { value: '30%', label: 'Lower Excess Inventory' },
  { value: '95%', label: 'Improve Inventory Accuracy' },
  { value: '60%', label: 'Increase Efficiency' },
]

const stagger = { animate: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6 } } }

function PricingCard({ plan, annual }) {
  const price = plan.price ? (annual ? Math.round(plan.price * 12 * 0.8 / 12) : plan.price) : null

  return (
    <motion.div
      variants={fadeUp}
      className={`relative rounded-2xl p-6 md:p-8 border ${plan.border} bg-gradient-to-b ${plan.gradient} backdrop-blur-xl ${plan.popular ? 'shadow-[0_0_40px_rgba(16,185,129,0.15)] scale-[1.02] md:scale-[1.05] z-10' : 'shadow-lg'} transition-all duration-500 hover:shadow-xl flex flex-col`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-emerald-400 to-emerald-500 text-white px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/25">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
        <div className="flex items-baseline gap-1 mb-3">
          {price ? (
            <>
              <span className="text-4xl font-extrabold text-white">₹{price.toLocaleString()}</span>
              <span className="text-slate-400 text-sm">/month</span>
            </>
          ) : (
            <span className="text-3xl font-extrabold text-white">Contact Sales</span>
          )}
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{plan.desc}</p>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">Best For</p>
        <p className="text-slate-300 text-sm">{plan.bestFor}</p>
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className={`mt-0.5 ${plan.popular ? 'text-emerald-400' : 'text-emerald-500'}`}>
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-slate-300">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mb-6 p-3 rounded-lg bg-white/[0.03] border border-white/5">
        <p className="text-xs text-slate-500 leading-relaxed">{plan.benefits}</p>
      </div>

      <a
        href={plan.contact ? '#contact' : '#start'}
        className={`w-full text-center font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
          plan.popular
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5'
            : plan.contact
              ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:-translate-y-0.5'
              : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:-translate-y-0.5'
        }`}
      >
        {plan.contact ? 'Contact Sales' : 'Start Free Trial'} <ArrowRight size={14} />
      </a>
    </motion.div>
  )
}

function WhyCard({ icon: Icon, title, text, idx }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group relative p-6 md:p-8 rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-white/10 transition-all duration-500 hover:-translate-y-1"
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={18} className="text-emerald-400" />
      </div>
      <h3 className="text-white font-semibold mb-2 text-base">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
    </motion.div>
  )
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section className="relative py-32 px-6 md:px-20 overflow-hidden bg-[#020B1F]" id="pricing">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-16" {...fadeUp}>
          <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 mb-4 block uppercase">Pricing</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
            Simple Pricing.{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Powerful Inventory Intelligence.</span>
          </h2>
          <p className="text-slate-400 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
            From inventory tracking to AI-powered demand forecasting, Insora helps businesses reduce stockouts, eliminate dead stock, optimize warehouse operations, and improve profitability.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium transition-colors ${!annual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${annual ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${annual ? 'translate-x-7.5' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? 'text-white' : 'text-slate-500'}`}>
            Annual <span className="text-emerald-400 text-xs font-semibold">Save 20%</span>
          </span>
        </motion.div>

        {/* Plans */}
        <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
          {plans.map((p, i) => (
            <PricingCard key={i} plan={p} annual={annual} />
          ))}
        </motion.div>

        {/* Why Insora */}
        <motion.div className="text-center mb-16" {...fadeUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Businesses Choose Insora</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm">AI-powered intelligence that transforms how you manage inventory across every channel.</p>
        </motion.div>

        <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-32">
          {whyCards.map((c, i) => <WhyCard key={i} {...c} idx={i} />)}
        </motion.div>

        {/* ROI */}
        <motion.div className="relative mb-32" {...fadeUp}>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 rounded-3xl" />
          <div className="relative rounded-3xl border border-white/5 p-10 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">Inventory Intelligence That Pays For Itself</h2>
            <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto text-sm">Real results from businesses using Insora&apos;s AI-powered platform.</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {roiMetrics.map((m, i) => (
                <div key={i} className="text-center group">
                  <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-b from-emerald-400 to-emerald-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-500">
                    {m.value}
                  </div>
                  <div className="text-slate-400 text-sm font-medium">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div className="relative" {...fadeUp}>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-emerald-500/10 rounded-3xl blur-[2px]" />
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Inventory Operations?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-sm leading-relaxed">
              Join modern businesses using AI to optimize inventory, reduce costs, and scale smarter.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#start" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-8 py-3.5 rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-300 text-sm">
                Start Free Trial <ArrowRight size={15} />
              </a>
              <a href="#demo" className="border border-white/10 text-white font-semibold px-8 py-3.5 rounded-xl flex items-center gap-2 hover:bg-white/5 hover:-translate-y-0.5 transition-all duration-300 text-sm">
                Book Demo <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
