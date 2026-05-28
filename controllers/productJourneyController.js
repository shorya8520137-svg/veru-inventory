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
  s = s.replace(/^(show|tell|get|give|fetch|display|find|search|check|view|see)\s+(me\s+)?(the\s+)?(complete\s+)?(full\s+)?(product\s+)?(journey|timeline|ledger|history|movement|stock|details?|info|data|trail|audit)\s+(of\s+|for\s+|on\s+)?/i, '');
  s = s.replace(/\s+(journey|timeline|ledger|history|movement|stock|details?|info|data|trail|audit)\s*$/i, '');
  s = s.replace(/\b(please|pls|now|bro|bhai|dost|friend)\b/gi, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

exports.getProductJourney = async (req, res) => {
  try {
    const { query, barcode, limit = 100 } = req.query;
    if (!query && !barcode) {
      return res.status(400).json({ success: false, message: 'Provide query (product name) or barcode' });
    }

    let products = [];
    const rawTerm = query || barcode;
    const searchTerm = barcode ? barcode : extractProductName(rawTerm) || rawTerm;

    if (barcode) {
      const rows = await asyncQuery(
        `SELECT p_id as id, product_name, barcode, price, category_id FROM dispatch_product WHERE barcode = ? LIMIT 1`,
        [barcode]
      );
      if (rows.length) {
        products = rows;
      } else {
        const siRows = await asyncQuery(
          `SELECT DISTINCT barcode, product_name, price FROM store_inventory WHERE barcode = ? LIMIT 1`,
          [barcode]
        );
        if (siRows.length) {
          products = siRows;
        }
      }
    } else {
      const like = `%${searchTerm}%`;
      let dpRows = await asyncQuery(
        `SELECT p_id as id, product_name, barcode, price, category_id FROM dispatch_product WHERE product_name LIKE ? OR barcode LIKE ? LIMIT 5`,
        [like, like]
      );
      if (!dpRows.length) {
        dpRows = await asyncQuery(
          `SELECT p_id as id, product_name, barcode, price, category_id FROM dispatch_product WHERE product_name LIKE ? LIMIT 5`,
          [searchTerm]
        );
      }
      if (dpRows.length) {
        products = dpRows;
      } else {
        let siRows = await asyncQuery(
          `SELECT DISTINCT barcode, product_name, price FROM store_inventory WHERE product_name LIKE ? OR barcode LIKE ? LIMIT 5`,
          [like, like]
        );
        if (!siRows.length) {
          siRows = await asyncQuery(
            `SELECT DISTINCT barcode, product_name, price FROM store_inventory WHERE product_name LIKE ? LIMIT 5`,
            [searchTerm]
          );
        }
        if (!siRows.length) {
          siRows = await asyncQuery(
            `SELECT DISTINCT barcode, product_name, 0 as price FROM stock_batches WHERE product_name LIKE ? OR barcode LIKE ? LIMIT 5`,
            [like, like]
          );
        }
        if (!siRows.length) {
          siRows = await asyncQuery(
            `SELECT DISTINCT barcode, product_name, 0 as price FROM stock_batches WHERE product_name LIKE ? LIMIT 5`,
            [searchTerm]
          );
        }
        products = siRows;
      }
    }

    if (!products.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const result = [];

    for (const product of products) {
      const bc = product.barcode;
      const pName = product.product_name;

      const warehouseEntries = await asyncQuery(
        `SELECT
          id, event_time as timestamp, movement_type, barcode, product_name,
          location_code as location, qty as quantity, direction, reference,
          'warehouse' as location_type, NULL as balance_after
        FROM inventory_ledger_base
        WHERE barcode = ?
        ORDER BY event_time ASC
        LIMIT ?`,
        [bc, parseInt(limit)]
      );

      const storeEntries = await asyncQuery(
        `SELECT
          id, created_at as timestamp, movement_type, product_barcode as barcode,
          product_name, store_code as location, quantity, direction, reference,
          'store' as location_type, balance_after
        FROM store_timeline
        WHERE product_barcode = ?
        ORDER BY created_at ASC
        LIMIT ?`,
        [bc, parseInt(limit)]
      );

      const saleEntries = await asyncQuery(
        `SELECT
          id, created_at as timestamp, 'SALE' as movement_type,
          barcode, product_name, NULL as location, quantity, 'OUT' as direction,
          reference_id as reference, 'store_log' as location_type, NULL as balance_after
        FROM store_inventory_logs
        WHERE barcode = ? AND movement_type = 'SALE'
        ORDER BY created_at ASC
        LIMIT ?`,
        [bc, parseInt(limit)]
      );

      const allEntries = [
        ...warehouseEntries.map(e => ({ ...e, movement_type: normalizeType(e.movement_type) })),
        ...storeEntries.map(e => ({ ...e, movement_type: normalizeType(e.movement_type) })),
        ...saleEntries.map(e => ({ ...e, movement_type: normalizeType(e.movement_type) })),
      ];

      allEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const currentStockWarehouse = await asyncQuery(
        `SELECT warehouse, SUM(qty_available) as stock
        FROM stock_batches WHERE barcode = ? AND status = 'active'
        GROUP BY warehouse`,
        [bc]
      );

      const currentStockStore = await asyncQuery(
        `SELECT store_code as warehouse, stock
        FROM store_inventory WHERE barcode = ?`,
        [bc]
      );

      const currentStock = [...currentStockWarehouse, ...currentStockStore];

      const summary = { total_in: 0, total_out: 0, by_type: {} };
      for (const e of allEntries) {
        const qty = parseInt(e.quantity) || 0;
        if (e.direction === 'IN') summary.total_in += qty;
        else if (e.direction === 'OUT') summary.total_out += qty;
        const t = e.movement_type || 'OTHER';
        summary.by_type[t] = (summary.by_type[t] || 0) + (e.direction === 'OUT' ? -qty : qty);
      }

      result.push({
        product: {
          name: pName,
          barcode: bc,
          price: product.price,
        },
        current_stock: {
          total: currentStock.reduce((s, r) => s + parseInt(r.stock || 0), 0),
          by_location: currentStock,
        },
        journey: allEntries,
        summary,
        total_events: allEntries.length,
      });
    }

    res.json({
      success: true,
      data: result.length === 1 ? result[0] : result,
    });

  } catch (error) {
    console.error('Product journey error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.compareProducts = async (req, res) => {
  try {
    const { product1, product2 } = req.query;
    if (!product1 || !product2) {
      return res.status(400).json({ success: false, message: 'Provide product1 and product2 (name or barcode)' });
    }

    const getJourneyForProduct = async (searchTerm) => {
      const like = `%${searchTerm}%`;
      let products = await asyncQuery(
        `SELECT p_id as id, product_name, barcode, price, category_id
        FROM dispatch_product WHERE product_name LIKE ? OR barcode LIKE ?
        LIMIT 3`,
        [like, like]
      );

      if (!products.length) {
        products = await asyncQuery(
          `SELECT DISTINCT barcode, product_name, price
          FROM store_inventory WHERE product_name LIKE ? OR barcode LIKE ?
          LIMIT 3`,
          [like, like]
        );
      }

      if (!products.length) return null;

      const product = products[0];
      const bc = product.barcode;

      const currentStockWarehouse = await asyncQuery(
        `SELECT warehouse, SUM(qty_available) as stock
        FROM stock_batches WHERE barcode = ? AND status = 'active'
        GROUP BY warehouse`,
        [bc]
      );

      const currentStockStore = await asyncQuery(
        `SELECT store_code as warehouse, stock
        FROM store_inventory WHERE barcode = ?`,
        [bc]
      );

      const movementCounts = await asyncQuery(
        `SELECT movement_type, COUNT(*) as count, SUM(quantity) as total_qty
        FROM inventory_ledger_base WHERE barcode = ?
        GROUP BY movement_type`,
        [bc]
      );

      const storeMovementCounts = await asyncQuery(
        `SELECT movement_type, COUNT(*) as count, SUM(quantity) as total_qty
        FROM store_timeline WHERE product_barcode = ?
        GROUP BY movement_type`,
        [bc]
      );

      const totalStock = [...currentStockWarehouse, ...currentStockStore]
        .reduce((s, r) => s + parseInt(r.stock || 0), 0);

      return {
        name: product.product_name,
        barcode: bc,
        price: product.price,
        current_stock: totalStock,
        stock_by_location: [...currentStockWarehouse, ...currentStockStore],
        movements: [...movementCounts, ...storeMovementCounts],
      };
    };

    const p1 = await getJourneyForProduct(product1);
    const p2 = await getJourneyForProduct(product2);

    if (!p1) return res.status(404).json({ success: false, message: `Product "${product1}" not found` });
    if (!p2) return res.status(404).json({ success: false, message: `Product "${product2}" not found` });

    res.json({
      success: true,
      comparison: [p1, p2],
    });

  } catch (error) {
    console.error('Product comparison error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
