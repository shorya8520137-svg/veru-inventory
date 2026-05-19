# InventoryGPT Complete Analysis And Fix

## What InventoryGPT is in this project

InventoryGPT is the `src/app/inventorygpt` chat UI plus the `src/app/api/inventorygpt` Next API layer. It is branded in the UI as **InsoraOpps** and is meant to act as an inventory intelligence copilot.

It connects to three major data areas:

1. **Live inventory / warehouse stock**
   - Read through the backend inventory API.
   - Used for warehouse stock, inventory totals, and SKU stock context.

2. **Product catalog / dispatch products**
   - Backend routes: `/api/products`, `/api/products/search/:barcode`, `/api/products/categories/all`.
   - Main DB tables behind this are dispatch-style product/category tables such as `dispatch_product` and `product_categories`.

3. **Website Product catalog**
   - Backend routes: `/api/website/products`, `/api/website/products/categories`, `/api/website/categories`.
   - Main DB tables behind this are website-style product/category tables such as `website_products` and `website_categories`.

The chat route also optionally uses OpenRouter through `OPENROUTER_API_KEY` for general AI answers, but SKU/product lookups should be deterministic and should not depend on the LLM.

## Main problem found

The biggest bug was not only a backend lookup issue. It was also a frontend rendering issue.

Example user question:

- `11232 show me the name of product and it belong to which category`

Because the prompt contains the word `category`, the frontend intent detector treated it like a request to show all categories. So when the SKU did not exist or even when the backend returned a normal SKU answer, the assistant message could be replaced by a category grid.

That made the user experience look wrong:

- SKU not found, but categories still showed.
- SKU question with `category` word triggered category UI.
- Product lookup was not always checking both catalogs deeply enough.

## Fixes applied

### 1. SKU questions now force text answers, not category grids

File changed:

- `src/app/inventorygpt/page.jsx`

Changes:

- Added SKU detection inside `detectIntent()`.
- If a prompt contains a numeric SKU/barcode pattern, the UI does not render category/product visual cards.
- Category grids now only show for explicit list/show commands like:
  - `show categories`
  - `list categories`
  - `show website categories`

### 2. Backend response can force text rendering

Files changed:

- `src/app/api/inventorygpt/route.js`
- `src/app/inventorygpt/page.jsx`

Changes:

- SKU lookup responses now return `render: "text"`.
- Frontend stores this metadata on the assistant message.
- `AssistantMessage` checks `message.render !== 'text'` before showing category/product cards.

Result:

- If SKU exists, InventoryGPT answers with product name/category/catalog/price/stock as text.
- If SKU does not exist, InventoryGPT says it checked both catalogs and could not find it.
- It no longer shows random categories for a missing SKU.

### 3. Product lookup now checks both product catalogs

File changed:

- `src/app/api/inventorygpt/route.js`

SKU lookup now checks:

1. `/api/products/search/:barcode` for Product catalog exact barcode lookup.
2. `/api/products?search=:barcode&limit=10` for Product catalog search fallback.
3. `/api/website/products?search=:barcode&limit=10` for Website Product catalog search.

It also normalizes different field names:

- SKU fields: `barcode`, `sku`, `code`, `sku_id`
- Name fields: `product_name`, `name`, `title`
- Category fields: `category`, `category_display_name`, `category_name`, `category_slug`
- Stock fields: `total_stock`, `stock`, `quantity`, `stock_quantity`, `qty_available`
- Price fields: `price`, `selling_price`, `offer_price`, `final_price`, `mrp`

### 4. Missing SKU now returns a clear not-found answer

If the SKU is not found in either catalog, the API returns a successful text answer like:

- checked Product catalog
- checked Website Product catalog
- product not found
- confirm SKU/barcode or ask for categories/products separately

This prevents the LLM from guessing and prevents frontend visual fallback from showing unrelated categories.

### 5. InventoryGPT brain context now includes both catalogs

Files changed:

- `src/lib/inventorygptBrainContext.js`
- `src/app/api/inventorygpt/context/route.js`

Changes:

- Added `dispatchProducts` to the brain context.
- Added `dispatchProductCount` population.
- Website products still load separately as `websiteProducts`.
- The `/api/inventorygpt/context` preview now returns:
  - `inventory`
  - `dispatch`
  - `website`

This matches the real project structure where you have both a Product catalog and a Website Product catalog.

## Expected behavior after fix

### Case 1: SKU exists in Product catalog

User asks:

- `11232 show me name and category`

InventoryGPT should answer in text:

- product name
- category
- catalog: Product catalog
- price if available
- stock if available

No category grid should appear.

### Case 2: SKU exists in Website Product catalog

InventoryGPT should answer in text:

- product name
- category
- catalog: Website Product catalog
- price if available
- stock if available

No category grid should appear.

### Case 3: SKU does not exist anywhere

InventoryGPT should answer in text:

- it checked both catalogs
- product not found
- ask user to confirm SKU/barcode

No category grid should appear.

### Case 4: User explicitly asks for categories

User asks:

- `show categories`
- `list categories`
- `show website categories`

Then the visual category grid is still allowed.

## Files changed in this fix

- `src/app/api/inventorygpt/route.js`
- `src/app/inventorygpt/page.jsx`
- `src/lib/inventorygptBrainContext.js`
- `src/app/api/inventorygpt/context/route.js`
- `INVENTORYGPT_COMPLETE_ANALYSIS_AND_FIX.md`

## Notes for future improvement

1. The backend should eventually expose one unified internal endpoint for InventoryGPT SKU lookup, so the Next route does not need to call three separate endpoints.
2. Product matching should prefer exact SKU/barcode match first, which is now implemented, but the DB layer can make this even cleaner with indexed lookup queries.
3. If the Product catalog and Website Product catalog represent the same physical product, a mapping table between `dispatch_product.barcode` and `website_products.sku` would make answers more reliable.
4. The AI prompt should remain secondary for SKU lookup. SKU lookup should stay deterministic so InventoryGPT never hallucinates product/category data.
