const db = require('../../db/connection');

class TimelineService {
  static async logEvent(conversationId, eventType, details, metadata = {}) {
    try {
      const [result] = await db.promise().query(
        `INSERT INTO omnichannel_timeline (conversation_id, event_type, details, metadata)
         VALUES (?, ?, ?, ?)`,
        [conversationId, eventType, details, JSON.stringify(metadata)]
      );
      return { success: true, id: result.insertId };
    } catch (e) {
      console.error('[TimelineService] logEvent error:', e.message);
      return { success: false, error: e.message };
    }
  }

  static async getTimeline(conversationId) {
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM omnichannel_timeline WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );
      return rows.map(r => ({
        ...r,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      }));
    } catch (e) {
      console.error('[TimelineService] getTimeline error:', e.message);
      return [];
    }
  }

  static async insertMessage(conversationId, senderType, senderName, message, messageOriginal, messageTranslated) {
    try {
      const [result] = await db.promise().query(
        `INSERT INTO customer_support_messages
         (conversation_id, sender_type, sender_name, message, message_original, message_translated)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [conversationId, senderType, senderName, message, messageOriginal || message, messageTranslated || message]
      );

      await this.logEvent(conversationId, 'MESSAGE_SENT', `${senderType}: ${message.substring(0, 100)}`, {
        senderType,
        senderName,
        messageLength: message.length,
      });

      return result;
    } catch (e) {
      console.error('[TimelineService] insertMessage error:', e.message);
      throw e;
    }
  }
}

module.exports = TimelineService;
