import { NextResponse } from "next/server";

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct-v0.1";
const OPENROUTER_URL = "https://api.openrouter.ai/v1/chat/completions";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "https://api.giftgala.in";

async function requestLLM(messages) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let lastError = null;
  const modelsToTry = [
    OPENROUTER_MODEL,
    "mistralai/mistral-7b-instruct",
    "openchat/openchat-7b:free",
    "cognitivecomputations/dolphin-mixtral-8x7b:free",
  ].filter(Boolean);

  const seen = new Set();
  const uniqueModels = modelsToTry.filter(m => {
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  });

  for (const model of uniqueModels) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 2000,
          messages,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastError = data?.error?.message || data?.message || `HTTP ${response.status}`;
        continue;
      }

      const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;
      if (content) {
        clearTimeout(timeoutId);
        return { content, model };
      }
      lastError = "Empty response from model";
    } catch (e) {
      lastError = e?.message || "Unknown error";
      if (e?.name === "AbortError") lastError = "Request timed out";
      continue;
    }
  }

  clearTimeout(timeoutId);
  throw new Error(`All models failed: ${lastError}`);
}

export async function POST(req) {
  try {
    const { query, authToken } = await req.json();

    if (!query) {
      return NextResponse.json(
        { success: false, message: "Query is required" },
        { status: 400 }
      );
    }

    let productContext = "";
    if (authToken) {
      try {
        const [prodRes, catRes, orderRes] = await Promise.allSettled([
          fetch(`${API_BASE}/api/products?page=1&limit=10`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }).then(r => r.json()),
          fetch(`${API_BASE}/api/products/categories`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }).then(r => r.json().catch(() => ({}))),
          fetch(`${API_BASE}/api/website/orders/stats`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }).then(r => r.json().catch(() => ({}))),
        ]);

        const products = prodRes.value?.products || prodRes.value?.data || [];
        const categories = catRes.value?.categories || catRes.value?.data || [];
        const orders = orderRes.value || {};

        if (products.length > 0) {
          productContext = "Current products:\n";
          products.slice(0, 10).forEach(p => {
            productContext += `- ${p.product_name || p.name} (SKU: ${p.barcode || p.sku}, Price: ₹${p.price || 0})\n`;
          });
          productContext += "\n";

          const catNames = [...new Set(products.map(p => p.category || p.category_name).filter(Boolean))];
          if (catNames.length > 0) {
            productContext += `Categories: ${catNames.join(", ")}\n\n`;
          }
        }

        if (orders?.totalOrders || orders?.total) {
          productContext += `Order volume: ${orders.totalOrders || orders.total} orders\n`;
        }
      } catch (e) {
        productContext = "Note: Could not fetch live product data.\n";
      }
    }

    const systemPrompt = `You are an expert SEO strategist and content optimizer for e-commerce websites.

Your role is to provide actionable, specific SEO recommendations based on the user's query and the product catalog data provided.

When responding:
1. Give concrete, actionable advice — not generic tips
2. If suggesting keywords, provide actual keyword phrases relevant to the products
3. If suggesting meta tags, write actual meta title and description examples
4. If suggesting schema, specify which schema type and what properties to include
5. Always prioritize quick wins (high impact, low effort)
6. Keep responses concise and structured with bullet points where helpful
7. If the user asks for content ideas, suggest specific blog/article topics based on their products

${productContext ? `\nHere is the store's current data to work with:\n${productContext}` : "\nNote: No product data available. Provide general SEO guidance based on the query.\n"}

Current date: ${new Date().toLocaleDateString()}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ];

    const result = await requestLLM(messages);

    return NextResponse.json({
      success: true,
      data: {
        answer: result.content,
        model: result.model,
        query,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e.message },
      { status: 500 }
    );
  }
}
