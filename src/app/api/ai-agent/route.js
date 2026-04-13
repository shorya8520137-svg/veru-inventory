import { NextResponse } from 'next/server';

const WEBHOOK_URL = 'http://13.215.172.213:5678/webhook/6cc5c704-0ebe-4779-a00d-16c7cee83ac8';

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {}

  const { phase, language, message, conversationHistory } = body;

  // Phase 1 — init: always return language selection from frontend, no webhook needed
  if (!phase || phase === 'init') {
    return NextResponse.json({
      success: true,
      data: {
        type: 'language_selection',
        message: 'Hi, welcome to XYZ Brand support 👋 Please select your preferred language:',
        options: [
          { label: 'English', value: 'en' },
          { label: 'हिंदी', value: 'hi' },
          { label: 'தமிழ்', value: 'ta' },
        ],
      },
    });
  }

  // Phase 2 — language selected: show invoking animation, then call webhook
  if (phase === 'language_selected') {
    // Return invoking immediately
    return NextResponse.json({
      success: true,
      data: {
        type: 'agent_invoking',
        agent: `${language}_agent`,
        message: 'Connecting to support agent...',
        animation: 'code_editor',
      },
    });
  }

  // Phase 3 — final: call n8n webhook with language + message
  try {
    const payload = {
      phase: 'final',
      language,        // 'en' | 'hi' | 'ta'
      message,
      conversationHistory: conversationHistory || [],
    };

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    // Handle empty or non-JSON response from n8n
    if (!text || text.trim() === '' || text.trim() === '""') {
      return NextResponse.json({ success: true, data: fallbackFinal(language, message) });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // n8n returned plain text
      return NextResponse.json({
        success: true,
        data: { type: 'final_response', reply_local: text, reply_en: text },
      });
    }

    // If n8n returns the structured format directly
    if (data.type) {
      return NextResponse.json({ success: true, data });
    }

    // If n8n returns {reply_local, reply_en} or similar
    if (data.reply_local || data.reply || data.output || data.message) {
      return NextResponse.json({
        success: true,
        data: {
          type: 'final_response',
          reply_local: data.reply_local || data.reply || data.output || data.message,
          reply_en: data.reply_en || data.reply || data.output || data.message,
        },
      });
    }

    return NextResponse.json({ success: true, data: fallbackFinal(language, message) });
  } catch (e) {
    console.error('Webhook error:', e.message);
    return NextResponse.json({ success: true, data: fallbackFinal(language, message) });
  }
}

function fallbackFinal(language, message) {
  const responses = {
    hi: `नमस्ते! आपका संदेश मिल गया: "${message}"। हमारी टीम जल्द ही आपसे संपर्क करेगी।`,
    ta: `வணக்கம்! உங்கள் செய்தி பெறப்பட்டது: "${message}"। எங்கள் குழு விரைவில் தொடர்பு கொள்ளும்.`,
    en: `Hello! We received your message: "${message}". Our team will get back to you shortly.`,
  };
  const local = responses[language] || responses.en;
  return {
    type: 'final_response',
    reply_local: local,
    reply_en: responses.en,
  };
}
