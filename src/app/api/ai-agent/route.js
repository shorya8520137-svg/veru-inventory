import { NextResponse } from 'next/server';

const AI_AGENT_WEBHOOK   = 'http://13.215.172.213:5678/webhook/6cc5c704-0ebe-4779-a00d-16c7cee83ac8';
const TRANSLATE_WEBHOOK  = 'http://13.215.172.213:5678/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030';

/* ── call a webhook, return parsed JSON or null ── */
async function callWebhook(url, payload) {
  try {
    const res  = await fetch(url, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload),
    });
    const text = await res.text();
    if (!text || text.trim() === '' || text.trim() === '""') return null;
    try { return JSON.parse(text); } catch { return { type:'final_response', reply_local:text, reply_en:text }; }
  } catch (e) {
    console.error('Webhook error:', url, e.message);
    return null;
  }
}

/* ── normalise whatever n8n returns into our standard shape ── */
function normalise(data, language, message) {
  if (!data) return fallback(language, message);
  if (data.type === 'final_response') return data;
  if (data.reply_local || data.reply || data.output || data.message) {
    return {
      type       : 'final_response',
      reply_local: data.reply_local || data.reply || data.output || data.message,
      reply_en   : data.reply_en    || data.reply || data.output || data.message,
    };
  }
  return fallback(language, message);
}

/* ── fallback when both webhooks fail ── */
function fallback(language, message) {
  const map = {
    hi: `नमस्ते! आपका संदेश मिल गया: "${message}"। हमारी टीम जल्द ही आपसे संपर्क करेगी।`,
    ta: `வணக்கம்! உங்கள் செய்தி பெறப்பட்டது: "${message}"। எங்கள் குழு விரைவில் தொடர்பு கொள்ளும்.`,
    te: `నమస్కారం! మీ సందేశం అందింది: "${message}"। మా బృందం త్వరలో మీతో సంప్రదిస్తుంది.`,
    en: `Hello! We received your message: "${message}". Our team will get back to you shortly.`,
  };
  return {
    type       : 'final_response',
    reply_local: map[language] || map.en,
    reply_en   : map.en,
  };
}

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}

  const { phase, language, message, conversationHistory, aiMode } = body;

  /* ── Phase 1: init — return language selection UI ── */
  if (!phase || phase === 'init') {
    return NextResponse.json({
      success: true,
      data: {
        type   : 'language_selection',
        message: 'Hi, welcome to XYZ Brand support 👋 Please select your preferred language:',
        options: [
          { label:'🇬🇧 English', value:'en' },
          { label:'🇮🇳 हिंदी',   value:'hi' },
          { label:'🇮🇳 தமிழ்',   value:'ta' },
          { label:'🇮🇳 తెలుగు',  value:'te' },
        ],
      },
    });
  }

  /* ── Phase 2: language selected — show invoking animation ── */
  if (phase === 'language_selected') {
    const agentMap = { en:'english_agent', hi:'hindi_agent', ta:'tamil_agent', te:'telugu_agent' };
    return NextResponse.json({
      success: true,
      data: {
        type     : 'agent_invoking',
        agent    : agentMap[language] || 'english_agent',
        message  : 'Connecting to support agent...',
        animation: 'code_editor',
      },
    });
  }

  /* ── Phase 3: translate — call translation layer first ── */
  if (phase === 'translate') {
    const data = await callWebhook(TRANSLATE_WEBHOOK, {
      message,
      language            : language || null,
      conversationHistory : conversationHistory || [],
    });
    return NextResponse.json({ success:true, data: normalise(data, language, message) });
  }

  /* ── Phase 4: final — call AI agent webhook ── */
  if (phase === 'final' || phase === 'ai_takeover') {
    // Step 1: if no language provided, detect via translation layer
    let detectedLang = language;
    if (!detectedLang) {
      const translated = await callWebhook(TRANSLATE_WEBHOOK, {
        message,
        language           : null,
        conversationHistory: conversationHistory || [],
      });
      detectedLang = translated?.detected_language || translated?.language || 'en';
    }

    // Step 2: call AI agent with detected/provided language
    const data = await callWebhook(AI_AGENT_WEBHOOK, {
      phase              : 'final',
      language           : detectedLang,
      message,
      conversationHistory: conversationHistory || [],
      aiMode             : aiMode || false,
    });

    const result = normalise(data, detectedLang, message);
    result.detected_language = detectedLang; // send back so frontend knows

    return NextResponse.json({ success:true, data: result });
  }

  return NextResponse.json({ success:false, error:'Unknown phase' }, { status:400 });
}
