const db = require('../../db/connection');

class ContextEngine {
  static async gatherContext(conversationId, options = {}) {
    const context = {
      conversation: null,
      customer: null,
      messages: [],
      orders: [],
      products: [],
      delivery: null,
      refundHistory: [],
      previousConversations: [],
      sentiment: null,
      customerValue: null,
    };

    try {
      const [convs] = await db.promise().query(
        'SELECT * FROM customer_support_conversations WHERE conversation_id = ? LIMIT 1',
        [conversationId]
      );
      if (convs.length > 0) {
        context.conversation = convs[0];
        context.customer = {
          name: convs[0].customer_name,
          email: convs[0].customer_email,
          phone: convs[0].customer_phone,
        };
      }
    } catch (e) { console.warn('[ContextEngine] conversation:', e.message); }

    if (context.customer?.email) {
      const email = context.customer.email;

      try {
        const [orders] = await db.promise().query(
          `SELECT wo.*, COUNT(woi.id) as item_count,
                  SUM(woi.quantity * woi.price) as total_amount
           FROM website_orders wo
           LEFT JOIN website_order_items woi ON wo.id = woi.order_id
           WHERE wo.customer_email = ?
           GROUP BY wo.id
           ORDER BY wo.created_at DESC LIMIT 10`,
          [email]
        );
        context.orders = orders;
      } catch (e) { console.warn('[ContextEngine] orders:', e.message); }

      try {
        const [products] = await db.promise().query(
          `SELECT DISTINCT wp.* FROM website_orders wo
           JOIN website_order_items woi ON wo.id = woi.order_id
           JOIN website_products wp ON woi.product_id = wp.id
           WHERE wo.customer_email = ?
           LIMIT 10`,
          [email]
        );
        context.products = products;
      } catch (e) { console.warn('[ContextEngine] products:', e.message); }

      try {
        const [prev] = await db.promise().query(
          `SELECT conversation_id, subject, status, created_at,
                  (SELECT COUNT(*) FROM customer_support_messages WHERE conversation_id = c.conversation_id) as msg_count
           FROM customer_support_conversations c
           WHERE customer_email = ? AND conversation_id != ?
           ORDER BY created_at DESC LIMIT 5`,
          [email, conversationId]
        );
        context.previousConversations = prev;
      } catch (e) { console.warn('[ContextEngine] prev convos:', e.message); }
    }

    try {
      const [msgs] = await db.promise().query(
        'SELECT sender_type, message, message_original, created_at FROM customer_support_messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );
      context.messages = msgs;
    } catch (e) { console.warn('[ContextEngine] messages:', e.message); }

    return context;
  }

  static buildContextSummary(context) {
    const parts = [];

    if (context.conversation) {
      parts.push(`Subject: ${context.conversation.subject || 'N/A'}`);
      parts.push(`Status: ${context.conversation.status}`);
      parts.push(`Priority: ${context.conversation.priority || 'not set'}`);
      parts.push(`Language: ${context.conversation.preferred_language || 'en'}`);
    }

    if (context.orders.length > 0) {
      parts.push(`\nOrders (${context.orders.length}):`);
      context.orders.slice(0, 3).forEach(o => {
        parts.push(`- #${o.id}: ₹${Number(o.total_amount || 0).toLocaleString('en-IN')} (${o.status || 'N/A'})`);
      });
      if (context.orders.length > 3) parts.push(`- ...and ${context.orders.length - 3} more`);
    }

    if (context.previousConversations.length > 0) {
      parts.push(`\nPrevious conversations: ${context.previousConversations.length}`);
    }

    if (context.messages.length > 0) {
      const customerMsgs = context.messages.filter(m => m.sender_type === 'customer');
      const supportMsgs = context.messages.filter(m => m.sender_type === 'support');
      parts.push(`\nMessages: ${context.messages.length} total (${customerMsgs.length} customer, ${supportMsgs.length} support)`);
    }

    return parts.join('\n');
  }
}

module.exports = ContextEngine;
