'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  RefreshCw,
  Paperclip,
  ThumbsUp,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Info,
  Grid3X3,
  Package,
  TrendingUp,
  AlertTriangle,
  Star,
  Eye,
  Zap,
  MessageCircle,
  ChevronRight,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MarkdownBody from './MarkdownBody';

const STORAGE_KEY = 'inventorygpt_chat_sessions_v1';
const AGENT_NAME = 'InsoraOpps';
const BRAND_PURPLE = '#5850EC';
const CHAT_COLUMN = 'mx-auto w-full max-w-5xl min-w-0 px-6';
const READ_MORE_CHAR_LIMIT = 1600;
const TYPING_WORD_MS = 24;
const TYPING_CHAR_MS = 14;
const WELCOME_TYPE_MS = 18;

const QUICK_EXAMPLES = [
  { label: 'Show categories', prompt: 'show categories' },
  { label: 'BLR_WH stock', prompt: 'show stock of BLR_WH' },
  { label: 'Analyze dead stock', prompt: 'Analyze dead stock at BLR_WH' },
  { label: 'Website orders', prompt: 'show website orders' }
];

function isGreetingOnly(text) {
  const raw = String(text || '').trim();
  if (!raw || raw.length > 48) return false;
  const t = raw.replace(/[!?.]+$/g, '').trim().toLowerCase();
  const oneWord = ['hi', 'hello', 'hey', 'hii', 'yo', 'namaste', 'howdy', 'gm', 'ga', 'ge'];
  if (oneWord.includes(t)) return true;
  if (/^(good\s+(morning|afternoon|evening))$/.test(t)) return true;
  if (/^(hi|hello|hey)\s+(there|all|team|bro|buddy|sir|madam)$/.test(t)) return true;
  return false;
}

function insoraOppsGreeting(brain) {
  const wh = brain?.warehouses ? Object.keys(brain.warehouses).join(', ') : 'GGM_WH, BLR_WH';
  return (
    `Hi — I'm **${AGENT_NAME}**, your inventory intelligence copilot. I read **live warehouse stock**, **timeline/ledger movements**, **dispatch products**, and **website products** — not catalog totals alone.` +
    (brain?.inventoryRowCount
      ? `\n\n**Connected:** ${brain.inventoryRowCount} batch rows · ${brain.inventoryTotalUnits?.toLocaleString?.() ?? brain.inventoryTotalUnits} units · warehouses: ${wh}`
      : '\n\nSign in to connect live inventory APIs.')
  );
}

function insoraOppsGreetingPlain(brain) {
  const wh = brain?.warehouses ? Object.keys(brain.warehouses).join(', ') : 'GGM_WH, BLR_WH';
  let text = `Hi — I'm ${AGENT_NAME}, your inventory intelligence copilot. I read live warehouse stock, timeline/ledger movements, dispatch products, and website products — not catalog totals alone.`;
  if (brain?.inventoryRowCount) {
    text += ` Connected: ${brain.inventoryRowCount} batch rows, ${brain.inventoryTotalUnits?.toLocaleString?.() ?? brain.inventoryTotalUnits} units. Warehouses: ${wh}.`;
  } else {
    text += ' Sign in to connect live inventory APIs.';
  }
  return text;
}

function useTypewriter(fullText, charMs = WELCOME_TYPE_MS, enabled = true) {
  const [count, setCount] = useState(0);
  const text = String(fullText ?? '');

  useEffect(() => {
    setCount(0);
  }, [text]);

  useEffect(() => {
    if (!enabled || count >= text.length) return undefined;
    const timer = setTimeout(() => setCount((c) => c + 1), charMs);
    return () => clearTimeout(timer);
  }, [count, text, charMs, enabled]);

  return {
    visible: text.slice(0, count),
    done: count >= text.length
  };
}

function StreamingCursor() {
  return (
    <span
      className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[1px] align-middle animate-[igpt-caret_1s_step-end_infinite]"
      style={{ backgroundColor: BRAND_PURPLE }}
      aria-hidden
    />
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <motion.span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: BRAND_PURPLE }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles className="h-4 w-4" />
      </motion.span>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full animate-[igpt-dot-bounce_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.15}s`, backgroundColor: BRAND_PURPLE }}
          />
        ))}
        <span className="ml-2 text-sm text-slate-500">Thinking</span>
      </motion.div>
    </div>
  );
}

function sanitizeForUser(text) {
  let s = String(text ?? '').trim();
  s = s.replace(/\n*Source:\s*[^\n]+/gi, '').trim();
  if (
    /unknown column|sql|syntax error|er_|select\s+.+\s+from|\/api\/|processed_by|errno/i.test(
      s
    )
  ) {
    return 'That request could not be completed right now. Please try again or rephrase your question.';
  }
  return s;
}

function tokenizeForTyping(text) {
  const s = String(text ?? '');
  const parts = s.match(/\S+|\s+/g);
  return parts && parts.length ? parts : [s];
}

function deriveTitle(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 'Inventory Status';
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  if (lastUser?.content) {
    const trimmed = lastUser.content.trim();
    return trimmed.length > 36 ? `${trimmed.slice(0, 36).trim()}...` : trimmed;
  }
  return 'Inventory Status';
}

function catalogAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function userInitials(name) {
  const parts = String(name || 'U')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || 'U').toUpperCase();
}

function userRoleLabel(user) {
  if (!user) return 'Team member';
  return (
    user.role_display_name ||
    user.role_label ||
    user.role_name ||
    user.role ||
    'Team member'
  );
}

// ==================== CATEGORY GRID ====================
function CategoryGrid({ categories, onCategoryClick }) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {categories.map((cat, i) => {
        const catName = cat.name || cat.category || cat.category_name || cat.slug || '';
        const count = cat.count || cat.product_count || cat.total_products || 0;
        return (
          <motion.div
            key={`${catName}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategoryClick?.(catName)}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition-all hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-200">
                <Grid3X3 className="h-6 w-6" />
              </div>
              {count > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {count} products
                </span>
              )}
            </div>
            <h3 className="mt-3 text-base font-semibold capitalize text-slate-900">
              {catName}
            </h3>
            <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-violet-600 transition-colors group-hover:text-violet-700">
              <span>View Products</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ==================== PRODUCT CARD (FLIP) ====================
function ProductCard({ product, index = 0, onAskAI }) {
  const [flipped, setFlipped] = useState(false);
  const [showNestedChat, setShowNestedChat] = useState(false);

  if (!product) return null;

  const title = product.product_name || product.name || product.title || 'Unknown Product';
  const sku = product.sku || product.barcode || product.sku_id || '';
  const stock = parseInt(product.stock || product.quantity || product.qty || 0, 10);
  const price = parseFloat(product.price || product.selling_price || product.unit_price || 0);
  const warehouse = product.warehouse || product.warehouse_code || product.location || '';
  const description = product.description || product.long_description || product.details || '';
  
  // Build unique badges array
  const badges = [];
  if (stock === 0) badges.push('Out of Stock');
  else if (stock > 0 && stock < 10) badges.push('Low Stock');
  if (product.is_bestseller || product.bestseller) badges.push('Best Seller');
  if (product.is_trending || product.trending) badges.push('Trending');
  if (product.is_premium || product.premium) badges.push('Premium');

  const badgeColors = {
    'Best Seller': 'bg-emerald-100 text-emerald-700',
    'Low Stock': 'bg-amber-100 text-amber-700',
    'Premium': 'bg-violet-100 text-violet-700',
    'Trending': 'bg-blue-100 text-blue-700',
    'Out of Stock': 'bg-red-100 text-red-700'
  };

  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="relative h-full w-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
      >
        {/* FRONT SIDE */}
        <div
          className="absolute inset-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-violet-300 hover:shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight">{title}</h4>
              {sku && <p className="mt-1 text-xs text-slate-500">SKU: {sku}</p>}
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${stock === 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {stock}
            </span>
          </div>
          
          {/* Badges */}
          {badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {badges.slice(0, 2).map((b) => (
                <span key={b} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColors[b] || 'bg-slate-100 text-slate-600'}`}>
                  {b}
                </span>
              ))}
            </div>
          )}
          
          {warehouse && (
            <p className="mt-2 text-xs text-slate-500">📍 {warehouse}</p>
          )}
          {price > 0 && (
            <p className="mt-1 text-base font-bold text-slate-900">${price.toFixed(2)}</p>
          )}
          
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-violet-600">
            <Eye className="h-3.5 w-3.5" />
            <span>Click for details</span>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="absolute inset-0 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Product Details</h4>
          {description ? (
            <p className="text-xs leading-relaxed text-slate-600 line-clamp-4 mb-3">
              {description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mb-3">No description available</p>
          )}
          
          <div className="space-y-1 text-xs text-slate-600 mb-3">
            {sku && <p><span className="font-medium">SKU:</span> {sku}</p>}
            {warehouse && <p><span className="font-medium">Warehouse:</span> {warehouse}</p>}
            <p><span className="font-medium">Stock:</span> {stock} units</p>
            {price > 0 && <p><span className="font-medium">Price:</span> ${price.toFixed(2)}</p>}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowNestedChat(!showNestedChat); }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-100 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-200"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Ask AI
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              Back
            </button>
          </div>
          
          {showNestedChat && <NestedChat product={product} />}
        </div>
      </motion.div>
    </div>
  );
}

// ==================== NESTED AI CHAT ====================
function NestedChat({ product }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const productContext = `Product: ${product.product_name || product.name || product.title}, SKU: ${product.sku || product.barcode || ''}, Stock: ${product.stock || product.quantity || 0}, Warehouse: ${product.warehouse || ''}, Price: ${product.price || 0}`;
      const response = await fetch('/api/inventorygpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `${userMsg.content}\n\n[Context: ${productContext}]`,
          conversationHistory: messages.slice(-3).map((m) => ({ role: m.role, content: m.content }))
        })
      });
      const data = await response.json();
      if (data.success && data.answer) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      }
    } catch (error) {
      console.error('Nested chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl border border-violet-200 bg-white p-3"
    >
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs ${m.role === 'user' ? 'bg-violet-100 text-violet-900' : 'bg-slate-100 text-slate-700'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about this product..."
          className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-violet-300 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          <Send className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ==================== PRODUCT MATRIX ====================
function ProductMatrix({ products, title, onAskAI }) {
  if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {title && (
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, 9).map((product, i) => (
          <ProductCard key={i} product={product} index={i} onAskAI={onAskAI} />
        ))}
      </div>
      {products.length > 9 && (
        <p className="text-center text-sm text-slate-500">
          Showing 9 of {products.length} products. Ask for more details!
        </p>
      )}
    </motion.div>
  );
}

// ==================== INTENT DETECTION ====================
function detectIntent(text) {
  const t = text.toLowerCase();
  if (/show.*categor(y|ies)/.test(t)) return { type: 'categories', raw: text };
  if (/show.*(all\s+)?product/.test(t) || /products.*(of|from|in)/.test(t)) {
    const match = t.match(/(?:of|from|in)\s+([a-z\s]+)/);
    if (match) return { type: 'products', category: match[1].trim(), raw: text };
    return { type: 'products', raw: text };
  }
  if (/show.*stock|warehouse.*stock|stock.*warehouse|inventory/.test(t)) return { type: 'stock', raw: text };
  if (/dead\s*stock|slow\s*moving|excess/.test(t)) return { type: 'dead_stock', raw: text };
  if (/transfer|movement/.test(t)) return { type: 'transfers', raw: text };
  if (/how\s*(many|much).*warehouse|how\s*(many|much).*store|total\s*(warehouse|store)/.test(t)) return { type: 'warehouse_count', raw: text };
  return null;
}

function InsoraLogo() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
        style={{ backgroundColor: BRAND_PURPLE }}
      >
        <Sparkles className="h-4.5 w-4.5" strokeWidth={2.2} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">{AGENT_NAME}</span>
    </div>
  );
}

function StatusPill({ label, ok }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
      <span
        className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

function QuickExampleCard({ label, onClick, index = 0 }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 + index * 0.12, duration: 0.35 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/50"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Quick example
      </p>
      <p className="mt-1 text-sm italic text-slate-600">&ldquo;{label}&rdquo;</p>
    </motion.button>
  );
}

function WelcomePanel({ brain, onPickExample }) {
  const plain = insoraOppsGreetingPlain(brain);
  const { visible, done } = useTypewriter(plain, WELCOME_TYPE_MS, true);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
      <motion.span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-md"
        style={{ backgroundColor: BRAND_PURPLE }}
        animate={{ boxShadow: ['0 0 0 0 rgba(88,80,236,0.35)', '0 0 0 10px rgba(88,80,236,0)', '0 0 0 0 rgba(88,80,236,0)'] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Info className="h-4 w-4" strokeWidth={2.5} />
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-7 text-slate-700">
          {visible}
          {!done ? <StreamingCursor /> : null}
        </p>
        <AnimatePresence>
          {done ? (
            <motion.div
              key="welcome-extras"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {brain?.inventoryRowCount ? (
                <p className="mt-3 text-sm font-medium text-emerald-700">
                  Live data connected — ask about any warehouse or SKU.
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {QUICK_EXAMPLES.map((ex, i) => (
                  <QuickExampleCard
                    key={ex.prompt}
                    index={i}
                    label={ex.label}
                    onClick={() => onPickExample(ex.prompt)}
                  />
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function AssistantMessage({ message, isStreaming = false, onHelpful, categories, products, onCategoryClick }) {
  const [copied, setCopied] = useState(false);
  const [helpful, setHelpful] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fullContent = String(message.content ?? '');
  const isLong = fullContent.length > READ_MORE_CHAR_LIMIT && !isStreaming;
  const displayContent =
    isLong && !expanded ? `${fullContent.slice(0, READ_MORE_CHAR_LIMIT)}…` : fullContent;

  // Detect intent and render visual components
  const intent = detectIntent(message.userPrompt || '');
  const showCategoryGrid = intent?.type === 'categories' && Array.isArray(categories) && categories.length > 0;
  const showProductMatrix = intent?.type === 'products' && Array.isArray(products) && products.length > 0;

  // Filter products by category if needed
  const filteredProducts = useMemo(() => {
    if (!showProductMatrix || !intent?.category) return products;
    const cat = intent.category.toLowerCase();
    return products.filter((p) => {
      // Check multiple possible category fields
      const pCat = (p.category || p.product_category || p.type || p.category_name || p.category_id || '').toString().toLowerCase();
      const pName = (p.product_name || p.name || p.title || '').toLowerCase();
      const pSku = (p.sku || p.barcode || '').toLowerCase();
      // Match by category name OR product name containing the category
      return pCat.includes(cat) || pName.includes(cat) || pSku.includes(cat);
    });
  }, [products, showProductMatrix, intent?.category]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.div
      className="group flex gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
        style={{ backgroundColor: BRAND_PURPLE }}
      >
        <Info className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1 space-y-4">
        {/* Category Grid ONLY - no markdown text */}
        {showCategoryGrid ? (
          <CategoryGrid categories={categories} onCategoryClick={onCategoryClick} />
        ) : showProductMatrix ? (
          /* Product Matrix ONLY - no markdown text */
          <ProductMatrix products={filteredProducts} title={`${intent?.category ? `${intent.category} Products` : 'Products'}`} onAskAI={() => {}} />
        ) : (
          /* Regular text response */
          <>
            {message.error ? (
              <p className="text-sm text-red-600">{displayContent}</p>
            ) : (
              <div className="text-[15px] leading-7 text-slate-700">
                <MarkdownBody content={displayContent} />
                {isStreaming ? <StreamingCursor /> : null}
              </div>
            )}
            {isLong && !expanded ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-2 text-sm font-medium hover:opacity-80"
                style={{ color: BRAND_PURPLE }}
              >
                Read more
              </button>
            ) : null}
            {isLong && expanded ? (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="mt-2 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Show less
              </button>
            ) : null}
            {!isStreaming && fullContent ? (
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={copyText}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-slate-600"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHelpful(true);
                    onHelpful?.();
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs transition ${
                    helpful ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Helpful
                </button>
                {message.exportTsv ? (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(message.exportTsv)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Copy table
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </motion.div>
  );
}

function UserMessage({ content }) {
  return (
    <motion.div
      className="flex items-end justify-end gap-2"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <motion.div
        className="max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-md"
        style={{ backgroundColor: BRAND_PURPLE }}
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </motion.div>
      <span className="mb-1 shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        ME
      </span>
    </motion.div>
  );
}

export default function InventoryGPTPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brain, setBrain] = useState(null);
  const [brainLoading, setBrainLoading] = useState(true);
  const [streamingMsg, setStreamingMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  const activeSession = useMemo(
    () => sessions?.find((s) => s.id === activeSessionId),
    [sessions, activeSessionId]
  );
  const messages = activeSession?.messages ?? [];

  const displayName = user?.name || 'User';
  const displayRole = userRoleLabel(user);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p.sessions) && p.sessions.length) {
          setSessions(p.sessions);
          setActiveSessionId(p.activeSessionId || p.sessions[0].id);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}`;
    const initial = [{ id, title: 'Inventory Status', updatedAt: Date.now(), messages: [] }];
    setSessions(initial);
    setActiveSessionId(id);
  }, []);

  useEffect(() => {
    if (!sessions?.length || !activeSessionId) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, activeSessionId }));
    } catch {
      /* ignore */
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, streamingMsg]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  const appendAssistantWithTyping = useCallback((sessionId, fullText, meta = {}) => {
    const safeText = sanitizeForUser(fullText);
    const timestamp = Date.now();
    const useChars = safeText.length < 220;
    const tokens = useChars ? safeText.split('') : tokenizeForTyping(safeText);
    const tickMs = useChars ? TYPING_CHAR_MS : TYPING_WORD_MS;
    const baseMeta = { ...meta, isStreaming: true };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const assistantMessage = {
          role: 'assistant',
          content: '',
          timestamp,
          ...baseMeta
        };
        const nextMessages = [...s.messages, assistantMessage];
        return {
          ...s,
          messages: nextMessages,
          title: deriveTitle(nextMessages),
          updatedAt: Date.now()
        };
      })
    );

    setStreamingMsg({ sessionId, timestamp, tokens, index: 0, tickMs });

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    typingTimerRef.current = setInterval(() => {
      setStreamingMsg((prev) => {
        if (!prev) return null;
        const nextIndex = prev.index + 1;
        const visible = prev.tokens.slice(0, nextIndex).join('');

        setSessions((sessions) =>
          sessions.map((s) => {
            if (s.id !== prev.sessionId) return s;
            const msgs = [...s.messages];
            const idx = msgs.findIndex((m) => m.timestamp === prev.timestamp);
            if (idx < 0) return s;
            msgs[idx] = {
              ...msgs[idx],
              content: visible,
              isStreaming: nextIndex < prev.tokens.length
            };
            return { ...s, messages: msgs, updatedAt: Date.now() };
          })
        );

        if (nextIndex >= prev.tokens.length) {
          const full = prev.tokens.join('');
          setSessions((sessions) =>
            sessions.map((s) => {
              if (s.id !== prev.sessionId) return s;
              const msgs = [...s.messages];
              const idx = msgs.findIndex((m) => m.timestamp === prev.timestamp);
              if (idx < 0) return s;
              msgs[idx] = { ...msgs[idx], content: full, isStreaming: false };
              return { ...s, messages: msgs, updatedAt: Date.now() };
            })
          );
          if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          return null;
        }
        return { ...prev, index: nextIndex };
      });
    }, tickMs);
  }, []);

  const loadBrain = useCallback(async () => {
    setBrainLoading(true);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/inventorygpt/context', { headers });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.brain) {
        setBrain(data.brain);
        const inv = data.preview?.inventory ?? [];
        const disp = data.preview?.dispatch ?? [];
        const web = data.preview?.website ?? [];
        setProducts(inv.length ? inv : disp.length ? disp : web);
      }
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const h = catalogAuthHeaders();
      
      // Fetch REGULAR products AND website products
      const [productsRes, categoriesRes, websiteProductsRes, websiteCategoriesRes] = await Promise.all([
        fetch(`${apiBase}/api/products?limit=100`, { headers: h }).catch(() => ({ ok: false })),
        fetch(`${apiBase}/api/products/categories/all`, { headers: h }).catch(() => ({ ok: false })),
        fetch(`${apiBase}/api/website/products?limit=100`, { headers: h }).catch(() => ({ ok: false })),
        fetch(`${apiBase}/api/website/products/categories`, { headers: h }).catch(() => ({ ok: false }))
      ]);
      
      // Merge products from both sources
      const allProducts = [];
      if (productsRes.ok) {
        const pdata = await productsRes.json().catch(() => ({}));
        const list = pdata?.data?.products ?? pdata?.products ?? pdata?.data ?? [];
        if (Array.isArray(list)) allProducts.push(...list.map(p => ({ ...p, source: 'regular' })));
      }
      if (websiteProductsRes.ok) {
        const wdata = await websiteProductsRes.json().catch(() => ({}));
        const wlist = wdata?.data?.products ?? wdata?.products ?? wdata?.data ?? [];
        if (Array.isArray(wlist)) allProducts.push(...wlist.map(p => ({ ...p, source: 'website' })));
      }
      if (allProducts.length) setProducts(allProducts);
      
      // Merge categories from both sources
      const allCategories = [];
      if (categoriesRes.ok) {
        const cdata = await categoriesRes.json().catch(() => ({}));
        const clist = cdata?.data ?? cdata?.categories ?? [];
        if (Array.isArray(clist)) {
          allCategories.push(...clist.map(c => ({
            name: c.name || c.display_name || c.category || '',
            count: c.count || c.product_count || 0,
            source: 'regular',
            ...c
          })));
        }
      }
      if (websiteCategoriesRes.ok) {
        const wcdata = await websiteCategoriesRes.json().catch(() => ({}));
        const wclist = wcdata?.data ?? wcdata?.categories ?? [];
        if (Array.isArray(wclist)) {
          allCategories.push(...wclist.map(c => ({
            name: c.name || c.slug || c.category || '',
            count: c.product_count || c.count || 0,
            source: 'website',
            ...c
          })));
        }
      }
      if (allCategories.length) setCategories(allCategories);
      console.log('Loaded categories:', allCategories.length, 'Products:', allProducts.length);
    } catch (error) {
      console.error('Failed to load brain context:', error);
    } finally {
      setBrainLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrain();
  }, [loadBrain]);

  const sendMessage = async (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed || isLoading || !activeSessionId || !sessions) return;

    const userMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now()
    };

    const priorMessages = messages;
    const sessionIdForRequest = activeSessionId;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...s.messages, userMessage],
              title: deriveTitle([...s.messages, userMessage]),
              updatedAt: Date.now()
            }
          : s
      )
    );
    setInput('');
    setIsLoading(true);

    if (isGreetingOnly(trimmed)) {
      appendAssistantWithTyping(sessionIdForRequest, insoraOppsGreeting(brain), {
        error: false,
        fromAgent: AGENT_NAME
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/inventorygpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          products,
          categories,
          authToken:
            typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '',
          conversationHistory: priorMessages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      });
      const data = await response.json().catch(() => ({}));

      if (data.success && data.answer) {
        appendAssistantWithTyping(sessionIdForRequest, String(data.answer).trim(), {
          error: false,
          fromAgent: AGENT_NAME,
          exportTsv: data.exportTsv || null,
          exportFilename: data.exportFilename || null,
          userPrompt: trimmed // Track user prompt for intent detection
        });
      } else {
        appendAssistantWithTyping(
          sessionIdForRequest,
          sanitizeForUser(data.fallback || data.error || 'Something went wrong.'),
          { error: true, userPrompt: trimmed }
        );
      }
    } catch {
      appendAssistantWithTyping(sessionIdForRequest, 'Connection error. Try again.', {
        error: true,
        userPrompt: trimmed
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const newChat = () => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}`;
    setSessions((prev) => [
      { id, title: 'Inventory Status', updatedAt: Date.now(), messages: [] },
      ...prev
    ]);
    setActiveSessionId(id);
    setInput('');
  };

  const selectSession = (id) => {
    if (id === activeSessionId) return;
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setStreamingMsg(null);
    setActiveSessionId(id);
    setInput('');
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== id);
    const next =
      filtered.length === 0
        ? [
            {
              id:
                typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `s-${Date.now()}`,
              title: 'Inventory Status',
              updatedAt: Date.now(),
              messages: []
            }
          ]
        : filtered;
    const newActive = id === activeSessionId ? next[0].id : activeSessionId;
    setSessions(next);
    setActiveSessionId(newActive);
  };

  if (!sessions) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#f8f9fc] text-slate-700">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_PURPLE }} aria-label="Loading" />
      </div>
    );
  }

  const orderedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const headerTitle = activeSession?.title || 'Inventory Status';

  const inventoryOk = Boolean(brain?.inventoryRowCount);
  const dispatchOk = Boolean(brain?.dispatchProductCount);
  const websiteOk = Boolean(brain?.websiteProductCount);
  const aiOk = Boolean(brain?.aiReachable);

  return (
    <div
      data-inventorygpt-dashboard
      className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-[#f8f9fc]"
    >
      <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-slate-200/80 bg-white">
        <div className="shrink-0 border-b border-slate-100 px-5 py-5">
          <InsoraLogo />
          <button
            type="button"
            onClick={newChat}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            style={{ backgroundColor: BRAND_PURPLE }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Recent chats
          </p>
          <ul className="mt-2 space-y-0.5">
            {orderedSessions.map((s) => {
              const active = s.id === activeSessionId;
              return (
                <li key={s.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => selectSession(s.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        selectSession(s.id);
                      }
                    }}
                    className={`group flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                      active ? 'bg-violet-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare
                      className={`h-4 w-4 shrink-0 ${active ? 'text-violet-600' : 'text-slate-400'}`}
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        active ? 'font-medium text-violet-700' : 'text-slate-700'
                      }`}
                    >
                      {s.title || 'Inventory Status'}
                    </span>
                    <button
                      type="button"
                      aria-label="Delete chat"
                      className="rounded p-1 text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                      onClick={(e) => deleteSession(s.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND_PURPLE }}
            >
              {userInitials(displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
              <p className="truncate text-xs text-slate-500">{displayRole}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f9fc]">
        <header className="shrink-0 border-b border-slate-200/80 bg-white">
          <div className={`${CHAT_COLUMN} flex flex-wrap items-center justify-between gap-3 py-4`}>
            <h1 className="text-lg font-semibold text-slate-900">{headerTitle}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label="Inventory" ok={inventoryOk} />
              <StatusPill label="Dispatch" ok={dispatchOk} />
              <StatusPill label="Website" ok={websiteOk} />
              <StatusPill label={aiOk ? 'AI Online' : 'AI Offline'} ok={aiOk} />
              {brainLoading ? (
                <span className="text-xs text-slate-400">Syncing…</span>
              ) : null}
              <button
                type="button"
                onClick={loadBrain}
                disabled={brainLoading}
                className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${brainLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={`${CHAT_COLUMN} space-y-8 py-8 ${
              messages.length === 0 ? 'flex min-h-[min(58vh,calc(100vh-260px))] flex-col justify-center' : ''
            }`}
          >
            {messages.length === 0 ? (
              <WelcomePanel brain={brain} onPickExample={(prompt) => sendMessage(prompt)} />
            ) : (
              <>
                {messages.map((message, index) => {
                  if (message.role === 'assistant') {
                    return (
                      <AssistantMessage
                        key={`${message.timestamp}-${index}`}
                        message={message}
                        isStreaming={Boolean(message.isStreaming)}
                        categories={categories}
                        products={products}
                        onCategoryClick={(cat) => {
                          sendMessage(`show me all products of ${cat}`);
                        }}
                      />
                    );
                  }
                  return (
                    <UserMessage
                      key={`${message.timestamp}-${index}`}
                      content={message.content}
                    />
                  );
                })}
                {isLoading && !streamingMsg ? <ThinkingIndicator /> : null}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-200/60 bg-[#f8f9fc] pb-5 pt-4">
          <div className={CHAT_COLUMN}>
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center rounded-2xl border border-slate-200/80 bg-white py-2 pl-4 pr-2 shadow-lg shadow-slate-200/40"
            >
              <button
                type="button"
                className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                aria-label="Attach"
                tabIndex={-1}
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your inventory..."
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-md transition hover:opacity-90 disabled:opacity-30"
                style={{ backgroundColor: BRAND_PURPLE }}
                aria-label="Send"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
            <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Powered by Insora Core Intelligence v2.1
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
