const db = require('../db/connection');

// Generate unique ticket number
const generateTicketNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `TKT-${timestamp}`;
};

// Get all tickets with pagination and filters
const getTickets = (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        status, 
        priority, 
        category, 
        assigned_to, 
        created_by,
        search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    
    // Build WHERE conditions - only add if values are not empty or undefined
    if (status && status.trim() !== '' && status !== 'undefined') {
        whereConditions.push('status = ?');
        queryParams.push(status);
    }
    
    if (priority && priority.trim() !== '' && priority !== 'undefined') {
        whereConditions.push('priority = ?');
        queryParams.push(priority);
    }
    
    if (category && category.trim() !== '' && category !== 'undefined') {
        whereConditions.push('category LIKE ?');
        queryParams.push(`%${category}%`);
    }
    
    if (assigned_to && assigned_to.trim() !== '' && assigned_to !== 'undefined') {
        whereConditions.push('assigned_to = ?');
        queryParams.push(assigned_to);
    }
    
    if (created_by && created_by.trim() !== '' && created_by !== 'undefined') {
        whereConditions.push('created_by = ?');
        queryParams.push(created_by);
    }
    
    if (search && search.trim() !== '' && search !== 'undefined') {
        whereConditions.push('(title LIKE ? OR description LIKE ? OR ticket_number LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tickets ${whereClause}`;
    
    db.query(countQuery, queryParams, (err, countResult) => {
        if (err) {
            console.error('Error counting tickets:', err);
            return res.status(500).json({ 
                error: 'Failed to count tickets',
                details: err.message 
            });
        }
        
        const total = countResult[0].total;
        
        // Get tickets with pagination
        const ticketsQuery = `
            SELECT * FROM tickets 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        queryParams.push(parseInt(limit), parseInt(offset));
        
        db.query(ticketsQuery, queryParams, (err, tickets) => {
            if (err) {
                console.error('Error fetching tickets:', err);
                return res.status(500).json({ 
                    error: 'Failed to fetch tickets',
                    details: err.message 
                });
            }
            
            res.json({
                success: true,
                data: tickets,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        });
    });
};

// Get single ticket with follow-ups
const getTicketById = (req, res) => {
    const { id } = req.params;
    
    // Get ticket details
    const ticketQuery = 'SELECT * FROM tickets WHERE id = ?';
    
    db.query(ticketQuery, [id], (err, ticketResult) => {
        if (err) {
            console.error('Error fetching ticket:', err);
            return res.status(500).json({ error: 'Failed to fetch ticket' });
        }
        
        if (ticketResult.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        const ticket = ticketResult[0];
        
        // Get follow-ups
        const followupsQuery = `
            SELECT * FROM ticket_followups 
            WHERE ticket_id = ? 
            ORDER BY created_at ASC
        `;
        
        db.query(followupsQuery, [id], (err, followups) => {
            if (err) {
                console.error('Error fetching follow-ups:', err);
                return res.status(500).json({ error: 'Failed to fetch follow-ups' });
            }
            
            res.json({
                success: true,
                data: {
                    ...ticket,
                    followups
                }
            });
        });
    });
};

// Create new ticket
const createTicket = (req, res) => {
    const { title, description, priority, category, assigned_to } = req.body;
    const created_by = req.user.email;
    
    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }
    
    const ticket_number = generateTicketNumber();
    
    const query = `
        INSERT INTO tickets (ticket_number, title, description, priority, category, assigned_to, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [ticket_number, title, description, priority || 'Medium', category, assigned_to, created_by], (err, result) => {
        if (err) {
            console.error('Error creating ticket:', err);
            return res.status(500).json({ error: 'Failed to create ticket' });
        }
        
        // Add initial follow-up
        const followupQuery = `
            INSERT INTO ticket_followups (ticket_id, comment, comment_type, created_by)
            VALUES (?, ?, ?, ?)
        `;
        
        const initialComment = 'Ticket created';
        
        db.query(followupQuery, [result.insertId, initialComment, 'Status Update', created_by], (err) => {
            if (err) {
                console.error('Error creating initial follow-up:', err);
            }
            
            res.status(201).json({
                success: true,
                message: 'Ticket created successfully',
                data: {
                    id: result.insertId,
                    ticket_number
                }
            });
        });
    });
};

// Update ticket
const updateTicket = (req, res) => {
    const { id } = req.params;
    const { title, description, priority, status, category, assigned_to } = req.body;
    const updated_by = req.user.email;
    
    let updateFields = [];
    let queryParams = [];
    
    if (title) {
        updateFields.push('title = ?');
        queryParams.push(title);
    }
    
    if (description) {
        updateFields.push('description = ?');
        queryParams.push(description);
    }
    
    if (priority) {
        updateFields.push('priority = ?');
        queryParams.push(priority);
    }
    
    if (status) {
        updateFields.push('status = ?');
        queryParams.push(status);
        
        // Set resolved_at or closed_at timestamps
        if (status === 'Resolved') {
            updateFields.push('resolved_at = NOW()');
        } else if (status === 'Closed') {
            updateFields.push('closed_at = NOW()');
        }
    }
    
    if (category) {
        updateFields.push('category = ?');
        queryParams.push(category);
    }
    
    if (assigned_to !== undefined) {
        updateFields.push('assigned_to = ?');
        queryParams.push(assigned_to);
    }
    
    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    queryParams.push(id);
    
    const query = `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ?`;
    
    db.query(query, queryParams, (err, result) => {
        if (err) {
            console.error('Error updating ticket:', err);
            return res.status(500).json({ error: 'Failed to update ticket' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // Add follow-up for the update
        const followupQuery = `
            INSERT INTO ticket_followups (ticket_id, comment, comment_type, created_by)
            VALUES (?, ?, ?, ?)
        `;
        
        let comment = 'Ticket updated';
        let comment_type = 'Status Update';
        
        if (status) {
            comment = `Status changed to: ${status}`;
        } else if (assigned_to !== undefined) {
            comment = assigned_to ? `Assigned to: ${assigned_to}` : 'Unassigned';
            comment_type = 'Assignment';
        }
        
        db.query(followupQuery, [id, comment, comment_type, updated_by], (err) => {
            if (err) {
                console.error('Error creating follow-up:', err);
            }
            
            res.json({
                success: true,
                message: 'Ticket updated successfully'
            });
        });
    });
};

// Add follow-up to ticket
const addFollowup = (req, res) => {
    const { id } = req.params;
    const { comment, comment_type } = req.body;
    const created_by = req.user.email;
    
    if (!comment) {
        return res.status(400).json({ error: 'Comment is required' });
    }
    
    const query = `
        INSERT INTO ticket_followups (ticket_id, comment, comment_type, created_by)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(query, [id, comment, comment_type || 'Comment', created_by], (err, result) => {
        if (err) {
            console.error('Error adding follow-up:', err);
            return res.status(500).json({ error: 'Failed to add follow-up' });
        }
        
        res.status(201).json({
            success: true,
            message: 'Follow-up added successfully',
            data: {
                id: result.insertId
            }
        });
    });
};

// Get ticket statistics
const getTicketStats = (req, res) => {
    const statsQuery = `
        SELECT 
            COUNT(*) as total_tickets,
            SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_tickets,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tickets,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_tickets,
            SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_tickets,
            SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as critical_tickets,
            SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high_priority_tickets
        FROM tickets
    `;
    
    db.query(statsQuery, (err, result) => {
        if (err) {
            console.error('Error fetching ticket stats:', err);
            return res.status(500).json({ error: 'Failed to fetch statistics' });
        }
        
        res.json({
            success: true,
            data: result[0]
        });
    });
};

// Delete ticket (soft delete by changing status)
const deleteTicket = (req, res) => {
    const { id } = req.params;
    const deleted_by = req.user.email;
    
    const query = 'UPDATE tickets SET status = "Closed", closed_at = NOW() WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting ticket:', err);
            return res.status(500).json({ error: 'Failed to delete ticket' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // Add follow-up for deletion
        const followupQuery = `
            INSERT INTO ticket_followups (ticket_id, comment, comment_type, created_by)
            VALUES (?, ?, ?, ?)
        `;
        
        db.query(followupQuery, [id, 'Ticket closed/deleted', 'Status Update', deleted_by], (err) => {
            if (err) {
                console.error('Error creating deletion follow-up:', err);
            }
            
            res.json({
                success: true,
                message: 'Ticket deleted successfully'
            });
        });
    });
};

// Get user's own tickets
const getMyTickets = (req, res) => {
    const userEmail = req.user.email;
    
    const query = `
        SELECT * FROM tickets 
        WHERE created_by = ?
        ORDER BY created_at DESC
    `;
    
    db.query(query, [userEmail], (err, tickets) => {
        if (err) {
            console.error('Error fetching user tickets:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to fetch tickets',
                details: err.message 
            });
        }
        
        res.json({
            success: true,
            data: tickets
        });
    });
};

// Get user's ticket followups
const getMyFollowups = (req, res) => {
    const userEmail = req.user.email;
    
    const query = `
        SELECT 
            tf.*,
            t.ticket_number,
            t.title as ticket_title,
            t.status as ticket_status
        FROM ticket_followups tf
        INNER JOIN tickets t ON tf.ticket_id = t.id
        WHERE t.created_by = ?
        ORDER BY tf.created_at DESC
    `;
    
    db.query(query, [userEmail], (err, followups) => {
        if (err) {
            console.error('Error fetching user followups:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to fetch followups',
                details: err.message 
            });
        }
        
        res.json({
            success: true,
            data: followups
        });
    });
};

// Get unread message counts for all tickets
const getUnreadCounts = (req, res) => {
    const query = `
        SELECT 
            ticket_id,
            COUNT(*) as unread_count
        FROM ticket_followups
        WHERE is_read = 0 AND created_by != ?
        GROUP BY ticket_id
    `;
    
    const userEmail = req.user.email;
    
    db.query(query, [userEmail], (err, results) => {
        if (err) {
            console.error('Error fetching unread counts:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to fetch unread counts',
                details: err.message 
            });
        }
        
        // Convert to object format { ticketId: count }
        const counts = {};
        results.forEach(row => {
            counts[row.ticket_id] = row.unread_count;
        });
        
        res.json({
            success: true,
            data: counts
        });
    });
};

// Mark ticket messages as read
const markTicketAsRead = (req, res) => {
    const { id } = req.params;
    const userEmail = req.user.email;
    
    const query = `
        UPDATE ticket_followups 
        SET is_read = 1 
        WHERE ticket_id = ? AND created_by != ? AND is_read = 0
    `;
    
    db.query(query, [id, userEmail], (err, result) => {
        if (err) {
            console.error('Error marking messages as read:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to mark as read',
                details: err.message 
            });
        }
        
        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    });
};

module.exports = {
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
};