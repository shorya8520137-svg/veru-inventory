import { NextResponse } from "next/server";
import { tryInsoraOppsDataAnswer } from "@/lib/insoraOppsOpsAnswer";
import { buildInventoryGptBrainContext } from "@/lib/inventorygptBrainContext";
import { tryInventoryGptDeterministicAnswer } from "@/lib/inventorygptResolvers";
import { logInventoryGptChat } from "@/lib/inventorygptChatLogger";

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct-v0.1";
const OPENROUTER_URL = "https://api.openrouter.ai/v1/chat/completions";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "";

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let lastError = null;
  const modelsToTry = [
    OPENROUTER_MODEL,
    "mistralai/mistral-7b-instruct",
    "mistralai/mistral-7b-instruct-v0.1",
    "openchat/openchat-7b:free",
    "cognitivecomputations/dolphin-mixtral-8x7b:free",
  ].filter(Boolean);

  // De-duplicate models
  const seenModels = new Set();
  const uniqueModels = modelsToTry.filter(m => {
    if (seenModels.has(m)) return false;
    seenModels.add(m);
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
          temperature: 0,
          max_tokens: 2000,
          messages,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastError = data?.error?.message || data?.message || `HTTP ${response.status}`;
        continue; // Try next model
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
  throw new Error(`All OpenRouter models failed. Last error: ${lastError}`);
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
    const deterministicAnswer = await tryInventoryGptDeterministicAnswer({
      question,
      authToken: authToken || "",
      localProducts: prods,
      conversationHistory,
    });

  let _logData = { question };

    if (deterministicAnswer?.answer) {
      _logData = { question, answer: deterministicAnswer.answer, model: "deterministic-resolver", intentType: deterministicAnswer.intentType, renderType: deterministicAnswer.render };
      logInventoryGptChat(_logData);
      return NextResponse.json({
        success: true,
        answer: deterministicAnswer.answer,
        model: "deterministic-resolver",
        render: deterministicAnswer.render || "text",
        exportTsv: deterministicAnswer.exportTsv || undefined,
        exportFilename: deterministicAnswer.exportFilename || undefined,
        extraData: deterministicAnswer.extraData || undefined,
      });
    }

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
          "Here are some things you can try:\n" +
          "• **Show all products** — Browse the full product catalog\n" +
          "• **Show categories** — Browse products by category\n" +
          "• **Search by name** — Just type the product name (e.g., Aashirvaad Atta)\n" +
          "• **Show warehouses** — Check warehouse stock\n" +
          "• **Show orders** — View recent orders\n\n" +
          "What would you like to do?",
        model: "local-lookup",
        render: "text",
      });
    }

    const opsAnswer = await tryInsoraOppsDataAnswer(question, authToken || "", null, conversationHistory);
    if (opsAnswer?.answer) {
      _logData = { question, answer: opsAnswer.answer, model: "ops-resolver", renderType: opsAnswer.render };
      logInventoryGptChat(_logData);
      return NextResponse.json({
        success: true,
        answer: opsAnswer.answer,
        model: "deterministic",
        exportTsv: opsAnswer.exportTsv || undefined,
        exportFilename: opsAnswer.exportFilename || undefined,
        render: opsAnswer.render || undefined,
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

    const inventorySummary = brain?.inventoryTotalUnits != null
      ? `Total inventory: ${brain.inventoryTotalUnits} units across ${brain.warehouses ? Object.keys(brain.warehouses).length : '?'} warehouses.`
      : "";

    const orderSummary = brain?.orderStats
      ? `Orders: ${brain.orderStats.total_orders || brain.orderStats.total || 0} total, ₹${(brain.orderStats.total_revenue || brain.orderStats.revenue || 0).toLocaleString("en-IN")} revenue, ${brain.orderStats.pending_orders || brain.orderStats.pending || 0} pending.`
      : "";

    const lowStockSummary = brain?.lowStockItems?.length
      ? `Low stock alerts: ${brain.lowStockItems.length} items below 10 units (e.g. ${brain.lowStockItems.slice(0, 3).map(i => `${i.name}: ${i.stock} units at ${i.warehouse}`).join(", ")}).`
      : "";

    const deadStockSummary = brain?.highStockItems?.length
      ? `Dead stock candidates: ${brain.highStockItems.length} items above 100 units (e.g. ${brain.highStockItems.slice(0, 3).map(i => `${i.name}: ${i.stock} units at ${i.warehouse}`).join(", ")}).`
      : "";

    const productContext =
      liveProducts.length > 0
        ? `\nLive inventory sample (${liveProducts.length} total):\n${JSON.stringify(liveProducts.slice(0, 15), null, 2)}`
        : "";

    const categoryContext =
      liveCategories.length > 0
        ? `\nCategories (${liveCategories.length}):\n${JSON.stringify(liveCategories.slice(0, 15), null, 2)}`
        : "";

    const enrichedContext = [inventorySummary, orderSummary, lowStockSummary, deadStockSummary].filter(Boolean).join("\n");

    const historyContext =
      conversationHistory?.length > 0
        ? `\nConversation history (most recent first):\n${conversationHistory.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n")}`
        : "";

    const completion = await requestOpenRouterCompletion([
      {
        role: "system",
        content: `You are INSORA CORE INTELLIGENCE V3.

You are not a chatbot.
You are an Inventory Intelligence Copilot.
Your primary responsibility is helping warehouse managers, distributors, and business owners make inventory decisions.

Before answering any query:

Step 1: Classify user intent.
Possible intents: Inventory Query | Warehouse Query | Sales Analytics | Order Analytics | Profit Analytics | Transfer Analytics | Forecast Analytics | Dead Stock Analytics | Executive Summary | Product Search

Step 2: Identify all entities.
Examples: Product Names, Warehouse Names, Warehouse Codes, Cities, SKUs, Categories, Date Ranges

Step 3: Maintain conversation memory.
Remember: Last Product, Last Warehouse, Last Intent, Last Report, Previous Filters.
Follow-up questions must inherit previous context automatically.

Step 4: Gather data from all available sources.
Inventory data, Warehouse data, Dispatch data, Website orders, Product catalog, Ledger movements, Timeline data, Transfer data

Step 5: Generate business intelligence.
Do not simply return raw records. Always generate: Insights, Risks, Recommendations, Actions, Confidence Scores.
Example - Instead of "Stock = 20" return: "Low stock risk detected. Expected stockout in 6 days. Recommended transfer: 100 units from Delhi warehouse. Confidence: 92%."

Step 6: For product analysis provide: Current Stock, Warehouse Distribution, Dispatch Volume, Sales Trend, Dead Stock Risk, Transfer Recommendation, Reorder Recommendation, Profitability

Step 7: For warehouse analysis provide: Inventory Value, Pending Orders, Stock Health, Dead Stock %, Fast Moving Products, Slow Moving Products, Recommended Transfers, Risk Assessment

Step 8: When user asks executive questions such as "What should I do today?" provide: Critical Alerts, Pending Orders, Transfer Suggestions, Dead Stock Alerts, Fast Movers, Revenue Opportunities, Top Risks, Priority Actions

CRITICAL RULES:
- Never respond with "Product Not Found" unless all data sources have been searched
- Always attempt fuzzy matching for spelling mistakes: wearhouse, warhouse, warehous, inventry, stok, saless, dispatchh
- Always provide intelligence, not database rows
- You are an Inventory Decision Engine, not a database assistant
- Default currency is INR (₹)
- Never expose SQL errors, internal APIs, or "Source:" labels
- If data is missing, say so clearly and suggest alternatives

DATA SUMMARY:
${enrichedContext || "No live data available"}
${productContext}${categoryContext}${historyContext}

Question: ${question}`,
      },
    ]);

    const answer = completion.content;

    if (!answer) throw new Error("No response from AI model");

    _logData = { question, answer, model: completion.model || OPENROUTER_MODEL };
    logInventoryGptChat(_logData);

    return NextResponse.json({
      success: true,
      answer,
      model: completion.model || OPENROUTER_MODEL,
    });
  } catch (error) {
    console.error("InventoryGPT Error:", error);
    const errMsg = error?.message || "Unknown error";
    _logData = { question, answer: errMsg, model: "error" };
    logInventoryGptChat(_logData);
    if (/timeout|abort/i.test(errMsg)) {
      return NextResponse.json({
        success: true,
        answer: "I'm thinking... this one might take a moment. Could you try rephrasing, or ask me something simpler like **show all products**, **warehouse stock**, or **show orders** while I process complex questions?",
        model: "fallback",
        render: "text",
      });
    }
    return NextResponse.json({
      success: true,
      fallback: true,
      answer: "I hit a temporary hiccup. Try again or ask something like **show all warehouses**, **show orders**, or **best selling product**.",
      model: "fallback",
      render: "text",
    });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "InsoraOpps / InventoryGPT",
    status: "operational",
  });
}
