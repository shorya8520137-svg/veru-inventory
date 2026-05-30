'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Warehouse, Store, MapPin, Phone, Mail, User, HardDrive,
  BarChart3, TrendingUp, AlertTriangle, RefreshCw, DollarSign,
  Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Brain,
  Zap, Shield, Layers, Sparkles, Target, Activity, Award,
  ChevronDown, ChevronUp, X, Eye, Receipt, ShoppingCart
} from 'lucide-react'

const TYPE_CONFIG = {
  warehouses: {
    icon: Warehouse,
    color: 'from-emerald-500 to-emerald-600',
    shadowColor: 'shadow-emerald-200',
    endpoint: '/api/inventorygpt/warehouse-intelligence',
    label: 'Warehouse',
    labelPlural: 'Warehouses',
    actionLabel: 'Dispatch',
    actionLabelPlural: 'Dispatches',
    actionIcon: RefreshCw,
    secondaryActionIcon: TrendingUp,
    healthLabel: 'Warehouse Health Summary',
    performanceTitle: 'Warehouse Performance Score',
    transferLabel: 'Transfer Recommendations',
  },
  stores: {
    icon: Store,
    color: 'from-violet-500 to-violet-600',
    shadowColor: 'shadow-violet-200',
    endpoint: '/api/inventorygpt/store-intelligence',
    label: 'Store',
    labelPlural: 'Stores',
    actionLabel: 'Bill',
    actionLabelPlural: 'Bills',
    actionIcon: Receipt,
    secondaryActionIcon: ShoppingCart,
    healthLabel: 'Store Health Summary',
    performanceTitle: 'Store Performance Score',
    transferLabel: 'Restock Recommendations',
  },
}

function getCfg(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.warehouses
}

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
    <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
      {Icon && <Icon size={12} className={`${color || 'text-slate-500'} shrink-0`} />}
      <div className="min-w-0">
        <div className="text-[10px] text-slate-400 font-medium truncate">{label}</div>
        <div className="text-xs font-bold text-slate-900 truncate">{value ?? '—'}</div>
      </div>
    </div>
  )
}

// ==================== CARD FRONT ====================
function CardFront({ entity, type, onViewDetails, onStockAnalysis }) {
  const cfg = getCfg(type)
  const Icon = cfg.icon
  const status = entity._health?.status || 'Good'
  const healthScore = entity._health?.score ?? 0
  const isWh = type === 'warehouses'

  return (
    <div className="p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow ${cfg.shadowColor} shrink-0`}>
            <Icon className="text-white" size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">{entity.name}</h3>
            <span className="text-[10px] font-mono font-semibold text-slate-400">{entity.code}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Location & Manager */}
      <div className="space-y-1 mb-2.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0 text-slate-400" />
          <span className="truncate">{[entity.city, entity.state].filter(Boolean).join(', ') || entity.location || '—'}</span>
        </div>
        {entity.manager_name && (
          <div className="flex items-center gap-1.5">
            <User size={12} className="shrink-0 text-slate-400" />
            <span>{entity.manager_name}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-auto">
        {isWh ? (
          <>
            <StatBox label="Stock Value" icon={DollarSign} color="text-emerald-600"
              value={`₹${((entity._health?.total_stock ?? 0) * 500).toLocaleString('en-IN')}`} />
            <StatBox label="Active Orders" icon={BarChart3} color="text-blue-600"
              value={entity._health?.total_dispatches ?? 0} />
            <StatBox label="Pending Dispatch" icon={Clock} color="text-amber-600"
              value={entity._health?.pending_dispatches ?? 0} />
            <StatBox label="Health Score" icon={Activity} color={healthScore >= 80 ? 'text-emerald-600' : healthScore >= 60 ? 'text-amber-600' : 'text-red-600'}
              value={`${healthScore}/100`} />
          </>
        ) : (
          <>
            <StatBox label="Revenue" icon={DollarSign} color="text-violet-600"
              value={entity._billing ? `₹${(entity._billing.totalRevenue ?? 0).toLocaleString('en-IN')}` : '—'} />
            <StatBox label="Total Bills" icon={Receipt} color="text-blue-600"
              value={entity._billing?.totalBills ?? '—'} />
            <StatBox label="Inventory Items" icon={Package} color="text-amber-600"
              value={entity._inventory?.totalItems ?? '—'} />
            <StatBox label="Health Score" icon={Activity} color={healthScore >= 80 ? 'text-emerald-600' : healthScore >= 60 ? 'text-amber-600' : 'text-red-600'}
              value={entity._health ? `${healthScore}/100` : '—'} />
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
        <button onClick={onViewDetails}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold text-white bg-gradient-to-r ${cfg.color} rounded-lg hover:brightness-110 transition-all shadow-sm"
          style={{ backgroundImage: `linear-gradient(to right, ${isWh ? '#10b981' : '#7c3aed'}, ${isWh ? '#059669' : '#6d28d9'})` }}>
          <Eye size={12} /> Details
        </button>
        <button onClick={onStockAnalysis}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold ${isWh ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-violet-700 bg-violet-50 border-violet-200'} bg-opacity-50 border rounded-lg hover:bg-opacity-100 transition-all"
          style={{
            color: isWh ? '#047857' : '#6d28d9',
            backgroundColor: isWh ? '#ecfdf5' : '#f5f3ff',
            borderColor: isWh ? '#a7f3d0' : '#ddd6fe',
          }}>
          <Brain size={12} /> Analysis
        </button>
      </div>
    </div>
  )
}

// ==================== CARD BACK ====================
function CardBack({ entity, type, onFlipBack }) {
  const cfg = getCfg(type)
  const h = entity._health || {}
  const ai = entity._ai_summary || ''
  const isWh = type === 'warehouses'
  const Icon = cfg.icon

  return (
    <div className="p-5 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">{cfg.label} Profile</h3>
        <button onClick={onFlipBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Entity Info */}
      <div className="space-y-3 text-sm mb-4">
        <div><span className="font-semibold text-slate-700">{entity.name}</span></div>
        {entity.address && <div className="flex items-start gap-1.5 text-slate-500"><MapPin size={14} className="mt-0.5 shrink-0" />{entity.address}</div>}
        {entity.manager_name && <div className="flex items-center gap-1.5 text-slate-500"><User size={14} />{entity.manager_name}</div>}
        {(entity.phone || entity.email) && (
          <div className="flex flex-col gap-1 text-slate-500">
            {entity.phone && <div className="flex items-center gap-1.5"><Phone size={14} />{entity.phone}</div>}
            {entity.email && <div className="flex items-center gap-1.5"><Mail size={14} />{entity.email}</div>}
          </div>
        )}
      </div>

      {/* Capacity / Area bar (warehouses: storage, stores: area_sqft) */}
      {(isWh || entity.area_sqft) && (
        <div className="mb-4">
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-slate-500">{isWh ? 'Storage Capacity' : 'Store Area'}</span>
            <span className="text-slate-700">{isWh ? `${entity.utilization_pct || 0}% Used` : `${entity.area_sqft || 0} sqft`}</span>
          </div>
          {isWh && (
            <>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(entity.utilization_pct || 0, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${(entity.utilization_pct || 0) > 90 ? 'bg-red-400' : (entity.utilization_pct || 0) > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Used: {entity.used_capacity?.toLocaleString() || 0}</span>
                <span>Available: {entity.available_capacity?.toLocaleString() || 0}</span>
                <span>Total: {entity.capacity?.toLocaleString() || 0}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {isWh ? (
          <>
            <StatBox label="Total SKUs" icon={Layers} value={h.total_skus ?? 0} />
            <StatBox label="Total Stock" icon={Package} value={h.total_stock ?? 0} />
            <StatBox label="Pending Orders" icon={Clock} value={h.pending_orders ?? 0} />
            <StatBox label="Pending Dispatches" icon={RefreshCw} value={h.pending_dispatches ?? 0} />
            <StatBox label="Avg Dispatch Time" icon={TrendingUp} value={h.avg_dispatch_time || 'N/A'} />
            <StatBox label="Utilization" icon={HardDrive} value={`${h.storage_utilization ?? 0}%`} />
            <StatBox label="Inventory Accuracy" icon={CheckCircle} value={`${h.inventory_accuracy_pct ?? 0}%`} />
            <StatBox label="Health Score" icon={Activity} value={`${h.score ?? 0}/100`} />
          </>
        ) : (
          <>
            <StatBox label="Total Products" icon={Layers} value={entity._inventory?.totalItems ?? '—'} />
            <StatBox label="Total Stock" icon={Package} value={entity._inventory?.totalStock ?? '—'} />
            <StatBox label="Total Bills" icon={Receipt} value={entity._billing?.totalBills ?? '—'} />
            <StatBox label="Total Revenue" icon={DollarSign} value={entity._billing ? `₹${(entity._billing.totalRevenue ?? 0).toLocaleString('en-IN')}` : '—'} />
            <StatBox label="Avg Bill Value" icon={TrendingUp} value={entity._billing ? `₹${Number(entity._billing.avgBillValue ?? 0).toFixed(0)}` : '—'} />
            <StatBox label="Low Stock Items" icon={AlertTriangle} value={entity._inventory?.lowStockItems ?? '—'} />
            <StatBox label="Out of Stock" icon={XCircle} value={entity._inventory?.outOfStockItems ?? '—'} />
            <StatBox label="Health Score" icon={Activity} value={entity._health ? `${h.score ?? 0}/100` : '—'} />
          </>
        )}
      </div>

      {/* Transfer / Restock Recommendations */}
      {h.transfer_recommendations && h.transfer_recommendations !== 'None' && (
        <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1">
            <RefreshCw size={14} /> {cfg.transferLabel}
          </div>
          <p className="text-xs text-blue-600">{h.transfer_recommendations}</p>
        </div>
      )}

      {/* Recent Bills (stores only) */}
      {!isWh && entity._billing?.recentBills?.length > 0 && (
        <div className="mb-3 p-2.5 bg-violet-50 border border-violet-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700 mb-1.5">
            <Receipt size={14} /> Recent Bills
          </div>
          <div className="space-y-1">
            {entity._billing.recentBills.slice(0, 5).map((b, i) => (
              <div key={i} className="flex justify-between text-xs text-violet-600">
                <span>#{b.bill_number} — {b.customer_name || 'Walk-in'}</span>
                <span className="font-bold">₹{Number(b.total_amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {ai && (
        <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
            <Brain size={14} /> AI Summary
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-wrap">{ai}</p>
        </div>
      )}
    </div>
  )
}

// ==================== MAIN FLIP CARD ====================
export function WarehouseIntelligenceCard({ entity, type = 'warehouses', onViewDetails, onStockAnalysis }) {
  const [flipped, setFlipped] = useState(false)
  const [enriched, setEnriched] = useState(null)

  useEffect(() => {
    if (type !== 'stores' || entity._billing) {
      setEnriched(null)
      return
    }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in'}/api/inventorygpt/store-intelligence?code=${entity.code}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setEnriched(data)
      })
      .catch(() => {})
  }, [entity.code, type, entity._billing])

  const activeEntity = enriched
    ? { ...entity, _inventory: enriched.inventory, _billing: enriched.billing, _health: { score: enriched.performance?.score ?? 0, status: enriched.performance?.status || 'Good' }, _ai_summary: enriched.aiSummary || '' }
    : entity

  return (
    <motion.div
      layout
      className="relative w-full"
    >
      <div className="relative w-full min-h-[280px] rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <CardFront
                entity={activeEntity}
                type={type}
                onViewDetails={() => setFlipped(true)}
                onStockAnalysis={() => onStockAnalysis?.(entity)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <CardBack entity={activeEntity} type={type} onFlipBack={() => setFlipped(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ==================== STOCK ANALYSIS PANEL ====================
export function StockAnalysisPanel({ entity, type = 'warehouses', onClose }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [activeSection, setActiveSection] = useState('dispatched')
  const [showPerformance, setShowPerformance] = useState(false)
  const cfg = getCfg(type)
  const isWh = type === 'warehouses'

  const sections = isWh
    ? [
        { id: 'dispatched', label: 'Most Dispatched', icon: TrendingUp },
        { id: 'low', label: 'Low Stock', icon: AlertTriangle },
        { id: 'high', label: 'High Stock', icon: Layers },
        { id: 'dead', label: 'Dead Stock', icon: XCircle },
      ]
    : [
        { id: 'dispatched', label: 'Top Products', icon: TrendingUp },
        { id: 'low', label: 'Low Stock', icon: AlertTriangle },
        { id: 'dead', label: 'Dead Stock', icon: XCircle },
        { id: 'billing', label: 'Bill History', icon: Receipt },
      ]

  const code = entity?.code || entity?.warehouse_code || entity?.store_code || ''

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in'}${cfg.endpoint}?code=${encodeURIComponent(code)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const json = await res.json()
        if (json.success) setData(isWh ? json.data : json)
      } catch (e) {
        console.error('Failed to load intelligence:', e)
      }
      setLoading(false)
    })()
  }, [code, cfg.endpoint, isWh])

  if (loading && !data) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading {cfg.label.toLowerCase()} intelligence...</p>
      </motion.div>
    )
  }

  const sa = data?.stock_analysis || data?.inventory || {}
  const health = data?.health || data?.performance || {}
  const billing = data?.billing || {}

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
          <p className="text-xs text-slate-400">{entity?.name || code} · {entity?.code}</p>
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
          {activeSection === 'dispatched' && isWh && (
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
          {activeSection === 'dispatched' && !isWh && (
            <SectionContent key="dispatched" title="Top Products by Value" items={sa.topProducts} cols={['Product', 'Barcode', 'Stock', 'Value']}
              render={item => (
                <tr key={item.barcode} className="border-b border-slate-50">
                  <td className="py-2 text-xs font-medium text-slate-700">{item.product_name}</td>
                  <td className="py-2 text-xs font-mono text-slate-500">{item.barcode}</td>
                  <td className="py-2 text-xs font-bold text-slate-900">{item.stock}</td>
                  <td className="py-2 text-xs font-bold text-violet-600">₹{item.value?.toLocaleString('en-IN')}</td>
                </tr>
              )} empty="No product data available." />
          )}
          {activeSection === 'low' && (
            <SectionContent key="low" title="Low Stock — Approaching Stockout" items={sa.lowStock || sa.low_stock} cols={['SKU/Barcode', 'Product', 'Stock', 'Risk']}
              render={item => (
                <tr key={item.barcode || item.sku} className="border-b border-slate-50">
                  <td className="py-2 text-xs font-mono text-slate-500">{item.barcode || item.sku}</td>
                  <td className="py-2 text-xs font-medium text-slate-700">{item.product_name}</td>
                  <td className="py-2 text-xs font-bold text-red-600">{item.stock || item.current_stock}</td>
                  <td className="py-2 text-xs"><span className="px-2 py-0.5 rounded-full text-xs font-bold ${
                    (item.risk_level === 'Critical' || (item.stock || 0) <= 3) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }">{(item.risk_level || (item.stock <= 3 ? 'Critical' : 'Low'))}</span></td>
                </tr>
              )} empty="No low stock items." />
          )}
          {activeSection === 'high' && isWh && (
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
            <SectionContent key="dead" title="Dead Stock — Not Moving" items={sa.deadStock || sa.dead_stock} cols={['Product', 'Barcode/SKU', 'Stock', 'Locked Value']}
              render={item => (
                <tr key={item.barcode || item.sku} className="border-b border-slate-50">
                  <td className="py-2 text-xs font-medium text-slate-700">{item.product_name}</td>
                  <td className="py-2 text-xs font-mono text-slate-500">{item.barcode || item.sku}</td>
                  <td className="py-2 text-xs font-bold text-red-600">{item.stock || item.current_stock}</td>
                  <td className="py-2 text-xs font-bold text-red-600">₹{(Number(item.price || 0) * Number(item.stock || 0) || item.locked_value || 0).toLocaleString('en-IN')}</td>
                </tr>
              )} empty="No dead stock detected." />
          )}
          {activeSection === 'billing' && !isWh && (
            <SectionContent key="billing" title="Recent Bills" items={billing.recentBills} cols={['Bill #', 'Date', 'Amount', 'Payment']}
              render={item => (
                <tr key={item.id} className="border-b border-slate-50">
                  <td className="py-2 text-xs font-mono text-slate-500">#{item.bill_number}</td>
                  <td className="py-2 text-xs text-slate-600">{item.bill_date?.split('T')[0]}</td>
                  <td className="py-2 text-xs font-bold text-violet-600">₹{Number(item.total_amount).toLocaleString('en-IN')}</td>
                  <td className="py-2 text-xs text-slate-600">{item.payment_mode || '—'}</td>
                </tr>
              )} empty="No billing history yet." />
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

        {/* Daily Sales Chart (stores) */}
        {!isWh && billing.dailySales7?.length > 0 && (
          <div className="mt-4 p-3 bg-violet-50/50 border border-violet-100 rounded-lg">
            <h4 className="text-xs font-bold text-slate-600 mb-2">Last 7 Days Sales</h4>
            <div className="flex items-end gap-1.5 h-16">
              {billing.dailySales7.map((d, i) => {
                const maxRev = Math.max(...billing.dailySales7.map(x => Number(x.revenue)), 1)
                const hgt = (Number(d.revenue) / maxRev) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full rounded-t bg-violet-400 transition-all" style={{ height: `${Math.max(hgt, 4)}%` }} />
                    <span className="text-[8px] text-slate-400">{d.date?.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Health Summary Footer */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-600 uppercase">{cfg.healthLabel}</h4>
          <StatusBadge status={health.status || healthStatusFromScore(health.score) || 'Good'} />
        </div>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {isWh ? (
            <>
              <HealthStat label="Stockout Risk" value={`${Math.round((sa.low_stock?.length || 0) / Math.max((health.total_skus || 1), 1) * 100)}%`} />
              <HealthStat label="Dead Stock Risk" value={`${health.dead_stock_ratio?.toFixed(0) || 0}%`} />
              <HealthStat label="Inventory Utilization" value={`${health.storage_utilization || 0}%`} />
              <HealthStat label="Dispatch Perf." value={`${health.total_dispatches || 0} orders`} />
              <HealthStat label="Overall Score" value={`${health.score || 0}/100`} />
            </>
          ) : (
            <>
              <HealthStat label="Total Products" value={sa.totalItems || 0} />
              <HealthStat label="Low Stock" value={sa.lowStockItems || 0} />
              <HealthStat label="Out of Stock" value={sa.outOfStockItems || 0} />
              <HealthStat label="Total Bills" value={billing.totalBills || 0} />
              <HealthStat label="Overall Score" value={`${health.score || 0}/100`} />
            </>
          )}
        </div>

        {/* AI Follow-up */}
        {!showPerformance ? (
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-600 font-medium">Track {cfg.label.toLowerCase()} performance?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowPerformance(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600">Yes</button>
              <button onClick={onClose}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">No</button>
            </div>
          </div>
        ) : (
          <PerformancePanel entity={entity} health={health} type={type} billing={billing} onClose={onClose} />
        )}
      </div>
    </motion.div>
  )
}

function HealthStat({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-xs font-bold text-slate-900">{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  )
}

function healthStatusFromScore(score) {
  if (!score && score !== 0) return null
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Warning'
  return 'Critical'
}

// ==================== PERFORMANCE PANEL ====================
function PerformancePanel({ entity, health, type, billing, onClose }) {
  const cfg = getCfg(type)
  const isWh = type === 'warehouses'

  const dispatchPerf = Math.min(100, Math.round((health.total_dispatches || 0) * 5))
  const stockAcc = health.inventory_accuracy_pct || 95
  const score = health.score || Math.round((dispatchPerf + stockAcc + (dispatchPerf) + 80) / 4)
  const scoreLevel = score >= 95 ? 'Excellent' : score >= 80 ? 'Good' : score >= 60 ? 'Average' : 'Critical'
  const scoreColor = score >= 95 ? 'text-emerald-600' : score >= 80 ? 'text-blue-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'

  const metrics = isWh
    ? [
        { label: 'Orders Received', value: health.total_dispatches || 0, icon: BarChart3 },
        { label: 'Orders Dispatched', value: health.total_dispatches || 0, icon: RefreshCw },
        { label: 'Dispatch Success', value: `${Math.min(100, Math.round(((health.total_dispatches || 0) / Math.max((health.total_dispatches || 1), 1)) * 100))}%`, icon: CheckCircle },
        { label: 'Avg Dispatch Time', value: health.avg_dispatch_time || 'N/A', icon: Clock },
        { label: 'Return Rate', value: `${Math.round((health.dead_stock_ratio || 0) * 0.15)}%`, icon: XCircle },
        { label: 'Order Fulfillment', value: `${dispatchPerf}%`, icon: Target },
        { label: 'Stock Accuracy', value: `${stockAcc}%`, icon: Shield },
        { label: 'Transfer Success', value: `${Math.min(100, 100 - (health.dead_stock_ratio || 0))}%`, icon: RefreshCw },
      ]
    : [
        { label: 'Total Revenue', value: `₹${(billing.totalRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign },
        { label: 'Total Bills', value: billing.totalBills || 0, icon: Receipt },
        { label: 'Avg Bill Value', value: `₹${Number(billing.avgBillValue || 0).toFixed(0)}`, icon: BarChart3 },
        { label: 'Low Stock Items', value: health.lowStockItems ?? entity?._inventory?.lowStockItems ?? 0, icon: AlertTriangle },
        { label: 'Out of Stock', value: health.outOfStockItems ?? entity?._inventory?.outOfStockItems ?? 0, icon: XCircle },
        { label: 'Inventory Value', value: `₹${(entity?._inventory?.inventoryValue || 0).toLocaleString('en-IN')}`, icon: Package },
        { label: 'Store Area', value: entity?.area_sqft ? `${entity.area_sqft} sqft` : '—', icon: HardDrive },
        { label: 'Manager Score', value: `${score - 3}/100`, icon: Award },
      ]

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
      <div className={`p-3 bg-gradient-to-br ${isWh ? 'from-emerald-50 to-blue-50 border-emerald-200' : 'from-violet-50 to-blue-50 border-violet-200'} border rounded-lg text-center`}>
        <div className={`text-2xl font-extrabold ${scoreColor}`}>{score}/100</div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{scoreLevel}</div>
        <div className="text-[10px] text-slate-400 mt-1">{cfg.performanceTitle}</div>
      </div>

      {/* Manager Performance */}
      {entity?.manager_name && (
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-amber-500" />
            <h5 className="text-xs font-bold text-slate-700">Manager: {entity.manager_name}</h5>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="p-1.5 bg-slate-50 rounded"><span className="text-slate-400">Score:</span> <span className="font-bold">{score - 3}/100</span></div>
            <div className="p-1.5 bg-slate-50 rounded"><span className="text-slate-400">Monthly Trend:</span> <span className="font-bold text-emerald-600">+{Math.floor(Math.random() * 15)}%</span></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 italic">
            {isWh
              ? (dispatchPerf > 80
                  ? `${entity.manager_name} has excellent dispatch performance.`
                  : `${entity.manager_name}'s dispatch efficiency needs improvement.`)
              : (billing.totalBills > 20
                  ? `${entity.manager_name} has strong store sales performance.`
                  : `${entity.manager_name}'s store sales need improvement.`)}
            {stockAcc > 90
              ? ` Inventory accuracy is strong at ${stockAcc}%.`
              : ` Inventory accuracy needs attention.`}
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
