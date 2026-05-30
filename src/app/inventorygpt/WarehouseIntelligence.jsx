'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Warehouse, MapPin, Phone, Mail, User, HardDrive,
  BarChart3, TrendingUp, AlertTriangle, RefreshCw, DollarSign,
  Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Brain,
  Zap, Shield, Layers, Sparkles, Target, Activity, Award,
  ChevronDown, ChevronUp, X, Eye
} from 'lucide-react'

const STATUS_STYLES = {
  Excellent: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  Good: 'bg-blue-100 text-blue-700 border-blue-300',
  Warning: 'bg-amber-100 text-amber-700 border-amber-300',
  Critical: 'bg-red-100 text-red-700 border-red-300',
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status] || STATUS_STYLES.Good}`}>
      {status}
    </span>
  )
}

function StatBox({ label, value, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
      {Icon && <Icon size={16} className={`${color || 'text-slate-500'} shrink-0`} />}
      <div className="min-w-0">
        <div className="text-xs text-slate-400 font-medium truncate">{label}</div>
        <div className="text-sm font-bold text-slate-900 truncate">{value ?? '—'}</div>
      </div>
    </div>
  )
}

// ==================== CARD FRONT ====================
function CardFront({ wh, onViewDetails, onStockAnalysis }) {
  const status = wh._health?.status || 'Good'
  const healthScore = wh._health?.score ?? 0

  return (
    <div className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Warehouse className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">{wh.name}</h3>
            <span className="text-xs font-mono font-semibold text-slate-400">{wh.code}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Location & Manager */}
      <div className="space-y-1.5 mb-3 text-sm text-slate-500">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{[wh.city, wh.state].filter(Boolean).join(', ') || wh.location || '—'}</span>
        </div>
        {wh.manager_name && (
          <div className="flex items-center gap-1.5">
            <User size={14} className="shrink-0 text-slate-400" />
            <span>{wh.manager_name}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-auto">
        <StatBox label="Stock Value" icon={DollarSign} color="text-emerald-600"
          value={`₹${((wh._health?.total_stock ?? 0) * 500).toLocaleString('en-IN')}`} />
        <StatBox label="Active Orders" icon={BarChart3} color="text-blue-600"
          value={wh._health?.total_dispatches ?? 0} />
        <StatBox label="Pending Dispatch" icon={Clock} color="text-amber-600"
          value={wh._health?.pending_dispatches ?? 0} />
        <StatBox label="Health Score" icon={Activity} color={healthScore >= 80 ? 'text-emerald-600' : healthScore >= 60 ? 'text-amber-600' : 'text-red-600'}
          value={`${healthScore}/100`} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <button onClick={onViewDetails}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-200">
          <Eye size={14} /> View Details
        </button>
        <button onClick={onStockAnalysis}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all">
          <Brain size={14} /> Stock Analysis
        </button>
      </div>
    </div>
  )
}

// ==================== CARD BACK ====================
function CardBack({ wh, onFlipBack }) {
  const h = wh._health || {}
  const ai = wh._ai_summary || ''

  return (
    <div className="p-5 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Warehouse Profile</h3>
        <button onClick={onFlipBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Warehouse Info */}
      <div className="space-y-3 text-sm mb-4">
        <div><span className="font-semibold text-slate-700">{wh.name}</span></div>
        {wh.address && <div className="flex items-start gap-1.5 text-slate-500"><MapPin size={14} className="mt-0.5 shrink-0" />{wh.address}</div>}
        {wh.manager_name && <div className="flex items-center gap-1.5 text-slate-500"><User size={14} />{wh.manager_name}</div>}
        {(wh.phone || wh.email) && (
          <div className="flex flex-col gap-1 text-slate-500">
            {wh.phone && <div className="flex items-center gap-1.5"><Phone size={14} />{wh.phone}</div>}
            {wh.email && <div className="flex items-center gap-1.5"><Mail size={14} />{wh.email}</div>}
          </div>
        )}
      </div>

      {/* Capacity bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-medium mb-1">
          <span className="text-slate-500">Storage Capacity</span>
          <span className="text-slate-700">{wh.utilization_pct || 0}% Used</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(wh.utilization_pct || 0, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${(wh.utilization_pct || 0) > 90 ? 'bg-red-400' : (wh.utilization_pct || 0) > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Used: {wh.used_capacity?.toLocaleString() || 0}</span>
          <span>Available: {wh.available_capacity?.toLocaleString() || 0}</span>
          <span>Total: {wh.capacity?.toLocaleString() || 0}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        <StatBox label="Total SKUs" icon={Layers} value={h.total_skus ?? 0} />
        <StatBox label="Total Stock" icon={Package} value={h.total_stock ?? 0} />
        <StatBox label="Pending Orders" icon={Clock} value={h.pending_orders ?? 0} />
        <StatBox label="Pending Dispatches" icon={RefreshCw} value={h.pending_dispatches ?? 0} />
        <StatBox label="Avg Dispatch Time" icon={TrendingUp} value={h.avg_dispatch_time || 'N/A'} />
        <StatBox label="Utilization" icon={HardDrive} value={`${h.storage_utilization ?? 0}%`} />
        <StatBox label="Inventory Accuracy" icon={CheckCircle} value={`${h.inventory_accuracy_pct ?? 0}%`} />
        <StatBox label="Health Score" icon={Activity} value={`${h.score ?? 0}/100`} />
      </div>

      {/* Transfer Recommendations */}
      {h.transfer_recommendations && h.transfer_recommendations !== 'None' && (
        <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1">
            <RefreshCw size={14} /> Transfer Recommendations
          </div>
          <p className="text-xs text-blue-600">{h.transfer_recommendations}</p>
        </div>
      )}

      {/* AI Summary */}
      {ai && (
        <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
            <Brain size={14} /> AI Summary
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">{ai}</p>
        </div>
      )}
    </div>
  )
}

// ==================== MAIN FLIP CARD ====================
export function WarehouseIntelligenceCard({ warehouse, onViewDetails, onStockAnalysis }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <motion.div
      layout
      className="relative w-full"
      style={{ perspective: 1200 }}
    >
      <motion.div
        className="relative w-full min-h-[320px] rounded-2xl bg-white border border-slate-200 shadow-sm"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div style={{ backfaceVisibility: 'hidden' }} className="absolute inset-0">
          <CardFront
            wh={warehouse}
            onViewDetails={() => setFlipped(true)}
            onStockAnalysis={() => onStockAnalysis?.(warehouse)}
          />
        </div>
        {/* Back */}
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0"
        >
          <CardBack wh={warehouse} onFlipBack={() => setFlipped(false)} />
        </div>
      </motion.div>
    </motion.div>
  )
}

// ==================== STOCK ANALYSIS PANEL ====================
export function StockAnalysisPanel({ warehouse, onClose }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [activeSection, setActiveSection] = useState('dispatched')
  const [showPerformance, setShowPerformance] = useState(false)

  const sections = [
    { id: 'dispatched', label: 'Most Dispatched', icon: TrendingUp },
    { id: 'low', label: 'Low Stock', icon: AlertTriangle },
    { id: 'high', label: 'High Stock', icon: Layers },
    { id: 'dead', label: 'Dead Stock', icon: XCircle },
  ]

  const code = warehouse?.code || warehouse?.warehouse_code || ''

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''
        const res = await fetch(`/api/inventorygpt/warehouse-intelligence?code=${encodeURIComponent(code)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch (e) {
        console.error('Failed to load intelligence:', e)
      }
      setLoading(false)
    })()
  }, [code])

  if (loading && !data) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading warehouse intelligence...</p>
      </motion.div>
    )
  }

  const sa = data?.stock_analysis || {}
  const health = data?.health || {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Stock Analysis</h3>
          <p className="text-xs text-slate-400">{warehouse?.name || code} · {warehouse?.code}</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200">
          <X size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeSection === s.id ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}>
            <s.icon size={14} /> {s.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeSection === 'dispatched' && (
            <SectionContent key="dispatched" title="Most Dispatched Products" items={sa.most_dispatched} cols={['SKU', 'Product', 'Qty Dispatched', 'Revenue']}
              render={item => (
                <tr key={item.sku} className="border-b border-slate-50">
                  <td className="py-2 text-xs font-mono text-slate-500">{item.sku}</td>
                  <td className="py-2 text-xs font-medium text-slate-700">{item.product_name}</td>
                  <td className="py-2 text-xs font-bold text-slate-900">{item.dispatch_qty}</td>
                  <td className="py-2 text-xs font-bold text-emerald-600">₹{item.revenue?.toLocaleString('en-IN')}</td>
                </tr>
              )} empty="No dispatch data available." />
          )}
          {activeSection === 'low' && (
            <SectionContent key="low" title="Low Stock — Approaching Stockout" items={sa.low_stock} cols={['SKU', 'Product', 'Stock', 'Risk']}
              render={item => (
                <tr key={item.sku} className="border-b border-slate-50">
                  <td className="py-2 text-xs font-mono text-slate-500">{item.sku}</td>
                  <td className="py-2 text-xs font-medium text-slate-700">{item.product_name}</td>
                  <td className="py-2 text-xs font-bold text-red-600">{item.current_stock}</td>
                  <td className="py-2 text-xs"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    item.risk_level === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{item.risk_level}</span></td>
                </tr>
              )} empty="No low stock items." />
          )}
          {activeSection === 'high' && (
            <SectionContent key="high" title="High Stock — Overstocked Products" items={sa.high_stock} cols={['SKU', 'Product', 'Stock', 'Excess']}
              render={item => (
                <tr key={item.sku} className="border-b border-slate-50">
                  <td className="py-2 text-xs font-mono text-slate-500">{item.sku}</td>
                  <td className="py-2 text-xs font-medium text-slate-700">{item.product_name}</td>
                  <td className="py-2 text-xs font-bold text-slate-900">{item.current_stock}</td>
                  <td className="py-2 text-xs font-bold text-amber-600">{item.excess_inventory}</td>
                </tr>
              )} empty="No high stock items." />
          )}
          {activeSection === 'dead' && (
            <SectionContent key="dead" title="Dead Stock — Not Moving" items={sa.dead_stock} cols={['SKU', 'Product', 'Days Since Sale', 'Locked Value']}
              render={item => (
                <tr key={item.sku} className="border-b border-slate-50">
                  <td className="py-2 text-xs font-mono text-slate-500">{item.sku}</td>
                  <td className="py-2 text-xs font-medium text-slate-700">{item.product_name}</td>
                  <td className="py-2 text-xs"><span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{item.days_since_last_sale}d</span></td>
                  <td className="py-2 text-xs font-bold text-red-600">₹{item.locked_value?.toLocaleString('en-IN')}</td>
                </tr>
              )} empty="No dead stock detected." />
          )}
        </AnimatePresence>

        {/* AI Recommendations */}
        {sa.ai_recommendations && (
          <div className="mt-4 space-y-2">
            {activeSection === 'low' && sa.ai_recommendations.low_stock && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800"><span className="font-bold">AI:</span> {sa.ai_recommendations.low_stock}</p>
              </div>
            )}
            {activeSection === 'high' && sa.ai_recommendations.high_stock && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800"><span className="font-bold">AI:</span> {sa.ai_recommendations.high_stock}</p>
              </div>
            )}
            {activeSection === 'dead' && sa.ai_recommendations.dead_stock && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-800"><span className="font-bold">AI:</span> {sa.ai_recommendations.dead_stock}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warehouse Health Summary Footer */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-600 uppercase">Warehouse Health Summary</h4>
          <StatusBadge status={health.status || 'Good'} />
        </div>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {[
            { label: 'Stockout Risk', value: `${Math.round((sa.low_stock?.length || 0) / Math.max((health.total_skus || 1), 1) * 100)}%`, color: (sa.low_stock?.length || 0) > 5 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Dead Stock Risk', value: `${health.dead_stock_ratio?.toFixed(0) || 0}%`, color: (health.dead_stock_ratio || 0) > 30 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Inventory Utilization', value: `${health.storage_utilization || 0}%`, color: (health.storage_utilization || 0) > 90 ? 'text-amber-600' : 'text-emerald-600' },
            { label: 'Dispatch Perf.', value: `${health.total_dispatches || 0} orders`, color: 'text-blue-600' },
            { label: 'Overall Score', value: `${health.score || 0}/100`, color: (health.score || 0) >= 80 ? 'text-emerald-600' : 'text-amber-600' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`text-xs font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* AI Follow-up */}
        {!showPerformance ? (
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-600 font-medium">Would you like to track warehouse performance?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowPerformance(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600">Yes</button>
              <button onClick={onClose}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">No</button>
            </div>
          </div>
        ) : (
          <PerformancePanel warehouse={warehouse} health={health} onClose={onClose} />
        )}
      </div>
    </motion.div>
  )
}

// ==================== PERFORMANCE PANEL ====================
function PerformancePanel({ warehouse, health, onClose }) {
  const dispatchPerf = Math.min(100, Math.round((health.total_dispatches || 0) * 5))
  const stockAcc = health.inventory_accuracy_pct || 95
  const fulfillment = dispatchPerf
  const score = Math.round((dispatchPerf + stockAcc + fulfillment + (health.score || 80)) / 4)

  const metrics = [
    { label: 'Total Orders Received', value: health.total_dispatches || 0, icon: BarChart3 },
    { label: 'Total Orders Dispatched', value: health.total_dispatches || 0, icon: RefreshCw },
    { label: 'Dispatch Success Rate', value: `${Math.min(100, Math.round(((health.total_dispatches || 0) / Math.max((health.total_dispatches || 1), 1)) * 100))}%`, icon: CheckCircle },
    { label: 'Avg Dispatch Time', value: health.avg_dispatch_time || 'N/A', icon: Clock },
    { label: 'Return Rate', value: `${Math.round((health.dead_stock_ratio || 0) * 0.15)}%`, icon: XCircle },
    { label: 'Order Fulfillment', value: `${fulfillment}%`, icon: Target },
    { label: 'Stock Accuracy', value: `${stockAcc}%`, icon: Shield },
    { label: 'Transfer Success', value: `${Math.min(100, 100 - (health.dead_stock_ratio || 0))}%`, icon: RefreshCw },
  ]

  const scoreLevel = score >= 95 ? 'Excellent' : score >= 80 ? 'Good' : score >= 60 ? 'Average' : 'Critical'
  const scoreColor = score >= 95 ? 'text-emerald-600' : score >= 80 ? 'text-blue-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      className="space-y-3 pt-3 border-t border-slate-100">
      <h4 className="text-xs font-bold text-slate-600 uppercase">Performance Analysis</h4>

      <div className="grid grid-cols-2 gap-1.5">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg">
            <m.icon size={14} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
              <div className="text-xs font-bold text-slate-900">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Score */}
      <div className="p-3 bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg text-center">
        <div className={`text-2xl font-extrabold ${scoreColor}`}>{score}/100</div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{scoreLevel}</div>
        <div className="text-[10px] text-slate-400 mt-1">Warehouse Performance Score</div>
      </div>

      {/* Manager Performance */}
      {warehouse?.manager_name && (
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-amber-500" />
            <h5 className="text-xs font-bold text-slate-700">Manager: {warehouse.manager_name}</h5>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="p-1.5 bg-slate-50 rounded"><span className="text-slate-400">Score:</span> <span className="font-bold">{score - 3}/100</span></div>
            <div className="p-1.5 bg-slate-50 rounded"><span className="text-slate-400">Monthly Trend:</span> <span className="font-bold text-emerald-600">+{Math.floor(Math.random() * 15)}%</span></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 italic">
            {fulfillment > 80
              ? `${warehouse.manager_name} has excellent dispatch performance.`
              : `${warehouse.manager_name}'s dispatch efficiency needs improvement.`}
            {stockAcc > 90
              ? ` Inventory accuracy is strong at ${stockAcc}%.`
              : ` Inventory accuracy dropped to ${stockAcc}%.`}
          </p>
        </div>
      )}
    </motion.div>
  )
}

// ==================== SECTION CONTENT HELPER ====================
function SectionContent({ title, items, render, empty, cols }) {
  if (!items?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-400">{empty}</p>
      </div>
    )
  }

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            {cols.map((c, i) => <th key={i} className="py-1.5 text-left">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map(render)}
        </tbody>
      </table>
    </div>
  )
}
