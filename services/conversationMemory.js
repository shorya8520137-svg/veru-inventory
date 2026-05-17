const db = require('../db/connection');

/**
 * CONVERSATION MEMORY SERVICE
 * Stores and retrieves chat history for AI context awareness
 */

class ConversationMemory {
  /**
   * Save conversation turn to history
   */
  static async saveMessage(sessionId, userMessage, aiResponse, context = {}) {
    try {
      const query = `
        INSERT INTO conversation_history (session_id, user_message, ai_response, context_data)
        VALUES (?, ?, ?, ?)
      `;
      
      const contextJson = JSON.stringify(context);
      
      await db.promise().query(query, [sessionId, userMessage, aiResponse, contextJson]);
      
      // Auto-cleanup: keep only last 100 messages per session
      await db.promise().query(`
        DELETE h1 FROM conversation_history h1
        INNER JOIN conversation_history h2 
        WHERE h1.session_id = h2.session_id 
        AND h1.id < h2.id 
        AND (SELECT COUNT(*) FROM conversation_history h3 
             WHERE h3.session_id = h1.session_id 
             AND h3.id > h1.id) >= 100
      `);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save conversation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get last N messages for context
   */
  static async getRecentMessages(sessionId, limit = 5) {
    try {
      const query = `
        SELECT user_message, ai_response, context_data, created_at
        FROM conversation_history
        WHERE session_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      const [rows] = await db.promise().query(query, [sessionId, limit]);
      
      // Reverse to get chronological order (oldest first)
      return rows.reverse();
    } catch (error) {
      console.error('Failed to retrieve conversation history:', error);
      return [];
    }
  }

  /**
   * Extract context from recent conversations
   * Returns last used warehouse, category, product, etc.
   */
  static async extractContext(sessionId) {
    try {
      const messages = await this.getRecentMessages(sessionId, 10);
      
      const context = {
        lastWarehouse: null,
        lastCategory: null,
        lastProduct: null,
        lastBarcode: null,
        conversationTopics: []
      };

      // Extract context from stored JSON
      messages.forEach(msg => {
        if (msg.context_data) {
          try {
            const ctx = typeof msg.context_data === 'string' 
              ? JSON.parse(msg.context_data) 
              : msg.context_data;
            
            if (ctx.warehouse) context.lastWarehouse = ctx.warehouse;
            if (ctx.category) context.lastCategory = ctx.category;
            if (ctx.product) context.lastProduct = ctx.product;
            if (ctx.barcode) context.lastBarcode = ctx.barcode;
          } catch (e) {
            // Ignore parse errors
          }
        }

        // Extract topics from messages
        const combined = (msg.user_message + ' ' + msg.ai_response).toLowerCase();
        if (combined.includes('warehouse') || combined.includes('_wh')) {
          const whMatch = combined.match(/\b([A-Z]{2,6}_WH)\b/i);
          if (whMatch) context.lastWarehouse = whMatch[1].toUpperCase();
        }
        if (combined.includes('category')) context.conversationTopics.push('categories');
        if (combined.includes('product')) context.conversationTopics.push('products');
        if (combined.includes('damage')) context.conversationTopics.push('damage');
        if (combined.includes('timeline')) context.conversationTopics.push('timeline');
      });

      // Remove duplicates
      context.conversationTopics = [...new Set(context.conversationTopics)];

      return context;
    } catch (error) {
      console.error('Failed to extract context:', error);
      return {};
    }
  }

  /**
   * Build context string for AI prompt
   */
  static async buildContextPrompt(sessionId, currentQuestion) {
    const recentMessages = await this.getRecentMessages(sessionId, 5);
    const context = await this.extractContext(sessionId);

    let prompt = '\n\n[CONVERSATION CONTEXT]\n';
    
    // Add recent messages
    if (recentMessages.length > 0) {
      prompt += 'Recent conversation:\n';
      recentMessages.forEach((msg, idx) => {
        prompt += `${idx + 1}. User: ${msg.user_message}\n`;
        prompt += `   AI: ${msg.ai_response.substring(0, 200)}...\n\n`;
      });
    }

    // Add extracted context
    if (context.lastWarehouse) {
      prompt += `Last discussed warehouse: ${context.lastWarehouse}\n`;
    }
    if (context.lastCategory) {
      prompt += `Last discussed category: ${context.lastCategory}\n`;
    }
    if (context.lastProduct) {
      prompt += `Last discussed product: ${context.lastProduct}\n`;
    }

    // Smart follow-up detection
    const lower = currentQuestion.toLowerCase();
    if (lower.match(/^(show|tell|get|fetch)\s+(it|them|that|those|more|details)/i)) {
      if (context.lastWarehouse) {
        prompt += `\nUser is asking for more details about: ${context.lastWarehouse}\n`;
      }
      if (context.lastBarcode) {
        prompt += `\nUser is asking for more details about barcode: ${context.lastBarcode}\n`;
      }
    }

    prompt += '[END CONTEXT]\n\n';

    return prompt;
  }
}

module.exports = ConversationMemory;
