import { NextResponse } from 'next/server';
import { tryInsoraOppsDataAnswer } from '@/lib/insoraOppsOpsAnswer';
import { buildInventoryGptBrainContext } from '@/lib/inventorygptBrainContext';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct-v0.1';
const OPENROUTER_URL = 'https://api.openrouter.ai/v1/chat/completions';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || 'https://api.giftgala.in';

async function fetchWebsiteProductByBarcode(barcode, token) {
  try {
    const response = await fetch(
      `${API_BASE}/api/website/products?search=${encodeURIComponent(barcode)}&limit=5`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          : { 'Content-Type': 'application/json' }
      }
    );
    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    const list = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data)
          ? data
          : [];
    return list.find((p) => (p.barcode || p.sku || p.code || '').toString().includes(barcode)) || null;
  } catch {
    return null;
  }
}

async function requestOpenRouterCompletion(messages) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured. Set OPENROUTER_API_KEY in environment.');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0,
      max_tokens: 1000,
      messages
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || `HTTP ${response.status}`;
    throw new Error(`OpenRouter API error: ${errorMessage}`);
  }

  return data;
}

function extractBarcode(text) {
  const m = String(text || '').match(/\b(\d{4,16})\b/);
  return m ? m[1] : null;
}

function findProduct(list, code) {
  if (!Array.isArray(list) || !code) return null;
  return list.find((p) => {
    const b = (p.barcode || p.sku || p.code || '').toString();
    return b && b.includes(code);
  }) || null;
}

export async function POST(req) {
  try {
    const { question, products, categories, conversationHistory, authToken } =
      await req.json();

    if (!question) {
      return NextResponse.json({ success: false, error: 'Question is required' }, { status: 400 });
    }

    const prods = Array.isArray(products) ? products : [];
    const cats = Array.isArray(categories) ? categories : [];
    const localBarcode = extractBarcode(question);

    if (localBarcode) {
      let found = findProduct(prods, localBarcode);
      if (!found) {
        found = await fetchWebsiteProductByBarcode(localBarcode, authToken || '');
      }
      if (found) {
        const name = found.product_name || found.name || found.title || 'Product';
        const cat = found.category || found.category_name || found.category_display_name || 'Uncategorized';
        const price = found.price ?? found.selling_price ?? found.mrp ?? found.final_price ?? null;
        const stock = found.total_stock ?? found.stock ?? found.quantity ?? found.stock_quantity ?? null;
        return NextResponse.json({
          success: true,
          answer:
            `**${name}** (SKU: \`${localBarcode}\`)\n\n` +
            `- **Category:** ${cat}\n` +
            `${price != null ? `- **Price:** ${typeof price === 'number' ? `₹${price.toLocaleString('en-IN')}` : price}\n` : ''}` +
            `${stock != null ? `- **Stock:** ${stock > 0 ? stock + ' units' : 'Out of Stock'}\n` : ''}` +
            `\nWould you like anything else about this product?`,
          model: 'local-lookup'
        });
      }
    }

    const opsAnswer = await tryInsoraOppsDataAnswer(question, authToken || '');
    if (opsAnswer?.answer) {
      return NextResponse.json({
        success: true,
        answer: opsAnswer.answer,
        model: 'deterministic',
        exportTsv: opsAnswer.exportTsv || undefined,
        exportFilename: opsAnswer.exportFilename || undefined
      });
    }

    let brain = null;
    if (authToken) {
      try {
        brain = await buildInventoryGptBrainContext(authToken, { productLimit: 40 });
      } catch (e) {
        console.warn('[InventoryGPT] brain:', e?.message);
      }
    }

    const liveProducts = brain?.inventoryPreview?.length ? brain.inventoryPreview : prods;
    const liveCategories = cats;

    if (localBarcode) {
      const found = findProduct(liveProducts, localBarcode);
      if (found) {
        const name = found.product_name || found.name || found.title || 'Product';
        const cat = found.category || found.category_name || found.category_display_name || 'Uncategorized';
        const price = found.price ?? found.selling_price ?? found.mrp ?? null;
        const stock = found.total_stock ?? found.stock ?? found.quantity ?? null;
        return NextResponse.json({
          success: true,
          answer:
            `**${name}** (SKU: \`${localBarcode}\`)\n\n` +
            `- **Category:** ${cat}\n` +
            `${price != null ? `- **Price:** ${typeof price === 'number' ? `₹${price.toLocaleString('en-IN')}` : price}\n` : ''}` +
            `${stock != null ? `- **Stock:** ${stock > 0 ? stock + ' units' : 'Out of Stock'}\n` : ''}` +
            `\nWould you like anything else about this product?`,
          model: 'local-lookup'
        });
      }
    }

    if (!OPENROUTER_API_KEY) {
      const p = liveProducts.length;
      const c = liveCategories.length;
      return NextResponse.json({
        success: true,
        answer:
          `I'd love to help you with that! \n\n` +
          `I have access to **${p}** live inventory items and **${c}** categories. ` +
          `Please set OPENROUTER_API_KEY in your environment to enable the Mistral model.`,
        model: 'fallback'
      });
    }

    const productContext =
      liveProducts.length > 0
        ? `Live inventory sample:\n${JSON.stringify(liveProducts.slice(0, 30), null, 2)}`
        : 'No live inventory rows in context.';

    const categoryContext =
      liveCategories.length > 0 ? `\nCategories:\n${JSON.stringify(liveCategories.slice(0, 20), null, 2)}` : '';

    const historyContext =
      conversationHistory?.length > 0
        ? `\nPrevious:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}`
        : '';

    const completion = await requestOpenRouterCompletion([
      {
        role: 'system',
        content: `You are InsoraOpps (InventoryGPT), an inventory intelligence copilot for Indian e-commerce ops.
Use live inventory data when provided. Default currency is INR (). Be concise and practical.
Never expose SQL errors, internal APIs, or "Source:" labels. If data is missing, say so clearly.

IMPORTANT BEHAVIOR:
- You are a helpful AI assistant, NOT a human
- Track the last product discussed in conversation context
- When user asks follow-up questions (stock, price, description) about a product mentioned earlier, use that product's context
- If the user asks for a barcode or product, answer with the product name and category first
- After the main answer, always offer a follow-up prompt such as: "If you want the price, description, or stock details, just ask me."
- Keep the tone friendly, direct, and helpful
- Do not return generic category lists when the user asked about a specific SKU
- If the user asks a SKU question like "11232 show me the name of product and it belong to which category", answer like: "This belongs to X category and the product name is Y. If you want description or price, I can share that next."
- Always include one follow-up suggestion at the end of the response.
        `
      },
      {
        role: 'user',
        content: `${productContext}${categoryContext}${historyContext}\n\nQuestion: ${question}`
      }
    ]);

    const answer = completion.choices?.[0]?.message?.content || completion.choices?.[0]?.text;
    if (!answer) throw new Error('No response from AI model');

    return NextResponse.json({
      success: true,
      answer,
      model: OPENROUTER_MODEL
    });
  } catch (error) {
    console.error('InventoryGPT Error:', error);
    return NextResponse.json(
      {
        success: false,
        fallback:
          "I'm having trouble right now. Please try again in a moment or ask about warehouse stock (e.g. stock at GGM_WH)."
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'InsoraOpps / InventoryGPT',
    status: 'operational'
  });
}
