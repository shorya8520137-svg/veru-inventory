'use client'

import { useMemo, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, BarChart3, DollarSign, MapPin, TrendingUp, TrendingDown, ArrowRight, Sparkles, PieChart } from 'lucide-react'

const BRAND_PURPLE = '#7C3AED'

function formatPrice(price) {
  if (price == null || price === '') return '—'
  const n = parseFloat(price)
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : String(price)
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm">
      <Icon className="h-4 w-4 mx-auto mb-1" style={{ color }} />
      <div className="text-lg font-bold text-slate-800">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  )
}

function StatBar({ label, value, maxValue, color = '#3B82F6' }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: `${pct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function ProductPanel({ product, side }) {
  const isLeft = side === 'left'
  const maxStock = product?.current_stock || 0

  const stockLocations = useMemo(() => {
    if (!product?.stock_by_location?.length) return []
    return product.stock_by_location.map(l => ({
      name: l.warehouse || l.location || 'Unknown',
      stock: parseInt(l.stock) || 0,
    }))
  }, [product])

  const movSummary = useMemo(() => {
    if (!product?.movements?.length) return []
    return product.movements.map(m => ({
      type: m.movement_type || 'OTHER',
      events: m.count || 0,
      qty: parseFloat(m.total_qty) || 0,
    }))
  }, [product])

  if (!product) return null

  return (
    <motion.div
      className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: isLeft ? 0.05 : 0.15 }}
    >
      {/* Head */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: isLeft ? '#EFF6FF' : '#F5F3FF' }}
        >
          {isLeft
            ? <Package className="h-4 w-4 text-blue-500" />
            : <Package className="h-4 w-4 text-purple-500" />
          }
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{product.name}</h3>
          <span className="text-[11px] text-slate-400">{product.barcode || ''}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2">
          <MetricCard icon={BarChart3} label="Stock" value={product.current_stock || 0} color="#3B82F6" />
          <MetricCard icon={DollarSign} label="Price" value={product.price ? `₹${parseFloat(product.price).toLocaleString('en-IN')}` : '—'} color="#22C55E" />
          <MetricCard icon={MapPin} label="Locations" value={stockLocations.length} color="#7C3AED" />
        </div>
      </div>

      {/* Stock by location */}
      {stockLocations.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stock by Location</h4>
          {stockLocations.map((loc, i) => (
            <StatBar key={i} label={loc.name} value={loc.stock} maxValue={maxStock} color={isLeft ? '#3B82F6' : '#7C3AED'} />
          ))}
        </div>
      )}

      {/* Movements */}
      {movSummary.length > 0 && (
        <div className="px-4 pb-4 space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Movements</h4>
          {movSummary.map((m, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 text-xs">
              <div className="flex items-center gap-1.5">
                {m.qty > 0
                  ? <TrendingUp className="h-3 w-3 text-green-500" />
                  : <TrendingDown className="h-3 w-3 text-red-500" />
                }
                <span className="text-slate-700">{m.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{m.events}e</span>
                <span className={`font-medium ${m.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {m.qty > 0 ? '+' : ''}{m.qty}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function ParallelComparison({ data, onVisualize }) {
  const p1 = data?.product1
  const p2 = data?.product2
  const [syncedScroll, setSyncedScroll] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const isScrolling = useRef(false)

  const handleScroll = useCallback((source, target) => {
    if (!syncedScroll || isScrolling.current) return
    isScrolling.current = true
    if (target?.current) target.current.scrollTop = source.current.scrollTop
    requestAnimationFrame(() => { isScrolling.current = false })
  }, [syncedScroll])

  if (!p1 || !p2) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        No comparison data available.
      </div>
    )
  }

  const stockDiff = (p1.current_stock || 0) - (p2.current_stock || 0)
  const price1 = parseFloat(p1.price) || 0
  const price2 = parseFloat(p2.price) || 0
  const priceDiff = price1 - price2

  return (
    <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-semibold text-slate-800">{p1.name} <span className="text-slate-300">vs</span> {p2.name}</h2>
          </div>
          <button
            onClick={() => setSyncedScroll(!syncedScroll)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              syncedScroll ? 'border-purple-200 bg-purple-50 text-purple-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
          >
            <ArrowRight className="h-3 w-3 inline mr-1" />
            {syncedScroll ? 'Synced' : 'Sync'}
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
          <span>
            Stock: <span className={stockDiff > 0 ? 'text-green-600 font-medium' : stockDiff < 0 ? 'text-red-600 font-medium' : ''}>
              {stockDiff > 0 ? `+${stockDiff}` : stockDiff < 0 ? stockDiff : 'Same'}
            </span>
          </span>
          {price1 > 0 && price2 > 0 && (
            <span>
              Price: <span className={priceDiff > 0 ? 'text-red-600' : priceDiff < 0 ? 'text-green-600' : ''}>
                {priceDiff !== 0 ? `${p1.name} ${priceDiff > 0 ? '+' : ''}₹${Math.abs(priceDiff).toFixed(2)}` : 'Same'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div ref={leftRef} onScroll={() => handleScroll(leftRef, rightRef)} className="space-y-3 max-h-[60vh] overflow-y-auto">
          <ProductPanel product={p1} side="left" />
        </div>
        <div ref={rightRef} onScroll={() => handleScroll(rightRef, leftRef)} className="space-y-3 max-h-[60vh] overflow-y-auto">
          <ProductPanel product={p2} side="right" />
        </div>
      </div>

      {/* Chart Toggle */}
      {price1 > 0 && (
        <motion.div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowChart(!showChart)}
            className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <PieChart className="h-3.5 w-3.5 text-purple-500" />
              {showChart ? 'Hide Chart' : 'Show Chart'}
            </div>
            <span className="text-slate-300">{showChart ? '▲' : '▼'}</span>
          </button>
          {showChart && (
            <div className="px-4 pb-4">
              <svg width="100%" height="180" viewBox="0 0 400 180" className="overflow-visible">
                {/* Y axis label */}
                <text x="20" y="20" fontSize="10" fill="#94A3B8" fontWeight="600">Stock</text>
                {/* Stock bars */}
                <rect x="80" y={135 - Math.min((p1.current_stock || 0), 120)} width="50" height={Math.min((p1.current_stock || 0), 120)} rx="4" fill="#3B82F6" opacity="0.85" />
                <text x="105" y="148" fontSize="9" fill="#475569" textAnchor="middle">{p1.current_stock || 0}</text>
                <text x="105" y="162" fontSize="8" fill="#94A3B8" textAnchor="middle" className="truncate" style={{maxWidth: 70}}>{p1.name.length > 12 ? p1.name.slice(0, 12) + '…' : p1.name}</text>
                <rect x="170" y={135 - Math.min((p2.current_stock || 0), 120)} width="50" height={Math.min((p2.current_stock || 0), 120)} rx="4" fill="#7C3AED" opacity="0.85" />
                <text x="195" y="148" fontSize="9" fill="#475569" textAnchor="middle">{p2.current_stock || 0}</text>
                <text x="195" y="162" fontSize="8" fill="#94A3B8" textAnchor="middle">{p2.name.length > 12 ? p2.name.slice(0, 12) + '…' : p2.name}</text>
                {/* Price bars */}
                <text x="270" y="20" fontSize="10" fill="#94A3B8" fontWeight="600">Price</text>
                <rect x="275" y={135 - Math.min(price1 / 10, 120)} width="50" height={Math.min(price1 / 10, 120)} rx="4" fill="#22C55E" opacity="0.85" />
                <text x="300" y="148" fontSize="9" fill="#475569" textAnchor="middle">₹{price1}</text>
                <rect x="340" y={135 - Math.min(price2 / 10, 120)} width="50" height={Math.min(price2 / 10, 120)} rx="4" fill="#EAB308" opacity="0.85" />
                <text x="365" y="148" fontSize="9" fill="#475569" textAnchor="middle">₹{price2}</text>
                {/* Legend */}
                <rect x="80" y="170" width="8" height="8" rx="2" fill="#3B82F6" />
                <text x="92" y="178" fontSize="8" fill="#64748B">{p1.name.length > 10 ? p1.name.slice(0, 10) + '…' : p1.name}</text>
                <rect x="170" y="170" width="8" height="8" rx="2" fill="#7C3AED" />
                <text x="182" y="178" fontSize="8" fill="#64748B">{p2.name.length > 10 ? p2.name.slice(0, 10) + '…' : p2.name}</text>
              </svg>
            </div>
          )}
        </motion.div>
      )}

      {/* Winner */}
      {(() => {
        const winners = []
        if (stockDiff > 0) winners.push(`**${p1.name}** has more stock (${stockDiff} units extra)`)
        else if (stockDiff < 0) winners.push(`**${p2.name}** has more stock (${Math.abs(stockDiff)} units extra)`)
        if (price1 > 0 && price2 > 0 && priceDiff > 0) winners.push(`**${p2.name}** is more affordable (₹${priceDiff.toFixed(2)} cheaper)`)
        else if (price1 > 0 && price2 > 0 && priceDiff < 0) winners.push(`**${p1.name}** is more affordable (₹${Math.abs(priceDiff).toFixed(2)} cheaper)`)
        if (!winners.length) return null
        return (
          <motion.div
            className="rounded-xl border border-purple-100 bg-purple-50/50 p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-semibold text-purple-700">Quick Summary</span>
              </div>
              {onVisualize && (
                <button
                  onClick={() => onVisualize(
                    [
                      { metric: 'Stock', [p1.name]: p1.current_stock || 0, [p2.name]: p2.current_stock || 0 },
                      { metric: 'Price', [p1.name]: price1, [p2.name]: price2 },
                    ],
                    ['metric', p1.name, p2.name],
                    `${p1.name} vs ${p2.name}`
                  )}
                  className="text-xs px-2 py-1 rounded-md bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                >
                  <BarChart3 className="h-3 w-3 inline mr-1" />
                  Graph
                </button>
              )}
            </div>
            <ul className="space-y-0.5">
              {winners.map((w, i) => (
                <li key={i} className="text-xs text-slate-600"><span className="text-green-500 mr-1">✓</span><span dangerouslySetInnerHTML={{ __html: w }} /></li>
              ))}
            </ul>
          </motion.div>
        )
      })()}
    </motion.div>
  )
}
