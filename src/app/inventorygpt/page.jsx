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
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MarkdownBody from './MarkdownBody';

const STORAGE_KEY = 'inventorygpt_chat_sessions_v1';
const AGENT_NAME = 'InsoraOpps';
const BRAND_PURPLE = '#5850EC';
const CHAT_COLUMN = 'mx-auto w-full max-w-3xl min-w-0 px-6';
const READ_MORE_CHAR_LIMIT = 1600;
const TYPING_WORD_MS = 24;
const TYPING_CHAR_MS = 14;
const WELCOME_TYPE_MS = 18;

const QUICK_EXAMPLES = [
  { label: 'Analyze dead stock at BLR_WH', prompt: 'Analyze dead stock at BLR_WH' },
  { label: 'Price of barcode 296113196998', prompt: 'Price of barcode 296113196998' }
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

function AssistantMessage({ message, isStreaming = false, onHelpful }) {
  const [copied, setCopied] = useState(false);
  const [helpful, setHelpful] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fullContent = String(message.content ?? '');
  const isLong = fullContent.length > READ_MORE_CHAR_LIMIT && !isStreaming;
  const displayContent =
    isLong && !expanded ? `${fullContent.slice(0, READ_MORE_CHAR_LIMIT)}…` : fullContent;

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
      <div className="min-w-0 flex-1">
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
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${apiBase}/api/products?limit=100`, { headers: h }),
        fetch(`${apiBase}/api/products/categories/all`, { headers: h })
      ]);
      if (productsRes.ok) {
        const pdata = await productsRes.json();
        const list = pdata?.data?.products ?? pdata?.products ?? [];
        if (Array.isArray(list) && list.length) setProducts(list);
      }
      if (categoriesRes.ok) {
        const cdata = await categoriesRes.json();
        const list = Array.isArray(cdata?.data) ? cdata.data : cdata?.categories ?? [];
        if (list.length) setCategories(list);
      }
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
          exportFilename: data.exportFilename || null
        });
      } else {
        appendAssistantWithTyping(
          sessionIdForRequest,
          sanitizeForUser(data.fallback || data.error || 'Something went wrong.'),
          { error: true }
        );
      }
    } catch {
      appendAssistantWithTyping(sessionIdForRequest, 'Connection error. Try again.', {
        error: true
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
