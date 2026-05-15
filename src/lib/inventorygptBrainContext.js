const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function pickRows(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.items)) return payload.data.items;
  if (Array.isArray(payload.data?.inventory)) return payload.data.inventory;
  if (Array.isArray(payload.data?.products)) return payload.data.products;
  if (Array.isArray(payload.inventory)) return payload.inventory;
  if (Array.isArray(payload.products)) return payload.products;
  return [];
}

function normalizeInventoryRow(row) {
  const code = row.code || row.sku || row.barcode || row.product_code || '';
  const stock = Number(row.stock ?? row.quantity ?? row.qty ?? 0);
  return {
    code,
    sku: code,
    product_name: row.product_name || row.name || row.title || code,
    warehouse: row.warehouse || row.warehouse_code || '',
    stock,
    price: row.price ?? row.mrp ?? null
  };
}

export async function buildInventoryGptBrainContext(authToken, opts = {}) {
  const limit = opts.productLimit ?? 80;
  const headers = authHeaders(authToken);
  const brain = {
    inventoryRowCount: 0,
    inventoryTotalUnits: 0,
    dispatchProductCount: 0,
    websiteProductCount: 0,
    warehouses: {},
    skuIndex: [],
    inventoryPreview: [],
    websiteProducts: [],
    aiReachable: false
  };

  try {
    const invRes = await fetch(`${API_BASE}/api/inventory?limit=${limit}`, { headers });
    if (invRes.ok) {
      const invData = await invRes.json();
      const rows = pickRows(invData).map(normalizeInventoryRow).filter((r) => r.code);
      brain.inventoryPreview = rows.slice(0, limit);
      brain.inventoryRowCount = rows.length;
      brain.inventoryTotalUnits = rows.reduce((sum, r) => sum + (r.stock || 0), 0);
      for (const r of rows) {
        if (r.warehouse) brain.warehouses[r.warehouse] = (brain.warehouses[r.warehouse] || 0) + 1;
        brain.skuIndex.push({ sku: r.code, name: r.product_name, warehouse: r.warehouse, stock: r.stock });
      }
    }
  } catch (e) {
    console.warn('[brain] inventory:', e?.message);
  }

  try {
    const webRes = await fetch(`${API_BASE}/api/website/products`, { headers });
    if (webRes.ok) {
      const webData = await webRes.json();
      const web = pickRows(webData);
      brain.websiteProducts = web.slice(0, 50);
      brain.websiteProductCount = web.length;
    }
  } catch (e) {
    console.warn('[brain] website:', e?.message);
  }

  const aiBase = (
    process.env.INVENTORYGPT_AI_BASE_URL ||
    process.env.NEXT_PUBLIC_INVENTORYGPT_AI_BASE_URL ||
    ''
  ).replace(/\/$/, '');
  if (aiBase) {
    try {
      const ping = await fetch(`${aiBase}/health`, { signal: AbortSignal.timeout(3000) });
      brain.aiReachable = ping.ok;
    } catch {
      brain.aiReachable = false;
    }
  }

  return brain;
}

export function brainContextForAiAgents(brain) {
  return {
    inventoryRowCount: brain.inventoryRowCount,
    inventoryTotalUnits: brain.inventoryTotalUnits,
    warehouses: Object.keys(brain.warehouses || {}),
    skuSample: (brain.skuIndex || []).slice(0, 40)
  };
}
