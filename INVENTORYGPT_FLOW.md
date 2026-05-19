# InventoryGPT Flow

## Current status

- Fix in progress for SKU/category lookup in InventoryGPT.
- Short numeric SKUs are now matched by the parser.
- The project now prefers deterministic product lookup before OpenRouter fallback.
- Documentation has been updated to reflect the real bug and the exact fix.

## Overview

InventoryGPT is an inventory assistant built into the app. It works as a chat interface where the user asks a question and the system either answers from deterministic inventory logic or forwards the question to an LLM via OpenRouter.

## Relevant files

- `src/app/inventorygpt/page.jsx` - frontend UI and chat state
- `src/app/api/inventorygpt/route.js` - API endpoint for chat requests
- `src/lib/insoraOppsOpsAnswer.js` - deterministic question handler

## Frontend flow

1. `page.jsx` loads inventory context:
   - `/api/inventorygpt/context`
   - `/api/products?limit=100`
   - `/api/products/categories/all`
2. It stores `products`, `categories`, `brain`, and session history.
3. When the user submits a question, the frontend calls `POST /api/inventorygpt` with:
   - `question`
   - `products`
   - `categories`
   - `authToken`
   - `conversationHistory`
4. The frontend then shows the assistant response.

## Backend flow

### `src/app/api/inventorygpt/route.js`

1. Parse the request JSON.
2. Run `tryInsoraOppsDataAnswer(question, authToken)` from `insoraOppsOpsAnswer.js`.
3. If that returns an answer, the route returns it immediately as a deterministic response.
4. Otherwise, if `OPENROUTER_API_KEY` is configured, the route sends the question, live inventory sample, categories, and recent chat history to OpenRouter with model `mistralai/mistral-7b-instruct-v0.1`.
5. If OpenRouter is not configured, it returns a fallback message.

## Deterministic handler flow

### `src/lib/insoraOppsOpsAnswer.js`

`tryInsoraOppsDataAnswer()` tries to answer common inventory questions before using the LLM.

Typical handled cases:

- warehouse stock queries (`stock at GGM_WH`)
- barcode/product lookup
- category queries
- website products
- website orders
- transfers
- damaged products
- dead stock
- price lookups
- SKU timeline

### Important logic

- It uses `extractBarcode()` to find a numeric SKU in the question.
- It uses the question keywords to decide which API to call.
- If the question contains `category`, it can return a category visual card trigger.

## Current issue

### What was wrong

- The SKU extractor only matched long barcodes, so short product codes like `11232` were ignored.
- When the user asked a SKU/category question, the system could miss the product lookup and fall back to generic category behavior.
- This caused the assistant to return a non-specific response instead of product name + category.

### What was fixed

- The barcode regex was expanded to match `4-16` digit SKU values in both:
  - `src/lib/insoraOppsOpsAnswer.js`
  - `src/app/api/inventorygpt/route.js`
- The deterministic handler now searches by barcode first when the question includes a SKU and returns a direct product answer if found.
- If the product is not found, the code now returns an explicit "product not found" answer rather than a generic fallback.
- The OpenRouter prompt was updated to encourage answers that include:
  - product name
  - product category
  - a follow-up suggestion like `If you want price or description, ask me.`

## How to verify

1. Use the InventoryGPT UI or call `POST /api/inventorygpt`.
2. Send a question like:

```json
{
  "question": "11232 show me the name of product and it belong to which category",
  "authToken": "<token>",
  "products": [],
  "categories": [],
  "conversationHistory": []
}
```

3. Confirm that the response returns:
   - product name
   - category
   - a follow-up suggestion

## Notes

- This is a real inventory flow, not a dummy project.
- The main problem was in the parser and fallback behavior, not just UI display.
- The current fix is in the backend files listed above.
