/**
 * CUSTOMER SUPPORT CONTROLLER
 * Handles customer queries, bot responses, and support chat
 */

const db = require('../db/connection');
const http = require('http');

const TRANSLATE_WEBHOOK_HOST = '13.215.172.213';
const TRANSLATE_WEBHOOK_PATH = '/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030';
const TRANSLATE_WEBHOOK = `http://${TRANSLATE_WEBHOOK_HOST}:5678${TRANSLATE_WEBHOOK_PATH}`;

/**
 * Call translate webhook using Node.js http module (no fetch dependency)
 */
function callTranslateWebhook(message, language) {
    return new Promise((resolve) => {
        const query = `?message=${encodeURIComponent(message)}&language=${encodeURIComponent(language || 'en')}`;
        const options = {
            hostname: TRANSLATE_WEBHOOK_HOST,
            port: 5678,
            path: TRANSLATE_WEBHOOK_PATH + query,
            method: 'GET',
            timeout: 8000,
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (!data || data.trim() === '' || data.trim() === '""') return resolve(null);
                    const json = JSON.parse(data);
                    resolve(json);
                } catch { resolve(null); }
            });
        });
        req.on('error', (e) => { console.error('Translate webhook http error:', e.message); resolve(null); });
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.end();
    });
}

/**
 * Translate text via n8n translate webhook
 */
async function translateText(text, language) {
    if (!language || language === 'en') return text;
    const result = await callTranslateWebhook(text, language);
    if (!result) return text;
    return result.reply_local || result.translated || result.output || result.message || text;
}

/**
 * Detect language from message
 */
async function detectLanguage(message) {
    const result = await callTranslateWebhook(message, null);
    return result?.detected_language || result?.language || 'en';
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

            // Detect language and translate bot response
            const detectedLang = await detectLanguage(initial_message);
            
            // Store detected language
            db.query('UPDATE customer_support_conversations SET preferred_language = ? WHERE conversation_id = ?', 
                [detectedLang, conversation_id], () => {});

            // Call translate webhook for initial response
            let translatedBotResponse = null;
            let englishBotResponse = null;
            try {
                const tJson = await callTranslateWebhook(initial_message, detectedLang);
                if (tJson) {
                    translatedBotResponse = tJson.reply_local || tJson.output || null;
                    englishBotResponse = tJson.reply_en || null;
                }
            } catch(e) { console.error('Translate webhook error on create:', e.message); }

            // Fallback to keyword bot
            if (!translatedBotResponse) {
                const botResponse = await getBotResponse(initial_message);
                translatedBotResponse = await translateText(botResponse, detectedLang);
            }

            if (translatedBotResponse) {
                const botMessageQuery = `INSERT INTO customer_support_messages (conversation_id, sender_type, sender_name, message) VALUES (?, 'bot', 'Support Bot', ?)`;
                await new Promise((resolve, reject) => {
                    db.query(botMessageQuery, [conversation_id, translatedBotResponse], (err, result) => {
                        if (err) reject(err); else resolve(result);
                    });
                });
                if (englishBotResponse && englishBotResponse !== translatedBotResponse) {
                    await new Promise((resolve, reject) => {
                        db.query(botMessageQuery.replace('Support Bot', 'Support Bot (EN)'), 
                            [conversation_id, `[EN] ${englishBotResponse}`], 
                            (err, result) => { if (err) reject(err); else resolve(result); });
                    });
                }
            }

            res.status(201).json({
                success: true,
                message: 'Conversation created successfully',
                data: { conversation_id, bot_response: translatedBotResponse, detected_language: detectedLang }
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

            // Get conversation's preferred language
            const convLang = await new Promise(resolve => {
                db.query('SELECT preferred_language FROM customer_support_conversations WHERE conversation_id = ?', 
                    [conversation_id], (err, rows) => resolve(rows?.[0]?.preferred_language || 'en'));
            });

            // If SUPPORT/AGENT message → translate to customer's language before storing
            let messageToStore = message;
            if ((sender_type === 'support' || sender_type === 'bot') && convLang && convLang !== 'en') {
                const tJson = await callTranslateWebhook(message, convLang);
                if (tJson && (tJson.reply_local || tJson.output)) {
                    messageToStore = tJson.reply_local || tJson.output || message;
                }
            }

            await new Promise((resolve, reject) => {
                db.query(insertQuery, [
                    conversation_id,
                    sender_type || 'customer',
                    sender_name || 'Customer',
                    messageToStore
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
                // Step 1: Call translate webhook to get response in customer's language
                // convLang already fetched above

                // Step 2: Send message to translate webhook → get reply_local + reply_en
                let translatedReply = null;
                try {
                    const tJson = await callTranslateWebhook(message, convLang);
                    if (tJson) {
                        translatedReply = tJson.reply_local || tJson.output || null;
                        const englishReply = tJson.reply_en || null;
                        
                        if (translatedReply) {
                            // Post translated (local language) response
                            await new Promise((resolve, reject) => {
                                db.query(insertQuery, [conversation_id, 'bot', 'Support Bot', translatedReply], 
                                    (err, result) => { if (err) reject(err); else resolve(result); });
                            });
                            botResponse = translatedReply;
                        }
                        if (englishReply && englishReply !== translatedReply) {
                            // Also post English version for admin reference
                            await new Promise((resolve, reject) => {
                                db.query(insertQuery, [conversation_id, 'bot', 'Support Bot (EN)', `[EN] ${englishReply}`],
                                    (err, result) => { if (err) reject(err); else resolve(result); });
                            });
                        }
                    }
                } catch(translateErr) {
                    console.error('Translate webhook error:', translateErr.message);
                }

                // Fallback to keyword bot if translate webhook failed
                if (!translatedReply) {
                    botResponse = await getBotResponse(message);
                    const translated = await translateText(botResponse, convLang);
                    if (translated) {
                        await new Promise((resolve, reject) => {
                            db.query(insertQuery, [conversation_id, 'bot', 'Support Bot', translated],
                                (err, result) => { if (err) reject(err); else resolve(result); });
                        });
                        botResponse = translated;
                    }
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
