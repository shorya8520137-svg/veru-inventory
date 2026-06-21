const db = require('../../db/connection');
const { requestLLM } = require('./LLMClient');

class LanguageRouter {
  static async detectLanguage(text) {
    try {
      const completion = await requestLLM([
        {
          role: 'system',
          content: `You are a language detection system. Given a text, respond with ONLY a JSON object containing:
{
  "language": "<ISO 639-1 code>",
  "language_name": "<Full language name>",
  "confidence": <0-100>,
  "is_translation_needed": <true/false if not English>
}

Known languages: English (en), Hindi (hi), Tamil (ta), Telugu (te), Bengali (bn), Marathi (mr), Gujarati (gu), Kannada (kn), Malayalam (ml), Punjabi (pa), Urdu (ur), Hinglish (hi - mixed Hindi+English).
- For Hinglish, detect as 'hi' with confidence reflecting mixed nature.
- If text contains mixed Hindi+English, treat as Hinglish.
- If the text is clearly English, set is_translation_needed to false.

Do NOT add any other text before or after the JSON object.`
        },
        { role: 'user', content: text }
      ]);

      const parsed = JSON.parse(completion.content);
      return {
        language: parsed.language || 'en',
        languageName: parsed.language_name || 'English',
        confidence: parsed.confidence || 0,
        needsTranslation: parsed.is_translation_needed !== false
      };
    } catch (e) {
      console.error('[LanguageRouter] Detection error:', e.message);
      return { language: 'en', languageName: 'English', confidence: 0, needsTranslation: false };
    }
  }

  static async translate(text, targetLang, preserveEntities = true) {
    if (!targetLang || targetLang === 'en') return text;

    try {
      const completion = await requestLLM([
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLang}.

CRITICAL RULES:
- Preserve ALL product names, SKUs, barcodes, order IDs, tracking IDs, prices, addresses, phone numbers, email addresses, URLs, and numbers exactly as-is.
- Do NOT translate brand names, product names, or proper nouns.
- Maintain the original tone (formal/polite/casual).
- If the text is already in the target language, return it unchanged.
- Respond with ONLY a JSON object: { "translated": "<translated text>", "preserved_entities": ["<entity1>", "<entity2>", ...] }

Do NOT add any other text before or after the JSON object.`
        },
        { role: 'user', content: text }
      ]);

      const parsed = JSON.parse(completion.content);
      return parsed.translated || text;
    } catch (e) {
      console.error('[LanguageRouter] Translation error:', e.message);
      return text;
    }
  }

  static async translateToEnglish(text, sourceLang) {
    if (!sourceLang || sourceLang === 'en' || sourceLang === 'unknown') return text;

    try {
      const completion = await requestLLM([
        {
          role: 'system',
          content: `You are a professional translator. Translate the following ${sourceLang} text to English.

CRITICAL RULES:
- Preserve ALL product names, SKUs, barcodes, order IDs, tracking IDs, prices, addresses, phone numbers, email addresses, URLs, and numbers exactly as-is.
- Do NOT translate brand names or product names.
- Respond with ONLY a JSON object: { "translated": "<English translation>", "preserved_entities": ["<entity1>", "<entity2>", ...] }

Do NOT add any other text before or after the JSON object.`
        },
        { role: 'user', content: text }
      ]);

      const parsed = JSON.parse(completion.content);
      return parsed.translated || text;
    } catch (e) {
      console.error('[LanguageRouter] Translation error:', e.message);
      return text;
    }
  }

  static async getConvLang(conversationId) {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.query(
          'SELECT preferred_language FROM customer_support_conversations WHERE conversation_id = ?',
          [conversationId],
          (err, results) => err ? reject(err) : resolve(results)
        );
      });
      return rows?.[0]?.preferred_language || 'en';
    } catch {
      return 'en';
    }
  }

  static async setConvLang(conversationId, language) {
    try {
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE customer_support_conversations SET preferred_language = ? WHERE conversation_id = ?',
          [language, conversationId],
          (err) => err ? reject(err) : resolve()
        );
      });
    } catch (e) {
      console.error('[LanguageRouter] setConvLang error:', e.message);
    }
  }
}

module.exports = LanguageRouter;
