const express = require('express');
const CategoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, CategoryController.getAll);
router.get('/analytics', authenticateToken, CategoryController.getAnalytics);
router.get('/:id', authenticateToken, CategoryController.getOne);
router.post('/', authenticateToken, CategoryController.create);
router.put('/:id', authenticateToken, CategoryController.update);
router.put('/:id/move', authenticateToken, CategoryController.moveSubcategory);
router.delete('/:id', authenticateToken, CategoryController.delete);

module.exports = router;
