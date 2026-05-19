const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  'https://api.giftgala.in';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function apiGet(path, token) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: authHeaders(token),
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { error: data?.message || data?.error || `HTTP ${response.status}` };
    }
    return { data };
  } catch (error) {
    return { error: error?.message || 'Network error' };
  }
}

function rowsFromPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data?.products)) return payload.data.products;
  if (Array.isArray(payload.data?.items)) return payload.data.items;
  if (Array.isArray(payload.data?.inventory)) return payload.data.inventory;
  if (Array.isArray(payload.data?.orders)) return payload.data.orders;
  if (Array.isArray(payload.data?.logs)) return payload.data.logs;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.orders)) return payload.orders;
  if (Array.isArray(payload.logs)) return payload.logs;
  if (payload.data && typeof payload.data === 'object') return [payload.data];
  return [];
}

function formatInr(value) {
  if (value == null || value === '') return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return `₹${numeric.toLocaleString('en-IN')}`;
  return String(value);
}

export function extractInventoryGptBarcode(text) {
  const raw = String(text || '');
  const m = raw.match(/\b(\d{4,16})\b/);
  if (!m) return null;
  const lower = raw.toLowerCase();
  const looksLikeProductQuestion =
    /sku|barcode|product|catalog|category|item|name|price|stock|journey|timeline|ledger|order|audit|description/.test(lower) ||
    raw.replace(/\D/g, '') === m[1];
  return looksLikeProductQuestion ? m[1] : null;
}

export function extractInventoryGptWarehouse(text) {
  const m = String(text || '').match(/\b([A-Z]{2,8}_WH)\b/i);
  return m ? m[1].toUpperCase() : null;
}

export function extractLastInventoryGptBarcode(history) {
  if (!Array.isArray(history)) return null;
  for (const message of [...history].reverse()) {
    const content = String(message?.content || '');
    const skuMatch = content.match(/SKU:\s*`?(\d{4,16})`?/i);
    if (skuMatch) return skuMatch[1];
    const anyBarcode = content.match(/\b(\d{8,16})\b/);
    if (anyBarcode) return anyBarcode[1];
  }
  return null;
}

export function detectInventoryGptIntent(question) {
  const lower = String(question || '').toLowerCase();
  const wantsExport = /excel|spreadsheet|csv|export|download|sheet|table/.test(lower);

  if (/journey|timeline|ledger|movement|in and out|history/.test(lower)) return { type: 'timeline', wantsExport };
  if (/audit|who changed|who update|who updated|activity|log/.test(lower)) return { type: 'audit', wantsExport };
  if (/order|sale|revenue|regional|region/.test(lower)) return { type: 'orders', wantsExport };
  if (/description|describe|details?|about this|about product/.test(lower)) return { type: 'product', field: 'description', wantsExport };
  if (/price|cost|mrp|rate|amount/.test(lower)) return { type: 'product', field: 'price', wantsExport };
  if (/stock|quantity|qty|available|availability|warehouse|store/.test(lower)) return { type: 'stock', wantsExport };
  if (/category|belong|catalog|sku|barcode|product|item|name/.test(lower)) return { type: 'product', field: 'summary', wantsExport };
  if (wantsExport) return { type: 'export_help', wantsExport };
  return null;
}

function normalizeProduct(product, source = '') {
  if (!product) return null;
  const sku = (product.barcode || product.sku || product.code || product.sku_id || '').toString();
  const stock = product.total_stock ?? product.stock ?? product.quantity ?? product.stock_quantity ?? product.qty_available ?? null;
  const price = product.price ?? product.selling_price ?? product.offer_price ?? product.final_price ?? product.mrp ?? null;
  return {
    ...product,
    source: product.source || source,
    sku,
    barcode: product.barcode || product.sku || sku,
    product_name: product.product_name || product.name || product.title || sku || 'Product',
    category:
      product.category ||
      product.category_display_name ||
      product.category_name ||
      product.category_slug ||
      product.product_category ||
      'Uncategorized',
    description:
      product.description ||
      product.short_description ||
      product.product_description ||
      'No description is available for this product yet.',
    price,
    cost_price: product.cost_price ?? product.unit_cost ?? null,
    stock,
    weight: product.weight ?? null,
    dimensions: product.dimensions ?? null
  };
}

function findProduct(list, barcode) {
  if (!Array.isArray(list) || !barcode) return null;
  const needle = barcode.toString().trim().toLowerCase();
  const rows = list.map((p) => normalizeProduct(p)).filter(Boolean);
  return (
    rows.find((p) => [p.barcode, p.sku, p.code, p.sku_id].some((v) => v?.toString().trim().toLowerCase() === needle)) ||
    rows.find((p) => [p.barcode, p.sku, p.code, p.sku_id].some((v) => v?.toString().trim().toLowerCase().includes(needle))) ||
    null
  );
}

export async function resolveInventoryGptProduct(barcode, token, localProducts = []) {
  const local = findProduct(localProducts, barcode);
  if (local) return local;

  const candidates = [];
  const code = encodeURIComponent(barcode);
  const endpoints = [
    { source: 'dispatch_product', path: `/api/products/search/${code}` },
    { source: 'dispatch_product', path: `/api/products?search=${code}&limit=10` },
    { source: 'website_products', path: `/api/website/products?search=${code}&limit=10` }
  ];

  for (const endpoint of endpoints) {
    const result = await apiGet(endpoint.path, token);
    if (!result.error) {
      candidates.push(...rowsFromPayload(result.data).map((row) => normalizeProduct(row, endpoint.source)));
    }
  }

  return findProduct(candidates, barcode);
}

export async function resolveInventoryGptStock(barcode, token, warehouse = null) {
  if (!barcode) return { rows: [], total: 0 };
  const params = new URLSearchParams({ search: barcode, limit: '100' });
  if (warehouse) params.set('warehouse', warehouse);

  const inv = await apiGet(`/api/inventory?${params.toString()}`, token);
  const rows = inv.error ? [] : rowsFromPayload(inv.data);
  const normalized = rows
    .filter((row) => String(row.code || row.barcode || row.sku || '').includes(barcode))
    .map((row) => ({
      sku: row.code || row.barcode || row.sku || barcode,
      product_name: row.product_name || row.product || row.name || barcode,
      warehouse: row.warehouse || row.warehouse_code || '—',
      stock: Number(row.stock ?? row.quantity ?? row.qty_available ?? 0),
      source: 'stock_batches/api_inventory'
    }));

  return {
    rows: normalized,
    total: normalized.reduce((sum, row) => sum + Number(row.stock || 0), 0),
    error: inv.error || null
  };
}

export async function resolveInventoryGptTimeline(barcode, token, warehouse = null) {
  if (!barcode) return { events: [], summary: null };
  const params = new URLSearchParams({ limit: '25' });
  if (warehouse) params.set('warehouse', warehouse);
  const timeline = await apiGet(`/api/timeline/${encodeURIComponent(barcode)}?${params.toString()}`, token);
  if (timeline.error) return { events: [], summary: null, error: timeline.error };
  const container = timeline.data?.data || timeline.data || {};
  const events = Array.isArray(container.timeline)
    ? container.timeline
    : Array.isArray(timeline.data?.timeline)
      ? timeline.data.timeline
      : rowsFromPayload(timeline.data);
  return { events, summary: container.summary || null };
}

export async function resolveInventoryGptOrders(token) {
  const stats = await apiGet('/api/website/orders/stats', token);
  const orders = await apiGet('/api/website/orders?limit=20', token);
  return {
    stats: stats.error ? null : stats.data?.data || stats.data,
    orders: orders.error ? [] : rowsFromPayload(orders.data),
    error: stats.error || orders.error || null
  };
}

export async function resolveInventoryGptAudit(token) {
  const audit = await apiGet('/api/audit-logs?limit=20&page=1', token);
  return {
    logs: audit.error ? [] : rowsFromPayload(audit.data),
    stats: audit.data?.stats || audit.data?.data?.stats || null,
    error: audit.error || null
  };
}

function catalogLabel(source) {
  return source === 'website_products' ? 'Website Product catalog' : 'Product catalog';
}

function productToTsv(product) {
  const header = ['sku', 'product_name', 'category', 'catalog', 'price', 'cost_price', 'stock', 'description'];
  const row = [
    product.sku || product.barcode || '',
    product.product_name || '',
    product.category || '',
    catalogLabel(product.source),
    product.price ?? '',
    product.cost_price ?? '',
    product.stock ?? '',
    String(product.description || '').replace(/\r?\n/g, ' ')
  ];
  return `${header.join('\t')}\n${row.join('\t')}`;
}

function rowsToTsv(rows, headers) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return [headers.join('\t')]
    .concat(safeRows.map((row) => headers.map((h) => String(row[h] ?? '').replace(/\r?\n/g, ' ')).join('\t')))
    .join('\n');
}

function buildProductAnswer(product, field, wantsExport) {
  const p = normalizeProduct(product);
  if (!p) return null;

  const title = `✨ **${p.product_name}** (SKU: \`${p.sku || p.barcode}\`)`;
  const formattedPrice = formatInr(p.price);
  const formattedCost = formatInr(p.cost_price);
  const lines = [title, ''];

  if (field === 'description') {
    lines.push(`📝 **Description:** ${p.description}`);
    lines.push(`🏷️ **Category:** ${p.category}`);
  } else if (field === 'price') {
    lines.push(`💰 **Price:** ${formattedPrice || 'Price not available'}`);
    if (formattedCost) lines.push(`🧾 **Cost Price:** ${formattedCost}`);
    lines.push(`🏷️ **Category:** ${p.category}`);
  } else {
    lines.push(`🏷️ **Category:** ${p.category}`);
    lines.push(`📚 **Catalog:** ${catalogLabel(p.source)}`);
    if (formattedPrice) lines.push(`💰 **Price:** ${formattedPrice}`);
    if (formattedCost) lines.push(`🧾 **Cost Price:** ${formattedCost}`);
    if (p.stock != null) lines.push(`📦 **Stock:** ${Number(p.stock) > 0 ? `${p.stock} units` : 'Out of Stock'}`);
    if (p.weight) lines.push(`⚖️ **Weight:** ${p.weight}`);
    if (p.dimensions) lines.push(`📐 **Dimensions:** ${p.dimensions}`);
  }

  lines.push('');
  lines.push('I can also show the **journey**, **warehouse stock**, **audit trail**, or create an **Excel-ready table** for this product.');

  return {
    answer: lines.join('\n'),
    exportTsv: wantsExport ? productToTsv(p) : null,
    exportFilename: wantsExport ? `inventorygpt-product-${p.sku || p.barcode}.tsv` : null
  };
}

function buildStockAnswer(product, stockResult, wantsExport) {
  const p = product ? normalizeProduct(product) : null;
  const rows = stockResult.rows || [];
  const lines = [`📦 **Stock Intelligence${p ? ` — ${p.product_name}` : ''}**`, ''];
  if (!rows.length) {
    lines.push('No live warehouse stock rows were found from the inventory API.');
    if (p?.stock != null) lines.push(`Catalog stock says: **${Number(p.stock) > 0 ? `${p.stock} units` : 'Out of Stock'}**`);
  } else {
    lines.push(`Total physical warehouse stock found: **${stockResult.total.toLocaleString('en-IN')} units**`);
    lines.push('');
    rows.slice(0, 12).forEach((row) => {
      lines.push(`- **${row.warehouse}** · ${row.stock} units · \`${row.sku}\``);
    });
  }
  lines.push('');
  lines.push('For deeper investigation, ask: **show product journey** or **show audit trail**.');

  return {
    answer: lines.join('\n'),
    exportTsv: wantsExport ? rowsToTsv(rows, ['sku', 'product_name', 'warehouse', 'stock', 'source']) : null,
    exportFilename: wantsExport ? 'inventorygpt-stock.tsv' : null
  };
}

function buildTimelineAnswer(barcode, product, timelineResult, wantsExport) {
  const p = product ? normalizeProduct(product) : null;
  const events = timelineResult.events || [];
  const lines = [`🧭 **Product Journey${p ? ` — ${p.product_name}` : ''}** (SKU: \`${barcode}\`)`, ''];

  if (!events.length) {
    lines.push('No timeline/ledger events were found for this SKU yet.');
    lines.push('I checked the product timeline endpoint backed by `inventory_ledger_base`.');
  } else {
    if (timelineResult.summary) {
      lines.push(`Current stock from timeline summary: **${timelineResult.summary.current_stock ?? '—'}**`);
      lines.push(`Total IN: **${timelineResult.summary.total_in ?? '—'}** · Total OUT: **${timelineResult.summary.total_out ?? '—'}**`);
      lines.push('');
    }
    events.slice(0, 12).forEach((event) => {
      const type = event.type || event.movement_type || event.event_type || 'EVENT';
      const qty = event.quantity ?? event.qty ?? '—';
      const direction = event.direction === 'IN' ? '+' : event.direction === 'OUT' ? '-' : '';
      const when = event.timestamp || event.event_time || event.created_at || '';
      const where = event.warehouse || event.location_code || event.store_code || '';
      lines.push(`- **${type}** · ${direction}${qty}${where ? ` · ${where}` : ''}${when ? ` · ${new Date(when).toLocaleString('en-IN')}` : ''}`);
    });
  }

  lines.push('');
  lines.push('This is the operational truth trail. If needed, I can also compare it with stock batches and audit logs.');

  const exportRows = events.map((event) => ({
    time: event.timestamp || event.event_time || event.created_at || '',
    type: event.type || event.movement_type || event.event_type || '',
    direction: event.direction || '',
    quantity: event.quantity ?? event.qty ?? '',
    location: event.warehouse || event.location_code || event.store_code || '',
    reference: event.reference || ''
  }));

  return {
    answer: lines.join('\n'),
    exportTsv: wantsExport ? rowsToTsv(exportRows, ['time', 'type', 'direction', 'quantity', 'location', 'reference']) : null,
    exportFilename: wantsExport ? `inventorygpt-journey-${barcode}.tsv` : null
  };
}

function buildOrdersAnswer(orderResult, wantsExport) {
  const orders = orderResult.orders || [];
  const stats = orderResult.stats || {};
  const lines = ['🧾 **Order Intelligence**', ''];
  lines.push(`Total orders: **${stats.total_orders ?? stats.total ?? orders.length ?? 0}**`);
  if (stats.total_revenue != null || stats.revenue != null) lines.push(`Revenue: **${formatInr(stats.total_revenue ?? stats.revenue)}**`);
  if (stats.pending_orders != null || stats.pending != null) lines.push(`Pending: **${stats.pending_orders ?? stats.pending}**`);
  lines.push('');

  if (!orders.length) {
    lines.push('No website order rows were returned yet.');
  } else {
    orders.slice(0, 10).forEach((order) => {
      lines.push(`- **${order.order_number || order.order_id || order.id || 'Order'}** · ${order.status || '—'} · ${formatInr(order.total_amount ?? order.total ?? order.amount) || '—'}`);
    });
  }

  lines.push('');
  lines.push('Next step: regional demand can be calculated from shipping address + order items when order data is available.');

  const exportRows = orders.map((order) => ({
    order: order.order_number || order.order_id || order.id || '',
    status: order.status || '',
    amount: order.total_amount ?? order.total ?? order.amount ?? '',
    date: order.order_date || order.created_at || ''
  }));

  return {
    answer: lines.join('\n'),
    exportTsv: wantsExport ? rowsToTsv(exportRows, ['order', 'status', 'amount', 'date']) : null,
    exportFilename: wantsExport ? 'inventorygpt-orders.tsv' : null
  };
}

function buildAuditAnswer(auditResult, wantsExport) {
  const logs = auditResult.logs || [];
  const lines = ['🛡️ **Audit Intelligence**', ''];
  if (!logs.length) {
    lines.push('No audit rows were returned for this request.');
  } else {
    logs.slice(0, 10).forEach((log) => {
      lines.push(`- **${log.action || log.event_type || 'EVENT'}** · ${log.resource_type || log.resource || 'resource'} · ${log.status || '—'} · ${log.user_name || log.joined_user_name || 'system'}`);
    });
  }
  lines.push('');
  lines.push('Audit logs help prove who changed what, when, and whether it succeeded.');

  const exportRows = logs.map((log) => ({
    time: log.created_at || '',
    action: log.action || log.event_type || '',
    resource: log.resource_type || log.resource || '',
    status: log.status || '',
    user: log.user_name || log.joined_user_name || log.user_email || ''
  }));

  return {
    answer: lines.join('\n'),
    exportTsv: wantsExport ? rowsToTsv(exportRows, ['time', 'action', 'resource', 'status', 'user']) : null,
    exportFilename: wantsExport ? 'inventorygpt-audit.tsv' : null
  };
}

export async function tryInventoryGptDeterministicAnswer({
  question,
  authToken,
  localProducts = [],
  conversationHistory = []
}) {
  const q = String(question || '').trim();
  if (!q) return null;

  const intent = detectInventoryGptIntent(q);
  if (!intent) return null;

  const directBarcode = extractInventoryGptBarcode(q);
  const historyBarcode = !directBarcode ? extractLastInventoryGptBarcode(conversationHistory) : null;
  const barcode = directBarcode || historyBarcode;
  const warehouse = extractInventoryGptWarehouse(q);

  if (intent.type === 'export_help') {
    return {
      answer:
        '📊 I can prepare **Excel-ready TSV tables** from live operational data now. PDF/Word/graph exports are part of the next premium export phase. Ask like: `export stock for SKU 12345` or `make excel for product journey 12345`.',
      render: 'text'
    };
  }

  if (['product', 'stock', 'timeline'].includes(intent.type) && !barcode) {
    return {
      answer:
        'Please share the SKU/barcode so I can read live catalog, stock, and timeline data accurately. I will not guess operational data.',
      render: 'text'
    };
  }

  const product = barcode ? await resolveInventoryGptProduct(barcode, authToken, localProducts) : null;

  if (intent.type === 'product') {
    if (!product) {
      return {
        answer:
          `I checked both catalogs for SKU \`${barcode}\`, but I could not find this product.\n\n` +
          '- Checked: **Product catalog** (dispatch products)\n' +
          '- Checked: **Website Product catalog**\n\n' +
          'Please confirm the SKU/barcode, or ask me to show categories/products separately.',
        render: 'text'
      };
    }
    return { ...buildProductAnswer(product, intent.field, intent.wantsExport), render: 'text' };
  }

  if (intent.type === 'stock') {
    const stock = await resolveInventoryGptStock(barcode, authToken, warehouse);
    return { ...buildStockAnswer(product, stock, intent.wantsExport), render: 'text' };
  }

  if (intent.type === 'timeline') {
    const timeline = await resolveInventoryGptTimeline(barcode, authToken, warehouse);
    return { ...buildTimelineAnswer(barcode, product, timeline, intent.wantsExport), render: 'text' };
  }

  if (intent.type === 'orders') {
    const orders = await resolveInventoryGptOrders(authToken);
    return { ...buildOrdersAnswer(orders, intent.wantsExport), render: 'text' };
  }

  if (intent.type === 'audit') {
    const audit = await resolveInventoryGptAudit(authToken);
    return { ...buildAuditAnswer(audit, intent.wantsExport), render: 'text' };
  }

  return null;
}
