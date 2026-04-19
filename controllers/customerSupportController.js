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

/* ── POST JSON to n8n webhook — production-ready with logging ── */
function callWebhook(payload) {
    return new Promise((resolve) => {
        const body = JSON.stringify(payload);
        const options = {
            hostname: WEBHOOK_HOST,
            port: WEBHOOK_PORT,
            path: WEBHOOK_PATH,
            method: 'POST',          // ALWAYS POST — never GET
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body, 'utf8'),
                'Accept': 'application/json, text/plain, */*'
            }
        };

        // Debug log — confirm method and payload
        console.log(`[n8n Webhook] → POST http://${WEBHOOK_HOST}:${WEBHOOK_PORT}${WEBHOOK_PATH}`);
        console.log(`[n8n Webhook] → Payload: ${body}`);

        const req = http.request(options, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[n8n Webhook] ← Status: ${res.statusCode} | Response: ${data.substring(0, 200)}`);
                const text = data.trim();
                if (!text || text === '' || text === '""') return resolve(null);
                // Try JSON first, fall back to plain text
                try {
                    const json = JSON.parse(text);
                    resolve(json);
                } catch {
                    // n8n returns plain text e.g. "வணக்கம்"
                    resolve({ reply_local: text, reply_en: text });
                }
            });
        });

        req.on('error', (e) => {
            console.error(`[n8n Webhook] ✗ Error: ${e.message}`);
            resolve(null);
        });
        req.on('timeout', () => {
            console.error('[n8n Webhook] ✗ Timeout after 30s');
            req.destroy();
            resolve(null);
        });

        req.write(body, 'utf8');
        req.end();
    });
}

/* ── Get preferred_language for a conversation ── */
function getConvLang(conversation_id) {
    return new Promise(resolve => {
        db.query(
            'SELECT preferred_language FROM customer_support_conversations WHERE conversation_id = ?',
            [conversation_id],
            (err, rows) => {
                if (err) { console.error('[getConvLang] Column may not exist:', err.message); return resolve('en'); }
                resolve(rows?.[0]?.preferred_language || 'en');
            }
        );
    });
}

/* ── Set preferred_language for a conversation ── */
function setConvLang(conversation_id, language) {
    return new Promise(resolve => {
        db.query(
            'UPDATE customer_support_conversations SET preferred_language = ? WHERE conversation_id = ?',
            [language, conversation_id],
            (err) => { if (err) console.error('[setConvLang] Column may not exist:', err.message); resolve(); }
        );
    });
}

/* ── Insert a message into DB — stores original, translated, and display message ── */
function insertMessage(conversation_id, sender_type, sender_name, message, message_original, message_translated) {
    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO customer_support_messages 
             (conversation_id, sender_type, sender_name, message, message_original, message_translated) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                conversation_id,
                sender_type,
                sender_name,
                message,                                          // display message (translated)
                message_original  || message,                    // original input
                message_translated || message                    // translated output
            ],
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
            await insertMessage(conversation_id, 'customer', customer_name || 'Customer', initial_message, initial_message, initial_message);

            // ALWAYS call n8n webhook for initial message
            console.log(`[createConversation] Calling n8n webhook for initial message, lang=en`);
            const initResult = await callWebhook({
                type: 'message',
                message: initial_message,
                language: 'en',
                source: 'customer'
            });
            console.log(`[createConversation] n8n response:`, initResult);

            // Use n8n response if available, else keyword bot
            const botEn = initResult?.reply_local || initResult?.reply_en || await getBotResponse(initial_message);
            await insertMessage(conversation_id, 'bot', 'Support Bot', botEn, initial_message, botEn);

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
                    [conversation_id],
                    (err, results) => err ? reject(err) : resolve(results.length > 0));
            });
            if (!exists) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }

            // ── LANGUAGE SELECT (NO MESSAGE SAVE) ──
            if (sender_type === 'language_select') {
                const langCode = language || message.toLowerCase().trim();
                await setConvLang(conversation_id, langCode);
                console.log(`[Lang] ✅ language_select: set preferred_language="${langCode}"`);
                return res.json({ success: true, message: 'Language preference saved', data: { language: langCode } });
            }

            // ── AUTO-DETECT: if message IS a language name/code, set it and stop ──
            const LANG_MAP = {
                'tamil':'ta', 'தமிழ்':'ta', 'ta':'ta',
                'hindi':'hi', 'हिंदी':'hi', 'hi':'hi',
                'telugu':'te', 'తెలుగు':'te', 'te':'te',
                'english':'en', 'en':'en'
            };
            const msgKey = message.trim().toLowerCase();
            const msgKeyOrig = message.trim();
            if (LANG_MAP[msgKey] || LANG_MAP[msgKeyOrig]) {
                const langCode = LANG_MAP[msgKey] || LANG_MAP[msgKeyOrig];
                await setConvLang(conversation_id, langCode);
                console.log(`[Lang] ✅ Auto-detected language="${langCode}" from message="${message}" — NOT storing as chat`);
                return res.json({ success: true, message: 'Language preference saved', data: { language: langCode } });
            }

            // Get conversation language — AFTER language detection
            const convLang = await getConvLang(conversation_id);
            console.log(`[Lang] convLang="${convLang}" for ${conversation_id}`);

            // Update timestamp
            db.query('UPDATE customer_support_conversations SET updated_at = NOW() WHERE conversation_id = ?', [conversation_id], () => {});

            console.log(`\n====== NEW MESSAGE ======`);
            console.log(`Sender: ${sender_type}`);
            console.log(`Lang: ${convLang}`);
            console.log(`Msg: ${message}`);

            // ─────────────────────────────
            // 🧠 CUSTOMER MESSAGE FLOW
            // ── CUSTOMER MESSAGE ──
            // Store English (translated) as main message for admin panel
            // Store original Tamil as message_original for chat widget
            if (sender_type === 'customer' || !sender_type) {
                // ── IDEMPOTENCY: block duplicate within 10 seconds ──
                const recentDup = await new Promise(resolve => {
                    db.query(
                        `SELECT id FROM customer_support_messages
                         WHERE conversation_id = ? AND sender_type = 'customer'
                           AND message_original = ? AND created_at >= NOW() - INTERVAL 10 SECOND
                         LIMIT 1`,
                        [conversation_id, message],
                        (err, rows) => resolve(rows?.[0] || null)
                    );
                });
                if (recentDup) {
                    console.log(`[Dedup] ⚠ Duplicate customer message blocked (id=${recentDup.id})`);
                    return res.json({ success:true, data:{ original:message, translated:message, deduplicated:true } });
                }

                console.log(`[n8n] → CUSTOMER: lang=${convLang} msg="${message}"`);
                const result = await callWebhook({ type:'message', message, language:convLang||'en', source:'customer' });
                console.log(`[n8n] ← CUSTOMER:`, result);
                const replyEn = result?.reply_en;
                const englishForAdmin = (replyEn && replyEn !== 'original') ? replyEn : message;
                console.log(`[DB] customer: original="${message}" english="${englishForAdmin}"`);
                // message = English (admin sees this), message_original = Tamil (widget shows this)
                await insertMessage(conversation_id, 'customer', sender_name||'Customer', englishForAdmin, message, englishForAdmin);
                return res.json({ success:true, data:{ original:message, translated:englishForAdmin } });
            }

            // ─────────────────────────────
            // 🧠 ADMIN / SUPPORT MESSAGE FLOW
            // ─────────────────────────────
            if (sender_type === 'support' || sender_type === 'admin') {
                // 1. Call n8n FIRST — translate English → local language
                console.log(`[n8n] → Payload:`, { type:'message', message, language:convLang||'en', source:'admin' });
                const result = await callWebhook({
                    type: 'message',
                    message: message,
                    language: convLang || 'en',
                    source: 'admin'
                });
                console.log(`[n8n] ← Admin response:`, result);

                // 2. Determine final values
                // n8n Code_Admin_Format sets reply_en="original" as placeholder — ignore it, use reply_local
                const replyLocal = result?.reply_local;
                const translated = (replyLocal && replyLocal !== 'original') ? replyLocal : message;  // local language for customer
                console.log(`[DB] Storing → original="${message}" translated="${translated}"`);

                // 3. ONE insert — translate first, then save
                await insertMessage(
                    conversation_id,
                    'support',
                    sender_name || 'Support Agent',
                    translated,       // message (display) = local language
                    message,          // message_original = English input
                    translated        // message_translated = local language
                );

                return res.json({
                    success: true,
                    data: { original: message, translated }
                });
            }

            // ─────────────────────────────
            // FALLBACK
            // ─────────────────────────────
            await insertMessage(conversation_id, sender_type||'bot', sender_name||'System', message, message, message);
            return res.json({ success: true, data: { original: message, translated: message } });

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
                    'SELECT id, sender_type, sender_name, message, message_original, message_translated, is_read, created_at FROM customer_support_messages WHERE conversation_id = ? ORDER BY created_at ASC',
                    [conversation_id],
                    (err, results) => { if (err) reject(err); else resolve(results); }
                );
            });
            // Also fetch preferred_language so frontend can use it
            const conv = await new Promise((resolve, reject) => {
                db.query(
                    'SELECT preferred_language FROM customer_support_conversations WHERE conversation_id = ?',
                    [conversation_id],
                    (err, rows) => { if (err) reject(err); else resolve(rows?.[0] || {}); }
                );
            });
            res.json({
                success: true,
                data: {
                    conversation_id,
                    preferred_language: conv.preferred_language || 'en',
                    messages
                }
            });
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
                    c.subject, c.status, c.priority, c.preferred_language,
                    c.created_at, c.updated_at,
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
