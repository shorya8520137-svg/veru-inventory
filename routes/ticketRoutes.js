const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getTickets,
    getTicketById,
    createTicket,
    updateTicket,
    addFollowup,
    getTicketStats,
    deleteTicket,
    getMyTickets,
    getMyFollowups,
    getUnreadCounts,
    markTicketAsRead
} = require('../controllers/ticketController');

// All routes require authentication
router.use(authenticateToken);

// Get ticket statistics
router.get('/stats', getTicketStats);

// Get user's own tickets
router.get('/my-tickets', getMyTickets);

// Get user's ticket followups
router.get('/my-followups', getMyFollowups);

// Get unread message counts
router.get('/unread-counts', getUnreadCounts);

// Get all tickets with filters and pagination
router.get('/', getTickets);

// Get single ticket with follow-ups
router.get('/:id', getTicketById);

// Create new ticket
router.post('/', createTicket);

// Update ticket
router.put('/:id', updateTicket);

// Add follow-up to ticket
router.post('/:id/followup', addFollowup);

// Mark ticket messages as read
router.post('/:id/mark-read', markTicketAsRead);

// Delete ticket (soft delete)
router.delete('/:id', deleteTicket);

module.exports = router;