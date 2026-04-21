'use client';
import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, defs, linearGradient, stop
} from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

const FILTERS = ['7D', '30D', '90D'];

const CHART_CONFIGS = [
  { key: 'stock',    label: 'Available Stock',    color: '#6366F1', bg: '#EEF2FF' },
  { key: 'opening',  label: 'Opening Stock',       color: '#10B981', bg: '#ECFDF5' },
  { key: 'movement', label: 'Stock Movement',      color: '#F59E0B', bg: '#FFFBEB' },
];

function StockChart({ config, products, selectedProduct, onProductChange, filter, onFilterChange }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProduct) return;
    fetchChartData();
  }, [selectedProduct, filter]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const days = filter === '7D' ? 7 : filter === '30D' ? 30 : 90;
      const dateFrom = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      const dateTo = new Date().toISOString().split('T')[0];

      const res = await fetch(
        `${API_BASE}/api/inventory?search=${encodeURIComponent(selectedProduct)}&dateFrom=${dateFrom}&dateTo=${dateTo}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (data.success) {
        const items = data.data?.inventory || data.data?.products || [];
        // Build time-series from inventory data grouped by date
        const grouped = {};
        items.forEach(item => {
          const date = item.updated_at
            ? new Date(item.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            : 'N/A';
          if (!grouped[date]) grouped[date] = { date, stock: 0, opening: 0, movement: 0 };
          grouped[date].stock    += Number(item.stock || item.qty_available || 0);
          grouped[date].opening  += Number(item.opening || item.qty_initial || 0);
          grouped[date].movement += Number(item.qty || 0);
        });

        const sorted = Object.values(grouped).slice(-days);
        // If no time-series data, show current snapshot as single point
        if (sorted.length === 0 && items.length > 0) {
          const total = items.reduce((s, i) => s + Number(i.stock || i.qty_available || 0), 0);
          setChartData([{ date: 'Now', stock: total, opening: total, movement: 0 }]);
        } else {
          setChartData(sorted.length > 0 ? sorted : generateFallback(days));
        }
      }
    } catch (e) {
      console.error(e);
      setChartData(generateFallback(filter === '7D' ? 7 : filter === '30D' ? 30 : 90));
    }
    setLoading(false);
  };

  const generateFallback = (days) =>
    Array.from({ length: Math.min(days, 10) }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      stock: 0, opening: 0, movement: 0,
    }));

  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '16px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{config.label}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Warehouse stock data</div>
        </div>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => onFilterChange(f)} style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              border: `1.5px solid ${filter === f ? config.color : '#E5E7EB'}`,
              background: filter === f ? config.color : '#fff',
              color: filter === f ? '#fff' : '#64748B',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Product dropdown */}
      <select
        value={selectedProduct}
        onChange={e => onProductChange(e.target.value)}
        style={{
          width: '100%', padding: '7px 12px', borderRadius: 10,
          border: '1.5px solid #E5E7EB', fontSize: 12, color: '#374151',
          background: '#F8FAFC', marginBottom: 12, outline: 'none', cursor: 'pointer',
        }}
      >
        <option value="">— Select Product —</option>
        {products.map(p => (
          <option key={p.barcode || p.p_id} value={p.product_name}>
            {p.product_name} {p.product_variant ? `(${p.product_variant})` : ''} — Stock: {p.total_stock ?? 0}
          </option>
        ))}
      </select>

      {/* 3D-style Area Chart */}
      <div style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}>
        {loading ? (
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${config.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={config.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, fontSize: 11, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={v => [v, config.label]}
              />
              <Area
                type="monotone"
                dataKey={config.key}
                stroke={config.color}
                strokeWidth={2.5}
                fill={`url(#grad-${config.key})`}
                dot={{ r: 3, fill: config.color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: config.color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom stat */}
      {chartData.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: config.color, display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#64748B' }}>
            Latest: <strong style={{ color: config.color }}>{chartData[chartData.length - 1]?.[config.key] ?? 0}</strong> units
          </span>
        </div>
      )}
    </div>
  );
}

export default function DeliveryCharts() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(['', '', '']);
  const [filters, setFilters] = useState(['30D', '30D', '30D']);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/products?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) setProducts(d.data?.products || []);
      })
      .catch(console.error);
  }, []);

  const setProduct = (i, val) => setSelectedProducts(prev => { const n = [...prev]; n[i] = val; return n; });
  const setFilter  = (i, val) => setFilters(prev => { const n = [...prev]; n[i] = val; return n; });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 32 }}>
      {CHART_CONFIGS.map((config, i) => (
        <StockChart
          key={config.key}
          config={config}
          products={products}
          selectedProduct={selectedProducts[i]}
          onProductChange={val => setProduct(i, val)}
          filter={filters[i]}
          onFilterChange={val => setFilter(i, val)}
        />
      ))}
    </div>
  );
}
