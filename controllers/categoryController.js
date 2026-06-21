const db = require('../db/connection');

const INIT_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    parent_id INT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_slug (slug)
  )
`;

db.query(INIT_TABLE, (err) => {
  if (err) console.error('[categories] init error:', err);
  else console.log('[categories] table ready');
});

class CategoryController {

  static getAll(req, res) {
    db.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM dispatch_product p WHERE p.category_id = c.id) AS product_count,
        (SELECT COUNT(*) FROM categories ch WHERE ch.parent_id = c.id) AS subcategory_count
      FROM categories c
      ORDER BY c.parent_id IS NULL DESC, c.sort_order ASC, c.name ASC`,
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        const parents = rows.filter(r => !r.parent_id);
        const children = rows.filter(r => r.parent_id);
        const tree = parents.map(p => ({
          ...p,
          subcategories: children.filter(c => c.parent_id === p.id)
        }));
        res.json({ success: true, data: { categories: tree, all: rows } });
      }
    );
  }

  static getOne(req, res) {
    const { id } = req.params;
    db.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM dispatch_product p WHERE p.category_id = c.id) AS product_count,
        (SELECT COUNT(*) FROM categories ch WHERE ch.parent_id = c.id) AS subcategory_count
      FROM categories c WHERE c.id = ?`,
      [id],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!rows.length) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, data: rows[0] });
      }
    );
  }

  static create(req, res) {
    const { name, slug, description, image_url, parent_id, sort_order } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, message: 'Name and slug are required' });
    db.query(
      'INSERT INTO categories (name, slug, description, image_url, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name, slug, description || null, image_url || null, parent_id || null, sort_order || 0],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Slug already exists' });
          return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: { id: result.insertId }, message: 'Category created' });
      }
    );
  }

  static update(req, res) {
    const { id } = req.params;
    const { name, slug, description, image_url, parent_id, sort_order, is_active } = req.body;
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (slug !== undefined) { fields.push('slug = ?'); params.push(slug); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (image_url !== undefined) { fields.push('image_url = ?'); params.push(image_url); }
    if (parent_id !== undefined) { fields.push('parent_id = ?'); params.push(parent_id); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); params.push(sort_order); }
    if (is_active !== undefined) { fields.push('is_active = ?'); params.push(is_active); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });
    params.push(id);
    db.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params, (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Slug already exists' });
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: 'Category updated' });
    });
  }

  static delete(req, res) {
    const { id } = req.params;
    const { strategy } = req.body; // 'delete_tree' | 'move_to_parent' | 'cancel'
    if (!strategy) return res.status(400).json({ success: false, message: 'Delete strategy required: delete_tree, move_to_parent, or cancel' });
    db.query('SELECT id, parent_id FROM categories WHERE id = ?', [id], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Category not found' });
      const cat = rows[0];
      if (strategy === 'delete_tree') {
        db.query('DELETE FROM categories WHERE id = ? OR parent_id = ?', [id, id], (err2) => {
          if (err2) return res.status(500).json({ success: false, message: err2.message });
          res.json({ success: true, message: 'Category and all subcategories deleted' });
        });
      } else if (strategy === 'move_to_parent') {
        db.query('UPDATE categories SET parent_id = ? WHERE parent_id = ?', [cat.parent_id, id], (err2) => {
          if (err2) return res.status(500).json({ success: false, message: err2.message });
          db.query('UPDATE dispatch_product SET category_id = NULL WHERE category_id = ?', [id], (err3) => {
            if (err3) return res.status(500).json({ success: false, message: err3.message });
            db.query('DELETE FROM categories WHERE id = ?', [id], (err4) => {
              if (err4) return res.status(500).json({ success: false, message: err4.message });
              res.json({ success: true, message: 'Category deleted, subcategories moved' });
            });
          });
        });
      } else {
        res.status(400).json({ success: false, message: 'Invalid strategy' });
      }
    });
  }

  static moveSubcategory(req, res) {
    const { id } = req.params;
    const { new_parent_id } = req.body;
    if (new_parent_id === undefined) return res.status(400).json({ success: false, message: 'new_parent_id is required' });
    db.query('UPDATE categories SET parent_id = ? WHERE id = ?', [new_parent_id || null, id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Subcategory moved' });
    });
  }

  static getAnalytics(req, res) {
    db.query(
      `SELECT 
        c.id, c.name, c.slug,
        COUNT(DISTINCT p.p_id) AS total_products,
        COUNT(DISTINCT ch.id) AS subcategory_count,
        COALESCE(SUM(p.price * COALESCE(i.stock, 0)), 0) AS estimated_revenue,
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT CASE WHEN p.is_active = 1 THEN p.p_id END) AS active_products
      FROM categories c
      LEFT JOIN dispatch_product p ON p.category_id = c.id
      LEFT JOIN inventory i ON i.product_id = p.p_id
      LEFT JOIN orders o ON FIND_IN_SET(p.p_id, o.product_ids)
      LEFT JOIN categories ch ON ch.parent_id = c.id
      WHERE c.parent_id IS NULL
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.name`,
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
      }
    );
  }
}

module.exports = CategoryController;
