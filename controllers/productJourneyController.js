const db = require('../db/connection');

function asyncQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function normalizeType(type) {
  const map = {
    OPENING: 'OPENING', BULK_UPLOAD: 'BULK_UPLOAD',
    DISPATCH: 'DISPATCH', SALE: 'SALE',
    SELF_TRANSFER: 'SELF_TRANSFER',
    RETURN: 'RETURN', DAMAGE: 'DAMAGE',
    RECOVER: 'RECOVER', RECOVERY: 'RECOVER',
    PURCHASE: 'PURCHASE', MANUAL: 'MANUAL',
    ADJUSTMENT: 'ADJUSTMENT',
  };
  return map[type] || type;
}

function extractProductName(raw) {
  if (!raw) return '';
  let s = raw.trim();
  s = s.replace(/^(show|tell|get|give|fetch|display|find|search|check|view|see|muje|muja|mujhe|mujha|mujhko|mera|hum|hame|ham|apna|aap)\s+(me\s+|ko\s+)?(the\s+)?(complete\s+)?(full\s+)?(product\s+)?(journey|timeline|ledger|history|movement|stock|details?|info|data|trail|audit)\s+(of\s+|for\s+|on\s+|ka\s+|ke\s+|ki\s+)?/i, '');
  s = s.replace(/\s+(dikha|dikhao|deka|dekhao|batao|bta|show)\s*/gi, ' ');
  s = s.replace(/\s+(journey|timeline|ledger|history|movement|stock|details?|info|data|trail|audit)\s*$/i, '');
  s = s.replace(/\b(please|pls|now|bro|bhai|dost|friend|yaar|yar)\b/gi, '');
  s = s.replace(/\b(of|this|it|that|the|for|on|ka|ke|ki|ko|se|mein|me|par|aur|bhi|to|hi|jo|tha|the|ne|ho|hai)\b/gi, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

exports.getProductJourney = async (req, res) => {
  try {
    const { query, barcode, limit = 100 } = req.query;
    if (!query && !barcode) {
      return res.status(400).json({ success: false, message: 'Provide product name or barcode' });
    }

    let products = [];
    const rawTerm = query || barcode;
    const searchTerm = barcode ? barcode : extractProductName(rawTerm) || rawTerm;

    if (barcode) {
      const rows = await asyncQuery(
        `SELECT p_id as id, product_name, barcode, price, category_id FROM dispatch_product WHERE barcode = ? LIMIT 1`, [barcode]
      );
      if (rows.length) products = rows;
      else {
        const siRows = await asyncQuery(
          `SELECT DISTINCT barcode, product_name, price FROM store_inventory WHERE barcode = ? LIMIT 1`, [barcode]
        );
        products = siRows;
      }
    } else {
      const like = `%${searchTerm}%`;
      let dpRows = await asyncQuery(
        `SELECT p_id as id, product_name, barcode, price, category_id FROM dispatch_product WHERE product_name LIKE ? OR barcode LIKE ? LIMIT 5`, [like, like]
      );
      if (!dpRows.length) {
        dpRows = await asyncQuery(
          `SELECT p_id as id, product_name, barcode, price, category_id FROM dispatch_product WHERE product_name LIKE ? LIMIT 5`, [searchTerm]
        );
      }
      if (dpRows.length) {
        products = dpRows;
      } else {
        let siRows = await asyncQuery(
          `SELECT DISTINCT barcode, product_name, price FROM store_inventory WHERE product_name LIKE ? OR barcode LIKE ? LIMIT 5`, [like, like]
        );
        if (!siRows.length) siRows = await asyncQuery(
          `SELECT DISTINCT barcode, product_name, price FROM store_inventory WHERE product_name LIKE ? LIMIT 5`, [searchTerm]
        );
        if (!siRows.length) siRows = await asyncQuery(
          `SELECT DISTINCT barcode, product_name, 0 as price FROM stock_batches WHERE product_name LIKE ? OR barcode LIKE ? LIMIT 5`, [like, like]
        );
        if (!siRows.length) siRows = await asyncQuery(
          `SELECT DISTINCT barcode, product_name, 0 as price FROM stock_batches WHERE product_name LIKE ? LIMIT 5`, [searchTerm]
        );
        products = siRows;
      }
    }

    if (!products.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Pre-fetch location name maps
    const warehouses = await asyncQuery(`SELECT code, name, location, city FROM warehouses WHERE is_active = 1`);
    const stores = await asyncQuery(`SELECT store_code, store_name, city FROM stores WHERE is_active = 1`);
    const whMap = {};
    warehouses.forEach(w => whMap[w.code] = w);
    const storeMap = {};
    stores.forEach(s => storeMap[s.store_code] = s);

    function getLocationName(code, type) {
      if (type === 'store' || type === 'store_log' || type === 'store_timeline') {
        const s = storeMap[code];
        return s ? `${s.store_name} (${s.city || code})` : code;
      }
      const w = whMap[code];
      return w ? `${w.name} (${w.city || code})` : code;
    }

    const result = [];

    for (const product of products) {
      const bc = product.barcode;
      const pName = product.product_name;

      const warehouseEntries = await asyncQuery(
        `SELECT id, event_time as timestamp, movement_type, barcode, product_name,
         location_code as location, qty as quantity, direction, reference,
         'warehouse' as location_type, NULL as balance_after
         FROM inventory_ledger_base WHERE barcode = ? ORDER BY event_time ASC LIMIT ?`,
        [bc, parseInt(limit)]
      );

      const storeEntries = await asyncQuery(
        `SELECT id, created_at as timestamp, movement_type, product_barcode as barcode,
         product_name, store_code as location, quantity, direction, reference,
         'store' as location_type, balance_after
         FROM store_timeline WHERE product_barcode = ? ORDER BY created_at ASC LIMIT ?`,
        [bc, parseInt(limit)]
      );

      const saleEntries = await asyncQuery(
        `SELECT id, created_at as timestamp, 'SALE' as movement_type,
         barcode, product_name, NULL as location, quantity, 'OUT' as direction,
         reference_id as reference, 'store_log' as location_type, NULL as balance_after
         FROM store_inventory_logs WHERE barcode = ? AND movement_type = 'SALE'
         ORDER BY created_at ASC LIMIT ?`,
        [bc, parseInt(limit)]
      );

      let allEntries = [
        ...warehouseEntries.map(e => ({ ...e, movement_type: normalizeType(e.movement_type) })),
        ...storeEntries.map(e => ({ ...e, movement_type: normalizeType(e.movement_type) })),
        ...saleEntries.map(e => ({ ...e, movement_type: normalizeType(e.movement_type) })),
      ];

      allEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Enrich each entry with location name and extra details
      for (const entry of allEntries) {
        entry.location_name = getLocationName(entry.location, entry.location_type);
        entry.description = '';

        if (entry.movement_type === 'SELF_TRANSFER' && entry.reference) {
          const ref = entry.reference;
          const st = await asyncQuery(
            `SELECT source_location, destination_location, order_ref, awb_number, remarks
             FROM self_transfer WHERE transfer_reference = ? LIMIT 1`, [ref]
          );
          if (st.length) {
            entry.source = st[0].source_location;
            entry.destination = st[0].destination_location;
            entry.source_name = getLocationName(st[0].source_location, 'warehouse');
            entry.destination_name = getLocationName(st[0].destination_location, st[0].destination_location?.endsWith('_WH') ? 'warehouse' : 'store');
            entry.order_ref = st[0].order_ref;
            entry.awb = st[0].awb_number;
            entry.remarks = st[0].remarks;
            if (entry.direction === 'OUT') {
              entry.description = `Transferred from ${entry.source_name} to ${entry.destination_name}`;
            } else {
              entry.description = `Received via transfer from ${entry.source_name} to ${entry.destination_name}`;
            }
          }
        } else if (entry.movement_type === 'DISPATCH' && entry.reference) {
          const ref = entry.reference;
          const dp = await asyncQuery(
            `SELECT customer, awb, order_ref, logistics, customer_name
             FROM warehouse_dispatch WHERE CONCAT('DISPATCH_', id) LIKE ? OR awb = ? OR order_ref = ? LIMIT 1`,
            [`%${ref}%`, ref, ref]
          );
          if (dp.length) {
            entry.customer = dp[0].customer_name || dp[0].customer;
            entry.awb = dp[0].awb;
            entry.order_ref = dp[0].order_ref;
            entry.logistics = dp[0].logistics;
            entry.description = `Dispatched to customer ${entry.customer || 'unknown'}${entry.awb ? `, AWB: ${entry.awb}` : ''}`;
          }
        } else if (entry.movement_type === 'SALE' && entry.reference) {
          const bill = await asyncQuery(
            `SELECT customer_name, customer_phone, grand_total, payment_mode
             FROM bills WHERE invoice_number = ? LIMIT 1`, [entry.reference]
          );
          if (bill.length) {
            entry.customer = bill[0].customer_name;
            entry.customer_phone = bill[0].customer_phone;
            entry.amount = bill[0].grand_total;
            entry.payment_mode = bill[0].payment_mode;
            entry.description = `Sold to customer ${bill[0].customer_name}${bill[0].customer_phone ? ` (${bill[0].customer_phone})` : ''} — ₹${parseFloat(bill[0].grand_total || 0).toFixed(2)} via ${bill[0].payment_mode || 'cash'}`;
          }
        } else if (entry.movement_type === 'OPENING') {
          entry.description = `Opening stock setup`;
        } else if (entry.movement_type === 'BULK_UPLOAD') {
          entry.description = `Bulk upload / initial stock addition`;
        } else if (entry.movement_type === 'RETURN') {
          entry.description = `Returned stock`;
        } else if (entry.movement_type === 'DAMAGE') {
          entry.description = `Marked as damaged`;
        } else if (entry.movement_type === 'RECOVER') {
          entry.description = `Recovered from damage`;
        } else if (entry.movement_type === 'PURCHASE') {
          entry.description = `New purchase`;
        } else if (entry.movement_type === 'MANUAL') {
          entry.description = `Manual adjustment`;
        }
      }

      const currentStockWarehouse = await asyncQuery(
        `SELECT warehouse, SUM(qty_available) as stock FROM stock_batches WHERE barcode = ? AND status = 'active' GROUP BY warehouse`,
        [bc]
      );
      const currentStockStore = await asyncQuery(
        `SELECT store_code as warehouse, stock FROM store_inventory WHERE barcode = ?`,
        [bc]
      );

      const currentStock = [
        ...currentStockWarehouse.map(r => ({ ...r, location_name: getLocationName(r.warehouse, 'warehouse') })),
        ...currentStockStore.map(r => ({ ...r, location_name: getLocationName(r.warehouse, 'store') })),
      ];

      const summary = { total_in: 0, total_out: 0, by_type: {}, paired_transfer_qty: 0, paired_transfer_details: [] };
      for (const e of allEntries) {
        const qty = parseInt(e.quantity) || 0;
        if (e.direction === 'IN') summary.total_in += qty;
        else if (e.direction === 'OUT') summary.total_out += qty;
        const t = e.movement_type || 'OTHER';
        summary.by_type[t] = (summary.by_type[t] || 0) + (e.direction === 'OUT' ? -qty : qty);
      }

      // Pair SELF_TRANSFER OUT (warehouse) with OPENING IN (store) — same physical movement
      const transferOuts = allEntries.filter(
        e => e.movement_type === 'SELF_TRANSFER' && e.direction === 'OUT' && e.destination
      );
      for (const entry of allEntries) {
        if (entry.movement_type === 'OPENING' && entry.direction === 'IN') {
          const match = transferOuts.find(te =>
            te.destination === entry.location &&
            Math.abs(parseInt(te.quantity)) === Math.abs(parseInt(entry.quantity)) &&
            Math.abs(new Date(te.timestamp) - new Date(entry.timestamp)) < 120000
          );
          if (match) {
            entry.paired_transfer = true;
            entry.transfer_source = match.source_name;
            entry.description = `Opening stock (received from ${match.source_name})`;
            const pq = Math.abs(parseInt(entry.quantity));
            summary.paired_transfer_qty += pq;
            const exists = summary.paired_transfer_details.some(d =>
              d.source === match.source_name && d.destination === entry.location_name
            );
            if (!exists) {
              summary.paired_transfer_details.push({
                qty: pq,
                source: match.source_name,
                destination: entry.location_name,
              });
            }
          }
        }
      }

      // Paired transfers are internal movement, not stock entering/leaving the system
      summary.total_in -= summary.paired_transfer_qty;
      summary.total_out -= summary.paired_transfer_qty;

      result.push({
        product: { name: pName, barcode: bc, price: product.price },
        current_stock: {
          total: currentStock.reduce((s, r) => s + parseInt(r.stock || 0), 0),
          by_location: currentStock,
        },
        journey: allEntries,
        summary,
        total_events: allEntries.length,
      });
    }

    res.json({ success: true, data: result.length === 1 ? result[0] : result });

  } catch (error) {
    console.error('Product journey error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.compareProducts = async (req, res) => {
  try {
    const { product1, product2 } = req.query;
    if (!product1 || !product2) {
      return res.status(400).json({ success: false, message: 'Provide product1 and product2' });
    }

    const getJourneyForProduct = async (searchTerm) => {
      const like = `%${searchTerm}%`;
      let products = await asyncQuery(
        `SELECT p_id as id, product_name, barcode, price, category_id FROM dispatch_product WHERE product_name LIKE ? OR barcode LIKE ? LIMIT 3`, [like, like]
      );
      if (!products.length) products = await asyncQuery(
        `SELECT DISTINCT barcode, product_name, price FROM store_inventory WHERE product_name LIKE ? OR barcode LIKE ? LIMIT 3`, [like, like]
      );
      if (!products.length) return null;

      const product = products[0];
      const bc = product.barcode;

      const currentStockWarehouse = await asyncQuery(
        `SELECT warehouse, SUM(qty_available) as stock FROM stock_batches WHERE barcode = ? AND status = 'active' GROUP BY warehouse`, [bc]
      );
      const currentStockStore = await asyncQuery(
        `SELECT store_code as warehouse, stock FROM store_inventory WHERE barcode = ?`, [bc]
      );
      const movementCounts = await asyncQuery(
        `SELECT movement_type, COUNT(*) as count, SUM(qty) as total_qty FROM inventory_ledger_base WHERE barcode = ? GROUP BY movement_type`, [bc]
      );
      const storeMovementCounts = await asyncQuery(
        `SELECT movement_type, COUNT(*) as count, SUM(quantity) as total_qty FROM store_timeline WHERE product_barcode = ? GROUP BY movement_type`, [bc]
      );

      return {
        name: product.product_name, barcode: bc, price: product.price,
        current_stock: [...currentStockWarehouse, ...currentStockStore].reduce((s, r) => s + parseInt(r.stock || 0), 0),
        stock_by_location: [...currentStockWarehouse, ...currentStockStore],
        movements: [...movementCounts, ...storeMovementCounts],
      };
    };

    const p1 = await getJourneyForProduct(product1);
    const p2 = await getJourneyForProduct(product2);

    if (!p1) return res.status(404).json({ success: false, message: `Product "${product1}" not found` });
    if (!p2) return res.status(404).json({ success: false, message: `Product "${product2}" not found` });

    res.json({ success: true, comparison: [p1, p2] });

  } catch (error) {
    console.error('Product comparison error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
