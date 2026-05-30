import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || 'https://api.giftgala.in';

async function apiGet(path, token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const res = await fetch(url, { headers, next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') || searchParams.get('token') || '';

    if (!code) {
      return NextResponse.json({ success: false, error: 'Warehouse code required' }, { status: 400 });
    }

    // Step 1: Get all warehouses (Express returns all regardless of ?code=)
    const whResult = await apiGet('/api/warehouse-management/warehouses', token);
    const warehouses = Array.isArray(whResult?.data)
      ? whResult.data
      : Array.isArray(whResult?.warehouses)
        ? whResult.warehouses
        : [];

    // Broader matching: exact code, warehouse_code, id, or case-insensitive name/code match
    const normalizedSearch = code.toLowerCase().replace(/[\s-]+/g, '');
    const warehouse = warehouses.find(w => {
      if (w.warehouse_code === code || w.code === code || w.id?.toString() === code) return true;
      const name = (w.warehouse_name || w.name || '').toLowerCase().replace(/[\s-]+/g, '');
      const wcode = (w.warehouse_code || w.code || '').toLowerCase().replace(/[\s-]+/g, '');
      return name.includes(normalizedSearch) || wcode.includes(normalizedSearch) || name === normalizedSearch;
    });

    const realCode = warehouse?.warehouse_code || warehouse?.code || code;

    // Step 2: Fetch metrics, dispatch, inventory with the real warehouse code
    const [metricsResult, dispatchResult, stockResult] = await Promise.all([
      apiGet('/api/inventorygpt/warehouse-metrics', token),
      apiGet(`/api/dispatch?warehouse=${encodeURIComponent(realCode)}&limit=100`, token),
      apiGet(`/api/inventory?warehouse=${encodeURIComponent(realCode)}&limit=500`, token),
    ]);

    const allMetrics = Array.isArray(metricsResult?.data) ? metricsResult.data : [];
    const metrics = allMetrics.find(m => {
      if (m.warehouse_code === realCode || m.warehouse_id === realCode || m.warehouse_name === realCode) return true;
      const name = (m.warehouse_name || '').toLowerCase().replace(/[\s-]+/g, '');
      return name.includes(normalizedSearch);
    });

    const dispatches = Array.isArray(dispatchResult?.data?.dispatches)
      ? dispatchResult.data.dispatches
      : Array.isArray(dispatchResult?.data)
        ? dispatchResult.data
        : [];

    const inventory = Array.isArray(stockResult?.data?.items)
      ? stockResult.data.items
      : Array.isArray(stockResult?.data)
        ? stockResult.data
        : [];

    // Compute warehouse health score
    const healthScore = metrics?.health_score ?? 95;
    const storageUtil = metrics?.storage_utilization_pct ?? 0;
    const deadStockRatio = metrics?.dead_stock_ratio ?? 0;
    const fulfillmentSpeed = metrics?.fulfillment_speed ?? 0;
    const totalSkus = metrics?.total_skus ?? inventory.length;
    const totalStock = metrics?.total_stock ?? inventory.reduce((s, i) => s + (Number(i.qty_available) || Number(i.stock) || Number(i.quantity) || 0), 0);
    const capacity = warehouse?.capacity ?? metrics?.capacity ?? 0;
    const usedCapacity = totalStock;
    const availableCapacity = Math.max(0, capacity - usedCapacity);
    const utilizationPct = capacity > 0 ? Math.round((usedCapacity / capacity) * 100) : 0;

    // Status badge
    const status = healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : healthScore >= 50 ? 'Warning' : 'Critical';

    // Most dispatched products
    const dispatchCounts = {};
    for (const d of dispatches) {
      const key = d.barcode || d.product_name || 'unknown';
      if (!dispatchCounts[key]) dispatchCounts[key] = { qty: 0, revenue: 0, name: d.product_name || d.barcode || 'Unknown' };
      dispatchCounts[key].qty += Number(d.qty) || 1;
      dispatchCounts[key].revenue += Number(d.invoice_amount) || 0;
    }
    const mostDispatched = Object.entries(dispatchCounts)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 10)
      .map(([sku, d]) => ({ sku, product_name: d.name, dispatch_qty: d.qty, revenue: d.revenue }));

    // Low stock analysis
    const lowStock = inventory
      .filter(i => (Number(i.qty_available) || Number(i.stock) || Number(i.quantity) || 0) < 10)
      .slice(0, 20)
      .map(i => ({
        sku: i.barcode || i.sku || i.product_id || '',
        product_name: i.product_name || i.name || 'Unknown',
        current_stock: Number(i.qty_available) || Number(i.stock) || Number(i.quantity) || 0,
        days_remaining: 0,
        risk_level: (Number(i.qty_available) || Number(i.stock) || Number(i.quantity) || 0) <= 3 ? 'Critical' : 'High',
      }));

    // High stock analysis
    const highStock = inventory
      .filter(i => (Number(i.qty_available) || Number(i.stock) || Number(i.quantity) || 0) > 100)
      .slice(0, 20)
      .map(i => ({
        sku: i.barcode || i.sku || i.product_id || '',
        product_name: i.product_name || i.name || 'Unknown',
        current_stock: Number(i.qty_available) || Number(i.stock) || Number(i.quantity) || 0,
        avg_monthly_sales: 0,
        excess_inventory: Math.max(0, (Number(i.qty_available) || Number(i.stock) || Number(i.quantity) || 0) - 50),
      }));

    // Dead stock (no dispatches for this product)
    const dispatchedSkus = new Set(dispatches.map(d => d.barcode));
    const deadStock = inventory
      .filter(i => !dispatchedSkus.has(i.barcode) && (Number(i.qty_available) || Number(i.stock) || Number(i.quantity) || 0) > 0)
      .slice(0, 20)
      .map(i => ({
        sku: i.barcode || i.sku || i.product_id || '',
        product_name: i.product_name || i.name || 'Unknown',
        days_since_last_sale: 90,
        locked_value: ((Number(i.qty_available) || Number(i.stock) || Number(i.quantity) || 0) * (Number(i.price) || 0)),
      }));

    // AI summary
    const lowStockCount = lowStock.length;
    const deadStockValue = deadStock.reduce((s, d) => s + d.locked_value, 0);
    const transferOpportunity = Math.round(deadStockValue * 0.44);
    const highUtilization = utilizationPct > 90;

    const aiSummary = [
      utilizationPct > 0 && `Operating at **${utilizationPct}% capacity**${highUtilization ? ' — near full utilisation' : ''}.`,
      lowStockCount > 0 && `**${lowStockCount} SKUs** at low stock risk.`,
      deadStockValue > 0 && `**₹${deadStockValue.toLocaleString('en-IN')}** worth of dead stock detected.`,
      transferOpportunity > 0 && `**₹${transferOpportunity.toLocaleString('en-IN')}** potential transfer opportunity.`,
      `Health score: **${healthScore}/100** (${status}).`,
    ].filter(Boolean).join(' ');

    const response = {
      success: true,
      data: {
        warehouse: {
          code: warehouse?.code || warehouse?.warehouse_code || code,
          name: warehouse?.name || warehouse?.warehouse_name || metrics?.warehouse_name || code,
          address: warehouse?.address || '',
          location: warehouse?.location || '',
          city: warehouse?.city || metrics?.city || '',
          state: warehouse?.state || metrics?.state || '',
          phone: warehouse?.phone || '',
          email: warehouse?.email || '',
          manager_name: warehouse?.manager_name || warehouse?.manager || '',
          capacity: Number(capacity),
          used_capacity: Number(usedCapacity),
          available_capacity: Number(availableCapacity),
          utilization_pct: utilizationPct,
        },
        health: {
          score: healthScore,
          status,
          storage_utilization: utilizationPct,
          dead_stock_ratio: deadStockRatio,
          fulfillment_speed: fulfillmentSpeed,
          total_skus: totalSkus,
          total_stock: totalStock,
          total_dispatches: dispatches.length,
          pending_orders: dispatches.filter(d => d.status === 'pending' || d.status === 'processing').length,
          pending_dispatches: dispatches.filter(d => !d.status || d.status === 'pending').length,
          avg_dispatch_time: fulfillmentSpeed > 0 ? `${fulfillmentSpeed} days` : 'N/A',
          inventory_accuracy_pct: Math.max(85, Math.min(100, 100 - deadStockRatio * 0.3)),
          transfer_recommendations: transferOpportunity > 0 ? `${Math.ceil(deadStockValue / 50000)} potential transfers` : 'None',
        },
        stock_analysis: {
          most_dispatched: mostDispatched,
          low_stock: lowStock,
          high_stock: highStock,
          dead_stock: deadStock,
          ai_recommendations: {
            low_stock: lowStock.length > 0 ? `Transfer from overstocked warehouses to replenish ${lowStock.slice(0, 3).map(s => s.product_name).join(', ')}.` : 'No low stock concerns.',
            high_stock: highStock.length > 0 ? `Consider redistribution or promotions for ${highStock.length} overstocked SKUs.` : 'No overstock concerns.',
            dead_stock: deadStock.length > 0 ? `Transfer, discount, bundle, or liquidate ${deadStock.length} dead stock items worth ₹${deadStockValue.toLocaleString('en-IN')}.` : 'No dead stock detected.',
          },
        },
        ai_summary: aiSummary,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Warehouse intelligence error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
