const LanguageRouter = require('../services/omnichannel/LanguageRouter');
const ContextEngine = require('../services/omnichannel/ContextEngine');
const IntelligenceLayer = require('../services/omnichannel/IntelligenceLayer');
const AIActions = require('../services/omnichannel/AIActions');
const DepartmentDetector = require('../services/omnichannel/DepartmentDetector');
const TimelineService = require('../services/omnichannel/TimelineService');
const { requestLLM } = require('../services/omnichannel/LLMClient');

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'bn', label: 'Bengali' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ur', label: 'Urdu' },
  { value: 'es', label: 'Spanish' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

class AIAgentController {
  async handle(req, res) {
    try {
      const { phase, language, message, conversationHistory, aiMode } = req.body;

      switch (phase) {
        case 'init':
          return res.json({
            success: true,
            data: {
              type: 'language_selection',
              message: '🌐 Please select your preferred language for support:',
              options: LANGUAGES,
              detected_language: null,
            },
          });

        case 'language_selected': {
          const langObj = LANGUAGES.find(l => l.value === language);
          return res.json({
            success: true,
            data: {
              type: 'agent_invoking',
              agent: 'ai_support_agent',
              message: `🤖 Activating AI Support Agent in ${langObj?.label || language}...`,
              detected_language: language,
            },
          });
        }

        case 'final':
        case 'translate': {
          const targetLang = language || 'en';
          const userMessage = message || 'Hello, I need help';

          // Detect language of user message
          const detected = await LanguageRouter.detectLanguage(userMessage);

          // Translate to English if needed
          const englishText = detected.language !== 'en'
            ? await LanguageRouter.translateToEnglish(userMessage, detected.language)
            : userMessage;

          // Analyze intelligence
          const intelligence = await IntelligenceLayer.analyze(englishText, {});

          // Detect department
          const dept = await DepartmentDetector.detect(englishText, {});

          // Generate AI reply
          const reply = await AIActions.generateReply(englishText, {
            ...intelligence,
            department: dept.department,
            departmentName: dept.departmentName,
            departmentConfig: dept.config,
            summary: `Message: ${englishText}`,
          });

          // Translate reply to customer's language
          const replyLocal = targetLang !== 'en'
            ? await LanguageRouter.translate(reply.response, targetLang)
            : reply.response;

          return res.json({
            success: true,
            data: {
              type: 'final_response',
              reply_local: replyLocal,
              reply_en: reply.response,
              detected_language: detected.language,
              sentiment: intelligence.sentiment,
              intent: intelligence.intent,
              tone: reply.tone,
              suggestedAction: reply.suggestedAction,
            },
          });
        }

        default:
          return res.status(400).json({ success: false, message: `Unknown phase: ${phase}` });
      }
    } catch (error) {
      console.error('AI Agent error:', error);
      res.status(500).json({ success: false, message: 'AI Agent failed', error: error.message });
    }
  }
}

module.exports = new AIAgentController();
