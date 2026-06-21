const db = require('../../db/connection');

class ProductKnowledgeRAG {
  static async search(query, options = {}) {
    const results = {
      products: [],
      websiteProducts: [],
      inventory: [],
      faq: [],
      policies: [],
    };

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    if (terms.length === 0) return { ...results, totalResults: 0, query };

    try {
      const [products] = await db.promise().query(`
        SELECT dp.p_id as id, dp.product_name, dp.barcode, dp.barcode as sku,
               pc.name as category_name,
               dp.description, dp.price, dp.cost_price,
               'dispatch_product' as source
        FROM dispatch_product dp
        LEFT JOIN product_categories pc ON dp.category_id = pc.id
        WHERE dp.is_active = 1 AND (${terms.map(t => '(LOWER(dp.product_name) LIKE ? OR LOWER(dp.barcode) LIKE ? OR LOWER(dp.description) LIKE ?)').join(' OR ')})
        LIMIT 10
      `, terms.flatMap(t => [`%${t}%`, `%${t}%`, `%${t}%`]));

      results.products = products;
    } catch (e) {
      console.warn('[ProductKnowledgeRAG] products:', e.message);
    }

    try {
      const [webProducts] = await db.promise().query(`
        SELECT wp.id, wp.product_name, wp.sku, wp.price, wp.offer_price,
               wp.stock_quantity, wc.name as category_name, wp.description, wp.short_description,
               'website_product' as source
        FROM website_products wp
        LEFT JOIN website_categories wc ON wp.category_id = wc.id
        WHERE wp.is_active = 1 AND (${terms.map(t => '(LOWER(wp.product_name) LIKE ? OR LOWER(wp.sku) LIKE ?)').join(' OR ')})
        LIMIT 10
      `, terms.flatMap(t => [`%${t}%`, `%${t}%`]));

      results.websiteProducts = webProducts;
    } catch (e) {
      console.warn('[ProductKnowledgeRAG] website products:', e.message);
    }

    try {
      const [inventory] = await db.promise().query(`
        SELECT sb.id, sb.product_name, sb.barcode, sb.barcode as sku, sb.warehouse,
               sb.qty_available as stock, sb.unit_cost as price,
               w.name as warehouse_name
        FROM stock_batches sb
        LEFT JOIN warehouses w ON sb.warehouse = w.code
        WHERE sb.status = 'active' AND sb.qty_available > 0
          AND (${terms.map(t => '(LOWER(sb.product_name) LIKE ? OR LOWER(sb.barcode) LIKE ?)').join(' OR ')})
        GROUP BY sb.barcode, sb.product_name, sb.warehouse
        LIMIT 15
      `, terms.flatMap(t => [`%${t}%`, `%${t}%`]));

      results.inventory = inventory;
    } catch (e) {
      console.warn('[ProductKnowledgeRAG] inventory:', e.message);
    }

    try {
      const [faq] = await db.promise().query(`
        SELECT response, keyword, usage_count
        FROM customer_support_bot_responses
        WHERE is_active = TRUE
          AND (${terms.map(t => 'LOWER(keyword) LIKE ?').join(' OR ')})
        ORDER BY usage_count DESC
        LIMIT 5
      `, terms.map(t => `%${t}%`));

      results.faq = faq;
    } catch (e) {
      console.warn('[ProductKnowledgeRAG] faq:', e.message);
    }

    return {
      ...results,
      totalResults: results.products.length + results.websiteProducts.length + results.inventory.length + results.faq.length,
      query,
    };
  }

  static async searchByBarcode(barcode) {
    const results = { product: null, inventory: [], websiteProduct: null };

    try {
      const [products] = await db.promise().query(
        'SELECT * FROM dispatch_product WHERE barcode = ? LIMIT 1',
        [barcode]
      );
      if (products.length > 0) results.product = products[0];
    } catch (e) { console.warn('[ProductKnowledgeRAG] barcode product:', e.message); }

    try {
      const [webProducts] = await db.promise().query(
        'SELECT * FROM website_products WHERE sku = ? OR barcode = ? LIMIT 1',
        [barcode, barcode]
      );
      if (webProducts.length > 0) results.websiteProduct = webProducts[0];
    } catch (e) { console.warn('[ProductKnowledgeRAG] barcode web:', e.message); }

    try {
      const [inventory] = await db.promise().query(
        `SELECT sb.*, w.name as warehouse_name
         FROM stock_batches sb
         LEFT JOIN warehouses w ON sb.warehouse = w.code
         WHERE sb.barcode = ? AND sb.status = 'active'
         ORDER BY sb.created_at DESC
         LIMIT 10`,
        [barcode]
      );
      results.inventory = inventory;
    } catch (e) { console.warn('[ProductKnowledgeRAG] barcode inventory:', e.message); }

    return results;
  }

  static async getCategories() {
    const cats = { dispatch: [], website: [] };
    try {
      const [rows] = await db.promise().query('SELECT id, name FROM product_categories ORDER BY name');
      cats.dispatch = rows;
    } catch (e) { console.warn('[ProductKnowledgeRAG] dispatch categories:', e.message); }
    try {
      const [rows] = await db.promise().query('SELECT id, name FROM website_categories WHERE is_active = 1 ORDER BY name');
      cats.website = rows;
    } catch (e) { console.warn('[ProductKnowledgeRAG] website categories:', e.message); }
    return cats;
  }

  static formatCategoriesForContext(categories) {
    const parts = [];
    if (categories.dispatch?.length) {
      parts.push('Inventory Categories: ' + categories.dispatch.map(c => c.name).join(', '));
    }
    if (categories.website?.length) {
      parts.push('Website Categories: ' + categories.website.map(c => c.name).join(', '));
    }
    return parts.join('\n') || 'No product categories found in database.';
  }

  static formatProductResultsForContext(productContext) {
    const lines = [];
    const { products, websiteProducts, inventory, faq } = productContext;

    if (products.length > 0) {
      lines.push('Matched Products (dispatch):');
      products.slice(0, 5).forEach(p => {
        lines.push(`  - ${p.product_name} (Barcode: ${p.barcode || 'N/A'}, Price: ${p.price || 'N/A'}, Category: ${p.category_name || 'N/A'})`);
      });
    }
    if (websiteProducts.length > 0) {
      lines.push('Website Products:');
      websiteProducts.slice(0, 5).forEach(p => {
        lines.push(`  - ${p.product_name} (SKU: ${p.sku || 'N/A'}, Price: ${p.offer_price || p.price || 'N/A'}, Category: ${p.category_name || 'N/A'})`);
      });
    }
    if (inventory.length > 0) {
      lines.push('In Stock:');
      inventory.slice(0, 5).forEach(p => {
        lines.push(`  - ${p.product_name} (Stock: ${p.stock}, Warehouse: ${p.warehouse_name || p.warehouse})`);
      });
    }
    if (faq.length > 0) {
      lines.push('Related FAQ:');
      faq.slice(0, 3).forEach(f => {
        lines.push(`  - ${f.keyword}: ${f.response.substring(0, 100)}`);
      });
    }
    return lines.join('\n') || 'No specific product matches found.';
  }

  static async getDeliveryEstimate(pincode, productId) {
    return { estimate: '3-5 business days', confidence: 'medium', source: 'standard_policy' };
  }
}

module.exports = ProductKnowledgeRAG;
