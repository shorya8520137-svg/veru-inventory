const db = require('../../db/connection');
const ContextEngine = require('./ContextEngine');
const IntelligenceLayer = require('./IntelligenceLayer');
const AIActions = require('./AIActions');
const DepartmentDetector = require('./DepartmentDetector');
const LanguageRouter = require('./LanguageRouter');

const TAKEOVER_STATES = {
  IDLE: 'idle',
  READING: 'reading',
  ANALYZING: 'analyzing',
  AUTONOMOUS: 'autonomous',
  PAUSED: 'paused',
  TERMINATED: 'terminated',
};

class AITakeover {
  constructor() {
    this._activeTakeovers = new Map();
  }

  async initiate(conversationId, options = {}) {
    const existing = this._activeTakeovers.get(conversationId);
    if (existing && existing.state === TAKEOVER_STATES.AUTONOMOUS) {
      return { success: false, message: 'AI takeover already active for this conversation', state: existing.state };
    }

    const takeover = {
      conversationId,
      state: TAKEOVER_STATES.READING,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      context: null,
      intelligence: null,
      summary: null,
      options,
      auditLog: [],
    };

    this._activeTakeovers.set(conversationId, takeover);
    this._log(takeover, 'TAKEOVER_INITIATED', 'AI takeover initiated');

    try {
      takeover.state = TAKEOVER_STATES.READING;
      this._log(takeover, 'READING_CONTEXT', 'Gathering conversation context');
      takeover.context = await ContextEngine.gatherContext(conversationId);

      takeover.state = TAKEOVER_STATES.ANALYZING;
      this._log(takeover, 'ANALYZING', 'Analyzing conversation with intelligence layer');

      const lastCustomerMsg = takeover.context.messages
        .filter(m => m.sender_type === 'customer')
        .pop();

      takeover.intelligence = await IntelligenceLayer.analyze(
        lastCustomerMsg?.message || '',
        {
          subject: takeover.context.conversation?.subject,
          orderCount: takeover.context.orders?.length,
          prevConversations: takeover.context.previousConversations?.length,
          messageCount: takeover.context.messages?.length,
        }
      );

      takeover.summary = await this._generateSummary(takeover);
      this._log(takeover, 'SUMMARY_GENERATED', takeover.summary);

      takeover.state = TAKEOVER_STATES.AUTONOMOUS;
      this._log(takeover, 'AUTONOMOUS_MODE', 'AI entered autonomous mode');

      return {
        success: true,
        state: takeover.state,
        summary: takeover.summary,
        intelligence: takeover.intelligence,
        contextSummary: ContextEngine.buildContextSummary(takeover.context),
      };
    } catch (e) {
      takeover.state = TAKEOVER_STATES.IDLE;
      this._log(takeover, 'ERROR', `Takeover failed: ${e.message}`);
      return { success: false, message: e.message };
    }
  }

  async processMessage(conversationId, message, extraContext = {}) {
    const takeover = this._activeTakeovers.get(conversationId);
    if (!takeover || takeover.state !== TAKEOVER_STATES.AUTONOMOUS) {
      return { success: false, message: 'AI takeover not active for this conversation' };
    }

    takeover.lastActivityAt = new Date();
    this._log(takeover, 'PROCESSING_MESSAGE', `Processing: "${message.substring(0, 100)}..."`);

    const intelligence = await IntelligenceLayer.analyze(message, takeover.intelligence || {});
    const reply = await AIActions.generateReply(message, {
      ...takeover.context,
      ...takeover.intelligence,
      ...extraContext,
      summary: takeover.summary,
    });

    return {
      success: true,
      intelligence,
      reply,
    };
  }

  pause(conversationId) {
    const takeover = this._activeTakeovers.get(conversationId);
    if (!takeover) return { success: false, message: 'No active takeover' };
    takeover.state = TAKEOVER_STATES.PAUSED;
    this._log(takeover, 'PAUSED', 'AI takeover paused by agent');
    return { success: true, state: takeover.state };
  }

  resume(conversationId) {
    const takeover = this._activeTakeovers.get(conversationId);
    if (!takeover) return { success: false, message: 'No active takeover' };
    takeover.state = TAKEOVER_STATES.AUTONOMOUS;
    this._log(takeover, 'RESUMED', 'AI takeover resumed by agent');
    return { success: true, state: takeover.state };
  }

  terminate(conversationId) {
    const takeover = this._activeTakeovers.get(conversationId);
    if (!takeover) return { success: false, message: 'No active takeover' };
    takeover.state = TAKEOVER_STATES.TERMINATED;
    this._log(takeover, 'TERMINATED', 'AI takeover terminated by agent');
    this._activeTakeovers.delete(conversationId);
    return { success: true, state: takeover.state };
  }

  getStatus(conversationId) {
    const takeover = this._activeTakeovers.get(conversationId);
    if (!takeover) return { active: false };
    return {
      active: true,
      state: takeover.state,
      startedAt: takeover.startedAt,
      lastActivityAt: takeover.lastActivityAt,
      summary: takeover.summary,
      intelligence: takeover.intelligence,
      auditLog: takeover.auditLog,
    };
  }

  isActive(conversationId) {
    const takeover = this._activeTakeovers.get(conversationId);
    return takeover && takeover.state === TAKEOVER_STATES.AUTONOMOUS;
  }

  async _generateSummary(takeover) {
    const context = takeover.context;
    const parts = [];
    parts.push(`Customer: ${context.customer?.name || 'Unknown'} (${context.customer?.email || 'No email'})`);
    parts.push(`Subject: ${context.conversation?.subject || 'N/A'}`);
    parts.push(`Status: ${context.conversation?.status || 'N/A'}`);
    parts.push(`Messages: ${context.messages?.length || 0} total`);
    if (context.orders?.length) parts.push(`Orders: ${context.orders.length} orders`);
    if (takeover.intelligence) {
      const i = takeover.intelligence;
      parts.push(`Sentiment: ${i.sentiment?.label} (${((i.sentiment?.score || 0) * 100).toFixed(0)}%)`);
      parts.push(`Urgency: ${i.urgency?.label}`);
      parts.push(`Priority: ${i.priorityScore}/100`);
    }
    return parts.join(' | ');
  }

  _log(takeover, action, details) {
    takeover.auditLog.push({
      action,
      details,
      timestamp: new Date(),
    });
  }
}

const instance = new AITakeover();
module.exports = instance;
