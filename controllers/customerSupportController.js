/**
 * CUSTOMER SUPPORT CONTROLLER
 * 2-way translation via n8n webhook
 *
 * FLOW:
 * 1. Language select  → {type:"language_select", language:"ta"} → store in DB, NO chat message
 * 2. Customer message → {type:"message", message, language, source:"customer"} → n8n → English for admin
 * 3. Admin message    → {type:"message", message, language, source:"admin"}    → n8n → Tamil for customer
 */

const db = require('../db/connection');
const http = require('http');

const WEBHOOK_HOST = '13.215.172.213';
const WEBHOOK_PORT = 5678;
const WEBHOOK_PATH = '/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030';

/* ── POST JSON to n8n webhook ── */
function callWebhook(payload) {
    return new Promise((resolve) => {
        const body = JSON.stringify(payload);
        const options = {
            hostname: WEBHOOK_HOST,
            port: WEBHOOK_PORT,
            path: WEBHOOK_PATH,
            method: 'POST',
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (!data || data.trim() === '' || data.trim() === '""') return resolve(null);
                    resolve(JSON.parse(data));
                } catch { resolve(null); }
            });
        });
        req.on('error', (e) => { console.error('[Webhook Error]', e.message); resolve(null); });
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(body);
        req.end();
    });
}

/* ── Get preferred_language for a conversation ── */
function getConvLang(conversation_id) {
    return new Promise(resolve => {
        db.query(
            'SELECT preferred_language FROM customer_support_conversations WHERE conversation_id = ?',
            [conversation_id],
            (err, rows) => resolve(rows?.[0]?.preferred_language || 'en')
        );
    });
}

/* ── Set preferred_language for a conversation ── */
function setConvLang(conversation_id, language) {
    return new Promise(resolve => {
        db.query(
            'UPDATE customer_support_conversations SET preferred_language = ? WHERE conversation_id = ?',
            [language, conversation_id],
            () => resolve()
        );
    });
}

/* ── Insert a message into DB ── */
function insertMessage(conversation_id, sender_type, sender_name, message) {
    return new Promise((resolve, reject) => {
        db.query(
            'INSERT INTO customer_support_messages (conversation_id, sender_type, sender_name, message) VALUES (?, ?, ?, ?)',
            [conversation_id, sender_type, sender_name, message],
            (err, result) => { if (err) reject(err); else resolve(result); }
        );
    });
}

/* ── Bot keyword response ── */
async function getBotResponse(message) {
    try {
        const messageLower = message.toLowerCase();
        const responses = await new Promise((resolve, reject) => {
            db.query(
                'SELECT response, keyword FROM customer_support_bot_responses WHERE is_active = TRUE ORDER BY LENGTH(keyword) DESC',
                (err, results) => { if (err) reject(err); else resolve(results); }
            );
        });
        for (const row of responses) {
            if (messageLower.includes(row.keyword.toLowerCase())) {
                db.query('UPDATE customer_support_bot_responses SET usage_count = usage_count + 1 WHERE keyword = ?', [row.keyword], () => {});
                return row.response;
            }
        }
        return 'Thank you for contacting us. A support representative will assist you shortly.';
    } catch {
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
            const { customer_name, customer_email, customer_phone, subject, initial_message } = req.body;

            if (!customer_email || !initial_message) {
                return res.status(400).json({ success: false, message: 'Customer email and initial message are required' });
            }

            const conversation_id = `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Create conversation
            await new Promise((resolve, reject) => {
                db.query(
                    "INSERT INTO customer_support_conversations (conversation_id, customer_name, customer_email, customer_phone, subject, status) VALUES (?, ?, ?, ?, ?, 'open')",
                    [conversation_id, customer_name, customer_email, customer_phone, subject || 'General Inquiry'],
                    (err, result) => { if (err) reject(err); else resolve(result); }
                );
            });

            // Store initial customer message
            await insertMessage(conversation_id, 'customer', customer_name || 'Customer', initial_message);

            // Get bot response (English) and store for admin
            const botEn = await getBotResponse(initial_message);
            await insertMessage(conversation_id, 'bot', 'Support Bot', botEn);

            res.status(201).json({
                success: true,
                message: 'Conversation created successfully',
                data: { conversation_id, bot_response: botEn }
            });

        } catch (error) {
            console.error('Create conversation error:', error);
            res.status(500).json({ success: false, message: 'Failed to create conversation', error: error.message });
        }
    }

    /**
     * Send a message in a conversation
     * POST /api/customer-support/conversations/:conversation_id/messages
     *
     * Special case: sender_type = "language_select" → store language, no chat message
     */
    async sendMessage(req, res) {
        try {
            const { conversation_id } = req.params;
            const { message, sender_type, sender_name, language } = req.body;

            if (!message) {
                return res.status(400).json({ success: false, message: 'Message is required' });
            }

            // Check conversation exists
            const exists = await new Promise((resolve, reject) => {
                db.query('SELECT id FROM customer_support_conversations WHERE conversation_id = ?',
                    [conversation_id], (err, results) => { if (err) reject(err); else resolve(results.length > 0); });
            });
            if (!exists) return res.status(404).json({ success: false, message: 'Conversation not found' });

            // ── LANGUAGE SELECTION ──
            // When customer selects language (e.g. "Tamil"), store it — do NOT create a chat message
            if (sender_type === 'language_select') {
                const langCode = language || message.toLowerCase().trim();
                await setConvLang(conversation_id, langCode);
                return res.json({ success: true, message: 'Language preference saved', data: { language: langCode } });
            }

            // ── Get stored language for this conversation ──
            const convLang = await getConvLang(conversation_id);

            // Update timestamp
            db.query('UPDATE customer_support_conversations SET updated_at = NOW() WHERE conversation_id = ?', [conversation_id], () => {});

            // ── CUSTOMER MESSAGE ──
            if (sender_type === 'customer' || !sender_type) {
                // Store original customer message (in their language)
                await insertMessage(conversation_id, 'customer', sender_name || 'Customer', message);

                // If language is set and not English → translate to English for admin
                let adminMessage = message;
                if (convLang && convLang !== 'en') {
                    const result = await callWebhook({
                        type: 'message',
                        message: message,
                        language: convLang,
                        source: 'customer'
                    });
                    if (result?.reply_en) {
                        adminMessage = result.reply_en;
                        // Store English translation for admin (prefixed so widget can filter)
                        await insertMessage(conversation_id, 'bot', 'Support Bot (EN)', `[EN] ${adminMessage}`);
                    }
                }

                // Bot auto-response in English (for admin)
                const botEn = await getBotResponse(message);

                // If language set → translate bot response to customer's language
                if (convLang && convLang !== 'en') {
                    const result = await callWebhook({
                        type: 'message',
                        message: botEn,
                        language: convLang,
                        source: 'admin'
                    });
                    const botLocal = result?.reply_local || botEn;
                    // Store translated bot response — customer sees this
                    await insertMessage(conversation_id, 'bot', 'Support Bot', botLocal);
                } else {
                    await insertMessage(conversation_id, 'bot', 'Support Bot', botEn);
                }

                return res.json({ success: true, message: 'Message sent successfully' });
            }

            // ── SUPPORT / ADMIN MESSAGE ──
            if (sender_type === 'support' || sender_type === 'admin') {
                if (convLang && convLang !== 'en') {
                    // Translate admin message to customer's language
                    const result = await callWebhook({
                        type: 'message',
                        message: message,
                        language: convLang,
                        source: 'admin'
                    });
                    const localMsg = result?.reply_local || message;
                    // Store translated message — customer sees this
                    await insertMessage(conversation_id, 'support', sender_name || 'Support Agent', localMsg);
                } else {
                    // No translation needed
                    await insertMessage(conversation_id, 'support', sender_name || 'Support Agent', message);
                }

                return res.json({ success: true, message: 'Message sent successfully' });
            }

            // ── BOT MESSAGE (direct insert, no translation) ──
            await insertMessage(conversation_id, sender_type, sender_name || 'Bot', message);
            return res.json({ success: true, message: 'Message sent successfully' });

        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
        }
    }

    /**
     * Get conversation messages
     * GET /api/customer-support/conversations/:conversation_id/messages
     */
    async getMessages(req, res) {
        try {
            const { conversation_id } = req.params;
            const messages = await new Promise((resolve, reject) => {
                db.query(
                    'SELECT id, sender_type, sender_name, message, is_read, created_at FROM customer_support_messages WHERE conversation_id = ? ORDER BY created_at ASC',
                    [conversation_id],
                    (err, results) => { if (err) reject(err); else resolve(results); }
                );
            });
            res.json({ success: true, data: { conversation_id, messages } });
        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({ success: false, message: 'Failed to get messages', error: error.message });
        }
    }

    /**
     * Get all conversations (admin)
     * GET /api/customer-support/conversations
     */
    async getAllConversations(req, res) {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;
            let whereClause = '';
            const params = [];
            if (status) { whereClause = 'WHERE status = ?'; params.push(status); }

            const query = `
                SELECT c.id, c.conversation_id, c.customer_name, c.customer_email, c.customer_phone,
                    c.subject, c.status, c.priority, c.preferred_language, c.inquiry_type,
                    c.description, c.created_at, c.updated_at,
                    (SELECT COUNT(*) FROM customer_support_messages WHERE conversation_id = c.conversation_id) as message_count,
                    (SELECT message FROM customer_support_messages WHERE conversation_id = c.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message
                FROM customer_support_conversations c
                ${whereClause}
                ORDER BY c.updated_at DESC
                LIMIT ? OFFSET ?
            `;
            params.push(parseInt(limit), parseInt(offset));

            const conversations = await new Promise((resolve, reject) => {
                db.query(query, params, (err, results) => { if (err) reject(err); else resolve(results); });
            });

            const countQuery = `SELECT COUNT(*) as total FROM customer_support_conversations ${whereClause}`;
            const countParams = status ? [status] : [];
            const total = await new Promise((resolve, reject) => {
                db.query(countQuery, countParams, (err, results) => { if (err) reject(err); else resolve(results[0].total); });
            });

            res.json({
                success: true,
                data: {
                    conversations,
                    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
                }
            });
        } catch (error) {
            console.error('Get conversations error:', error);
            res.status(500).json({ success: false, message: 'Failed to get conversations', error: error.message });
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
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }
            await new Promise((resolve, reject) => {
                db.query(
                    `UPDATE customer_support_conversations SET status = ?, closed_at = ${status === 'closed' ? 'NOW()' : 'NULL'} WHERE conversation_id = ?`,
                    [status, conversation_id],
                    (err, result) => { if (err) reject(err); else resolve(result); }
                );
            });
            res.json({ success: true, message: 'Status updated successfully' });
        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
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
                return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
            }
            await new Promise((resolve, reject) => {
                db.query(
                    'INSERT INTO customer_support_ratings (conversation_id, rating, feedback) VALUES (?, ?, ?)',
                    [conversation_id, rating, feedback],
                    (err, result) => { if (err) reject(err); else resolve(result); }
                );
            });
            res.json({ success: true, message: 'Thank you for your feedback!' });
        } catch (error) {
            console.error('Rate conversation error:', error);
            res.status(500).json({ success: false, message: 'Failed to submit rating', error: error.message });
        }
    }
}

module.exports = new CustomerSupportController();
