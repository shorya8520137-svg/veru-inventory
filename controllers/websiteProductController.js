const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Database connection (reuse existing connection)
const db = require('../db/connection');

// Helper function to promisify pool queries (for promise-based connection)
const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

class WebsiteProductController {
    // Get all products with pagination and filters
    async getProducts(req, res) {
        try {
            // First check if the tables exist
            const checkTablesQuery = "SHOW TABLES LIKE 'website_products'";
            
            db.query(checkTablesQuery, (err, tableResult) => {
                if (err) {
                    console.error('Error checking table existence:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (tableResult.length === 0) {
                    // Table doesn't exist, return empty array
                    console.log('website_products table does not exist');
                    return res.json({
                        success: true,
                        data: [],
                        pagination: {
                            page: 1,
                            limit: 20,
                            total: 0,
                            pages: 0
                        },
                        message: 'Products table not found. Please run database setup.'
                    });
                }

                // Tables exist, proceed with query
                const {
                    page = 1,
                    limit = 20,
                    search = '',
                    category = '',
                    minPrice = 0,
                    maxPrice = 999999,
                    featured = '',
                    active = 'true',
                    sortBy = 'created_at',
                    sortOrder = 'DESC'
                } = req.query;

                const offset = (page - 1) * limit;
                
                let whereConditions = ['p.is_active = ?'];
                let queryParams = [active === 'true'];

                // Search filter
                if (search) {
                    whereConditions.push('(p.product_name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
                    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
                }

                // Category filter
                if (category) {
                    whereConditions.push('c.slug = ?');
                    queryParams.push(category);
                }

                // Price range filter
                if (minPrice > 0) {
                    whereConditions.push('p.price >= ?');
                    queryParams.push(minPrice);
                }
                if (maxPrice < 999999) {
                    whereConditions.push('p.price <= ?');
                    queryParams.push(maxPrice);
                }

                // Featured filter
                if (featured !== '') {
                    whereConditions.push('p.is_featured = ?');
                    queryParams.push(featured === 'true');
                }

                const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

                // Valid sort columns
                const validSortColumns = ['product_name', 'price', 'created_at', 'stock_quantity', 'category_name'];
                const validSortOrders = ['ASC', 'DESC'];
                
                const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
                const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

                // Count query first
                const countQuery = `
                    SELECT COUNT(*) as total
                    FROM website_products p
                    LEFT JOIN website_categories c ON p.category_id = c.id
                    ${whereClause}
                `;

                // Count query uses the same WHERE parameters (no LIMIT/OFFSET)
                db.query(countQuery, queryParams, (err, countResult) => {
                    if (err) {
                        console.error('Count query error:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to count products',
                            error: err.message
                        });
                    }

                    const total = countResult[0]?.total || 0;

                    // Main query - add LIMIT and OFFSET to queryParams
                    const mainQueryParams = [...queryParams, parseInt(limit), parseInt(offset)];

                    const query = `
                        SELECT 
                            p.id,
                            p.product_name,
                            p.description,
                            p.short_description,
                            p.price,
                            p.offer_price,
                            p.image_url,
                            p.additional_images,
                            p.sku,
                            p.stock_quantity,
                            p.min_stock_level,
                            p.is_active,
                            p.is_featured,
                            p.created_at,
                            p.updated_at,
                            c.name as category_name,
                            c.slug as category_slug,
                            CASE 
                                WHEN p.offer_price IS NOT NULL AND p.offer_price < p.price 
                                THEN p.offer_price 
                                ELSE p.price 
                            END as final_price,
                            CASE 
                                WHEN p.offer_price IS NOT NULL AND p.offer_price < p.price 
                                THEN ROUND(((p.price - p.offer_price) / p.price) * 100, 2)
                                ELSE 0 
                            END as discount_percentage
                        FROM website_products p
                        LEFT JOIN website_categories c ON p.category_id = c.id
                        ${whereClause}
                        ORDER BY ${sortColumn === 'category_name' ? 'c.name' : 'p.' + sortColumn} ${sortDirection}
                        LIMIT ? OFFSET ?
                    `;

                    db.query(query, mainQueryParams, (err, products) => {
                        if (err) {
                            console.error('Products query error:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to fetch products',
                                error: err.message
                            });
                        }

                        res.json({
                            success: true,
                            data: products || [],
                            pagination: {
                                page: parseInt(page),
                                limit: parseInt(limit),
                                total: total,
                                pages: Math.ceil(total / limit)
                            }
                        });
                    });
                });
            });

        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch products',
                error: error.message
            });
        }
    }

    // Get single product by ID
    async getProduct(req, res) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    p.*,
                    c.name as category_name,
                    c.slug as category_slug,
                    CASE 
                        WHEN p.offer_price IS NOT NULL AND p.offer_price < p.price 
                        THEN p.offer_price 
                        ELSE p.price 
                    END as final_price,
                    CASE 
                        WHEN p.offer_price IS NOT NULL AND p.offer_price < p.price 
                        THEN ROUND(((p.price - p.offer_price) / p.price) * 100, 2)
                        ELSE 0 
                    END as discount_percentage
                FROM website_products p
                JOIN website_categories c ON p.category_id = c.id
                WHERE p.id = ?
            `;

            db.query(query, [id], (err, products) => {
                if (err) {
                    console.error('Error fetching product:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch product',
                        error: err.message
                    });
                }

                if (products.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Product not found'
                    });
                }

                // Get product variants
                const variantQuery = `
                    SELECT * FROM website_product_variants 
                    WHERE product_id = ? AND is_active = TRUE
                    ORDER BY variant_name, variant_value
                `;
                
                db.query(variantQuery, [id], (err, variants) => {
                    if (err) {
                        console.error('Error fetching variants:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to fetch product variants',
                            error: err.message
                        });
                    }

                    const product = products[0];
                    product.variants = variants || [];

                    res.json({
                        success: true,
                        data: product
                    });
                });
            });

        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product',
                error: error.message
            });
        }
    }

    // Create new product
    async createProduct(req, res) {
        try {
            const {
                product_name,
                description,
                short_description,
                key_features,
                price,
                offer_price,
                image_url,
                additional_images,
                category_id,
                sku,
                stock_quantity = 0,
                min_stock_level = 0,
                weight,
                dimensions,
                is_active = true,
                is_featured = false,
                meta_title,
                meta_description,
                tags,
                attributes
            } = req.body;

            // Validate required fields
            if (!product_name || !price || !category_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Product name, price, and category are required'
                });
            }

            // Check if category exists
            db.query('SELECT id FROM website_categories WHERE id = ? AND is_active = TRUE', [category_id], (err, categoryCheck) => {
                if (err) {
                    console.error('Error checking category:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (categoryCheck.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid category ID'
                    });
                }

                // Generate SKU if not provided
                let finalSku = sku;
                if (!finalSku) {
                    const timestamp = Date.now().toString().slice(-6);
                    finalSku = `WP-${timestamp}`;
                }

                // Check SKU uniqueness
                db.query('SELECT id FROM website_products WHERE sku = ?', [finalSku], (err, skuCheck) => {
                    if (err) {
                        console.error('Error checking SKU:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Database error',
                            error: err.message
                        });
                    }

                    if (skuCheck.length > 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'SKU already exists'
                        });
                    }

                    const query = `
                        INSERT INTO website_products (
                            product_name, description, short_description, key_features, price, offer_price,
                            image_url, additional_images, category_id, sku, stock_quantity,
                            min_stock_level, weight, dimensions, is_active, is_featured,
                            meta_title, meta_description, tags, attributes, created_by
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    db.query(query, [
                        product_name,
                        description,
                        short_description,
                        key_features ? JSON.stringify(key_features) : null,
                        price,
                        offer_price,
                        image_url,
                        additional_images ? JSON.stringify(additional_images) : null,
                        category_id,
                        finalSku,
                        stock_quantity,
                        min_stock_level,
                        weight,
                        dimensions,
                        is_active,
                        is_featured,
                        meta_title,
                        meta_description,
                        tags ? JSON.stringify(tags) : null,
                        attributes ? JSON.stringify(attributes) : null,
                        req.user?.id || null
                    ], (err, result) => {
                        if (err) {
                            console.error('Error creating product:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to create product',
                                error: err.message
                            });
                        }

                        res.status(201).json({
                            success: true,
                            message: 'Product created successfully',
                            data: {
                                id: result.insertId,
                                sku: finalSku
                            }
                        });
                    });
                });
            });

        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create product',
                error: error.message
            });
        }
    }

    // Update product
    updateProduct = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Remove id from update data
            delete updateData.id;
            delete updateData.created_at;
            delete updateData.created_by;

            // Check if product exists
            db.query('SELECT id, sku FROM website_products WHERE id = ?', [id], (err, existingProduct) => {
                if (err) {
                    console.error('Error checking product:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (existingProduct.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Product not found'
                    });
                }

                // Check SKU uniqueness if SKU is being updated
                if (updateData.sku && updateData.sku !== existingProduct[0].sku) {
                    db.query('SELECT id FROM website_products WHERE sku = ? AND id != ?', [updateData.sku, id], (err, skuCheck) => {
                        if (err) {
                            console.error('Error checking SKU:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Database error',
                                error: err.message
                            });
                        }

                        if (skuCheck.length > 0) {
                            return res.status(400).json({
                                success: false,
                                message: 'SKU already exists'
                            });
                        }

                        // Perform update directly
                        this.doProductUpdate(req, res, id, updateData);
                    });
                } else {
                    // Perform update directly
                    this.doProductUpdate(req, res, id, updateData);
                }
            });

        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product',
                error: error.message
            });
        }
    }

    // Helper method to perform the actual update
    doProductUpdate(req, res, id, updateData) {
        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                
                // Handle JSON fields
                if (['additional_images', 'key_features', 'tags', 'attributes'].includes(key) && 
                    typeof updateData[key] === 'object') {
                    updateValues.push(JSON.stringify(updateData[key]));
                } else {
                    // Handle decimal fields - convert empty strings to null
                    if (['weight', 'offer_price'].includes(key) && updateData[key] === '') {
                        updateValues.push(null);
                    } else if (['weight', 'offer_price'].includes(key) && updateData[key] !== null) {
                        // Ensure decimal values are properly formatted
                        updateValues.push(parseFloat(updateData[key]) || null);
                    } else {
                        updateValues.push(updateData[key]);
                    }
                }
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        const query = `
            UPDATE website_products 
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `;

        db.query(query, updateValues, (err, result) => {
            if (err) {
                console.error('Error updating product:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update product',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Product updated successfully'
            });
        });
    }

    // Delete product
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            // Check if product exists
            db.query('SELECT id FROM website_products WHERE id = ?', [id], (err, existingProduct) => {
                if (err) {
                    console.error('Error checking product:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (existingProduct.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Product not found'
                    });
                }

                // Soft delete - just mark as inactive
                db.query('UPDATE website_products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err, result) => {
                    if (err) {
                        console.error('Error deleting product:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to delete product',
                            error: err.message
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Product deleted successfully'
                    });
                });
            });

        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product',
                error: error.message
            });
        }
    }

    // Get all categories
    async getCategories(req, res) {
        try {
            // First check if the table exists
            const checkTableQuery = "SHOW TABLES LIKE 'website_categories'";
            
            db.query(checkTableQuery, (err, tableResult) => {
                if (err) {
                    console.error('Error checking table existence:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (tableResult.length === 0) {
                    // Table doesn't exist, return empty array
                    console.log('website_categories table does not exist');
                    return res.json({
                        success: true,
                        data: [],
                        message: 'Categories table not found. Please run database setup.'
                    });
                }

                // Table exists, fetch categories
                const query = `
                    SELECT 
                        c.id,
                        c.name,
                        c.description,
                        c.slug,
                        c.parent_id,
                        c.sort_order,
                        c.is_active,
                        c.created_at,
                        c.updated_at,
                        COUNT(p.id) as product_count,
                        parent.name as parent_name
                    FROM website_categories c
                    LEFT JOIN website_products p ON c.id = p.category_id AND p.is_active = TRUE
                    LEFT JOIN website_categories parent ON c.parent_id = parent.id
                    WHERE c.is_active = TRUE
                    GROUP BY c.id
                    ORDER BY c.sort_order, c.name
                `;

                db.query(query, (err, categories) => {
                    if (err) {
                        console.error('Database query error:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to fetch categories',
                            error: err.message
                        });
                    }

                    res.json({
                        success: true,
                        data: categories || []
                    });
                });
            });

        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories',
                error: error.message
            });
        }
    }

    // Create new category
    createCategory(req, res) {
        try {
            const {
                name,
                category_name, // Support both name and category_name for backward compatibility
                description,
                slug,
                parent_id,
                sort_order = 0,
                image_url
            } = req.body;

            // Use category_name if name is not provided (backward compatibility)
            const categoryName = name || category_name;

            // Validate required fields
            if (!categoryName || !categoryName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name is required'
                });
            }

            // Generate slug if not provided
            let finalSlug = slug;
            if (!finalSlug) {
                finalSlug = categoryName.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }

            // Helper function to insert category
            const insertCategory = (categoryName, description, finalSlug, parent_id, sort_order, image_url) => {
                const query = `
                    INSERT INTO website_categories (
                        name, description, slug, parent_id, sort_order, image_url
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;

                db.query(query, [categoryName, description, finalSlug, parent_id, sort_order, image_url], (err, result) => {
                    if (err) {
                        console.error('Error inserting category:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to create category',
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Category created successfully',
                        data: {
                            id: result.insertId,
                            name: categoryName,
                            slug: finalSlug
                        }
                    });
                });
            };

            // Check if name or slug already exists
            db.query('SELECT id FROM website_categories WHERE name = ? OR slug = ?', [categoryName, finalSlug], function(err, existingCheck) {
                if (err) {
                    console.error('Error checking category existence:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (existingCheck.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Category name or slug already exists'
                    });
                }

                // Validate parent_id if provided
                if (parent_id) {
                    db.query('SELECT id FROM website_categories WHERE id = ? AND is_active = TRUE', [parent_id], function(err, parentCheck) {
                        if (err) {
                            console.error('Error checking parent category:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Database error',
                                error: err.message
                            });
                        }

                        if (parentCheck.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: 'Invalid parent category'
                            });
                        }

                        // Insert category with parent_id
                        insertCategory(categoryName, description, finalSlug, parent_id, sort_order, image_url);
                    });
                } else {
                    // Insert category without parent_id
                    insertCategory(categoryName, description, finalSlug, null, sort_order, image_url);
                }
            });

        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create category',
                error: error.message
            });
        }
    }

    // Helper method to insert category
    insertCategory(req, res, categoryName, description, finalSlug, parent_id, sort_order, image_url) {
        const query = `
            INSERT INTO website_categories (
                name, description, slug, parent_id, sort_order, image_url
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [categoryName, description, finalSlug, parent_id, sort_order, image_url], (err, result) => {
            if (err) {
                console.error('Error inserting category:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create category',
                    error: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: {
                    id: result.insertId,
                    name: categoryName,
                    slug: finalSlug
                }
            });
        });
    }

    // Update category
    async updateCategory(req, res) {
        const self = this; // Store 'this' context for callbacks
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Remove id from update data
            delete updateData.id;
            delete updateData.created_at;

            // Check if category exists
            db.query('SELECT id, name, slug FROM website_categories WHERE id = ?', [id], (err, existingCategory) => {
                if (err) {
                    console.error('Error checking category:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (existingCategory.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Category not found'
                    });
                }

                // Check name/slug uniqueness if being updated
                if (updateData.name || updateData.slug) {
                    const checkName = updateData.name || existingCategory[0].name;
                    const checkSlug = updateData.slug || existingCategory[0].slug;

                    db.query('SELECT id FROM website_categories WHERE (name = ? OR slug = ?) AND id != ?', [checkName, checkSlug, id], (err, duplicateCheck) => {
                        if (err) {
                            console.error('Error checking duplicates:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Database error',
                                error: err.message
                            });
                        }

                        if (duplicateCheck.length > 0) {
                            return res.status(400).json({
                                success: false,
                                message: 'Category name or slug already exists'
                            });
                        }

                        // Inline category update logic to avoid 'this' context issues
                        const updateFields = [];
                        const updateValues = [];

                        // Define allowed fields for website_categories table
                        const allowedFields = ['name', 'description', 'slug', 'parent_id', 'sort_order', 'image_url', 'is_active'];

                        Object.keys(updateData).forEach(key => {
                            if (updateData[key] !== undefined && allowedFields.includes(key)) {
                                let value = updateData[key];
                                
                                // Handle special cases for database compatibility
                                if (key === 'parent_id' && (value === '' || value === null)) {
                                    value = null; // Convert empty string to NULL for INT column
                                }
                                if (key === 'sort_order' && (value === '' || value === null)) {
                                    value = 0; // Default sort_order to 0
                                }
                                
                                updateFields.push(`${key} = ?`);
                                updateValues.push(value);
                            }
                        });

                        if (updateFields.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: 'No valid fields to update'
                            });
                        }

                        updateFields.push('updated_at = CURRENT_TIMESTAMP');
                        updateValues.push(id);

                        const query = `
                            UPDATE website_categories 
                            SET ${updateFields.join(', ')}
                            WHERE id = ?
                        `;

                        db.query(query, updateValues, (err, result) => {
                            if (err) {
                                console.error('Error updating category:', err);
                                return res.status(500).json({
                                    success: false,
                                    message: 'Failed to update category',
                                    error: err.message
                                });
                            }

                            res.json({
                                success: true,
                                message: 'Category updated successfully'
                            });
                        });
                    });
                } else {
                    // Inline category update logic to avoid 'this' context issues
                    const updateFields = [];
                    const updateValues = [];

                    // Define allowed fields for website_categories table
                    const allowedFields = ['name', 'description', 'slug', 'parent_id', 'sort_order', 'image_url', 'is_active'];

                    Object.keys(updateData).forEach(key => {
                        if (updateData[key] !== undefined && allowedFields.includes(key)) {
                            let value = updateData[key];
                            
                            // Handle special cases for database compatibility
                            if (key === 'parent_id' && (value === '' || value === null)) {
                                value = null; // Convert empty string to NULL for INT column
                            }
                            if (key === 'sort_order' && (value === '' || value === null)) {
                                value = 0; // Default sort_order to 0
                            }
                            
                            updateFields.push(`${key} = ?`);
                            updateValues.push(value);
                        }
                    });

                    if (updateFields.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'No valid fields to update'
                        });
                    }

                    updateFields.push('updated_at = CURRENT_TIMESTAMP');
                    updateValues.push(id);

                    const query = `
                        UPDATE website_categories 
                        SET ${updateFields.join(', ')}
                        WHERE id = ?
                    `;

                    db.query(query, updateValues, (err, result) => {
                        if (err) {
                            console.error('Error updating category:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to update category',
                                error: err.message
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Category updated successfully'
                        });
                    });
                }
            });

        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update category',
                error: error.message
            });
        }
    }

    // Helper method to perform category update
    performCategoryUpdate(req, res, id, updateData) {
        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(updateData[key]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        const query = `
            UPDATE website_categories 
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `;

        db.query(query, updateValues, (err, result) => {
            if (err) {
                console.error('Error updating category:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update category',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Category updated successfully'
            });
        });
    }

    // Delete category (soft delete)
    async deleteCategory(req, res) {
        try {
            const { id } = req.params;

            // Check if category exists
            db.query('SELECT id FROM website_categories WHERE id = ?', [id], (err, existingCategory) => {
                if (err) {
                    console.error('Error checking category:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (existingCategory.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Category not found'
                    });
                }

                // Check if category has products
                db.query('SELECT COUNT(*) as count FROM website_products WHERE category_id = ? AND is_active = TRUE', [id], (err, productCheck) => {
                    if (err) {
                        console.error('Error checking products:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Database error',
                            error: err.message
                        });
                    }

                    if (productCheck[0].count > 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Cannot delete category with active products'
                        });
                    }

                    // Soft delete - mark as inactive
                    db.query('UPDATE website_categories SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err, result) => {
                        if (err) {
                            console.error('Error deleting category:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to delete category',
                                error: err.message
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Category deleted successfully'
                        });
                    });
                });
            });

        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete category',
                error: error.message
            });
        }
    }

    // Bulk upload products from CSV
    async bulkUpload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const filename = req.file.filename;
            const filePath = req.file.path;

            // Create bulk upload record
            db.query('INSERT INTO website_bulk_uploads (filename, total_rows, uploaded_by, file_path, status) VALUES (?, 0, ?, ?, ?)', 
                [filename, req.user?.id || null, filePath, 'pending'], (err, uploadRecord) => {
                if (err) {
                    console.error('Error creating upload record:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create upload record',
                        error: err.message
                    });
                }

                const uploadId = uploadRecord.insertId;

                // Process CSV file asynchronously
                this.processBulkUpload(uploadId, filePath);

                res.json({
                    success: true,
                    message: 'File uploaded successfully. Processing started.',
                    uploadId: uploadId
                });
            });

        } catch (error) {
            console.error('Error in bulk upload:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process bulk upload',
                error: error.message
            });
        }
    }

    // Process bulk upload (simplified for callback compatibility)
    processBulkUpload(uploadId, filePath) {
        // Update status to processing
        db.query('UPDATE website_bulk_uploads SET status = "processing", started_at = CURRENT_TIMESTAMP WHERE id = ?', [uploadId], (err) => {
            if (err) {
                console.error('Error updating upload status:', err);
                return;
            }

            const products = [];
            const errors = [];
            let totalRows = 0;
            let processedRows = 0;
            let successRows = 0;

            // Read CSV file
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    totalRows++;
                    products.push(row);
                })
                .on('end', () => {
                    // Update total rows
                    db.query('UPDATE website_bulk_uploads SET total_rows = ? WHERE id = ?', [totalRows, uploadId], (err) => {
                        if (err) {
                            console.error('Error updating total rows:', err);
                            return;
                        }

                        // Process products sequentially
                        this.processProductsSequentially(products, uploadId, 0, processedRows, successRows, errors, filePath);
                    });
                })
                .on('error', (error) => {
                    console.error('Error reading CSV:', error);
                    db.query('UPDATE website_bulk_uploads SET status = "failed", completed_at = CURRENT_TIMESTAMP, error_log = ? WHERE id = ?', 
                        [JSON.stringify([{ error: error.message }]), uploadId], () => {});
                });
        });
    }

    // Helper method to process products sequentially
    processProductsSequentially(products, uploadId, index, processedRows, successRows, errors, filePath) {
        if (index >= products.length) {
            // All products processed, finalize
            db.query(`UPDATE website_bulk_uploads SET 
                     processed_rows = ?, success_rows = ?, error_rows = ?, 
                     status = 'completed', completed_at = CURRENT_TIMESTAMP, error_log = ?
                     WHERE id = ?`,
                [processedRows, successRows, errors.length, JSON.stringify(errors), uploadId], (err) => {
                if (err) {
                    console.error('Error finalizing upload:', err);
                }
                // Clean up file
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error('Error deleting file:', e);
                }
            });
            return;
        }

        const productData = products[index];
        processedRows++;

        // Validate required fields
        if (!productData.product_name || !productData.price || !productData.category_name) {
            errors.push({
                row: processedRows,
                data: productData,
                error: 'Missing required fields: product_name, price, category_name'
            });
            this.processProductsSequentially(products, uploadId, index + 1, processedRows, successRows, errors, filePath);
            return;
        }

        // Find category by name
        db.query('SELECT id FROM website_categories WHERE name = ? AND is_active = TRUE', [productData.category_name], (err, categoryResult) => {
            if (err || categoryResult.length === 0) {
                errors.push({
                    row: processedRows,
                    data: productData,
                    error: `Category not found: ${productData.category_name}`
                });
                this.processProductsSequentially(products, uploadId, index + 1, processedRows, successRows, errors, filePath);
                return;
            }

            const categoryId = categoryResult[0].id;

            // Generate SKU if not provided
            let sku = productData.sku;
            if (!sku) {
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.random().toString(36).substring(2, 5);
                sku = `WP-${timestamp}-${random}`;
            }

            // Insert product (simplified - skip SKU uniqueness check for bulk upload)
            const query = `
                INSERT INTO website_products (
                    product_name, description, short_description, price, offer_price,
                    image_url, category_id, sku, stock_quantity, min_stock_level,
                    weight, dimensions, is_active, is_featured, meta_title, meta_description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(query, [
                productData.product_name,
                productData.description || null,
                productData.short_description || null,
                parseFloat(productData.price),
                productData.offer_price ? parseFloat(productData.offer_price) : null,
                productData.image_url || null,
                categoryId,
                sku,
                parseInt(productData.stock_quantity) || 0,
                parseInt(productData.min_stock_level) || 0,
                productData.weight ? parseFloat(productData.weight) : null,
                productData.dimensions || null,
                productData.is_active !== 'false',
                productData.is_featured === 'true',
                productData.meta_title || null,
                productData.meta_description || null
            ], (err, result) => {
                if (err) {
                    errors.push({
                        row: processedRows,
                        data: productData,
                        error: err.message
                    });
                } else {
                    successRows++;
                }

                // Update progress every 10 rows
                if (processedRows % 10 === 0) {
                    db.query('UPDATE website_bulk_uploads SET processed_rows = ?, success_rows = ?, error_rows = ? WHERE id = ?',
                        [processedRows, successRows, errors.length, uploadId], () => {});
                }

                // Process next product
                this.processProductsSequentially(products, uploadId, index + 1, processedRows, successRows, errors, filePath);
            });
        });
    }

    // Get bulk upload status
    async getBulkUploadStatus(req, res) {
        try {
            const { uploadId } = req.params;

            db.query('SELECT * FROM website_bulk_uploads WHERE id = ?', [uploadId], (err, uploads) => {
                if (err) {
                    console.error('Error fetching upload status:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch upload status',
                        error: err.message
                    });
                }

                if (uploads.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Upload not found'
                    });
                }

                res.json({
                    success: true,
                    data: uploads[0]
                });
            });

        } catch (error) {
            console.error('Error fetching upload status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch upload status',
                error: error.message
            });
        }
    }

    // Get featured products
    async getFeaturedProducts(req, res) {
        try {
            const { limit = 10 } = req.query;

            const query = `
                SELECT 
                    p.id,
                    p.product_name,
                    p.description,
                    p.short_description,
                    p.price,
                    p.offer_price,
                    p.image_url,
                    p.additional_images,
                    p.sku,
                    p.stock_quantity,
                    p.min_stock_level,
                    p.is_active,
                    p.is_featured,
                    p.created_at,
                    p.updated_at,
                    c.name as category_name,
                    c.slug as category_slug,
                    CASE 
                        WHEN p.offer_price IS NOT NULL AND p.offer_price < p.price 
                        THEN p.offer_price 
                        ELSE p.price 
                    END as final_price,
                    CASE 
                        WHEN p.offer_price IS NOT NULL AND p.offer_price < p.price 
                        THEN ROUND(((p.price - p.offer_price) / p.price) * 100, 2)
                        ELSE 0 
                    END as discount_percentage
                FROM website_products p
                JOIN website_categories c ON p.category_id = c.id
                WHERE p.is_featured = TRUE AND p.is_active = TRUE
                ORDER BY p.created_at DESC
                LIMIT ?
            `;

            db.query(query, [parseInt(limit)], (err, products) => {
                if (err) {
                    console.error('Error fetching featured products:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch featured products',
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    data: products || []
                });
            });

        } catch (error) {
            console.error('Error fetching featured products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch featured products',
                error: error.message
            });
        }
    }
}

module.exports = new WebsiteProductController();