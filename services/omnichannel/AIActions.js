const db = require('../../db/connection');

class AIActions {
  static async execute(action, params, conversationId) {
    const actionLog = {
      action,
      conversationId,
      params,
      status: 'started',
      timestamp: new Date(),
    };

    try {
      switch (action) {
        case 'reply':
          return await this._reply(params, conversationId);
        case 'ticket':
          return await this._createTicket(params, conversationId);
        case 'internal_note':
          return await this._internalNote(params, conversationId);
        case 'tracking':
          return await this._getTracking(params);
        case 'delivery_update':
          return await this._deliveryUpdate(params);
        default:
          return { success: false, message: `Action '${action}' not implemented` };
      }
    } catch (e) {
      console.error(`[AIActions] ${action} error:`, e.message);
      return { success: false, message: e.message };
    }
  }

  static async generateReply(message, context, language) {
    const { requestLLM } = require('./LLMClient');

    const contextStr = [
      context.customerName ? `Customer: ${context.customerName}` : '',
      context.department ? `Department: ${context.departmentName}` : '',
      context.subject ? `Subject: ${context.subject}` : '',
      context.sentiment ? `Customer sentiment: ${context.sentiment.label} (${(context.sentiment.score * 100).toFixed(0)}%)` : '',
      context.intent ? `Customer intent: ${context.intent}` : '',
      context.recommendedAction ? `Recommended action: ${context.recommendedAction}` : '',
      context.productRAG ? `\nRelevant Products/Categories:\n${context.productRAG}` : '',
    ].filter(Boolean).join('\n');

    try {
      const completion = await requestLLM([
        {
          role: 'system',
          content: `You are an AI Customer Support Agent. Generate a helpful, professional response to the customer.

${context.departmentName ? `You are handling a ${context.departmentName} inquiry.` : ''}
Response style: ${context.departmentConfig?.responseStyle || 'helpful and professional'}

CRITICAL RULES:
- Be concise, helpful, and professional
- Address the customer's specific concern
- If you don't know something, say so honestly
- Never make up order details, tracking numbers, or refund amounts
- Suggest specific next steps
- Use a warm, friendly tone
- If the customer is frustrated, acknowledge their frustration first
- The response will be translated to the customer's language, so use clear simple language
- Do NOT include meta-commentary like "I've generated this response..."
- Just provide the response text directly, as if you're the agent typing it
- IMPORTANT: If product/category information is provided below in "Relevant Products/Categories", USE IT to give specific, accurate answers. List actual product names and categories from that data rather than giving generic responses. If the customer asks about categories, list them out. If they ask about products, mention specific product names with prices.

Respond with ONLY a JSON object:
{
  "response": "<your response text>",
  "tone": "<empathetic|professional|urgent|reassuring>",
  "suggestedAction": "<action the agent should take next>"
}

Do NOT add any other text before or after the JSON.`
        },
        {
          role: 'user',
          content: `${contextStr ? contextStr + '\n\n' : ''}Customer message: ${message}\n\nPrevious context summary:\n${context.summary || 'No additional context'}`
        }
      ]);

      const parsed = JSON.parse(completion.content);
      return {
        response: parsed.response || 'Thank you for reaching out. Our team will look into this and get back to you shortly.',
        tone: parsed.tone || 'professional',
        suggestedAction: parsed.suggestedAction || 'reply',
      };
    } catch (e) {
      console.error('[AIActions] generateReply error:', e.message);
      return {
        response: 'Thank you for your message. Our team will review this and get back to you shortly.',
        tone: 'professional',
        suggestedAction: 'reply',
      };
    }
  }

  static async _reply(params, conversationId) {
    const { insertMessage } = require('./TimelineService');
    const text = params.text || params.response;
    if (!text) return { success: false, message: 'No reply text provided' };
    await insertMessage(conversationId, 'support', 'AI Agent', text, text, text);
    return { success: true, message: 'Reply sent', data: { text } };
  }

  static async _createTicket(params, conversationId) {
    const [existing] = await db.promise().query(
      'SELECT id FROM tickets WHERE conversation_id = ? LIMIT 1',
      [conversationId]
    );
    if (existing.length > 0) return { success: true, message: 'Ticket already exists', data: existing[0] };

    const [result] = await db.promise().query(
      "INSERT INTO tickets (conversation_id, subject, description, priority, status) VALUES (?, ?, ?, ?, 'open')",
      [conversationId, params.subject || 'Support Ticket', params.description || '', params.priority || 'medium']
    );
    return { success: true, message: 'Ticket created', data: { id: result.insertId } };
  }

  static async _internalNote(params, conversationId) {
    const [result] = await db.promise().query(
      "INSERT INTO customer_support_messages (conversation_id, sender_type, sender_name, message, message_original) VALUES (?, 'bot', 'System Note', ?, ?)",
      [conversationId, params.note || params.text || '', params.note || params.text || '']
    );
    return { success: true, message: 'Internal note saved' };
  }

  static async _getTracking(params) {
    return { success: true, message: 'Tracking info', data: params };
  }

  static async _deliveryUpdate(params) {
    return { success: true, message: 'Delivery update sent', data: params };
  }
}

module.exports = AIActions;
