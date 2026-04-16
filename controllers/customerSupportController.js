/**
 * CUSTOMER SUPPORT CONTROLLER
 * Handles customer queries, bot responses, and support chat
 */

const db = require('../db/connection');
const http = require('http');

const TRANSLATE_WEBHOOK = 'http://13.215.172.213:5678/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030';

/**
 * Translate text via n8n translate webhook (GET request)
 */
async function translateText(text, language) {
    if (!language || language === 'en') return text;
    try {
        const url = `${TRANSLATE_WEBHOOK}?message=${encodeURIComponent(text)}&language=${language}`;
        const res = await fetch(url);
        const raw = await res.text();
        if (!raw || raw.trim() === '' || raw.trim() === '""') return text;
        try {
            const json = JSON.parse(raw);
            return json.reply_local || json.translated || json.output || json.message || text;
        } catch { return raw || text; }
    } catch (e) {
        console.error('Translation error:', e.message);
        return text;
    }
}

/**
 * Detect language from message via n8n translate webhook
 */
async function detectLanguage(message) {
    try {
        const url = `${TRANSLATE_WEBHOOK}?message=${encodeURIComponent(message)}&detect=true`;
        const res = await fetch(url);
        const raw = await res.text();
        const json = JSON.parse(raw);
        return json.detected_language || json.language || 'en';
    } catch { return 'en'; }
}

/**
 * Get bot response based on message content
 */
async function getBotResponse(message) {
    try {
        const messageLower = message.toLowerCase();
        
        const query = `
            SELECT response, keyword 
            FROM customer_support_bot_responses 
            WHERE is_active = TRUE
            ORDER BY LENGTH(keyword) DESC
        `;

        const responses = await new Promise((resolve, reject) => {
            db.query(query, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // Find matching keyword
        for (const row of responses) {
            if (messageLower.includes(row.keyword.toLowerCase())) {
                // Update usage count
                db.query(
                    'UPDATE customer_support_bot_responses SET usage_count = usage_count + 1 WHERE keyword = ?',
                    [row.keyword],
                    () => {}
                );
                return row.response;
            }
        }

        // Default response if no keyword matches
        return 'Thank you for contacting us. A support representative will assist you shortly.';

    } catch (error) {
        console.error('Bot response error:', error);
        return 'Thank you for your message. Our team will get back to you soon.';
    }
}

class CustomerSupportController {
    
    /**
     * Create a new support conversation
     * POST /api/customer-support/conversations
     */
    async createConversation(req, res) {
        try {
            const {
                customer_name,
                customer_email,
                customer_phone,
                subject,
                initial_message
            } = req.body;

            if (!customer_email || !initial_message) {
                return res.status(400).json({
                    success: false,
                    message: 'Customer email and initial message are required'
                });
            }

            // Generate unique conversation ID
            const conversation_id = `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Create conversation
            const conversationQuery = `
                INSERT INTO customer_support_conversations 
                (conversation_id, customer_name, customer_email, customer_phone, subject, status)
                VALUES (?, ?, ?, ?, ?, 'open')
            `;

            await new Promise((resolve, reject) => {
                db.query(conversationQuery, [
                    conversation_id,
                    customer_name,
                    customer_email,
                    customer_phone,
                    subject || 'General Inquiry'
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            // Add initial customer message
            const messageQuery = `
                INSERT INTO customer_support_messages 
                (conversation_id, sender_type, sender_name, message)
                VALUES (?, 'customer', ?, ?)
            `;

            await new Promise((resolve, reject) => {
                db.query(messageQuery, [
                    conversation_id,
                    customer_name || 'Customer',
                    initial_message
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            // Get bot response
            const botResponse = await getBotResponse(initial_message);
            
            // Detect language and translate bot response
            const detectedLang = await detectLanguage(initial_message);
            const translatedBotResponse = await translateText(botResponse, detectedLang);
            
            // Store detected language in conversation
            db.query('UPDATE customer_support_conversations SET preferred_language = ? WHERE conversation_id = ?', 
                [detectedLang, conversation_id], () => {});
            
            if (translatedBotResponse) {
                const botMessageQuery = `
                    INSERT INTO customer_support_messages 
                    (conversation_id, sender_type, sender_name, message)
                    VALUES (?, 'bot', 'Support Bot', ?)
                `;
                
                await new Promise((resolve, reject) => {
                    db.query(botMessageQuery, [conversation_id, translatedBotResponse], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            }

            res.status(201).json({
                success: true,
                message: 'Conversation created successfully',
                data: {
                    conversation_id,
                    bot_response: translatedBotResponse,
                    detected_language: detectedLang
                }
            });

        } catch (error) {
            console.error('Create conversation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create conversation',
                error: error.message
            });
        }
    }

    /**
     * Send a message in a conversation
     * POST /api/customer-support/conversations/:conversation_id/messages
     */
    async sendMessage(req, res) {
        try {
            const { conversation_id } = req.params;
            const { message, sender_type, sender_name } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            // Check if conversation exists
            const checkQuery = 'SELECT id FROM customer_support_conversations WHERE conversation_id = ?';
            const exists = await new Promise((resolve, reject) => {
                db.query(checkQuery, [conversation_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results.length > 0);
                });
            });

            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            // Insert message
            const insertQuery = `
                INSERT INTO customer_support_messages 
                (conversation_id, sender_type, sender_name, message)
                VALUES (?, ?, ?, ?)
            `;

            await new Promise((resolve, reject) => {
                db.query(insertQuery, [
                    conversation_id,
                    sender_type || 'customer',
                    sender_name || 'Customer',
                    message
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            // Update conversation timestamp
            db.query(
                'UPDATE customer_support_conversations SET updated_at = NOW() WHERE conversation_id = ?',
                [conversation_id],
                () => {}
            );

            // Get bot response if customer message
            let botResponse = null;
            if (sender_type === 'customer' || !sender_type) {
                botResponse = await getBotResponse(message);
                
                if (botResponse) {
                    // Get conversation's preferred language and translate
                    const convLang = await new Promise(resolve => {
                        db.query('SELECT preferred_language FROM customer_support_conversations WHERE conversation_id = ?', 
                            [conversation_id], (err, rows) => resolve(rows?.[0]?.preferred_language || 'en'));
                    });
                    const translatedBot = await translateText(botResponse, convLang);
                    
                    await new Promise((resolve, reject) => {
                        db.query(insertQuery, [
                            conversation_id,
                            'bot',
                            'Support Bot',
                            translatedBot
                        ], (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });
                    botResponse = translatedBot;
                }
            }

            res.json({
                success: true,
                message: 'Message sent successfully',
                data: {
                    bot_response: botResponse
                }
            });

        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send message',
                error: error.message
            });
        }
    }

    /**
     * Get conversation messages
     * GET /api/customer-support/conversations/:conversation_id/messages
     */
    async getMessages(req, res) {
        try {
            const { conversation_id } = req.params;

            const query = `
                SELECT 
                    id,
                    sender_type,
                    sender_name,
                    message,
                    is_read,
                    created_at
                FROM customer_support_messages
                WHERE conversation_id = ?
                ORDER BY created_at ASC
            `;

            const messages = await new Promise((resolve, reject) => {
                db.query(query, [conversation_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            res.json({
                success: true,
                data: {
                    conversation_id,
                    messages
                }
            });

        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get messages',
                error: error.message
            });
        }
    }

    /**
     * Get all conversations (for admin/support)
     * GET /api/customer-support/conversations
     */
    async getAllConversations(req, res) {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = '';
            const params = [];

            if (status) {
                whereClause = 'WHERE status = ?';
                params.push(status);
            }

            const query = `
                SELECT 
                    c.id,
                    c.conversation_id,
                    c.customer_name,
                    c.customer_email,
                    c.customer_phone,
                    c.subject,
                    c.status,
                    c.priority,
                    c.created_at,
                    c.updated_at,
                    (SELECT COUNT(*) FROM customer_support_messages WHERE conversation_id = c.conversation_id) as message_count,
                    (SELECT message FROM customer_support_messages WHERE conversation_id = c.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message
                FROM customer_support_conversations c
                ${whereClause}
                ORDER BY c.updated_at DESC
                LIMIT ? OFFSET ?
            `;

            params.push(parseInt(limit), parseInt(offset));

            const conversations = await new Promise((resolve, reject) => {
                db.query(query, params, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM customer_support_conversations ${whereClause}`;
            const countParams = status ? [status] : [];
            
            const countResult = await new Promise((resolve, reject) => {
                db.query(countQuery, countParams, (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0].total);
                });
            });

            res.json({
                success: true,
                data: {
                    conversations,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: countResult,
                        pages: Math.ceil(countResult / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get conversations error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversations',
                error: error.message
            });
        }
    }

    /**
     * Update conversation status
     * PATCH /api/customer-support/conversations/:conversation_id/status
     */
    async updateStatus(req, res) {
        try {
            const { conversation_id } = req.params;
            const { status } = req.body;

            const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be: open, in_progress, resolved, or closed'
                });
            }

            const query = `
                UPDATE customer_support_conversations 
                SET status = ?, closed_at = ${status === 'closed' ? 'NOW()' : 'NULL'}
                WHERE conversation_id = ?
            `;

            await new Promise((resolve, reject) => {
                db.query(query, [status, conversation_id], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            res.json({
                success: true,
                message: 'Status updated successfully'
            });

        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update status',
                error: error.message
            });
        }
    }

    /**
     * Rate a conversation
     * POST /api/customer-support/conversations/:conversation_id/rating
     */
    async rateConversation(req, res) {
        try {
            const { conversation_id } = req.params;
            const { rating, feedback } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            const query = `
                INSERT INTO customer_support_ratings 
                (conversation_id, rating, feedback)
                VALUES (?, ?, ?)
            `;

            await new Promise((resolve, reject) => {
                db.query(query, [conversation_id, rating, feedback], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            res.json({
                success: true,
                message: 'Thank you for your feedback!'
            });

        } catch (error) {
            console.error('Rate conversation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit rating',
                error: error.message
            });
        }
    }
}

module.exports = new CustomerSupportController();
