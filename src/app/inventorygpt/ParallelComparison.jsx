'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, BarChart3, DollarSign, MapPin, TrendingUp, TrendingDown, Minus, Copy, Check, Maximize2, Minimize2, ShoppingCart, ArrowRight, Sparkles, Layers } from 'lucide-react'

const BRAND_PURPLE = '#7C3AED'
const BG_CARD = '#141414'
const BG_INNER = '#1A1A1A'
const BORDER = '#2A2A2A'
const TEXT_PRIMARY = '#E8E8E8'
const TEXT_SECONDARY = '#888888'
const TEXT_MUTED = '#666666'
const ACCENT_GREEN = '#22C55E'
const ACCENT_RED = '#EF4444'
const ACCENT_BLUE = '#3B82F6'

function formatPrice(price) {
  if (price == null || price === '') return '—'
  const n = parseFloat(price)
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : String(price)
}

function glowStyle(color) {
  return { boxShadow: `0 0 20px ${color}15, 0 0 60px ${color}08` }
}

function AnimatedCursor() {
  return (
    <motion.span
      className="inline-block w-[2px] h-[1em] ml-[1px] align-middle"
      style={{ backgroundColor: BRAND_PURPLE }}
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function StatBar({ label, value, maxValue, color = ACCENT_BLUE }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: TEXT_SECONDARY }}>{label}</span>
        <span style={{ color: TEXT_PRIMARY }} className="font-medium">{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2A2A2A' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function ProductPanel({ product, index, side }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [streamText, setStreamText] = useState('')
  const panelRef = useRef(null)

  const maxStock = product?.current_stock || 0
  const isLeft = side === 'left'

  const panelVariants = {
    hidden: { opacity: 0, x: isLeft ? -30 : 30, y: 20 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.5, delay: 0.15 + index * 0.1, ease: [0.25, 0.1, 0.25, 1] },
    },
  }

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

  // Streaming text effect
  useEffect(() => {
    if (!product?.name) return
    const phrases = [
      `📊 **${product.current_stock || 0} units** in stock`,
      `💰 ${formatPrice(product.price)}`,
      stockLocations.length ? `📍 ${stockLocations.length} locations` : '',
      movSummary.length ? `🔄 ${movSummary.length} movement types` : '',
    ].filter(Boolean)
    const fullText = phrases.join('  ·  ')
    let idx = 0
    setStreamText('')
    const interval = setInterval(() => {
      idx++
      setStreamText(fullText.slice(0, idx))
      if (idx >= fullText.length) clearInterval(interval)
    }, 25 + Math.random() * 15)
    return () => clearInterval(interval)
  }, [product, stockLocations.length, movSummary.length])

  const copyProduct = useCallback(() => {
    if (!product) return
    const text = `${product.name}\nBarcode: ${product.barcode || '—'}\nPrice: ${formatPrice(product.price)}\nStock: ${product.current_stock || 0} units`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }, [product])

  if (!product) return null

  return (
    <motion.div
      ref={panelRef}
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      className="relative rounded-2xl overflow-hidden border"
      style={{
        backgroundColor: BG_CARD,
        borderColor: BORDER,
        ...glowStyle(isLeft ? ACCENT_BLUE : BRAND_PURPLE),
      }}
    >
      {/* Gradient top line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: isLeft
            ? 'linear-gradient(90deg, #3B82F6, #8B5CF6)'
            : 'linear-gradient(90deg, #8B5CF6, #EC4899)',
        }}
      />

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: isLeft ? `${ACCENT_BLUE}15` : `${BRAND_PURPLE}15`,
                ...glowStyle(isLeft ? ACCENT_BLUE : BRAND_PURPLE),
              }}
            >
              {isLeft ? (
                <Package className="h-5 w-5" style={{ color: ACCENT_BLUE }} />
              ) : (
                <Layers className="h-5 w-5" style={{ color: BRAND_PURPLE }} />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight" style={{ color: TEXT_PRIMARY }}>
                {product.name || `Product ${index + 1}`}
              </h3>
              <span
                className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isLeft ? `${ACCENT_BLUE}12` : `${BRAND_PURPLE}12`,
                  color: isLeft ? ACCENT_BLUE : BRAND_PURPLE,
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                AI Analysis
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyProduct}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: TEXT_MUTED }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#222'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {copied ? <Check className="h-3.5 w-3.5" style={{ color: ACCENT_GREEN }} /> : <Copy className="h-3.5 w-3.5" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(!expanded)}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: TEXT_MUTED }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#222'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Streaming info bar */}
      <div
        className="mx-5 px-3 py-2 rounded-lg text-xs font-mono mb-2 overflow-hidden whitespace-nowrap"
        style={{ backgroundColor: BG_INNER, color: TEXT_SECONDARY }}
      >
        {streamText || <span style={{ color: TEXT_MUTED }}>Loading data…</span>}
        <AnimatedCursor />
      </div>

      {/* Body */}
      <div className={`px-5 ${expanded ? 'pb-5' : 'pb-3'} space-y-4 overflow-y-auto`} style={{ maxHeight: expanded ? '600px' : 'none' }}>
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-2">
          <motion.div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: BG_INNER }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.15 }}
          >
            <BarChart3 className="h-4 w-4 mx-auto mb-1" style={{ color: ACCENT_BLUE }} />
            <div className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>{product.current_stock || 0}</div>
            <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: TEXT_MUTED }}>Stock</div>
          </motion.div>
          <motion.div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: BG_INNER }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.15 }}
          >
            <DollarSign className="h-4 w-4 mx-auto mb-1" style={{ color: ACCENT_GREEN }} />
            <div className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>
              {product.price ? `₹${parseFloat(product.price).toLocaleString('en-IN')}` : '—'}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: TEXT_MUTED }}>Price</div>
          </motion.div>
          <motion.div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: BG_INNER }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.15 }}
          >
            <MapPin className="h-4 w-4 mx-auto mb-1" style={{ color: BRAND_PURPLE }} />
            <div className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>{stockLocations.length}</div>
            <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: TEXT_MUTED }}>Locations</div>
          </motion.div>
        </div>

        {/* Stock by location */}
        {stockLocations.length > 0 && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.15 }}
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>
              Stock by Location
            </h4>
            <div className="space-y-1.5">
              {stockLocations.map((loc, i) => (
                <StatBar
                  key={i}
                  label={loc.name}
                  value={loc.stock}
                  maxValue={maxStock}
                  color={isLeft ? ACCENT_BLUE : BRAND_PURPLE}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Movement breakdown */}
        {movSummary.length > 0 && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.15 }}
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>
              Movement Breakdown
            </h4>
            <div className="space-y-1">
              {movSummary.map((m, i) => {
                const isIn = m.qty > 0
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs"
                    style={{ backgroundColor: BG_INNER }}
                  >
                    <div className="flex items-center gap-2">
                      {isIn ? (
                        <TrendingUp className="h-3 w-3" style={{ color: ACCENT_GREEN }} />
                      ) : (
                        <TrendingDown className="h-3 w-3" style={{ color: ACCENT_RED }} />
                      )}
                      <span style={{ color: TEXT_PRIMARY }}>{m.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ color: TEXT_MUTED }}>{m.events} events</span>
                      <span
                        className="font-medium"
                        style={{ color: isIn ? ACCENT_GREEN : ACCENT_RED }}
                      >
                        {isIn ? '+' : ''}{m.qty}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Barcode footer */}
      {product.barcode && (
        <div
          className="mx-5 mb-3 px-3 py-2 rounded-lg text-[11px] font-mono"
          style={{ backgroundColor: BG_INNER, color: TEXT_MUTED }}
        >
          {product.barcode}
        </div>
      )}
    </motion.div>
  )
}

function WinnerBanner({ p1, p2 }) {
  if (!p1 || !p2) return null

  const stock1 = p1.current_stock || 0
  const stock2 = p2.current_stock || 0
  const price1 = parseFloat(p1.price) || 0
  const price2 = parseFloat(p2.price) || 0

  let stockWinner = stock1 > stock2 ? p1.name : stock2 > stock1 ? p2.name : null
  let priceWinner = (price1 > 0 && price2 > 0) ? (price1 < price2 ? p1.name : price2 < price1 ? p2.name : null) : null
  let bestValue = (price1 > 0 && price2 > 0 && stock1 > 0 && stock2 > 0)
    ? ((stock1 / price1) > (stock2 / price2) ? p1.name : (stock2 / price2) > (stock1 / price1) ? p2.name : null)
    : null

  const recommendations = []
  if (stockWinner) recommendations.push(`**${stockWinner}** has more stock available`)
  if (priceWinner) recommendations.push(`**${priceWinner}** is more affordable`)
  if (bestValue) recommendations.push(`**${bestValue}** offers better value for money`)

  if (!recommendations.length) return null

  return (
    <motion.div
      className="rounded-xl border p-4 mt-4"
      style={{
        backgroundColor: 'rgba(124, 58, 237, 0.06)',
        borderColor: 'rgba(124, 58, 237, 0.2)',
        ...glowStyle(BRAND_PURPLE),
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4" style={{ color: BRAND_PURPLE }} />
        <span className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Best For</span>
      </div>
      <ul className="space-y-1">
        {recommendations.map((r, i) => (
          <motion.li
            key={i}
            className="text-sm"
            style={{ color: TEXT_SECONDARY }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 + i * 0.15 }}
          >
            <span className="mr-2" style={{ color: ACCENT_GREEN }}>✓</span>
            <span dangerouslySetInnerHTML={{ __html: r }} />
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

export default function ParallelComparison({ data, onClose }) {
  const p1 = data?.product1
  const p2 = data?.product2

  const stockDiff = (p1?.current_stock || 0) - (p2?.current_stock || 0)
  const price1 = parseFloat(p1?.price) || 0
  const price2 = parseFloat(p2?.price) || 0
  const priceDiff = price1 - price2

  const [syncedScroll, setSyncedScroll] = useState(false)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const isScrolling = useRef(false)

  const handleScroll = useCallback((source, target) => {
    if (!syncedScroll || isScrolling.current) return
    isScrolling.current = true
    if (target?.current) {
      target.current.scrollTop = source.current.scrollTop
    }
    requestAnimationFrame(() => { isScrolling.current = false })
  }, [syncedScroll])

  if (!p1 || !p2) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: BG_CARD, borderColor: BORDER, border: '1px solid' }}>
        <p style={{ color: TEXT_MUTED }}>No comparison data available.</p>
      </div>
    )
  }

  return (
    <motion.div
      className="w-full space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Comparison header */}
      <motion.div
        className="rounded-2xl border p-5"
        style={{
          backgroundColor: BG_CARD,
          borderColor: BORDER,
          ...glowStyle(BRAND_PURPLE),
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-5 w-5" style={{ color: BRAND_PURPLE }} />
              <h2 className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>
                {p1.name} vs {p2.name}
              </h2>
            </div>
            <p className="text-sm" style={{ color: TEXT_SECONDARY }}>
              Side-by-side comparison
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Synced scroll toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSyncedScroll(!syncedScroll)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: syncedScroll ? `${BRAND_PURPLE}20` : BG_INNER,
                color: syncedScroll ? BRAND_PURPLE : TEXT_SECONDARY,
                border: `1px solid ${syncedScroll ? `${BRAND_PURPLE}40` : BORDER}`,
              }}
            >
              <ArrowRight className="h-3 w-3" />
              {syncedScroll ? 'Synced' : 'Sync scroll'}
            </motion.button>
          </div>
        </div>

        {/* Overall comparison summary */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: TEXT_SECONDARY }}>
            <BarChart3 className="h-3.5 w-3.5" />
            <span>
              Stock:{' '}
              <span style={{ color: stockDiff > 0 ? ACCENT_GREEN : stockDiff < 0 ? ACCENT_RED : TEXT_PRIMARY }}>
                {stockDiff > 0 ? `+${stockDiff}` : stockDiff < 0 ? stockDiff : 'Same'} units
              </span>
            </span>
          </div>
          {price1 > 0 && price2 > 0 && (
            <div className="flex items-center gap-2 text-xs" style={{ color: TEXT_SECONDARY }}>
              <DollarSign className="h-3.5 w-3.5" />
              <span>
                Price:{' '}
                <span style={{ color: priceDiff > 0 ? ACCENT_RED : priceDiff < 0 ? ACCENT_GREEN : TEXT_PRIMARY }}>
                  {priceDiff !== 0
                    ? `${p1.name} is ${priceDiff > 0 ? `₹${priceDiff.toFixed(2)} more` : `₹${Math.abs(priceDiff).toFixed(2)} less`}`
                    : 'Same price'}
                </span>
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Two-panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          ref={leftRef}
          onScroll={() => handleScroll(leftRef, rightRef)}
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
          className="scrollbar-thin"
        >
          <ProductPanel product={p1} index={0} side="left" />
        </div>
        <div
          ref={rightRef}
          onScroll={() => handleScroll(rightRef, leftRef)}
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
          className="scrollbar-thin"
        >
          <ProductPanel product={p2} index={1} side="right" />
        </div>
      </div>

      {/* Winner recommendation */}
      <WinnerBanner p1={p1} p2={p2} />

      {/* Mobile: swipe hint */}
      <div className="lg:hidden text-center text-xs py-2" style={{ color: TEXT_MUTED }}>
        ← Swipe to see both products →
      </div>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </motion.div>
  )
}
