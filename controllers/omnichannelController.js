const db = require('../db/connection');
const LanguageRouter = require('../services/omnichannel/LanguageRouter');
const DepartmentDetector = require('../services/omnichannel/DepartmentDetector');
const ProductKnowledgeRAG = require('../services/omnichannel/ProductKnowledgeRAG');
const ContextEngine = require('../services/omnichannel/ContextEngine');
const IntelligenceLayer = require('../services/omnichannel/IntelligenceLayer');
const AIActions = require('../services/omnichannel/AIActions');
const AITakeover = require('../services/omnichannel/AITakeover');
const TimelineService = require('../services/omnichannel/TimelineService');

class OmnichannelController {

  async sendMessage(req, res) {
    try {
      const { conversation_id } = req.params;
      const { message, sender_type, sender_name, language } = req.body;

      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      const exists = await new Promise((resolve, reject) => {
        db.query('SELECT id, preferred_language, status, subject, customer_name, customer_email, customer_phone FROM customer_support_conversations WHERE conversation_id = ?',
          [conversation_id],
          (err, results) => err ? reject(err) : resolve(results[0] || null));
      });
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }

      if (sender_type === 'language_select') {
        const langCode = language || message.toLowerCase().trim();
        await LanguageRouter.setConvLang(conversation_id, langCode);
        return res.json({ success: true, message: 'Language preference saved', data: { language: langCode } });
      }

      let convLang = exists.preferred_language || language || 'en';
      db.query('UPDATE customer_support_conversations SET updated_at = NOW() WHERE conversation_id = ?', [conversation_id], () => {});

      if (sender_type === 'customer' || !sender_type) {
        const recentDup = await new Promise(resolve => {
          db.query(
            `SELECT id FROM customer_support_messages
             WHERE conversation_id = ? AND sender_type = 'customer'
               AND message_original = ? AND created_at >= NOW() - INTERVAL 30 SECOND
             LIMIT 1`,
            [conversation_id, message],
            (err, rows) => resolve(rows?.[0] || null)
          );
        });
        if (recentDup) {
          return res.json({ success: true, data: { original: message, translated: message, deduplicated: true } });
        }

        const detected = await LanguageRouter.detectLanguage(message);
        const englishText = detected.language !== 'en'
          ? await LanguageRouter.translateToEnglish(message, detected.language)
          : message;

        // Update convLang if language was detected but not saved yet
        if (detected.language !== 'en' && convLang === 'en') {
          convLang = detected.language;
          await LanguageRouter.setConvLang(conversation_id, detected.language);
        }

        const dept = await DepartmentDetector.detect(message, {
          subject: exists.subject,
          customerName: exists.customer_name,
        });

        const productContext = await ProductKnowledgeRAG.search(message);

        const intelligence = await IntelligenceLayer.analyze(englishText, {
          subject: exists.subject,
          department: dept.department,
          messageCount: null,
        });

        await TimelineService.insertMessage(
          conversation_id, 'customer', sender_name || exists.customer_name || 'Customer',
          englishText, message, englishText
        );

        await TimelineService.logEvent(conversation_id, 'MESSAGE_RECEIVED', `Customer message in ${detected.languageName}`, {
          originalLanguage: detected.language,
          department: dept.department,
          sentiment: intelligence.sentiment,
          urgency: intelligence.urgency,
        });

        if (AITakeover.isActive(conversation_id)) {
          const categories = await ProductKnowledgeRAG.getCategories();
          const productRAGstr = ProductKnowledgeRAG.formatProductResultsForContext(productContext)
            + '\n' + ProductKnowledgeRAG.formatCategoriesForContext(categories);
          const aiResult = await AITakeover.processMessage(conversation_id, englishText, { productRAG: productRAGstr });
          if (aiResult.success && aiResult.reply?.response) {
            const replyText = convLang !== 'en'
              ? await LanguageRouter.translate(aiResult.reply.response, convLang)
              : aiResult.reply.response;

            await TimelineService.insertMessage(
              conversation_id, 'support', 'AI Agent',
              replyText, aiResult.reply.response, replyText
            );

            return res.json({
              success: true,
              data: { original: message, translated: englishText, aiReplied: true },
              timeline: await TimelineService.getTimeline(conversation_id),
            });
          }
        }

        return res.json({
          success: true,
          data: { original: message, translated: englishText },
          intelligence,
          department: dept,
          productContext: {
            productCount: productContext.totalResults,
            products: productContext.products.slice(0, 3),
          },
          timeline: await TimelineService.getTimeline(conversation_id),
        });
      }

      if (sender_type === 'support' || sender_type === 'admin') {
        const translated = convLang !== 'en' && convLang !== 'unknown'
          ? await LanguageRouter.translate(message, convLang)
          : message;

        await TimelineService.insertMessage(
          conversation_id, 'support', sender_name || 'Support Agent',
          translated, message, translated
        );

        await TimelineService.logEvent(conversation_id, 'AGENT_REPLIED', `Support agent replied in ${convLang}`, {
          agentName: sender_name,
          language: convLang,
        });

        return res.json({
          success: true,
          data: { original: message, translated },
          timeline: await TimelineService.getTimeline(conversation_id),
        });
      }

      await TimelineService.insertMessage(conversation_id, sender_type || 'bot', sender_name || 'System', message, message, message);
      return res.json({ success: true, data: { original: message, translated: message } });

    } catch (error) {
      console.error('Omnichannel sendMessage error:', error);
      res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
    }
  }

  async getIntelligence(req, res) {
    try {
      const { conversation_id } = req.params;
      const lastMessages = await new Promise((resolve, reject) => {
        db.query(
          `SELECT sender_type, message, message_original, created_at
           FROM customer_support_messages WHERE conversation_id = ?
           ORDER BY created_at DESC LIMIT 5`,
          [conversation_id],
          (err, results) => err ? reject(err) : resolve(results)
        );
      });

      if (lastMessages.length === 0) {
        return res.json({ success: true, data: { message: 'No messages to analyze' } });
      }

      const lastCustomerMsg = lastMessages.find(m => m.sender_type === 'customer')?.message || lastMessages[0]?.message || '';
      const context = await ContextEngine.gatherContext(conversation_id);
      const intelligence = await IntelligenceLayer.analyze(lastCustomerMsg, {
        subject: context.conversation?.subject,
        orderCount: context.orders?.length,
        prevConversations: context.previousConversations?.length,
        messageCount: context.messages?.length,
      });

      const takeoverStatus = AITakeover.getStatus(conversation_id);

      res.json({
        success: true,
        data: {
          intelligence,
          contextSummary: ContextEngine.buildContextSummary(context),
          takeoverStatus,
          conversationId: conversation_id,
        },
      });
    } catch (error) {
      console.error('Get intelligence error:', error);
      res.status(500).json({ success: false, message: 'Failed to get intelligence', error: error.message });
    }
  }

  async getTimeline(req, res) {
    try {
      const { conversation_id } = req.params;
      const timeline = await TimelineService.getTimeline(conversation_id);
      res.json({ success: true, data: { timeline, conversationId: conversation_id } });
    } catch (error) {
      console.error('Get timeline error:', error);
      res.status(500).json({ success: false, message: 'Failed to get timeline', error: error.message });
    }
  }

  async aiTakeover(req, res) {
    try {
      const { conversation_id } = req.params;
      const { action } = req.body;

      switch (action) {
        case 'initiate': {
          const result = await AITakeover.initiate(conversation_id);
          return res.json({ success: result.success, data: result });
        }
        case 'pause': {
          const result = AITakeover.pause(conversation_id);
          return res.json({ success: true, data: result });
        }
        case 'resume': {
          const result = AITakeover.resume(conversation_id);
          return res.json({ success: true, data: result });
        }
        case 'terminate': {
          const result = AITakeover.terminate(conversation_id);
          return res.json({ success: true, data: result });
        }
        case 'status': {
          const result = AITakeover.getStatus(conversation_id);
          return res.json({ success: true, data: result });
        }
        default:
          return res.status(400).json({ success: false, message: 'Invalid action' });
      }
    } catch (error) {
      console.error('AI takeover error:', error);
      res.status(500).json({ success: false, message: 'AI takeover failed', error: error.message });
    }
  }

  async generateReply(req, res) {
    try {
      const { conversation_id } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      const context = await ContextEngine.gatherContext(conversation_id);
      const intelligence = await IntelligenceLayer.analyze(message, {
        subject: context.conversation?.subject,
        orderCount: context.orders?.length,
        prevConversations: context.previousConversations?.length,
        messageCount: context.messages?.length,
      });

      const dept = await DepartmentDetector.detect(message, {
        subject: context.conversation?.subject,
        customerName: context.conversation?.customer_name,
      });

      const reply = await AIActions.generateReply(message, {
        ...context,
        ...intelligence,
        department: dept.department,
        departmentName: dept.departmentName,
        departmentConfig: dept.config,
        summary: ContextEngine.buildContextSummary(context),
      });

      await TimelineService.logEvent(conversation_id, 'AI_REPLY_GENERATED', `AI generated reply with tone: ${reply.tone}`, {
        tone: reply.tone,
        department: dept.department,
        sentiment: intelligence.sentiment,
        suggestedAction: reply.suggestedAction,
      });

      res.json({
        success: true,
        data: {
          reply,
          intelligence,
          department: dept,
        },
      });
    } catch (error) {
      console.error('Generate reply error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate reply', error: error.message });
    }
  }

  async searchProduct(req, res) {
    try {
      const { q, barcode } = req.query;
      const query = q || barcode;
      if (!query) return res.status(400).json({ success: false, message: 'Search query required' });

      const results = barcode
        ? await ProductKnowledgeRAG.searchByBarcode(barcode)
        : await ProductKnowledgeRAG.search(query);

      res.json({ success: true, data: results });
    } catch (error) {
      console.error('Product search error:', error);
      res.status(500).json({ success: false, message: 'Search failed', error: error.message });
    }
  }
}

module.exports = new OmnichannelController();
