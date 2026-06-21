const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct-v0.1';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const modelsToTry = [
  OPENROUTER_MODEL,
  'openrouter/auto',
  'google/gemini-2.0-flash-001',
  'cohere/command-r-plus',
].filter(Boolean);

async function requestLLM(messages, options = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

  let lastError = null;
  const seenModels = new Set();
  const uniqueModels = modelsToTry.filter(m => {
    if (seenModels.has(m)) return false;
    seenModels.add(m);
    return true;
  });

  for (const model of uniqueModels) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          temperature: options.temperature ?? 0,
          max_tokens: options.maxTokens ?? 2000,
          messages,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastError = data?.error?.message || data?.message || `HTTP ${response.status}`;
        continue;
      }

      let content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;
      if (content) {
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        clearTimeout(timeoutId);
        return { content, model };
      }
      lastError = 'Empty response from model';
    } catch (e) {
      lastError = e?.message || 'Unknown error';
      if (e?.name === 'AbortError') lastError = 'Request timed out';
      continue;
    }
  }

  clearTimeout(timeoutId);
  throw new Error(`All models failed. Last error: ${lastError}`);
}

module.exports = { requestLLM, OPENROUTER_MODEL };
