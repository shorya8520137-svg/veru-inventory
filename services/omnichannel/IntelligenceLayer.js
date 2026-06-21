const { requestLLM } = require('./LLMClient');

class IntelligenceLayer {
  static async analyze(text, context = {}) {
    try {
      const contextStr = [
        context.subject ? `Subject: ${context.subject}` : '',
        context.orderCount ? `Order count: ${context.orderCount}` : '',
        context.totalSpent ? `Total spent: ₹${context.totalSpent}` : '',
        context.returnCount ? `Previous returns: ${context.returnCount}` : '',
        context.prevConversations ? `Previous conversations: ${context.prevConversations}` : '',
        context.department ? `Department: ${context.department}` : '',
        context.messageCount ? `Messages in this conversation: ${context.messageCount}` : '',
      ].filter(Boolean).join('\n');

      const completion = await requestLLM([
        {
          role: 'system',
          content: `You are an AI intelligence analyst for a customer support system. Analyze the customer message and context, and respond with ONLY a JSON object:

{
  "sentiment": {
    "score": <0.0 to 1.0, 0=very negative, 0.5=neutral, 1.0=very positive>,
    "label": "<positive|neutral|negative|angry|frustrated|satisfied>",
    "details": "<brief explanation>"
  },
  "urgency": {
    "score": <0.0 to 1.0>,
    "label": "<low|medium|high|critical>"
  },
  "intent": "<what the customer wants>",
  "churnProbability": <0.0 to 1.0>,
  "escalationRisk": <0.0 to 1.0>,
  "fraudRisk": <0.0 to 1.0>,
  "customerValue": "<low|medium|high|vip>",
  "priorityScore": <1 to 100>,
  "keyPhrases": ["<phrase1>", "<phrase2>", ...],
  "recommendedAction": "<reply|refund|replacement|coupon|escalation|tracking|ticket|delivery_update|internal_note>"
}

Rules:
- Fraud risk should only be high if there are clear indicators (multiple returns, suspicious patterns, conflicting info)
- Churn probability increases with negative sentiment, multiple issues, long wait times
- Escalation risk increases with anger, threats, repeated issues, high customer value at risk
- Priority score combines urgency, customer value, and sentiment
- Customer value is based on order history and total spend
- Be conservative - default most risks to low unless clear evidence exists

Do NOT add any other text before or after the JSON.`
        },
        {
          role: 'user',
          content: `Context:\n${contextStr || 'No additional context'}\n\nCustomer message:\n${text}`
        }
      ]);

      const parsed = JSON.parse(completion.content);
      return {
        sentiment: parsed.sentiment || { score: 0.5, label: 'neutral', details: 'Analysis unavailable' },
        urgency: parsed.urgency || { score: 0, label: 'low' },
        intent: parsed.intent || 'general_inquiry',
        churnProbability: parsed.churnProbability ?? 0,
        escalationRisk: parsed.escalationRisk ?? 0,
        fraudRisk: parsed.fraudRisk ?? 0,
        customerValue: parsed.customerValue || 'low',
        priorityScore: parsed.priorityScore ?? 50,
        keyPhrases: parsed.keyPhrases || [],
        recommendedAction: parsed.recommendedAction || 'reply',
      };
    } catch (e) {
      console.error('[IntelligenceLayer] Error:', e.message);
      return {
        sentiment: { score: 0.5, label: 'neutral', details: 'Analysis unavailable' },
        urgency: { score: 0, label: 'low' },
        intent: 'general_inquiry',
        churnProbability: 0,
        escalationRisk: 0,
        fraudRisk: 0,
        customerValue: 'low',
        priorityScore: 50,
        keyPhrases: [],
        recommendedAction: 'reply',
      };
    }
  }
}

module.exports = IntelligenceLayer;
