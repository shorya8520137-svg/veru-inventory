const { requestLLM } = require('./LLMClient');

const DEPARTMENTS = {
  SALES: 'sales',
  SUPPORT: 'support',
  DELIVERY: 'delivery',
  RETURNS: 'returns',
  TECHNICAL: 'technical',
  WHOLESALE: 'wholesale',
};

const DEPARTMENT_CONFIG = {
  [DEPARTMENTS.SALES]: {
    name: 'Sales',
    responseStyle: 'persuasive and helpful, highlighting product benefits, pricing, and availability',
    actions: ['reply', 'coupon', 'quote'],
    slaPriority: 'medium',
  },
  [DEPARTMENTS.SUPPORT]: {
    name: 'Support',
    responseStyle: 'empathetic and solution-oriented, focusing on issue resolution and customer satisfaction',
    actions: ['reply', 'ticket', 'escalation', 'internal_note'],
    slaPriority: 'high',
  },
  [DEPARTMENTS.DELIVERY]: {
    name: 'Delivery',
    responseStyle: 'informative and reassuring, providing tracking updates and delivery estimates',
    actions: ['reply', 'tracking', 'delivery_update', 'escalation'],
    slaPriority: 'urgent',
  },
  [DEPARTMENTS.RETURNS]: {
    name: 'Returns',
    responseStyle: 'clear and process-oriented, explaining return policy, refund timeline, and steps',
    actions: ['reply', 'refund', 'replacement', 'tracking', 'coupon'],
    slaPriority: 'high',
  },
  [DEPARTMENTS.TECHNICAL]: {
    name: 'Technical',
    responseStyle: 'precise and technical, providing troubleshooting steps and product specifications',
    actions: ['reply', 'ticket', 'escalation', 'internal_note'],
    slaPriority: 'medium',
  },
  [DEPARTMENTS.WHOLESALE]: {
    name: 'Wholesale',
    responseStyle: 'professional and volume-oriented, discussing bulk pricing, MOQs, and B2B terms',
    actions: ['reply', 'coupon', 'quote', 'internal_note'],
    slaPriority: 'medium',
  },
};

class DepartmentDetector {
  static async detect(text, context = {}) {
    try {
      const subject = context.subject ? `Subject: ${context.subject}\n` : '';
      const customerInfo = context.customerName ? `Customer: ${context.customerName}\n` : '';

      const completion = await requestLLM([
        {
          role: 'system',
          content: `You are a conversation classifier. Given a customer message, classify which department it belongs to.

Departments:
- sales: Pre-sales inquiries, product information, pricing, bulk orders, quotes
- support: General support, account help, how-to questions, feature requests
- delivery: Delivery status, tracking, shipping delays, address changes
- returns: Return requests, refunds, exchanges, damaged items, replacements
- technical: Technical issues, bugs, integration problems, API help
- wholesale: B2B inquiries, large volume orders, distributor pricing, MOQ

Respond with ONLY a JSON object:
{
  "department": "<department_code>",
  "confidence": <0-100>,
  "reason": "<brief reason for classification>"
}

Do NOT add any other text before or after.`
        },
        {
          role: 'user',
          content: `${subject}${customerInfo}Message: ${text}`
        }
      ]);

      const parsed = JSON.parse(completion.content);
      const dept = parsed.department || DEPARTMENTS.SUPPORT;
      const config = DEPARTMENT_CONFIG[dept] || DEPARTMENT_CONFIG[DEPARTMENTS.SUPPORT];

      return {
        department: dept,
        departmentName: config.name,
        confidence: parsed.confidence || 0,
        reason: parsed.reason || '',
        config,
      };
    } catch (e) {
      console.error('[DepartmentDetector] Error:', e.message);
      return {
        department: DEPARTMENTS.SUPPORT,
        departmentName: 'Support',
        confidence: 0,
        reason: 'Fallback: detection failed',
        config: DEPARTMENT_CONFIG[DEPARTMENTS.SUPPORT],
      };
    }
  }

  static getDepartmentConfig(department) {
    return DEPARTMENT_CONFIG[department] || DEPARTMENT_CONFIG[DEPARTMENTS.SUPPORT];
  }
}

DepartmentDetector.DEPARTMENTS = DEPARTMENTS;
DepartmentDetector.DEPARTMENT_CONFIG = DEPARTMENT_CONFIG;

module.exports = DepartmentDetector;
