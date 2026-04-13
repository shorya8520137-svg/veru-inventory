const db = require('../db/connection');

// Helper function to promisify pool queries
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

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { page = 1, limit = 10, sort = 'latest' } = req.query;
        const offset = (page - 1) * limit;

        // Determine sort order
        let orderBy = 'pr.created_at DESC';
        switch (sort) {
            case 'oldest':
                orderBy = 'pr.created_at ASC';
                break;
            case 'highest_rated':
                orderBy = 'pr.rating DESC, pr.created_at DESC';
                break;
            case 'lowest_rated':
                orderBy = 'pr.rating ASC, pr.created_at DESC';
                break;
            case 'most_helpful':
                orderBy = 'pr.helpful_count DESC, pr.created_at DESC';
                break;
        }

        // Get reviews with user information
        const reviews = await query(`
            SELECT 
                pr.id,
                pr.product_id,
                pr.user_id,
                COALESCE(wc.name, u.username, 'Anonymous') as user_name,
                pr.rating,
                pr.comment,
                pr.helpful_count,
                pr.is_verified_purchase,
                pr.created_at,
                pr.updated_at
            FROM product_reviews pr
            LEFT JOIN website_customers wc ON pr.user_id = wc.id
            LEFT JOIN users u ON pr.user_id = u.id
            WHERE pr.product_id = ? AND pr.status = 'approved'
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `, [product_id, parseInt(limit), offset]);

        // Get review statistics
        const stats = await query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
            FROM product_reviews
            WHERE product_id = ? AND status = 'approved'
        `, [product_id]);

        const statistics = stats[0] || {};
        const totalReviews = parseInt(statistics.total_reviews) || 0;

        res.json({
            success: true,
            data: reviews,
            statistics: {
                total_reviews: totalReviews,
                average_rating: parseFloat(statistics.average_rating || 0).toFixed(1),
                rating_distribution: {
                    5: parseInt(statistics.rating_5) || 0,
                    4: parseInt(statistics.rating_4) || 0,
                    3: parseInt(statistics.rating_3) || 0,
                    2: parseInt(statistics.rating_2) || 0,
                    1: parseInt(statistics.rating_1) || 0
                }
            },
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(totalReviews / limit),
                per_page: parseInt(limit),
                total_reviews: totalReviews
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};

// Create a new review
exports.createReview = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { rating, comment } = req.body;
        const user_id = req.user.id;

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5',
                error: 'INVALID_RATING'
            });
        }

        if (!comment || comment.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Comment must be at least 10 characters',
                error: 'INVALID_COMMENT'
            });
        }

        if (comment.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Comment must not exceed 1000 characters',
                error: 'COMMENT_TOO_LONG'
            });
        }

        // Check if user already reviewed this product
        const existing = await query(
            'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this product',
                error: 'DUPLICATE_REVIEW'
            });
        }

        // Check if user purchased this product
        const purchases = await query(`
            SELECT COUNT(*) as count 
            FROM website_order_items oi
            INNER JOIN website_orders o ON oi.order_id = o.id
            WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
        `, [user_id, product_id]);

        const isVerifiedPurchase = purchases[0].count > 0;

        // Insert review
        const result = await query(`
            INSERT INTO product_reviews (product_id, user_id, rating, comment, is_verified_purchase, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `, [product_id, user_id, rating, comment, isVerifiedPurchase]);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully. It will be visible after approval.',
            data: {
                id: result.insertId,
                product_id: parseInt(product_id),
                user_id,
                rating,
                comment,
                helpful_count: 0,
                is_verified_purchase: isVerifiedPurchase,
                status: 'pending',
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create review',
            error: error.message
        });
    }
};

// Update a review
exports.updateReview = async (req, res) => {
    try {
        const { product_id, review_id } = req.params;
        const { rating, comment } = req.body;
        const user_id = req.user.id;

        // Verify ownership
        const review = await query(
            'SELECT id FROM product_reviews WHERE id = ? AND user_id = ?',
            [review_id, user_id]
        );

        if (review.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own reviews',
                error: 'FORBIDDEN'
            });
        }

        // Update review
        await query(`
            UPDATE product_reviews 
            SET rating = ?, comment = ?, status = 'pending', updated_at = NOW()
            WHERE id = ? AND user_id = ?
        `, [rating, comment, review_id, user_id]);

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: {
                id: parseInt(review_id),
                rating,
                comment,
                updated_at: new Date()
            }
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
            error: error.message
        });
    }
};

// Delete a review
exports.deleteReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const user_id = req.user.id;

        // Delete review (only if user owns it)
        const result = await query(
            'DELETE FROM product_reviews WHERE id = ? AND user_id = ?',
            [review_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews',
                error: 'FORBIDDEN'
            });
        }

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
    try {
        const { review_id } = req.params;
        const user_id = req.user.id;

        // Check if already marked helpful
        const existing = await query(
            'SELECT id FROM review_helpful WHERE review_id = ? AND user_id = ?',
            [review_id, user_id]
        );

        if (existing.length > 0) {
            // Remove helpful mark
            await query(
                'DELETE FROM review_helpful WHERE review_id = ? AND user_id = ?',
                [review_id, user_id]
            );
            await query(
                'UPDATE product_reviews SET helpful_count = helpful_count - 1 WHERE id = ?',
                [review_id]
            );

            const updated = await query(
                'SELECT helpful_count FROM product_reviews WHERE id = ?',
                [review_id]
            );

            return res.json({
                success: true,
                message: 'Helpful mark removed',
                data: {
                    review_id: parseInt(review_id),
                    helpful_count: updated[0].helpful_count,
                    is_helpful: false
                }
            });
        } else {
            // Add helpful mark
            await query(
                'INSERT INTO review_helpful (review_id, user_id) VALUES (?, ?)',
                [review_id, user_id]
            );
            await query(
                'UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
                [review_id]
            );

            const updated = await query(
                'SELECT helpful_count FROM product_reviews WHERE id = ?',
                [review_id]
            );

            return res.json({
                success: true,
                message: 'Review marked as helpful',
                data: {
                    review_id: parseInt(review_id),
                    helpful_count: updated[0].helpful_count,
                    is_helpful: true
                }
            });
        }
    } catch (error) {
        console.error('Error marking helpful:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark review as helpful',
            error: error.message
        });
    }
};

// Get user's own reviews
exports.getUserReviews = async (req, res) => {
    try {
        const user_id = req.user.id;

        const reviews = await query(`
            SELECT 
                pr.id,
                pr.product_id,
                p.product_name,
                p.image_url as product_image,
                pr.rating,
                pr.comment,
                pr.helpful_count,
                pr.status,
                pr.created_at
            FROM product_reviews pr
            INNER JOIN products p ON pr.product_id = p.product_id
            WHERE pr.user_id = ?
            ORDER BY pr.created_at DESC
        `, [user_id]);

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user reviews',
            error: error.message
        });
    }
};

// Admin: Get all reviews (pending, approved, rejected)
exports.getAllReviews = async (req, res) => {
    try {
        console.log('=== getAllReviews called with query:', req.query);
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        const params = [];

        if (status && status !== 'all') {
            whereClause = 'WHERE pr.status = ?';
            params.push(status);
        }

        console.log('=== Executing query with whereClause:', whereClause, 'params:', params);

        const reviews = await query(`
            SELECT 
                pr.id,
                pr.product_id,
                COALESCE(p.product_name, CONCAT('Product #', pr.product_id)) as product_name,
                pr.user_id,
                COALESCE(wc.name, u.username, CONCAT('User #', pr.user_id)) as user_name,
                pr.rating,
                pr.comment,
                pr.helpful_count,
                pr.is_verified_purchase,
                pr.status,
                pr.created_at
            FROM product_reviews pr
            LEFT JOIN products p ON pr.product_id = p.product_id
            LEFT JOIN website_customers wc ON pr.user_id = wc.id
            LEFT JOIN users u ON pr.user_id = u.id
            ${whereClause}
            ORDER BY pr.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        console.log('=== Query returned', reviews.length, 'reviews');

        const countResult = await query(`
            SELECT COUNT(*) as total FROM product_reviews pr ${whereClause}
        `, params);

        const totalReviews = countResult[0].total;
        console.log('=== Total reviews in database:', totalReviews);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(totalReviews / limit),
                per_page: parseInt(limit),
                total: totalReviews
            }
        });
    } catch (error) {
        console.error('Error fetching all reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};

// Admin: Update review status
exports.updateReviewStatus = async (req, res) => {
    try {
        const { review_id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                error: 'INVALID_STATUS'
            });
        }

        await query(
            'UPDATE product_reviews SET status = ? WHERE id = ?',
            [status, review_id]
        );

        res.json({
            success: true,
            message: `Review ${status} successfully`
        });
    } catch (error) {
        console.error('Error updating review status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review status',
            error: error.message
        });
    }
};
