import { NextResponse } from "next/server";
import { tryInsoraOppsDataAnswer } from "@/lib/insoraOppsOpsAnswer";
import { buildInventoryGptBrainContext } from "@/lib/inventorygptBrainContext";

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct-v0.1";
const OPENROUTER_URL = "https://api.openrouter.ai/v1/chat/completions";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "https://api.giftgala.in";

function apiHeaders(token) {
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

function rowsFromPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data?.products)) return payload.data.products;
  if (Array.isArray(payload.data?.items)) return payload.data.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.products)) return payload.products;
  if (payload.data && typeof payload.data === "object") return [payload.data];
  return [];
}

function normalizeProductForAnswer(product, source = "") {
  if (!product) return null;
  const sku = (
    product.barcode ||
    product.sku ||
    product.code ||
    product.sku_id ||
    ""
  ).toString();
  return {
    ...product,
    source: product.source || source,
    sku,
    barcode: product.barcode || product.sku || sku,
    product_name:
      product.product_name || product.name || product.title || sku || "Product",
    category:
      product.category ||
      product.category_display_name ||
      product.category_name ||
      product.category_slug ||
      "Uncategorized",
    price:
      product.price ??
      product.selling_price ??
      product.offer_price ??
      product.final_price ??
      product.mrp ??
      null,
    total_stock:
      product.total_stock ??
      product.stock ??
      product.quantity ??
      product.stock_quantity ??
      product.qty_available ??
      null,
  };
}

function findProduct(list, code) {
  if (!Array.isArray(list) || !code) return null;
  const needle = code.toString().trim().toLowerCase();
  const normalized = list
    .map((p) => normalizeProductForAnswer(p))
    .filter(Boolean);
  return (
    normalized.find((p) =>
      [p.barcode, p.sku, p.code, p.sku_id].some(
        (v) => v?.toString().trim().toLowerCase() === needle,
      ),
    ) ||
    normalized.find((p) =>
      [p.barcode, p.sku, p.code, p.sku_id].some((v) =>
        v?.toString().trim().toLowerCase().includes(needle),
      ),
    ) ||
    null
  );
}

function formatInr(value) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return `₹${numeric.toLocaleString("en-IN")}`;
  return String(value);
}

function productAnswer(product, barcode, options = {}) {
  const found = normalizeProductForAnswer(product);
  if (!found) return null;

  const requested = options.requested || "summary";
  const name = found.product_name || found.name || found.title || "Product";
  const cat =
    found.category ||
    found.category_name ||
    found.category_display_name ||
    "Uncategorized";
  const price =
    found.price ??
    found.selling_price ??
    found.mrp ??
    found.final_price ??
    null;
  const stock =
    found.total_stock ??
    found.stock ??
    found.quantity ??
    found.stock_quantity ??
    null;
  const desc =
    found.description ||
    found.short_description ||
    found.product_description ||
    "No description is available for this product yet.";
  const sourceLabel =
    found.source === "website_products"
      ? "Website Product catalog"
      : "Product catalog";
  const sku = found.sku || barcode;
  const lines = [`**${name}** (SKU: \`${sku}\`)`, ""];

  if (requested === "description") {
    lines.push(`- **Description:** ${desc}`);
    lines.push(`- **Category:** ${cat}`);
  } else if (requested === "price") {
    const formattedPrice = formatInr(price);
    lines.push(`- **Price:** ${formattedPrice || "Price not available"}`);
    lines.push(`- **Category:** ${cat}`);
  } else if (requested === "stock") {
    lines.push(
      `- **Stock:** ${stock != null && Number(stock) > 0 ? stock + " units" : "Out of Stock"}`,
    );
    lines.push(`- **Category:** ${cat}`);
  } else {
    lines.push(`- **Category:** ${cat}`);
    lines.push(`- **Catalog:** ${sourceLabel}`);
    const formattedPrice = formatInr(price);
    if (formattedPrice) lines.push(`- **Price:** ${formattedPrice}`);
    if (stock != null) {
      lines.push(
        `- **Stock:** ${Number(stock) > 0 ? stock + " units" : "Out of Stock"}`,
      );
    }
  }

  lines.push("");
  lines.push(
    "If you want description, warehouse breakup, price, stock, or product journey, just ask me.",
  );
  return lines.join("\n");
}

function extractLastBarcodeFromHistory(history) {
  if (!Array.isArray(history)) return null;
  for (const message of [...history].reverse()) {
    const content = String(message?.content || "");
    const skuMatch = content.match(/SKU:\s*`?(\d{4,16})`?/i);
    if (skuMatch) return skuMatch[1];
    const anyBarcode = content.match(/\b(\d{8,16})\b/);
    if (anyBarcode) return anyBarcode[1];
  }
  return null;
}

function productFollowUpType(question) {
  const lower = String(question || "").toLowerCase();
  if (/description|describe|details?|about this|about product/.test(lower))
    return "description";
  if (/price|cost|mrp|rate|amount/.test(lower)) return "price";
  if (/stock|quantity|qty|available|availability/.test(lower)) return "stock";
  if (/category|belong/.test(lower)) return "category";
  return null;
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: apiHeaders(token),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

async function fetchProductByBarcodeFromCatalogs(barcode, token) {
  const code = encodeURIComponent(barcode);
  const candidates = [];

  const endpoints = [
    {
      source: "dispatch_product",
      url: `${API_BASE}/api/products/search/${code}`,
    },
    {
      source: "dispatch_product",
      url: `${API_BASE}/api/products?search=${code}&limit=10`,
    },
    {
      source: "website_products",
      url: `${API_BASE}/api/website/products?search=${code}&limit=10`,
    },
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJson(endpoint.url, token);
      const rows = rowsFromPayload(payload).map((p) =>
        normalizeProductForAnswer(p, endpoint.source),
      );
      candidates.push(...rows);
    } catch (error) {
      console.warn(
        `[InventoryGPT] product lookup failed for ${endpoint.source}:`,
        error?.message,
      );
    }
  }

  return findProduct(candidates, barcode);
}

async function requestOpenRouterCompletion(messages) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OpenRouter API key is not configured. Set OPENROUTER_API_KEY in environment.",
    );
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0,
      max_tokens: 1000,
      messages,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage =
      data?.error?.message || data?.message || `HTTP ${response.status}`;
    throw new Error(`OpenRouter API error: ${errorMessage}`);
  }

  return data;
}

function extractBarcode(text) {
  const raw = String(text || "");
  const m = raw.match(/\b(\d{4,16})\b/);
  if (!m) return null;

  const lower = raw.toLowerCase();
  const looksLikeProductQuestion =
    /sku|barcode|product|catalog|category|item|name|price|stock/.test(lower) ||
    raw.replace(/\D/g, "") === m[1];

  return looksLikeProductQuestion ? m[1] : null;
}

export async function POST(req) {
  try {
    const { question, products, categories, conversationHistory, authToken } =
      await req.json();

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question is required" },
        { status: 400 },
      );
    }

    const prods = Array.isArray(products) ? products : [];
    const cats = Array.isArray(categories) ? categories : [];
    const localBarcode = extractBarcode(question);
    const followUpType = productFollowUpType(question);
    const historyBarcode =
      !localBarcode && followUpType
        ? extractLastBarcodeFromHistory(conversationHistory)
        : null;
    const effectiveBarcode = localBarcode || historyBarcode;

    if (effectiveBarcode) {
      let found = findProduct(prods, effectiveBarcode);
      if (!found) {
        found = await fetchProductByBarcodeFromCatalogs(
          effectiveBarcode,
          authToken || "",
        );
      }
      if (found) {
        const answer = productAnswer(found, effectiveBarcode, {
          requested: followUpType || "summary",
        });
        return NextResponse.json({
          success: true,
          answer,
          model: "local-lookup",
          render: "text",
        });
      }

      return NextResponse.json({
        success: true,
        answer:
          `I checked both catalogs for SKU \`${effectiveBarcode}\`, but I could not find this product.\n\n` +
          `- Checked: **Product catalog** (dispatch products)\n` +
          `- Checked: **Website Product catalog**\n\n` +
          `Please confirm the SKU/barcode, or ask me to show categories/products separately.`,
        model: "local-lookup",
        render: "text",
      });
    }

    const opsAnswer = await tryInsoraOppsDataAnswer(question, authToken || "");
    if (opsAnswer?.answer) {
      return NextResponse.json({
        success: true,
        answer: opsAnswer.answer,
        model: "deterministic",
        exportTsv: opsAnswer.exportTsv || undefined,
        exportFilename: opsAnswer.exportFilename || undefined,
      });
    }

    let brain = null;
    if (authToken) {
      try {
        brain = await buildInventoryGptBrainContext(authToken, {
          productLimit: 40,
        });
      } catch (e) {
        console.warn("[InventoryGPT] brain:", e?.message);
      }
    }

    const liveProducts = brain?.inventoryPreview?.length
      ? brain.inventoryPreview
      : prods;
    const liveCategories = cats;

    if (!OPENROUTER_API_KEY) {
      const p = liveProducts.length;
      const c = liveCategories.length;
      return NextResponse.json({
        success: true,
        answer:
          `I'd love to help you with that! \n\n` +
          `I have access to **${p}** live inventory items and **${c}** categories. ` +
          `Please set OPENROUTER_API_KEY in your environment to enable the Mistral model.`,
        model: "fallback",
        render: "text",
      });
    }

    const productContext =
      liveProducts.length > 0
        ? `Live inventory sample:\n${JSON.stringify(liveProducts.slice(0, 30), null, 2)}`
        : "No live inventory rows in context.";

    const categoryContext =
      liveCategories.length > 0
        ? `\nCategories:\n${JSON.stringify(liveCategories.slice(0, 20), null, 2)}`
        : "";

    const historyContext =
      conversationHistory?.length > 0
        ? `\nPrevious:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}`
        : "";

    const completion = await requestOpenRouterCompletion([
      {
        role: "system",
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
        `,
      },
      {
        role: "user",
        content: `${productContext}${categoryContext}${historyContext}\n\nQuestion: ${question}`,
      },
    ]);

    const answer =
      completion.choices?.[0]?.message?.content ||
      completion.choices?.[0]?.text;
    if (!answer) throw new Error("No response from AI model");

    return NextResponse.json({
      success: true,
      answer,
      model: OPENROUTER_MODEL,
    });
  } catch (error) {
    console.error("InventoryGPT Error:", error);
    return NextResponse.json(
      {
        success: false,
        fallback:
          "I'm having trouble right now. Please try again in a moment or ask about warehouse stock (e.g. stock at GGM_WH).",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "InsoraOpps / InventoryGPT",
    status: "operational",
  });
}
