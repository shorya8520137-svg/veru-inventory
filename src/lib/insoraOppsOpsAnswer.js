const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

function isInternalErrorText(text) {
  return /unknown column|sql|syntax error|er_|errno|processed_by|select\s+.+\s+from/i.test(
    String(text || '')
  );
}

function userFacingError(label) {
  return `${label} is temporarily unavailable. Please try again in a moment.`;
}

function safeUserError(raw, label) {
  const msg = String(raw || '').trim();
  if (!msg || isInternalErrorText(msg)) return userFacingError(label);
  if (msg.length > 200) return userFacingError(label);
  return msg;
}

function extractWarehouse(q) {
  const m = String(q).match(/\b([A-Z]{2,6}_WH)\b/i);
  return m ? m[1].toUpperCase() : null;
}

function extractBarcode(q) {
  const m = String(q).match(/\b(\d{8,14})\b/);
  return m ? m[1] : null;
}

async function apiGet(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: data.message || data.error || `HTTP ${res.status}` };
  }
  return { data };
}

function pickInventoryRows(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.items)) return payload.data.items;
  if (Array.isArray(payload.data?.inventory)) return payload.data.inventory;
  return [];
}

function formatInr(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `₹${v.toLocaleString('en-IN')}`;
}

function pickItems(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.items)) return payload.data.items;
  if (Array.isArray(payload.data?.products)) return payload.data.products;
  if (Array.isArray(payload.data?.orders)) return payload.data.orders;
  if (Array.isArray(payload.data?.transfers)) return payload.data.transfers;
  if (Array.isArray(payload.data?.categories)) return payload.data.categories;
  return [];
}

export async function tryInsoraOppsDataAnswer(question, authToken, sessionId = null) {
  const q = String(question || '').trim();
  const lower = q.toLowerCase();
  if (!q) return null;

  // Extract context for memory tracking
  const contextData = {
    warehouse: extractWarehouse(q),
    barcode: extractBarcode(q),
    timestamp: new Date().toISOString()
  };

  // Detect category from question
  if (/categor/.test(lower)) {
    contextData.category = 'categories';
  }
  if (/product/.test(lower)) {
    contextData.product = 'products';
  }
  if (/damage/.test(lower)) {
    contextData.product = 'damaged_products';
  }

  if (!authToken && /stock|warehouse|timeline|website|barcode|price|category|transfer|order|dead/i.test(lower)) {
    return {
      answer:
        'Please sign in so I can read **live warehouse stock**, **timeline**, **transfers**, **orders**, and **website products** from your account.',
      context: contextData
    };
  }

  const wh = extractWarehouse(q);

  // --- WAREHOUSE STOCK ---
  if ((/stock|inventory/.test(lower) || /show.*warehouse/.test(lower)) && wh) {
    const inv = await apiGet(`/api/inventory?warehouse=${encodeURIComponent(wh)}&limit=25`, authToken);
    if (inv.error) return { answer: safeUserError(inv.error, `Stock at ${wh}`) };
    const rows = pickInventoryRows(inv.data);
    if (!rows.length) {
      return { answer: `No batch rows found for **${wh}** right now. Try another warehouse or refresh.` };
    }
    const lines = rows.slice(0, 15).map((r) => {
      const code = r.code || r.sku || r.barcode || '—';
      const name = r.product_name || r.name || code;
      const stock = r.stock ?? r.quantity ?? 0;
      return `- **${name}** (\`${code}\`) — **${stock}** units`;
    });
    const total = rows.reduce((s, r) => s + Number(r.stock ?? r.quantity ?? 0), 0);
    return {
      answer:
        `**${wh}** — ${rows.length} SKU row(s), **${total.toLocaleString('en-IN')}** units total:\n\n` +
        lines.join('\n') +
        (rows.length > 15 ? `\n\n_…and ${rows.length - 15} more._` : '')
    };
  }

  // --- BARCODE / PRODUCT LOOKUP ---
  const lookupBarcode = extractBarcode(q);
  if (lookupBarcode || /which.*categor|belong.*categor|product.*categor|this.*product/.test(lower)) {
    // If barcode provided, look up the product
    if (lookupBarcode) {
      // First try dispatch_product (products table)
      const prodRes = await apiGet(`/api/products?search=${encodeURIComponent(lookupBarcode)}&limit=5`, authToken);
      if (!prodRes.error && prodRes.data) {
        const prodList = prodRes.data?.data || prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
        const found = prodList.find(p => (p.barcode || p.sku || '').toString().includes(lookupBarcode));
        if (found) {
          const name = found.product_name || found.name || 'Unknown';
          const cat = found.category || found.category_name || found.category_display_name || 'Uncategorized';
          const price = found.price || found.selling_price || 0;
          const stock = found.total_stock || found.stock || 0;
          const desc = found.description || 'No description available';
          return {
            answer: `**${name}** (SKU: \`${lookupBarcode}\`)

` +
              `- **Category:** ${cat}\n` +
              `- **Price:** ${formatInr(price)}\n` +
              `- **Stock:** ${stock > 0 ? stock + ' units' : 'Out of Stock'}\n` +
              `- **Description:** ${desc}\n\n` +
              `Would you like to know anything else about this product? I can help with stock details, pricing, or warehouse info.`
          };
        }
      }
      // Fallback: try inventory table
      const invRes = await apiGet(`/api/inventory?search=${encodeURIComponent(lookupBarcode)}&limit=5`, authToken);
      if (!invRes.error && invRes.data) {
        const invList = pickInventoryRows(invRes.data);
        const found = invList.find(r => (r.code || r.barcode || '').toString().includes(lookupBarcode));
        if (found) {
          const name = found.product_name || found.name || lookupBarcode;
          const wh = found.warehouse || found.warehouse_code || 'Unknown';
          const stock = found.stock ?? 0;
          return {
            answer: `**${name}** (SKU: \`${lookupBarcode}\`)\n\n` +
              `- **Warehouse:** ${wh}\n` +
              `- **Stock:** ${stock} units\n\n` +
              `Would you like more details about this product?`
          };
        }
      }
      return { answer: `I couldn't find a product with barcode **${lookupBarcode}**. Please check the barcode and try again.` };
    }
    // If no barcode but category question about a product
    return null; // Fall through to AI
  }

  // --- CATEGORIES ---
  if (/categor(y|ies)/.test(lower)) {
    // Return empty answer - frontend will show visual category grid
    return {
      answer: `I found the categories for you. Here they are:`,
      triggerVisual: true
    };
  }

  // --- WEBSITE PRODUCTS ---
  if (/website/.test(lower) && /product/.test(lower)) {
    const web = await apiGet('/api/website/products', authToken);
    if (web.error) return { answer: safeUserError(web.error, 'Website catalog') };
    const list = Array.isArray(web.data?.data)
      ? web.data.data
      : Array.isArray(web.data?.products)
        ? web.data.products
        : Array.isArray(web.data)
          ? web.data
          : [];
    if (!list.length) return { answer: 'No website products returned from the API.' };
    const lines = list.slice(0, 12).map((p) => {
      const name = p.name || p.title || p.sku || 'Product';
      const price = p.price ?? p.mrp;
      return `- **${name}**${price != null ? ` — ${formatInr(price)}` : ''}`;
    });
    return {
      answer: `**Website products** (${list.length}):\n\n${lines.join('\n')}${
        list.length > 12 ? `\n\n_…and ${list.length - 12} more._` : ''
      }`
    };
  }

  // --- ORDERS ---
  if (/order/.test(lower)) {
    const statsRes = await apiGet('/api/website/orders/stats', authToken);
    if (!statsRes.error && statsRes.data) {
      const s = statsRes.data.data || statsRes.data;
      const total = s.total_orders ?? s.total ?? '—';
      const revenue = s.total_revenue ?? s.revenue ?? '—';
      const pending = s.pending_orders ?? s.pending ?? '—';
      return {
        answer:
          `**Website orders summary**\n` +
          `- Total orders: **${total}**\n` +
          `- Total revenue: **${typeof revenue === 'number' ? formatInr(revenue) : revenue}**\n` +
          `- Pending: **${pending}**`
      };
    }
    const ordersRes = await apiGet('/api/website/orders?limit=10', authToken);
    if (ordersRes.error) return { answer: safeUserError(ordersRes.error, 'Orders') };
    const list = pickItems(ordersRes.data);
    if (!list.length) return { answer: 'No website orders found.' };
    const lines = list.slice(0, 10).map((o) => {
      const id = o.order_id || o.id || '—';
      const status = o.status || '—';
      const total = o.total_amount ?? o.total ?? o.amount ?? '—';
      return `- Order **${id}** — ${status} — ${typeof total === 'number' ? formatInr(total) : total}`;
    });
    return {
      answer: `**Recent orders** (${list.length}):\n\n${lines.join('\n')}${
        list.length > 10 ? `\n\n_…and ${list.length - 10} more._` : ''
      }`
    };
  }

  // --- TRANSFERS ---
  if (/transfer/.test(lower) || /movement/.test(lower)) {
    const tr = await apiGet('/api/self-transfer?limit=15', authToken);
    if (tr.error) return { answer: safeUserError(tr.error, 'Transfers') };
    const list = pickItems(tr.data);
    if (!list.length) return { answer: 'No transfers found right now.' };
    const lines = list.slice(0, 10).map((t) => {
      const ref = t.transfer_reference || t.id || '—';
      const type = t.transfer_type || 'Transfer';
      const src = t.source_location || t.source || '—';
      const dst = t.destination_location || t.destination || '—';
      const status = t.status || '—';
      return `- **${ref}** (${type}) — ${src} → ${dst} — **${status}**`;
    });
    return {
      answer: `**Recent transfers** (${list.length}):\n\n${lines.join('\n')}${
        list.length > 10 ? `\n\n_…and ${list.length - 10} more._` : ''
      }`
    };
  }

  // --- DAMAGE PRODUCTS ---
  if (/damage|damaged/.test(lower) && /product/.test(lower)) {
    const dmg = await apiGet('/api/damage-recovery?limit=20', authToken);
    if (dmg.error) return { answer: safeUserError(dmg.error, 'Damage recovery') };
    const list = pickItems(dmg.data);
    if (!list.length) return { answer: 'No damaged products found in the system.' };
    const lines = list.slice(0, 12).map((d) => {
      const name = d.product_name || d.barcode || 'Product';
      const qty = d.quantity ?? d.qty ?? 0;
      const status = d.status || d.recovery_status || 'Pending';
      return `- **${name}** — ${qty} units damaged — **${status}**`;
    });
    return {
      answer: `**Damaged products** (${list.length}):\n\n${lines.join('\n')}${
        list.length > 12 ? `\n\n_…and ${list.length - 12} more._` : ''
      }`
    };
  }

  // --- WAREHOUSE INVENTORY (smart detection) ---
  if (/product.*of.*\w+_wh|\w+_wh.*product|inventory.*of.*\w+_wh|\w+_wh.*inventory/.test(lower)) {
    const whMatch = lower.match(/\b([A-Z]{2,6}_WH)\b/i);
    if (whMatch) {
      const wh = whMatch[1].toUpperCase();
      // Fall through to stock handler
    }
  }

  // --- DEAD STOCK ---
  if (/dead\s*stock/.test(lower) || /slow\s*moving/.test(lower) || /old\s*stock/.test(lower)) {
    const inv = await apiGet('/api/inventory?stockFilter=high-stock&sortBy=stock&sortOrder=desc&limit=20', authToken);
    if (inv.error) return { answer: safeUserError(inv.error, 'Dead stock analysis') };
    const rows = pickInventoryRows(inv.data);
    if (!rows.length) return { answer: 'No inventory data available for dead stock analysis.' };
    const candidates = rows.filter((r) => (r.stock ?? r.quantity ?? 0) > 50).slice(0, 10);
    if (!candidates.length) return { answer: 'No high-stock items flagged for dead stock review right now.' };
    const lines = candidates.map((r) => {
      const code = r.code || r.sku || r.barcode || '—';
      const name = r.product_name || r.name || code;
      const stock = r.stock ?? r.quantity ?? 0;
      const wh = r.warehouse || '—';
      return `- **${name}** (\`${code}\`) — **${stock}** units at **${wh}**`;
    });
    return {
      answer:
        `**Dead stock candidates** (${candidates.length}):\n\n${lines.join('\n')}\n\n` +
        `_These items have high stock levels. Review sales velocity to confirm dead stock status._`
    };
  }

  // --- BARCODE PRICE ---
  const barcode = extractBarcode(q);
  if (barcode && (/price|cost|mrp|barcode/.test(lower))) {
    const inv = await apiGet(`/api/inventory?search=${encodeURIComponent(barcode)}&limit=5`, authToken);
    if (inv.error) return { answer: safeUserError(inv.error, 'Price lookup') };
    const rows = pickInventoryRows(inv.data);
    const row = rows[0];
    if (!row) {
      return { answer: `No stock row found for barcode **${barcode}**. Check the code or warehouse filter.` };
    }
    const price = row.price ?? row.mrp ?? row.selling_price;
    return {
      answer:
        `**${row.product_name || row.name || barcode}** (\`${barcode}\`)\n` +
        `- Warehouse: **${row.warehouse || '—'}**\n` +
        `- Stock: **${row.stock ?? row.quantity ?? 0}**\n` +
        `- Price: **${price != null ? formatInr(price) : 'not in batch data'}**`
    };
  }

  // --- TIMELINE (with barcode) ---
  if (barcode && /timeline|ledger|movement|in and out/.test(lower)) {
    const whParam = wh ? `?warehouse=${encodeURIComponent(wh)}&limit=20` : '?limit=20';
    const tl = await apiGet(`/api/timeline/${encodeURIComponent(barcode)}${whParam}`, authToken);
    
    console.log('🔍 Timeline API Response:', {
      hasError: !!tl.error,
      hasData: !!tl.data,
      dataKeys: tl.data ? Object.keys(tl.data) : [],
      hasTimeline: Array.isArray(tl.data?.timeline),
      timelineLength: tl.data?.timeline?.length,
      hasDataArray: Array.isArray(tl.data?.data),
      dataArrayLength: tl.data?.data?.length
    });
    
    if (tl.error) {
      console.error('❌ Timeline API Error:', tl.error);
      return { answer: userFacingError('Timeline for this product') };
    }
    
    // FIX: Check data.timeline FIRST (correct response structure from API)
    const events = Array.isArray(tl.data?.timeline)
      ? tl.data.timeline
      : Array.isArray(tl.data?.data)
        ? tl.data.data
        : Array.isArray(tl.data)
          ? tl.data
          : [];
          
    console.log(' Extracted events:', events.length);
    
    if (!events.length) {
      return { answer: `No timeline events for **${barcode}**${wh ? ` at ${wh}` : ''}.` };
    }
    
    const lines = events.slice(0, 10).map((e) => {
      const type = e.type || e.movement_type || e.event_type || 'event';
      const qty = e.quantity ?? e.qty ?? e.delta ?? '—';
      const when = e.timestamp || e.created_at || e.date || e.event_time || '';
      const direction = e.direction === 'IN' ? '+' : e.direction === 'OUT' ? '-' : '';
      return `- **${type}** · ${direction}${qty}${when ? ` · ${new Date(when).toLocaleString()}` : ''}`;
    });
    
    return {
      answer: `**Timeline** for \`${barcode}\` (${events.length} events):\n\n${lines.join('\n')}${events.length > 10 ? `\n\n_…and ${events.length - 10} more._` : ''}`,
      context: contextData
    };
  }

  // --- INSIGHTS / HELP ---
  if (wh && /insight|help|look into|what can/.test(lower)) {
    return {
      answer:
        `Here are some insights you can look into for **${wh}**:\n\n` +
        `- **Warehouse stock** — \`stock at ${wh}\`\n` +
        `- **SKU timeline** — \`timeline for <barcode> at ${wh}\`\n` +
        `- **Website catalog** — \`show website products\`\n` +
        `- **Dead stock** — \`analyze dead stock at ${wh}\`\n` +
        `- **Transfers** — \`show transfers\`\n` +
        `- **Orders** — \`show orders\``
    };
  }

  return null;
}