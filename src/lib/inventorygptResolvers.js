const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "https://api.giftgala.in";

function authHeaders(token) {
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function apiGet(path, token) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        error: data?.message || data?.error || `HTTP ${response.status}`,
      };
    }
    return { data };
  } catch (error) {
    return { error: error?.message || "Network error" };
  }
}

function rowsFromPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data?.products)) return payload.data.products;
  if (Array.isArray(payload.data?.items)) return payload.data.items;
  if (Array.isArray(payload.data?.inventory)) return payload.data.inventory;
  if (Array.isArray(payload.data?.orders)) return payload.data.orders;
  if (Array.isArray(payload.data?.logs)) return payload.data.logs;
  if (Array.isArray(payload.data?.warehouses)) return payload.data.warehouses;
  if (Array.isArray(payload.data?.stores)) return payload.data.stores;
  if (Array.isArray(payload.data?.categories)) return payload.data.categories;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.orders)) return payload.orders;
  if (Array.isArray(payload.logs)) return payload.logs;
  if (Array.isArray(payload.warehouses)) return payload.warehouses;
  if (Array.isArray(payload.stores)) return payload.stores;
  if (Array.isArray(payload.categories)) return payload.categories;
  if (payload.data && typeof payload.data === "object") return [payload.data];
  return [];
}

function formatInr(value) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return `₹${numeric.toLocaleString("en-IN")}`;
  return String(value);
}

export function extractInventoryGptBarcode(text) {
  const raw = String(text || "");

  // First try alphanumeric SKU patterns like FG-082-5KG, ABC-123, SKU-001
  const alphaSkuMatch = raw.match(/\b([A-Za-z]{1,5}[-_]?\d{1,6}[-_][A-Za-z0-9]{1,6}[-_]?\d{0,4}[A-Za-z0-9]{0,3})\b/);
  if (alphaSkuMatch) {
    const lower = raw.toLowerCase();
    const looksLikeProductQuestion =
      /sku|barcode|product|catalog|category|item|name|price|stock|journey|timeline|ledger|order|audit|description|show|detail/.test(
        lower,
      );
    return looksLikeProductQuestion ? alphaSkuMatch[1] : null;
  }

  // Then try pure numeric barcodes (4-16 digits)
  const m = raw.match(/\b(\d{4,16})\b/);
  if (!m) return null;
  const lower = raw.toLowerCase();
  const looksLikeProductQuestion =
    /sku|barcode|product|catalog|category|item|name|price|stock|journey|timeline|ledger|order|audit|description|show|detail/.test(
      lower,
    ) || raw.replace(/\D/g, "") === m[1];
  return looksLikeProductQuestion ? m[1] : null;
}

export function extractInventoryGptWarehouse(text) {
  const m = String(text || "").match(/\b([A-Z]{2,8}_WH)\b/i);
  return m ? m[1].toUpperCase() : null;
}

export function extractLastInventoryGptBarcode(history) {
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

// Extract active context from conversation history (category, product, warehouse, SKU)
export function extractActiveContext(conversationHistory = []) {
  const context = {
    category: null,
    product: null,
    warehouse: null,
    sku: null,
  };

  if (!Array.isArray(conversationHistory)) return context;

  // IMPORTANT: Multi-word categories MUST come first to avoid partial matches
  // "home & kitchen" must be checked before "home" or "kitchen"
  const categoryNames = ["home & kitchen", "home--kitchen", "electronics", "sports", "clothing", "home", "kitchen", "beauty", "books", "toys", "grocery", "health", "food", "fashion", "accessories"];

  // Search from most recent to oldest
  for (const message of [...conversationHistory].reverse()) {
    const content = String(message?.content || "");
    const isAssistant = message?.role === "assistant";
    const isUser = message?.role === "user";

    // Extract category from assistant responses
    if (isAssistant) {
      // Match: "**Category:** Home & Kitchen" or "Category: beauty"
      // Check multi-word categories first to avoid partial matches
      for (const cat of categoryNames) {
        // Escape special regex characters in category name (e.g., "&")
        const escapedCat = cat.replace(/[&]/g, '\\$&');
        const catRegex = new RegExp(`Category[^\\n]*${escapedCat}`, 'i');
        if (catRegex.test(content) && !context.category) {
          context.category = cat;
        }
      }
      // Match: SKU: `FG-082-5KG` or SKU: FG-082-5KG
      const skuMatch = content.match(/SKU:\s*`?([A-Za-z0-9-]+)`?/i);
      if (skuMatch && !context.sku) {
        context.sku = skuMatch[1];
      }
      // Match product name from bold text at start: "**H&M Women Jeans**"
      const productMatch = content.match(/\*\*([^*]+)\*\*.*SKU:/i);
      if (productMatch && !context.product) {
        context.product = productMatch[1].trim();
      }
    }

    // Extract category/product from user queries
    if (isUser) {
      const lowerContent = content.toLowerCase();
      for (const cat of categoryNames) {
        if (lowerContent.includes(cat) && !context.category) {
          context.category = cat;
        }
      }
    }

    // Stop if we have all context
    if (context.category && context.product && context.sku) break;
  }

  return context;
}

export function detectInventoryGptIntent(question, conversationHistory = []) {
  const raw = String(question || "").trim();
  const lower = raw.toLowerCase();
  const wantsExport = /excel|spreadsheet|csv|export|download|sheet|table/.test(
    lower,
  );

  // Extract active context from conversation history
  const activeContext = extractActiveContext(conversationHistory);

  // ========================================
  // STEP 1 — ENTITY DETECTION (before intent classification)
  // ========================================
  const categoryNames = ["home & kitchen", "home--kitchen", "electronics", "sports", "clothing", "home", "kitchen", "beauty", "books", "toys", "grocery", "health", "food", "fashion", "accessories"];
  
  // Detect SKU/barcode (alphanumeric like FG-082-5KG or numeric like 12345678)
  const detectedSKU = extractInventoryGptBarcode(raw);
  
  // Detect warehouse names
  const detectedWarehouse = extractInventoryGptWarehouse(raw);
  
  // Detect category names in query
  const detectedCategory = categoryNames.find(cat => lower.includes(cat)) || activeContext.category;
  
  // Detect if query is JUST a product name (no action words, no question words)
  const isJustEntity = !/show|list|get|display|view|find|search|check|tell|batao|kya|kise|kis|konsa|belong|which|what|how|when|where|who|why|stock|price|cost|timeline|journey|audit|order|transfer|return|damage|excel|export|download|category|categor|warehouse|warhorse|wearhouse|werahouse|store|details|address|manager|contact|location/.test(lower);
  
  // ========================================
  // STEP 2 — IF ONLY PRODUCT NAME → PRODUCT_OVERVIEW
  // ========================================
  if (isJustEntity && raw.length > 2 && !detectedSKU && !detectedWarehouse && !detectedCategory) {
    // User just typed a product name like "Lakme Absolute Lipstick"
    // Infer intent: show product overview
    return {
      type: "product",
      field: "summary",
      productName: raw.trim(),
      wantsExport,
    };
  }

  // Follow-up like "?" should continue the last business context instead of failing.
  if (/^[?.!]+$/.test(lower)) {
    const previousUser = [...(conversationHistory || [])]
      .reverse()
      .find(
        (m) =>
          m?.role === "user" &&
          !/^[?.!]+$/.test(String(m.content || "").trim()),
      );
    if (previousUser?.content)
      return detectInventoryGptIntent(previousUser.content, []);
    return { type: "context_help", wantsExport };
  }

  // Follow-up context: "ok then send me", "yes send it", "sure", "do it"
  // These should trigger the last action's export or continue the last context
  // IMPORTANT: Exclude full queries that contain category names or are complete requests
  const hasCategoryName = categoryNames.some(cat => lower.includes(cat));
  const isFullRequest = /show.*all.*product|list.*product|get.*product|display.*product|see.*product/.test(lower);
  
  if (
    /^(ok|okay|yes|sure|do it|send|send it|send me|go ahead|please|do that|give me|get it)/.test(lower) &&
    lower.length < 50 &&
    !hasCategoryName &&
    !isFullRequest
  ) {
    // Check if last assistant message mentioned Excel export
    const lastAssistant = [...(conversationHistory || [])]
      .reverse()
      .find((m) => m?.role === "assistant");
    if (lastAssistant?.content && /excel|sheet|export|tsv/i.test(lastAssistant.content)) {
      return { type: "export_followup", wantsExport: true };
    }
    // Check if last user question was about a category/warehouse/price
    const previousUser = [...(conversationHistory || [])]
      .reverse()
      .find((m) => m?.role === "user" && !/^(ok|okay|yes|sure|do it|send|send it|send me|go ahead|please|do that|give me|get it)/.test(String(m.content || "").trim().toLowerCase()));
    if (previousUser?.content) {
      return detectInventoryGptIntent(previousUser.content, []);
    }
    return { type: "context_help", wantsExport };
  }

  // Follow-up with "this category" / "same category" / "that category" - inherit from conversation memory
  if (/this category|same category|that category|of this category|of that category/.test(lower) && /product|item|show|list/.test(lower)) {
    // Use extracted context from conversation history
    if (activeContext.category) {
      return { type: "category_products", category: activeContext.category, wantsExport };
    }
    // If we can't find the category in history, still don't fall through to product_category lookup
    // Return null so the LLM can handle it with context
    return null;
  }

  // Global/list intents must be checked before SKU/product intents.
  if (
    /address|full address|location|phone|email|contact|manager/.test(lower) &&
    /(store|warehouse|wearhouse|werahouse|warhorse|this|same|it)/.test(lower)
  ) {
    return {
      type: "location_detail",
      locationType: /store/.test(lower) && !/warehouse|wearhouse|werahouse|warhorse/.test(lower)
        ? "stores"
        : /warehouse|wearhouse|werahouse|warhorse/.test(lower)
          ? "warehouses"
          : "last",
      wantsExport,
    };
  }

  // Product category lookup: "Aashirvaad Atta belong to which category"
  // Must be checked BEFORE generic category listing
  // ONLY match when asking about a specific product's category
  if (/categor/.test(lower)) {
    // IMPORTANT: "this category/that category" in product requests is NOT a product category query
    const isFollowUpCategoryReference = /this category|that category|same category|of this|of that/.test(lower);
    const isShowAllProducts = /^(show|list|get|display|view|all)\s+(the\s+)?(all\s+)?product/.test(lower);
    
    // Multilingual semantic intent detection for product category lookup
    // English: belong to which category, what is its category, which category
    // Hinglish: kise category se belong kr ta hai, iska category kya hai, konsa category hai
    // Hindi: ye kis category ka hai, category batao, ye kis category se taluk rakhta hai
    const isProductCategoryQuery = !isFollowUpCategoryReference && !isShowAllProducts && (
      /belong|which.*categor|what.*categor/.test(lower) ||
      /kise.*categor|kis.*categor|konsa.*categor|kounsi.*categor/.test(lower) ||
      /category.*kya.*hai|category.*batao|category.*hai/.test(lower) ||
      /taluk|taluk rakhta|taluk rekh|andher ayea|andhar aaya|se belong/.test(lower) ||
      /iska.*category|is.*category|uska.*category|us.*category/.test(lower)
    );
    
    if (isProductCategoryQuery) {
      // Extract potential product name - everything before the category question part
      // English: "Lakme Absolute Lipstick belong to which category" → "Lakme Absolute Lipstick"
      // Hinglish: "Lakme Absolute Lipstick kise category se belong kr ta hai" → "Lakme Absolute Lipstick"
      // Hinglish: "Lakme Absolute Lipstick iska category kya hai" → "Lakme Absolute Lipstick"
      let productName = "";
      
      // Try multiple patterns to extract product name
      // IMPORTANT: Hinglish patterns MUST come first (more specific)
      const patterns = [
        /^(.+?)\s+(?:iska|is|uska|us)\s+categor/,
        /^(.+?)\s+(?:kise|kis|konsa|kounsi)\s+categor/,
        /^(.+?)\s+categor\s+(?:kya|batao|hai|bta)/,
        /^(.+?)\s+(?:taluk|andher|andhar)/,
        /^(.+?)\s+(?:belong|which|what)/,
      ];
      
      for (const pattern of patterns) {
        const match = lower.match(pattern);
        if (match) {
          productName = match[1].trim();
          break;
        }
      }
      
      if (productName) {
        // Clean up filler words (English + Hinglish + category-related words)
        productName = productName.replace(/\b(this|that|the|a|an|is|are|it|for|me|my|your|his|her|our|their|product|item|name|ye|ya|hai|ho|tha|the|ne|se|ka|ke|ki|ko|mein|par|aur|bhi|to|hi|jo|kise|kis|konsa|kounsi|iska|is|uska|us|category|categor|belong|se|kr|ta|hai|rekh|rakhta|andher|andhar|batao|bta|kya)\b/gi, '').trim();
        // Remove extra spaces
        productName = productName.replace(/\s+/g, ' ').trim();
        
        if (productName.length > 0) {
          return {
            type: "product_category",
            productName,
            wantsExport,
          };
        }
      }
      // If no clear product name but mentions category question, try to extract from context
      return {
        type: "product_category",
        productName: null,
        wantsExport,
      };
    }
  }

  // Category-based product listing: "grocery show me all the product", "show all products in electronics"
  // Also handles: "show me all the product of this category" (with inherited context)
  if (
    (/product|item/.test(lower)) &&
    !/sku|barcode|single|specific|this product|this item|one product/.test(lower)
  ) {
    // Check if a category name is explicitly mentioned
    for (const cat of categoryNames) {
      if (lower.includes(cat)) {
        return { type: "category_products", category: cat, wantsExport };
      }
    }
    // Check for "this category" / "that category" with inherited context
    if (/this category|that category|same category|of this|of that/.test(lower)) {
      // Use extracted active context from conversation history
      if (activeContext.category) {
        return { type: "category_products", category: activeContext.category, wantsExport };
      }
    }
  }

  // Price-based product filtering: "products less than 300", "items above 500"
  const priceFilterMatch = lower.match(
    /(?:product|item|show|all).*(?:less than|below|under|cheaper than|max|maximum|upto|up to)\s*₹?\s*(\d+)/
  ) || lower.match(
    /(?:product|item|show|all).*(?:more than|above|over|greater than|higher than|min|minimum)\s*₹?\s*(\d+)/
  ) || lower.match(
    /(?:less than|below|under|cheaper than|max|maximum)\s*₹?\s*(\d+).*(?:product|item)/
  ) || lower.match(
    /(?:more than|above|over|greater than|higher than|min|minimum)\s*₹?\s*(\d+).*(?:product|item)/
  );
  if (priceFilterMatch) {
    const isLessThan = /less than|below|under|cheaper than|max|maximum|upto|up to/.test(lower);
    return {
      type: "price_filter",
      priceOperator: isLessThan ? "<" : ">",
      priceValue: parseInt(priceFilterMatch[1], 10),
      wantsExport,
    };
  }

  // Warehouse-based product listing: "show all products in gandu nagar warehouse"
  const genericPhraseRe = /^(?:all|every|each|the|this|that|any|some|a|an|of|in|for|from|to)(?:\s+(?:all|every|each|the|this|that|any|some|a|an|of|in|for|from|to))*$/i;
  const warehouseProductMatch = lower.match(
    /(?:product|item|stock|inventory).*(?:in|at|of|from)\s+([\w\s]+?)\s*(?:warehouse|wearhouse|werahouse|warhorse|wh|store)/
  ) || lower.match(
    /(?:in|at|of|from)\s+([\w\s]+?)\s*(?:warehouse|wearhouse|werahouse|warhorse|wh|store).*(?:product|item|stock|inventory)/
  );
  const warehouseProductName = warehouseProductMatch?.[1]?.trim();
  const isGenericWarehouseName = !!warehouseProductName && genericPhraseRe.test(warehouseProductName);
  if (warehouseProductMatch && /product|item|stock|inventory/.test(lower) && !isGenericWarehouseName) {
    return {
      type: "warehouse_products",
      warehouseName: warehouseProductName,
      wantsExport,
    };
  }

  // Warehouse stock prompt: user asks about stock across warehouses but doesn't name one
  // Must be checked BEFORE categories/warehouses/stock to catch queries like
  // "show me stock of all the warehouse", "sare warehouse ka stock dikhao"
  // Also catches "show me all stock" / "show me all products" (no warehouse mentioned)
  if (
    /show.*(?:stock|inventory|quantity).*(?:warehouse|wearhouse|werahouse|warhorse)/.test(lower) ||
    /(?:warehouse|wearhouse|werahouse|warhorse).*(?:stock|inventory|quantity)/.test(lower) ||
    /(?:all|every|each|sare|saare|sabhi).*(?:warehouse|wearhouse|werahouse|warhorse).*(?:stock|inventory|product)/.test(lower) ||
    /(?:stock|inventory|quantity).*(?:all|every|each|sare|saare|sabhi).*(?:warehouse|wearhouse|werahouse|warhorse)/.test(lower) ||
    /^show\s+(?:me\s+)?(?:all|every|the\s+entire)\s+(?:stock|inventory|products?|items?)\s*$/.test(lower) ||
    /^show\s+(?:me\s+)?(?:all|every|the\s+entire)\s+(?:stock|inventory|products?|items?).*dikhao/.test(lower) ||
    /(?:sare|saare|sabhi|all)\s+(?:stock|product|item|inventory|samagri|cheeze?)\s+(?:dikhao|show)/.test(lower)
  ) {
    if (!detectedWarehouse && (!warehouseProductMatch || isGenericWarehouseName)) {
      return { type: "warehouse_prompt", wantsExport };
    }
  }

  if (/categor/.test(lower) && !/product|item|show.*product/.test(lower)) {
    return {
      type: /website|web site|websites|website product|site/.test(lower)
        ? "website_categories"
        : "categories",
      wantsExport,
    };
  }
  if (
    /how\s*(many|much|may).*(?:warehouse|wearhouse|werahouse|warhorse)|total.*(?:warehouse|wearhouse|werahouse|warhorse)|list.*(?:warehouse|wearhouse|werahouse|warhorse)|(?:warehouse|warehouses|wearhouse|wearhouses|werahouse|werahouses|warhorse|warhorses)\s*(?:i have|count|list)?$/.test(
      lower,
    ) ||
    (/show\s+(?:me\s+)?(?:all\s+)?(?:the\s+)?(?:warehouse|warehouses|wearhouse|wearhouses|warhorse|warhorses)(?:\s+with\s+(?:complete\s+)?details)?\s*$/.test(lower) && !/stock|inventory|quantity|product/.test(lower))
  ) {
    return { type: "warehouses", wantsExport };
  }
  if (
    /how\s*(many|much|may).*store|total.*store|list.*store|show.*store|stores?\s*(i have|count|list)?$/.test(
      lower,
    )
  ) {
    return { type: "stores", wantsExport };
  }
  if (/store inventory|inventory.*store|stores inventory/.test(lower))
    return { type: "store_inventory", wantsExport };
  if (/graph|chart|visual/.test(lower)) return { type: "graph", wantsExport };
  if (wantsExport && /this|it|same|current|last/.test(lower))
    return { type: "product", field: "summary", wantsExport };
  if (/journey|timeline|ledger|movement|in and out|history/.test(lower))
    return { type: "timeline", wantsExport };
  if (
    /audit|who changed|who update|who updated|activity|log|login.*user|which user|by which user/.test(
      lower,
    )
  )
    return { type: "audit", wantsExport };
  if (/order|sale|revenue|regional|region/.test(lower))
    return { type: "orders", wantsExport };
  if (/description|describe|details?|about this|about product/.test(lower))
    return { type: "product", field: "description", wantsExport };
  if (/price|cost|mrp|rate|amount/.test(lower))
    return { type: "product", field: "price", wantsExport };
  if (/stock|quantity|qty|available|availability/.test(lower))
    return { type: "stock", wantsExport };
  if (/sku|barcode|product|item|name|what about this/.test(lower))
    return { type: "product", field: "summary", wantsExport };
  if (wantsExport) return { type: "export_help", wantsExport };
  return null;
}

function normalizeProduct(product, source = "") {
  if (!product) return null;
  const sku = (
    product.barcode ||
    product.sku ||
    product.code ||
    product.sku_id ||
    ""
  ).toString();
  const stock =
    product.total_stock ??
    product.stock ??
    product.quantity ??
    product.stock_quantity ??
    product.qty_available ??
    null;
  const price =
    product.price ??
    product.selling_price ??
    product.offer_price ??
    product.final_price ??
    product.mrp ??
    null;
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
      product.product_category ||
      "Uncategorized",
    description:
      product.description ||
      product.short_description ||
      product.product_description ||
      "No description is available for this product yet.",
    price,
    cost_price: product.cost_price ?? product.unit_cost ?? null,
    stock,
    weight: product.weight ?? null,
    dimensions: product.dimensions ?? null,
  };
}

function findProduct(list, barcode) {
  if (!Array.isArray(list) || !barcode) return null;
  const needle = barcode.toString().trim().toLowerCase();
  const rows = list.map((p) => normalizeProduct(p)).filter(Boolean);
  return (
    rows.find((p) =>
      [p.barcode, p.sku, p.code, p.sku_id].some(
        (v) => v?.toString().trim().toLowerCase() === needle,
      ),
    ) ||
    rows.find((p) =>
      [p.barcode, p.sku, p.code, p.sku_id].some((v) =>
        v?.toString().trim().toLowerCase().includes(needle),
      ),
    ) ||
    null
  );
}

export async function resolveInventoryGptProduct(
  barcode,
  token,
  localProducts = [],
) {
  const local = findProduct(localProducts, barcode);
  if (local) return local;

  const candidates = [];
  const code = encodeURIComponent(barcode);
  const endpoints = [
    { source: "dispatch_product", path: `/api/products/search/${code}` },
    {
      source: "dispatch_product",
      path: `/api/products?search=${code}&limit=10`,
    },
    {
      source: "website_products",
      path: `/api/website/products?search=${code}&limit=10`,
    },
  ];

  for (const endpoint of endpoints) {
    const result = await apiGet(endpoint.path, token);
    if (!result.error) {
      candidates.push(
        ...rowsFromPayload(result.data).map((row) =>
          normalizeProduct(row, endpoint.source),
        ),
      );
    }
  }

  return findProduct(candidates, barcode);
}

export async function resolveInventoryGptStock(
  barcode,
  token,
  warehouse = null,
) {
  if (!barcode) return { rows: [], total: 0 };
  const params = new URLSearchParams({ search: barcode, limit: "100" });
  if (warehouse) params.set("warehouse", warehouse);

  const inv = await apiGet(`/api/inventory?${params.toString()}`, token);
  const rows = inv.error ? [] : rowsFromPayload(inv.data);
  const normalized = rows
    .filter((row) =>
      String(row.code || row.barcode || row.sku || "").includes(barcode),
    )
    .map((row) => ({
      sku: row.code || row.barcode || row.sku || barcode,
      product_name: row.product_name || row.product || row.name || barcode,
      warehouse: row.warehouse || row.warehouse_code || "—",
      stock: Number(row.stock ?? row.quantity ?? row.qty_available ?? 0),
      source: "stock_batches/api_inventory",
    }));

  return {
    rows: normalized,
    total: normalized.reduce((sum, row) => sum + Number(row.stock || 0), 0),
    error: inv.error || null,
  };
}

export async function resolveInventoryGptJourney(
  query,
  token,
) {
  if (!query || query.length < 2) return { journey: [], summary: null };
  const journey = await apiGet(
    `/api/inventory/product-journey?query=${encodeURIComponent(query)}&limit=100`,
    token,
  );
  if (journey.error) {
    return { journey: [], summary: null, error: journey.error };
  }
  const data = journey.data?.data || journey.data || {};
  return {
    journey: Array.isArray(data.journey) ? data.journey : [],
    summary: data.summary || null,
    product: data.product || null,
    current_stock: data.current_stock || null,
  };
}

export async function resolveInventoryGptTimeline(
  barcode,
  token,
  warehouse = null,
) {
  if (!barcode) return { events: [], summary: null };
  const params = new URLSearchParams({ limit: "25" });
  if (warehouse) params.set("warehouse", warehouse);
  const timeline = await apiGet(
    `/api/timeline/${encodeURIComponent(barcode)}?${params.toString()}`,
    token,
  );
  if (timeline.error)
    return { events: [], summary: null, error: timeline.error };
  const container = timeline.data?.data || timeline.data || {};
  const events = Array.isArray(container.timeline)
    ? container.timeline
    : Array.isArray(timeline.data?.timeline)
      ? timeline.data.timeline
      : rowsFromPayload(timeline.data);
  return { events, summary: container.summary || null };
}

export async function resolveInventoryGptOrders(token) {
  const stats = await apiGet("/api/website/orders/stats", token);
  const orders = await apiGet("/api/website/orders?limit=20", token);
  return {
    stats: stats.error ? null : stats.data?.data || stats.data,
    orders: orders.error ? [] : rowsFromPayload(orders.data),
    error: stats.error || orders.error || null,
  };
}

export async function resolveInventoryGptAudit(token, question = "") {
  const lower = String(question || "").toLowerCase();
  const params = new URLSearchParams({ limit: "20", page: "1" });
  if (/login/.test(lower)) params.set("action", "LOGIN");
  if (/logout/.test(lower)) params.set("action", "LOGOUT");
  if (/product/.test(lower)) params.set("resource", "PRODUCT");
  if (/inventory|stock/.test(lower)) params.set("resource", "INVENTORY");
  const audit = await apiGet(`/api/audit-logs?${params.toString()}`, token);
  return {
    logs: audit.error ? [] : rowsFromPayload(audit.data),
    stats: audit.data?.stats || audit.data?.data?.stats || null,
    error: audit.error || null,
  };
}

function catalogLabel(source) {
  return source === "website_products"
    ? "Website Product catalog"
    : "Product catalog";
}

function productToTsv(product) {
  const header = [
    "sku",
    "product_name",
    "category",
    "catalog",
    "price",
    "cost_price",
    "stock",
    "description",
  ];
  const row = [
    product.sku || product.barcode || "",
    product.product_name || "",
    product.category || "",
    catalogLabel(product.source),
    product.price ?? "",
    product.cost_price ?? "",
    product.stock ?? "",
    String(product.description || "").replace(/\r?\n/g, " "),
  ];
  return `${header.join("\t")}\n${row.join("\t")}`;
}

function rowsToTsv(rows, headers) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return [headers.join("\t")]
    .concat(
      safeRows.map((row) =>
        headers
          .map((h) => String(row[h] ?? "").replace(/\r?\n/g, " "))
          .join("\t"),
      ),
    )
    .join("\n");
}

function buildProductAnswer(product, field, wantsExport) {
  const p = normalizeProduct(product);
  if (!p) return null;

  const title = `✨ **${p.product_name}** (SKU: \`${p.sku || p.barcode}\`)`;
  const formattedPrice = formatInr(p.price);
  const formattedCost = formatInr(p.cost_price);
  const lines = [title, ""];

  if (field === "description") {
    lines.push(`📝 **Description:** ${p.description}`);
    lines.push(`🏷️ **Category:** ${p.category}`);
  } else if (field === "price") {
    lines.push(`💰 **Price:** ${formattedPrice || "Price not available"}`);
    if (formattedCost) lines.push(`🧾 **Cost Price:** ${formattedCost}`);
    lines.push(`🏷️ **Category:** ${p.category}`);
  } else {
    lines.push(`🏷️ **Category:** ${p.category}`);
    lines.push(`📚 **Catalog:** ${catalogLabel(p.source)}`);
    if (formattedPrice) lines.push(`💰 **Price:** ${formattedPrice}`);
    if (formattedCost) lines.push(`🧾 **Cost Price:** ${formattedCost}`);
    if (p.stock != null)
      lines.push(
        `📦 **Stock:** ${Number(p.stock) > 0 ? `${p.stock} units` : "Out of Stock"}`,
      );
    if (p.weight) lines.push(`⚖️ **Weight:** ${p.weight}`);
    if (p.dimensions) lines.push(`📐 **Dimensions:** ${p.dimensions}`);
  }

  lines.push("");
  lines.push(
    "I can also show the **journey**, **warehouse stock**, **audit trail**, or create an **Excel-ready table** for this product.",
  );

  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport ? productToTsv(p) : null,
    exportFilename: wantsExport
      ? `inventorygpt-product-${p.sku || p.barcode}.tsv`
      : null,
  };
}

function buildStockAnswer(product, stockResult, wantsExport) {
  const p = product ? normalizeProduct(product) : null;
  const rows = stockResult.rows || [];
  const lines = [
    `📦 **Stock Intelligence${p ? ` — ${p.product_name}` : ""}**`,
    "",
  ];
  if (!rows.length) {
    lines.push(
      "No live warehouse stock rows were found from the inventory API.",
    );
    if (p?.stock != null)
      lines.push(
        `Catalog stock says: **${Number(p.stock) > 0 ? `${p.stock} units` : "Out of Stock"}**`,
      );
  } else {
    lines.push(
      `Total physical warehouse stock found: **${stockResult.total.toLocaleString("en-IN")} units**`,
    );
    lines.push("");
    rows.slice(0, 12).forEach((row) => {
      lines.push(
        `- **${row.warehouse}** · ${row.stock} units · \`${row.sku}\``,
      );
    });
  }
  lines.push("");
  lines.push(
    "For deeper investigation, ask: **show product journey** or **show audit trail**.",
  );

  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport
      ? rowsToTsv(rows, ["sku", "product_name", "warehouse", "stock", "source"])
      : null,
    exportFilename: wantsExport ? "inventorygpt-stock.tsv" : null,
  };
}

function buildTimelineAnswer(barcode, product, timelineResult, wantsExport) {
  const p = product ? normalizeProduct(product) : null;
  const events = timelineResult.events || [];
  const lines = [
    `🧭 **Product Journey${p ? ` — ${p.product_name}` : ""}** (SKU: \`${barcode}\`)`,
    "",
  ];

  if (!events.length) {
    lines.push("No timeline/ledger events were found for this SKU yet.");
    lines.push(
      "I checked the product timeline endpoint backed by `inventory_ledger_base`.",
    );
  } else {
    if (timelineResult.summary) {
      lines.push(
        `Current stock from timeline summary: **${timelineResult.summary.current_stock ?? "—"}**`,
      );
      lines.push(
        `Total IN: **${timelineResult.summary.total_in ?? "—"}** · Total OUT: **${timelineResult.summary.total_out ?? "—"}**`,
      );
      lines.push("");
    }
    events.slice(0, 12).forEach((event) => {
      const type =
        event.type || event.movement_type || event.event_type || "EVENT";
      const qty = event.quantity ?? event.qty ?? "—";
      const direction =
        event.direction === "IN" ? "+" : event.direction === "OUT" ? "-" : "";
      const when =
        event.timestamp || event.event_time || event.created_at || "";
      const where =
        event.warehouse || event.location_code || event.store_code || "";
      lines.push(
        `- **${type}** · ${direction}${qty}${where ? ` · ${where}` : ""}${when ? ` · ${new Date(when).toLocaleString("en-IN")}` : ""}`,
      );
    });
  }

  lines.push("");
  lines.push(
    "This is the operational truth trail. If needed, I can also compare it with stock batches and audit logs.",
  );

  const exportRows = events.map((event) => ({
    time: event.timestamp || event.event_time || event.created_at || "",
    type: event.type || event.movement_type || event.event_type || "",
    direction: event.direction || "",
    quantity: event.quantity ?? event.qty ?? "",
    location: event.warehouse || event.location_code || event.store_code || "",
    reference: event.reference || "",
  }));

  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport
      ? rowsToTsv(exportRows, [
          "time",
          "type",
          "direction",
          "quantity",
          "location",
          "reference",
        ])
      : null,
    exportFilename: wantsExport ? `inventorygpt-journey-${barcode}.tsv` : null,
  };
}

function buildJourneyAnswer(query, journeyResult, wantsExport) {
  const product = journeyResult.product || null;
  const events = journeyResult.journey || [];
  const currentStock = journeyResult.current_stock || null;
  const summary = journeyResult.summary || null;

  const name = product?.name || query;
  const barcode = product?.barcode || '';
  const lines = [];

  // ── Opening ──
  lines.push(`🧾 **Here is the complete journey of ${name}**`);
  if (barcode) lines.push(`Product Code: \`${barcode}\``);
  lines.push('');

  // ── Current stock ──
  if (currentStock && currentStock.total > 0) {
    lines.push(`📦 **Right now, we have ${currentStock.total} units of ${name} in stock** across ${currentStock.by_location?.length || 0} locations:`);
    if (currentStock.by_location?.length) {
      currentStock.by_location.forEach(loc => {
        const locName = loc.location_name || loc.warehouse || 'Unknown';
        lines.push(`   🔹 ${locName} — **${loc.stock} units**`);
      });
    }
  } else {
    lines.push(`📦 **${name} is currently out of stock across all locations.**`);
  }
  lines.push('');

  // ── High-level summary in plain language ──
  if (summary && events.length > 0) {
    if (summary.total_in > 0 && summary.total_out > 0) {
      lines.push(`📊 **Journey Overview:** A total of **${summary.total_in} units** came in and **${summary.total_out} units** went out, leaving us with the current stock position above.`);
    } else if (summary.total_in > 0) {
      lines.push(`📊 **Journey Overview:** A total of **${summary.total_in} units** have been added — no outward movements yet.`);
    }

    // Narrative by movement type
    const byType = summary.by_type || {};
    const narratives = {
      BULK_UPLOAD: (q) => q > 0 ? `**${q} units** were added as initial stock via bulk upload.` : null,
      OPENING: (q) => q > 0 ? `**${q} units** were set up as opening stock.` : null,
      PURCHASE: (q) => q > 0 ? `**${q} units** were added through purchase.` : null,
      SELF_TRANSFER: (q) => q < 0 ? `**${Math.abs(q)} units** were transferred out to other locations.` : q > 0 ? `**${q} units** were received from other locations.` : null,
      DISPATCH: (q) => q < 0 ? `**${Math.abs(q)} units** were dispatched to customers.` : null,
      SALE: (q) => q < 0 ? `**${Math.abs(q)} units** were sold to customers.` : null,
      RETURN: (q) => q > 0 ? `**${q} units** were returned back.` : null,
      DAMAGE: (q) => q < 0 ? `**${Math.abs(q)} units** were marked as damaged.` : null,
      RECOVER: (q) => q > 0 ? `**${q} units** were recovered from damage.` : null,
      MANUAL: (q) => `**${Math.abs(q)} units** were adjusted manually.`,
    };

    const narrativeLines = [];
    for (const [type, qty] of Object.entries(byType)) {
      const fn = narratives[type];
      if (fn) {
        const msg = fn(qty);
        if (msg) narrativeLines.push(`   · ${msg}`);
      }
    }
    if (narrativeLines.length) {
      lines.push('');
      narrativeLines.forEach(l => lines.push(l));
    }
  }

  // ── Chronological events with full context ──
  if (events.length > 0) {
    lines.push('');
    if (events.length === 1) {
      lines.push(`📅 **There is 1 event in the timeline:**`);
    } else {
      lines.push(`📅 **All ${events.length} events in chronological order:**`);
    }
    lines.push('');

    events.slice(0, 30).forEach((event, i) => {
      const type = event.movement_type || event.type || 'EVENT';
      const qty = parseInt(event.quantity) || 0;
      const when = event.timestamp || event.created_at || '';
      const dateStr = when ? new Date(when).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date';
      const locName = event.location_name || event.location || 'Unknown location';
      const desc = event.description || '';
      const isIn = event.direction === 'IN';

      let emoji = '📌';
      if (type === 'OPENING' || type === 'BULK_UPLOAD') emoji = '🆕';
      else if (type === 'DISPATCH' || type === 'SALE') emoji = '📦';
      else if (type === 'SELF_TRANSFER') emoji = '🔄';
      else if (type === 'RETURN') emoji = '↩️';
      else if (type === 'DAMAGE') emoji = '⚠️';
      else if (type === 'RECOVER') emoji = '✅';
      else if (type === 'PURCHASE') emoji = '🛒';

      let detail = '';
      if (isIn) detail = `✅ **IN +${qty}** — ${desc || `${qty} units received`}`;
      else detail = `🔴 **OUT -${qty}** — ${desc || `${qty} units sent out`}`;

      lines.push(`${emoji} **${dateStr}**`);
      lines.push(`   ${detail}`);
      lines.push(`   📍 ${locName}`);

      // Extra details for specific event types
      if (event.source_name && event.destination_name && type === 'SELF_TRANSFER') {
        lines.push(`   🔄 Route: ${event.source_name} → ${event.destination_name}`);
      }
      if (event.customer && (type === 'DISPATCH' || type === 'SALE')) {
        lines.push(`   👤 Customer: ${event.customer}${event.customer_phone ? ` (${event.customer_phone})` : ''}`);
      }
      if (event.awb) {
        lines.push(`   📮 AWB: ${event.awb}`);
      }
      if (event.amount && type === 'SALE') {
        lines.push(`   💰 Amount: ₹${parseFloat(event.amount).toFixed(2)}`);
      }
      if (event.reference && type !== 'SALE') {
        lines.push(`   🆔 Ref: ${event.reference}`);
      }
      lines.push('');
    });

    if (events.length > 30) {
      lines.push(`_…and ${events.length - 30} more events. Ask me for a detailed export if you need everything._`);
      lines.push('');
    }
  } else {
    lines.push('');
    lines.push(`📭 No events found for this product across warehouses, stores, or sale logs.`);
    lines.push('');
  }

  // ── Closing / next steps ──
  lines.push('💡 **What would you like to do next?**');
  lines.push('   · Compare this product with another — just say **compare with [product name]**');
  if (wantsExport) {
    lines.push('   · Export this journey as an Excel-ready table — say **export this**');
  }

  const exportRows = events.map((event) => ({
    time: event.timestamp || event.created_at || '',
    type: event.movement_type || event.type || '',
    direction: event.direction || '',
    quantity: event.quantity || 0,
    location: event.location || event.location_code || event.store_code || '',
    location_name: event.location_name || '',
    description: event.description || '',
    source: event.source_name || '',
    destination: event.destination_name || '',
    customer: event.customer || '',
    awb: event.awb || '',
    reference: event.reference || '',
  }));

  return {
    answer: lines.join('\n'),
    exportTsv: wantsExport
      ? rowsToTsv(exportRows, ['time', 'type', 'direction', 'quantity', 'location', 'location_name', 'description', 'source', 'destination', 'customer', 'awb', 'reference'])
      : null,
    exportFilename: wantsExport ? `inventorygpt-journey-${barcode || query}.tsv` : null,
  };
}

function buildOrdersAnswer(orderResult, wantsExport) {
  const orders = orderResult.orders || [];
  const stats = orderResult.stats || {};
  const lines = ["🧾 **Order Intelligence**", ""];
  lines.push(
    `Total orders: **${stats.total_orders ?? stats.total ?? orders.length ?? 0}**`,
  );
  if (stats.total_revenue != null || stats.revenue != null)
    lines.push(
      `Revenue: **${formatInr(stats.total_revenue ?? stats.revenue)}**`,
    );
  if (stats.pending_orders != null || stats.pending != null)
    lines.push(`Pending: **${stats.pending_orders ?? stats.pending}**`);
  lines.push("");

  if (!orders.length) {
    lines.push("No website order rows were returned yet.");
  } else {
    orders.slice(0, 10).forEach((order) => {
      lines.push(
        `- **${order.order_number || order.order_id || order.id || "Order"}** · ${order.status || "—"} · ${formatInr(order.total_amount ?? order.total ?? order.amount) || "—"}`,
      );
    });
  }

  lines.push("");
  lines.push(
    "Next step: regional demand can be calculated from shipping address + order items when order data is available.",
  );

  const exportRows = orders.map((order) => ({
    order: order.order_number || order.order_id || order.id || "",
    status: order.status || "",
    amount: order.total_amount ?? order.total ?? order.amount ?? "",
    date: order.order_date || order.created_at || "",
  }));

  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport
      ? rowsToTsv(exportRows, ["order", "status", "amount", "date"])
      : null,
    exportFilename: wantsExport ? "inventorygpt-orders.tsv" : null,
  };
}

function normalizeCategory(row) {
  return {
    id: row.id ?? row.category_id ?? "",
    name:
      row.name ||
      row.display_name ||
      row.category ||
      row.category_name ||
      row.slug ||
      "Uncategorized",
    slug: row.slug || row.name || "",
    product_count: Number(
      row.product_count ?? row.count ?? row.total_products ?? 0,
    ),
    source: row.source || "",
  };
}

export async function resolveInventoryGptCategories(token, website = false) {
  const endpoints = website
    ? ["/api/website/products/categories", "/api/website/categories"]
    : ["/api/products/categories/all"];

  for (const path of endpoints) {
    const result = await apiGet(path, token);
    const rows = result.error
      ? []
      : rowsFromPayload(result.data).map(normalizeCategory);
    if (rows.length) return { rows, error: null };
  }

  return { rows: [], error: null };
}

export async function resolveInventoryGptCategoryProducts(token, category, limit = 20) {
  // First get all categories to find the exact name (case-insensitive match)
  const categoriesResult = await resolveInventoryGptCategories(token, false);
  let exactCategoryName = category;
  
  if (categoriesResult.rows && categoriesResult.rows.length) {
    const lowerCategory = category.toLowerCase();
    const found = categoriesResult.rows.find(
      (cat) => cat.name.toLowerCase() === lowerCategory || cat.slug?.toLowerCase() === lowerCategory
    );
    if (found) {
      exactCategoryName = found.name;
    }
  }

  const endpoints = [
    { source: "dispatch_product", path: `/api/products?category=${encodeURIComponent(exactCategoryName)}&limit=${limit}` },
    { source: "website_products", path: `/api/website/products?category=${encodeURIComponent(exactCategoryName)}&limit=${limit}` },
  ];

  const merged = [];
  const seen = new Set();

  for (const endpoint of endpoints) {
    const result = await apiGet(endpoint.path, token);
    if (result.error) continue;
    const rows = rowsFromPayload(result.data);
    for (const row of rows) {
      const normalized = normalizeProduct(row, endpoint.source);
      const key = normalized.sku || normalized.barcode || normalized.product_name;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(normalized);
      }
    }
  }

  return { rows: merged, total: merged.length, error: merged.length ? null : "No products found" };
}

export async function resolveInventoryGptPriceFilter(token, operator, priceValue, limit = 20) {
  const endpoints = [
    { source: "dispatch_product", path: `/api/products?limit=100` },
    { source: "website_products", path: `/api/website/products?limit=100` },
  ];

  const merged = [];
  const seen = new Set();

  for (const endpoint of endpoints) {
    const result = await apiGet(endpoint.path, token);
    if (result.error) continue;
    const rows = rowsFromPayload(result.data);
    for (const row of rows) {
      const normalized = normalizeProduct(row, endpoint.source);
      const price = Number(normalized.price);
      if (!Number.isFinite(price)) continue;
      if ((operator === "<" && price < priceValue) || (operator === ">" && price > priceValue)) {
        const key = normalized.sku || normalized.barcode;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(normalized);
        }
      }
    }
  }

  return { rows: merged.slice(0, limit), total: merged.length, error: merged.length ? null : "No products found" };
}

export async function resolveInventoryGptWarehouseProducts(token, warehouseName, limit = 5000) {
  // First try to find the warehouse code by name
  const locations = await resolveInventoryGptLocations(token, "warehouses");
  let warehouseCode = null;

  if (locations.rows && locations.rows.length) {
    const lowerName = warehouseName.toLowerCase();
    const found = locations.rows.find(
      (loc) =>
        loc.name.toLowerCase().includes(lowerName) ||
        loc.code.toLowerCase().includes(lowerName) ||
        loc.location.toLowerCase().includes(lowerName)
    );
    if (found) warehouseCode = found.code;
  }

  if (!warehouseCode) {
    // Try using the name directly as code
    warehouseCode = warehouseName.replace(/\s+/g, "_").toUpperCase();
  }

  // Get inventory for this warehouse
  const invResult = await apiGet(`/api/inventory?warehouse=${encodeURIComponent(warehouseCode)}&limit=${limit}`, token);
  if (invResult.error) {
    return { rows: [], total: 0, error: invResult.error };
  }

  const invRows = rowsFromPayload(invResult.data);
  const products = invRows.map((row) => ({
    product_name: row.product || row.product_name || row.name || "Product",
    sku: row.code || row.barcode || row.sku || "",
    stock: Number(row.stock ?? row.qty_available ?? 0),
    price: row.price ?? row.mrp ?? null,
    warehouse: row.warehouse || warehouseCode,
    source: "inventory",
  }));

  return { rows: products, total: products.length, error: products.length ? null : null };
}

function normalizeLocation(row, type) {
  return {
    id: row.id ?? row.w_id ?? "",
    code:
      row.warehouse_code || row.code || row.store_code || row.warehouse || "",
    name:
      row.warehouse_name ||
      row.Warehouse_name ||
      row.name ||
      row.store_name ||
      row.code ||
      row.store_code ||
      "Unnamed",
    location: row.location || "",
    address: row.address || "",
    city: row.city || "",
    state: row.state || "",
    country: row.country || "",
    pincode: row.pincode || "",
    phone: row.phone || "",
    email: row.email || "",
    manager_name: row.manager_name || row.manager || "",
    capacity: row.capacity ?? row.area_sqft ?? "",
    type,
  };
}

export async function resolveInventoryGptLocations(token, type) {
  const paths =
    type === "warehouses"
      ? [
          "/api/warehouse-management/warehouses",
          "/api/products/warehouses",
          "/api/dispatch/warehouses",
        ]
      : ["/api/warehouse-management/stores", "/api/products/stores"];

  const merged = [];
  const seen = new Set();
  let lastError = null;

  for (const path of paths) {
    const result = await apiGet(path, token);
    if (result.error) {
      lastError = result.error;
      continue;
    }
    const rows = rowsFromPayload(result.data).map((row) =>
      normalizeLocation(row, type),
    );
    for (const row of rows) {
      const key = `${row.code || row.name || row.id}`.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
  }

  return { rows: merged, error: merged.length ? null : lastError };
}

function extractLastLocationContext(history) {
  if (!Array.isArray(history)) return null;
  for (const message of [...history].reverse()) {
    const content = String(message?.content || "");
    const storeSection = /store network|store inventory/i.test(content);
    const warehouseSection = /warehouse network|warhorse network/i.test(content);
    const code = content.match(/`([^`]+)`/)?.[1] || null;
    const namedLine = content.match(/\d+\.\s+\*\*([^*]+)\*\*/)?.[1] || null;
    if (code || namedLine) {
      return {
        type: storeSection ? "stores" : warehouseSection ? "warehouses" : null,
        code,
        name: namedLine,
      };
    }
  }
  return null;
}

function findLocation(rows, context) {
  if (!context) return rows[0] || null;
  const code = String(context.code || "").toLowerCase();
  const name = String(context.name || "").toLowerCase();
  return (
    rows.find((row) => code && String(row.code || "").toLowerCase() === code) ||
    rows.find(
      (row) =>
        name &&
        String(row.name || "")
          .toLowerCase()
          .includes(name),
    ) ||
    rows[0] ||
    null
  );
}

export async function resolveInventoryGptStoreInventory(token) {
  const result = await apiGet(
    "/api/billing/store-inventory?limit=50&page=1",
    token,
  );
  const rows = result.error
    ? []
    : rowsFromPayload(result.data).map((row) => ({
        store_code: row.store_code || row.warehouse_id || "—",
        product_name: row.product_name || row.name || row.barcode || "Product",
        barcode: row.barcode || row.sku || "",
        category: row.category || "—",
        stock: Number(row.stock ?? row.quantity ?? 0),
        price: row.price ?? "",
      }));
  return { rows, error: result.error || null };
}

export async function resolveInventoryGptGraph({
  barcode,
  authToken,
  localProducts = [],
}) {
  const product = barcode
    ? await resolveInventoryGptProduct(barcode, authToken, localProducts)
    : null;
  const timeline = barcode
    ? await resolveInventoryGptTimeline(barcode, authToken)
    : { events: [] };
  const orders = await resolveInventoryGptOrders(authToken);
  return { product, timeline, orders };
}

function buildCategoriesAnswer(categoriesResult, website, wantsExport) {
  const rows = categoriesResult.rows || [];
  const label = website
    ? "Website Product Categories"
    : "Product Catalog Categories";
  const lines = [`🏷️ **${label}**`, ""];
  lines.push(`Total categories found: **${rows.length}**`);
  lines.push("");
  if (!rows.length) {
    lines.push("No categories were returned from the live API.");
  } else {
    rows.slice(0, 30).forEach((cat, index) => {
      lines.push(
        `${index + 1}. **${cat.name}**${cat.product_count ? ` · ${cat.product_count} products` : ""}`,
      );
    });
  }
  lines.push("");
  lines.push("You can ask me to show products from any category, like **show all products in grocery**.");
  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport
      ? rowsToTsv(rows, ["id", "name", "slug", "product_count", "source"])
      : null,
    exportFilename: wantsExport
      ? `inventorygpt-${website ? "website" : "product"}-categories.tsv`
      : null,
  };
}

function buildCategoryProductsAnswer(category, result, wantsExport) {
  const rows = result.rows || [];
  const lines = [`📦 **Products in "${category}" category**`, ""];
  lines.push(`Total products found: **${result.total || rows.length}**`);
  lines.push("");

  if (!rows.length) {
    lines.push(`No products found in the **${category}** category.`);
    lines.push("");
    lines.push("Would you like me to check another category or show all categories?");
  } else {
    const visible = rows.slice(0, 5);
    visible.forEach((p, index) => {
      const priceStr = p.price != null ? ` · ${formatInr(p.price)}` : "";
      const stockStr = p.stock != null ? ` · ${p.stock} units` : "";
      lines.push(
        `${index + 1}. **${p.product_name}** (\`${p.sku || p.barcode}\`)${priceStr}${stockStr}`,
      );
    });

    if (rows.length > 5) {
      lines.push("");
      lines.push(`[READ_MORE:${rows.length - 5}:category:${category}]`);
    }

    lines.push("");
    lines.push("📊 Here is the Excel sheet — you can also do deep analysis if needed.");
  }

  return {
    answer: lines.join("\n"),
    exportTsv: rowsToTsv(rows, ["sku", "product_name", "category", "price", "stock", "source"]),
    exportFilename: `inventorygpt-category-${category}.tsv`,
    extraData: {
      type: "table_preview",
      title: `Products in "${category}" category`,
      total: result.total,
      columns: ["Product", "SKU", "Category", "Price", "Stock"],
      rows: rows.map((r) => ({
        product: r.product_name,
        sku: r.sku || "",
        category: r.category || category,
        price: r.price ?? null,
        stock: r.stock ?? 0,
      })),
      category,
      allRows: rows,
    },
  };
}

function buildPriceFilterAnswer(operator, priceValue, result, wantsExport) {
  const rows = result.rows || [];
  const label = operator === "<" ? `under ₹${priceValue}` : `above ₹${priceValue}`;
  const lines = [`💰 **Products ${label}**`, ""];
  lines.push(`Total products found: **${result.total || rows.length}**`);
  lines.push("");

  if (!rows.length) {
    lines.push(`No products found ${label}.`);
    lines.push("");
    lines.push("Would you like me to try a different price range?");
  } else {
    const visible = rows.slice(0, 5);
    visible.forEach((p, index) => {
      const priceStr = p.price != null ? ` · ${formatInr(p.price)}` : "";
      const stockStr = p.stock != null ? ` · ${p.stock} units` : "";
      lines.push(
        `${index + 1}. **${p.product_name}** (\`${p.sku || p.barcode}\`)${priceStr}${stockStr}`,
      );
    });

    if (rows.length > 5) {
      lines.push("");
      lines.push(`[READ_MORE:${rows.length - 5}:price:${operator}${priceValue}]`);
    }

    lines.push("");
    lines.push("📊 Here is the Excel sheet — you can also do deep analysis if needed.");
  }

  return {
    answer: lines.join("\n"),
    exportTsv: rowsToTsv(rows, ["sku", "product_name", "category", "price", "stock", "source"]),
    exportFilename: `inventorygpt-price-${operator}${priceValue}.tsv`,
    extraData: {
      type: "table_preview",
      title: `Products ${operator === "<" ? "under" : "above"} ₹${priceValue}`,
      total: result.total,
      columns: ["Product", "SKU", "Category", "Price", "Stock"],
      rows: rows.map((r) => ({
        product: r.product_name,
        sku: r.sku || "",
        category: r.category || "",
        price: r.price ?? null,
        stock: r.stock ?? 0,
      })),
      operator,
      priceValue,
      allRows: rows,
    },
  };
}

function buildWarehouseProductsAnswer(warehouseName, result, wantsExport) {
  const rows = result.rows || [];
  const lines = [`🏬 **Products in ${warehouseName} warehouse**`, ""];
  lines.push(`Total products found: **${result.total || rows.length}**`);
  lines.push("");

  if (!rows.length) {
    lines.push(`No products found in **${warehouseName}** warehouse.`);
    lines.push("");
    lines.push("Would you like me to check another warehouse?");
  } else {
    const visible = rows.slice(0, 5);
    visible.forEach((p, index) => {
      const priceStr = p.price != null ? ` · ${formatInr(p.price)}` : "";
      lines.push(
        `${index + 1}. **${p.product_name}** (\`${p.sku || p.barcode}\`) · ${p.stock} units${priceStr}`,
      );
    });

    if (rows.length > 5) {
      lines.push("");
      lines.push(`[READ_MORE:${rows.length - 5}:warehouse:${warehouseName}]`);
    }

    lines.push("");
    lines.push("📊 Here is the Excel sheet — you can also do deep analysis if needed.");
  }

  return {
    answer: lines.join("\n"),
    exportTsv: rowsToTsv(rows, ["sku", "product_name", "warehouse", "stock", "price"]),
    exportFilename: `inventorygpt-warehouse-${warehouseName}.tsv`,
    extraData: {
      type: "table_preview",
      title: `Products in ${warehouseName} warehouse`,
      total: result.total,
      columns: ["Product", "SKU", "Stock", "Price"],
      rows: rows.map((r) => ({
        product: r.product_name,
        sku: r.sku || "",
        stock: r.stock ?? 0,
        price: r.price ?? null,
      })),
      warehouseName,
      allRows: rows,
    },
  };
}

function buildLocationDetailAnswer(location, type, wantsExport) {
  const isWarehouse = type === "warehouses";
  if (!location) {
    return {
      answer: `I could not find the ${isWarehouse ? "warehouse" : "store"} details from the live master data.`,
      exportTsv: null,
      exportFilename: null,
    };
  }
  const lines = [
    isWarehouse ? "🏬 **Warehouse Details**" : "🏪 **Store Details**",
    "",
  ];
  lines.push(
    `**${location.name}**${location.code ? ` (\`${location.code}\`)` : ""}`,
  );
  lines.push("");
  if (location.location) lines.push(`📍 **Location:** ${location.location}`);
  if (location.address) lines.push(`🏠 **Address:** ${location.address}`);
  if (location.city || location.state || location.country || location.pincode) {
    lines.push(
      `🗺️ **Area:** ${[location.city, location.state, location.country, location.pincode].filter(Boolean).join(", ")}`,
    );
  }
  if (location.phone) lines.push(`☎️ **Phone:** ${location.phone}`);
  if (location.email) lines.push(`✉️ **Email:** ${location.email}`);
  if (location.manager_name)
    lines.push(`👤 **Manager:** ${location.manager_name}`);
  if (location.capacity)
    lines.push(
      `${isWarehouse ? "📦 **Capacity**" : "📐 **Area/Capacity**"}: ${location.capacity}`,
    );
  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport
      ? rowsToTsv(
          [location],
          [
            "id",
            "code",
            "name",
            "location",
            "address",
            "city",
            "state",
            "country",
            "pincode",
            "phone",
            "email",
            "manager_name",
            "type",
          ],
        )
      : null,
    exportFilename: wantsExport
      ? `inventorygpt-${isWarehouse ? "warehouse" : "store"}-details.tsv`
      : null,
  };
}

function buildLocationsAnswer(locationsResult, type, wantsExport) {
  const rows = locationsResult.rows || [];
  const isWarehouse = type === "warehouses";
  const lines = [
    isWarehouse ? "🏬 **Warehouse Network**" : "🏪 **Store Network**",
    "",
  ];
  lines.push(
    `Total ${isWarehouse ? "warehouses" : "stores"} found: **${rows.length}**`,
  );
  lines.push("");
  if (!rows.length) {
    lines.push(
      `No ${isWarehouse ? "warehouse" : "store"} master rows were returned from the live API.`,
    );
  } else {
    rows.slice(0, 30).forEach((loc, index) => {
      const place = [loc.location, loc.city, loc.state]
        .filter(Boolean)
        .join(", ");
      lines.push(
        `${index + 1}. **${loc.name}**${loc.code ? ` · \`${loc.code}\`` : ""}${place ? ` · ${place}` : ""}`,
      );
    });
  }
  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport
      ? rowsToTsv(rows, [
          "id",
          "code",
          "name",
          "location",
          "address",
          "city",
          "state",
          "country",
          "pincode",
          "phone",
          "email",
          "manager_name",
          "type",
        ])
      : null,
    exportFilename: wantsExport ? `inventorygpt-${type}.tsv` : null,
  };
}

function buildStoreInventoryAnswer(storeInventoryResult, wantsExport) {
  const rows = storeInventoryResult.rows || [];
  const lines = ["🏪 **Store Inventory**", ""];
  lines.push(`Store inventory rows found: **${rows.length}**`);
  lines.push("");
  if (!rows.length) {
    lines.push("No store inventory rows were returned from the live API.");
  } else {
    const totalUnits = rows.reduce(
      (sum, row) => sum + Number(row.stock || 0),
      0,
    );
    lines.push(
      `Total store units in returned rows: **${totalUnits.toLocaleString("en-IN")}**`,
    );
    lines.push("");
    rows.slice(0, 15).forEach((row) => {
      lines.push(
        `- **${row.product_name}** · \`${row.barcode || "no-sku"}\` · ${row.stock} units · ${row.store_code}`,
      );
    });
  }
  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport
      ? rowsToTsv(rows, [
          "store_code",
          "product_name",
          "barcode",
          "category",
          "stock",
          "price",
        ])
      : null,
    exportFilename: wantsExport ? "inventorygpt-store-inventory.tsv" : null,
  };
}

function buildGraphAnswer(graphResult, barcode, wantsExport) {
  const product = graphResult.product
    ? normalizeProduct(graphResult.product)
    : null;
  const events = graphResult.timeline?.events || [];
  const orders = graphResult.orders?.orders || [];
  const lines = [
    `📈 **Graph Intelligence${product ? ` — ${product.product_name}` : ""}**`,
    "",
  ];
  if (!barcode) {
    lines.push(
      "To build a product-specific graph, share the SKU/barcode. I can then use timeline + order data as graph points.",
    );
  } else {
    lines.push(`SKU: \`${barcode}\``);
    lines.push(`Timeline points available: **${events.length}**`);
    lines.push(`Order rows available: **${orders.length}**`);
    lines.push("");
    lines.push("Graph-ready series I can prepare:");
    lines.push("- Stock movement over time from timeline/ledger events.");
    lines.push(
      "- Sales/order quantity trend from order items when order data exists.",
    );
    lines.push("- IN vs OUT movement comparison.");
  }
  lines.push("");
  lines.push(
    "The current chat can return graph-ready data; the visual chart panel is the next UI execution step.",
  );
  const exportRows = events.map((event) => ({
    time: event.timestamp || event.event_time || event.created_at || "",
    type: event.type || event.movement_type || event.event_type || "",
    quantity: event.quantity ?? event.qty ?? "",
    direction: event.direction || "",
  }));
  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport
      ? rowsToTsv(exportRows, ["time", "type", "quantity", "direction"])
      : null,
    exportFilename: wantsExport
      ? `inventorygpt-graph-${barcode || "data"}.tsv`
      : null,
  };
}

function buildAuditAnswer(auditResult, wantsExport) {
  const logs = auditResult.logs || [];
  const lines = ["🛡️ **Audit Intelligence**", ""];
  if (!logs.length) {
    lines.push("No audit rows were returned for this request.");
  } else {
    logs.slice(0, 10).forEach((log) => {
      const details =
        log.details && typeof log.details === "object" ? log.details : {};
      const actor =
        log.user_name ||
        log.joined_user_name ||
        log.user_email ||
        details.user_name ||
        details.name ||
        details.email ||
        "system";
      lines.push(
        `- **${log.action || log.event_type || "EVENT"}** · ${log.resource_type || log.resource || "resource"} · ${log.status || "—"} · ${actor}`,
      );
    });
  }
  lines.push("");
  lines.push(
    "Audit logs help prove who changed what, when, and whether it succeeded.",
  );

  const exportRows = logs.map((log) => ({
    time: log.created_at || "",
    action: log.action || log.event_type || "",
    resource: log.resource_type || log.resource || "",
    status: log.status || "",
    user:
      log.user_name ||
      log.joined_user_name ||
      log.user_email ||
      log.details?.user_name ||
      log.details?.email ||
      "",
  }));

  return {
    answer: lines.join("\n"),
    exportTsv: wantsExport
      ? rowsToTsv(exportRows, ["time", "action", "resource", "status", "user"])
      : null,
    exportFilename: wantsExport ? "inventorygpt-audit.tsv" : null,
  };
}

export async function tryInventoryGptDeterministicAnswer({
  question,
  authToken,
  localProducts = [],
  conversationHistory = [],
}) {
  const q = String(question || "").trim();
  if (!q) return null;

  const intent = detectInventoryGptIntent(q, conversationHistory);
  if (!intent) return null;

  const directBarcode = extractInventoryGptBarcode(q);
  const historyBarcode = !directBarcode
    ? extractLastInventoryGptBarcode(conversationHistory)
    : null;
  const barcode = directBarcode || historyBarcode;
  const warehouse = extractInventoryGptWarehouse(q);

  if (intent.type === "export_help") {
    return {
      answer:
        "📊 I can prepare **Excel-ready TSV tables** from live operational data now. PDF/Word/graph exports are part of the next premium export phase. Ask like: `export stock for SKU 12345` or `make excel for product journey 12345`.",
      render: "text",
    };
  }

  // Export follow-up: user said "ok send me" after being offered Excel
  if (intent.type === "export_followup") {
    // Look at conversation history to find the last data that was offered
    const lastUserWithCategory = [...(conversationHistory || [])]
      .reverse()
      .find((m) => {
        const c = String(m?.content || "").toLowerCase();
        return m?.role === "user" && /grocery|electronics|sports|clothing|beauty|books|toys|health|home.*kitchen/.test(c);
      });
    if (lastUserWithCategory) {
  const categoryNames = ["home & kitchen", "home--kitchen", "electronics", "sports", "clothing", "home", "kitchen", "beauty", "books", "toys", "grocery", "health", "food", "fashion", "accessories"];
      for (const cat of categoryNames) {
        if (lastUserWithCategory.content.toLowerCase().includes(cat)) {
          const categoryProducts = await resolveInventoryGptCategoryProducts(authToken, cat, 50);
          if (categoryProducts.rows && categoryProducts.rows.length) {
            const tsv = rowsToTsv(categoryProducts.rows, ["sku", "product_name", "category", "price", "stock", "source"]);
            return {
              answer: `📊 **Excel-ready data for "${cat}" category**\n\n**${categoryProducts.rows.length}** products exported. Copy the table below and paste into Excel:\n\n\`\`\`\n${tsv}\n\`\`\``,
              exportTsv: tsv,
              exportFilename: `inventorygpt-category-${cat}.tsv`,
              render: "text",
            };
          }
        }
      }
    }
    return {
      answer: "📊 I can prepare **Excel-ready TSV tables** from live operational data now. Please specify which data you'd like exported (e.g., **grocery products**, **stock for SKU 12345**, etc.).",
      render: "text",
    };
  }

  // Category-based product listing
  if (intent.type === "category_products") {
    const categoryProducts = await resolveInventoryGptCategoryProducts(
      authToken,
      intent.category,
    );
    return {
      ...buildCategoryProductsAnswer(
        intent.category,
        categoryProducts,
        intent.wantsExport,
      ),
      render: "text",
    };
  }

  // Product category lookup: "Product X belong to which category"
  if (intent.type === "product_category") {
    // Try to find the product by name from both catalogs
    let foundProduct = null;
    const searchName = intent.productName || "";

    if (searchName) {
      // Search dispatch products
      const dispatchResult = await apiGet(
        `/api/products?search=${encodeURIComponent(searchName)}&limit=10`,
        authToken,
      );
      if (!dispatchResult.error) {
        const rows = rowsFromPayload(dispatchResult.data);
        for (const row of rows) {
          const normalized = normalizeProduct(row, "dispatch_product");
          if (
            normalized.product_name.toLowerCase().includes(searchName.toLowerCase()) ||
            searchName.toLowerCase().includes(normalized.product_name.toLowerCase())
          ) {
            foundProduct = normalized;
            break;
          }
        }
      }

      // If not found, try website products
      if (!foundProduct) {
        const webResult = await apiGet(
          `/api/website/products?search=${encodeURIComponent(searchName)}&limit=10`,
          authToken,
        );
        if (!webResult.error) {
          const rows = rowsFromPayload(webResult.data);
          for (const row of rows) {
            const normalized = normalizeProduct(row, "website_products");
            if (
              normalized.product_name.toLowerCase().includes(searchName.toLowerCase()) ||
              searchName.toLowerCase().includes(normalized.product_name.toLowerCase())
            ) {
              foundProduct = normalized;
              break;
            }
          }
        }
      }
    }

    if (foundProduct) {
      const lines = [
        `🏷️ **${foundProduct.product_name}** (SKU: \`${foundProduct.sku || foundProduct.barcode}\`)`,
        "",
        `**Category:** ${foundProduct.category}`,
        `**Catalog:** ${catalogLabel(foundProduct.source)}`,
      ];
      if (foundProduct.price != null) {
        lines.push(`**Price:** ${formatInr(foundProduct.price)}`);
      }
      if (foundProduct.stock != null) {
        lines.push(`**Stock:** ${foundProduct.stock > 0 ? `${foundProduct.stock} units` : "Out of Stock"}`);
      }
      lines.push("");
      lines.push("Would you like more details about this product?");
      return {
        answer: lines.join("\n"),
        render: "text",
      };
    }

    // If no product found, show categories as fallback
    const categories = await resolveInventoryGptCategories(authToken, false);
    return {
      ...buildCategoriesAnswer(categories, false, intent.wantsExport),
      render: "text",
    };
  }

  // Price-based product filtering
  if (intent.type === "price_filter") {
    const priceResult = await resolveInventoryGptPriceFilter(
      authToken,
      intent.priceOperator,
      intent.priceValue,
    );
    return {
      ...buildPriceFilterAnswer(
        intent.priceOperator,
        intent.priceValue,
        priceResult,
        intent.wantsExport,
      ),
      render: "text",
    };
  }

  // Warehouse-based product listing
  if (intent.type === "warehouse_products") {
    const warehouseResult = await resolveInventoryGptWarehouseProducts(
      authToken,
      intent.warehouseName,
    );
    return {
      ...buildWarehouseProductsAnswer(
        intent.warehouseName,
        warehouseResult,
        intent.wantsExport,
      ),
      render: "text",
    };
  }

  // Warehouse stock prompt: show warehouses and ask user to pick one
  if (intent.type === "warehouse_prompt") {
    const locations = await resolveInventoryGptLocations(authToken, "warehouses");
    const warehouseRows = locations.rows || [];

    if (!warehouseRows.length) {
      return {
        answer: "No warehouses found. Please check your warehouse management setup.",
        render: "text",
      };
    }

    const lines = ["🏬 **Warehouse Stock**", ""];
    lines.push("Which warehouse would you like to check the stock for?");
    lines.push("");
    warehouseRows.slice(0, 20).forEach((wh) => {
      const place = [wh.city, wh.state].filter(Boolean).join(", ");
      lines.push(
        `- **${wh.name}** \`${wh.code}\`${place ? ` · ${place}` : ""}`,
      );
    });
    lines.push("");
    lines.push("Type the warehouse name or code to see its stock.");
    lines.push("");
    lines.push("Which warehouse would you like to check?");

    return {
      answer: lines.join("\n"),
      render: "text",
      extraData: {
        type: "warehouse_prompt",
        warehouses: warehouseRows.map(wh => ({
          code: wh.code,
          name: wh.name,
          city: wh.city,
          state: wh.state,
        })),
      },
    };
  }

  // Only ask for SKU for single-product operations (product, stock, timeline)
  // Do NOT ask for SKU for bulk/list operations
  // EXCEPTION: if intent has productName (entity-first detection), use that instead
  if (["product", "stock", "timeline"].includes(intent.type) && !barcode && !intent.productName) {
    // Try to extract product name from natural language query like "3M Sticky Notes what is the stock of this"
    const productNameFromQuery = q
      .replace(/what('s| is| are)(\s+the)?\s+(complete\s+|full\s+|detailed\s+)?(stock|price|timeline|journey|description|details?|status|info|quantity|qty)\s+(of|for|on)\s+(this|it|that|the product)/i, "")
      .replace(/(complete\s+|full\s+|detailed\s+)?(stock|price|timeline|journey|description|details?|status|info|quantity|qty)\s+(of|for|on)\s+(this|it|that|the product)/i, "")
      .replace(/what('s| is| are)(\s+the)?\s+(complete\s+|full\s+|detailed\s+)?(stock|price|timeline|journey|description|details?|status|info|quantity|qty)(\s+of)?/i, "")
      .replace(/(tell|show|check|get|give)\s+(me\s+)?(the\s+)?(complete\s+|full\s+|detailed\s+)?(stock|price|timeline|journey|description|details?|status|info|quantity|qty)(\s+of)?/i, "")
      .replace(/\b(of|this|it|that|the|for|on|please|pls|now|complete|full|detailed|entire|whole)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (productNameFromQuery && productNameFromQuery.length > 2) {
      intent.productName = productNameFromQuery;
    } else {
      return {
        answer:
          "Please share the SKU/barcode so I can read live catalog, stock, and timeline data accurately. I will not guess operational data.",
        render: "text",
      };
    }
  }

  // Entity-first: if product name provided directly (user just typed product name)
  let product = null;
  if (intent.productName) {
    // Search by product name across both catalogs
    const searchName = intent.productName;
    const dispatchResult = await apiGet(
      `/api/products?search=${encodeURIComponent(searchName)}&limit=10`,
      authToken,
    );
    if (!dispatchResult.error) {
      const rows = rowsFromPayload(dispatchResult.data);
      for (const row of rows) {
        const normalized = normalizeProduct(row, "dispatch_product");
        if (
          normalized.product_name.toLowerCase().includes(searchName.toLowerCase()) ||
          searchName.toLowerCase().includes(normalized.product_name.toLowerCase())
        ) {
          product = normalized;
          break;
        }
      }
    }
    if (!product) {
      const webResult = await apiGet(
        `/api/website/products?search=${encodeURIComponent(searchName)}&limit=10`,
        authToken,
      );
      if (!webResult.error) {
        const rows = rowsFromPayload(webResult.data);
        for (const row of rows) {
          const normalized = normalizeProduct(row, "website_products");
          if (
            normalized.product_name.toLowerCase().includes(searchName.toLowerCase()) ||
            searchName.toLowerCase().includes(normalized.product_name.toLowerCase())
          ) {
            product = normalized;
            break;
          }
        }
      }
    }
  } else if (barcode) {
    product = await resolveInventoryGptProduct(barcode, authToken, localProducts);
  }

  if (intent.type === "context_help") {
    return {
      answer:
        "I’m following the last conversation context. Ask me like **show timeline**, **export this to Excel**, **show audit by user**, **show website categories**, or **how many warehouses/stores do I have** — I’ll use the recent chat context where it fits.",
      render: "text",
    };
  }

  if (intent.type === "categories" || intent.type === "website_categories") {
    const categories = await resolveInventoryGptCategories(
      authToken,
      intent.type === "website_categories",
    );
    return {
      ...buildCategoriesAnswer(
        categories,
        intent.type === "website_categories",
        intent.wantsExport,
      ),
      render: "text",
    };
  }

  if (intent.type === "warehouses" || intent.type === "stores") {
    const locations = await resolveInventoryGptLocations(
      authToken,
      intent.type,
    );
    return {
      ...buildLocationsAnswer(locations, intent.type, intent.wantsExport),
      render: "text",
    };
  }

  if (intent.type === "location_detail") {
    const lastContext = extractLastLocationContext(conversationHistory);
    const type =
      intent.locationType === "last"
        ? lastContext?.type || "warehouses"
        : intent.locationType;
    const locations = await resolveInventoryGptLocations(authToken, type);
    const location = findLocation(locations.rows || [], lastContext);
    return {
      ...buildLocationDetailAnswer(location, type, intent.wantsExport),
      render: "text",
    };
  }

  if (intent.type === "store_inventory") {
    const storeInventory = await resolveInventoryGptStoreInventory(authToken);
    return {
      ...buildStoreInventoryAnswer(storeInventory, intent.wantsExport),
      render: "text",
    };
  }

  if (intent.type === "graph") {
    const graph = await resolveInventoryGptGraph({
      barcode,
      authToken,
      localProducts,
    });
    return {
      ...buildGraphAnswer(graph, barcode, intent.wantsExport),
      render: "text",
    };
  }

  if (intent.type === "product") {
    if (!product) {
      const searchRef = barcode ? `SKU \`${barcode}\`` : `\`${intent.productName || 'this product'}\``;
      return {
        answer:
          `I checked both catalogs for ${searchRef}, but I could not find this product.\n\n` +
          "- Checked: **Product catalog** (dispatch products)\n" +
          "- Checked: **Website Product catalog**\n\n" +
          "Please confirm the product name or SKU/barcode, or ask me to show categories/products separately.",
        render: "text",
      };
    }
    return {
      ...buildProductAnswer(product, intent.field, intent.wantsExport),
      render: "text",
    };
  }

  if (intent.type === "stock") {
    const stock = await resolveInventoryGptStock(barcode, authToken, warehouse);
    return {
      ...buildStockAnswer(product, stock, intent.wantsExport),
      render: "text",
    };
  }

  if (intent.type === "timeline") {
    const searchName = barcode || product?.barcode || intent.productName || null;
    if (searchName && searchName.length > 2) {
      const journey = await resolveInventoryGptJourney(searchName, authToken);
      if (journey.journey?.length > 0) {
        return {
          ...buildJourneyAnswer(searchName, journey, intent.wantsExport),
          render: "text",
        };
      }
    }
    const timeline = await resolveInventoryGptTimeline(
      barcode,
      authToken,
      warehouse,
    );
    return {
      ...buildTimelineAnswer(barcode, product, timeline, intent.wantsExport),
      render: "text",
    };
  }

  if (intent.type === "orders") {
    const orders = await resolveInventoryGptOrders(authToken);
    return { ...buildOrdersAnswer(orders, intent.wantsExport), render: "text" };
  }

  if (intent.type === "audit") {
    const audit = await resolveInventoryGptAudit(authToken, q);
    return { ...buildAuditAnswer(audit, intent.wantsExport), render: "text" };
  }

  return null;
}
