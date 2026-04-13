const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/products/:product_id/reviews', reviewController.getProductReviews);

// Protected routes (require authentication)
router.post('/products/:product_id/reviews', authenticateToken, reviewController.createReview);
router.put('/products/:product_id/reviews/:review_id', authenticateToken, reviewController.updateReview);
router.delete('/reviews/:review_id', authenticateToken, reviewController.deleteReview);
router.post('/reviews/:review_id/helpful', authenticateToken, reviewController.markHelpful);
router.get('/users/me/reviews', authenticateToken, reviewController.getUserReviews);

// Admin routes
router.get('/admin/reviews', authenticateToken, reviewController.getAllReviews);
router.put('/admin/reviews/:review_id/status', authenticateToken, reviewController.updateReviewStatus);

module.exports = router;
