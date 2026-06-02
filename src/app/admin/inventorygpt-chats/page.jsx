"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export default function InventoryGptChatMonitor() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("");
  const [intentFilter, setIntentFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filter) params.set("session_id", filter);
      if (intentFilter) params.set("intent_type", intentFilter);

      const res = await fetch(`/api/inventorygpt/chat-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
        setTotal(data.total || 0);
      } else {
        setError(data.error || "Failed to fetch logs");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, intentFilter]);

  useEffect(() => {
    fetchLogs();
    const interval = autoRefresh ? setInterval(fetchLogs, 10000) : null;
    return () => clearInterval(interval);
  }, [fetchLogs, autoRefresh]);

  const intentTypes = [...new Set(logs.map(l => l.intent_type).filter(Boolean))];

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  if (!user) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-500">Please log in to view chat logs.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">InventoryGPT Chat Monitor</h1>
            <p className="text-sm text-gray-500 mt-1">{total} total conversations logged</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
              Auto-refresh (10s)
            </label>
            <button onClick={fetchLogs} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              Refresh
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Filter by session ID..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <select value={intentFilter} onChange={e => setIntentFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All intents</option>
            {intentTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No chat logs found yet.</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.model === 'error' ? 'bg-red-500' : log.model === 'deterministic-resolver' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <span className="text-xs text-gray-400 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                    <span className="text-sm text-gray-600 truncate max-w-md">{log.user_question}</span>
                    {log.intent_type && (
                      <span className="px-2 py-0.5 bg-gray-100 text-xs rounded-full text-gray-600 flex-shrink-0">{log.intent_type}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">{log.model}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {expandedId === log.id && (
                  <div className="px-4 pb-4 border-t">
                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-500 mb-3">
                      <div><span className="font-medium">Session:</span> {log.session_id}</div>
                      <div><span className="font-medium">Model:</span> {log.model || 'N/A'}</div>
                      <div><span className="font-medium">Intent:</span> {log.intent_type || 'N/A'}</div>
                      <div><span className="font-medium">Render:</span> {log.render_type || 'N/A'}</div>
                      <div><span className="font-medium">User:</span> {log.user_email || 'anonymous'}</div>
                      <div><span className="font-medium">Time:</span> {log.response_time_ms ? `${log.response_time_ms}ms` : 'N/A'}</div>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">User Question:</p>
                      <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">{log.user_question}</pre>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Bot Response:</p>
                      <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">{log.bot_response}</pre>
                    </div>
                    <div className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
