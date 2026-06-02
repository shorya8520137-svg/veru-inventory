/**
 * InventoryGPT Chat Logger
 * Logs all user questions + bot responses to the Express backend for monitoring.
 * Fire-and-forget — never blocks the main response.
 */

export async function logInventoryGptChat({
  sessionId,
  question,
  answer,
  model,
  intentType,
  renderType,
  responseTimeMs,
  userEmail,
  metadata,
}) {
  try {
    const payload = {
      session_id: sessionId || 'anonymous',
      user_question: String(question || '').slice(0, 5000),
      bot_response: String(answer || '').slice(0, 50000),
      model: model || null,
      intent_type: intentType || null,
      render_type: renderType || null,
      response_time_ms: responseTimeMs || null,
      user_email: userEmail || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    };

    const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || 'https://api.giftgala.in';

    await fetch(`${apiBase}/api/inventorygpt/chat-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Silently fail — logging must never break the main response
    console.warn('[ChatLogger]', e?.message);
  }
}
