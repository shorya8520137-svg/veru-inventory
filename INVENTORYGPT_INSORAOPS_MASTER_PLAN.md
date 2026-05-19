# InventoryGPT + InsoraOps Master Plan

## AI-Powered Commerce Operations Operating System

This document is the planning blueprint for turning InventoryGPT from a chat assistant into a live commerce operations intelligence layer for InsoraOps.

It is based on:

- Code analysis of inventory pages, routes, and controllers.
- Database schema analysis using `DESCRIBE` on core tables.
- Server-side database relation checks.
- Current InventoryGPT behavior and failure analysis.
- The long-term concept: InventoryGPT is not a virtual assistant; it is a live business operations intelligence layer.

---

## 1. Product Vision

InventoryGPT + InsoraOps should become an AI-powered commerce operations operating system.

### InsoraOps

The deterministic operational infrastructure layer.

Responsible for:

- Inventory truth.
- Product catalogs.
- Warehouse stock.
- Store stock.
- Orders.
- Dispatch.
- Returns.
- Damage/recovery.
- Transfers.
- Audit logs.
- Timeline and ledger records.
- Operational permissions and execution safety.

### InventoryGPT

The AI operational intelligence layer.

Responsible for:

- Product journey understanding.
- Stock intelligence.
- Order tracking intelligence.
- Regional order and demand analysis.
- Warehouse risk analysis.
- Dead stock detection.
- Transfer recommendations.
- Operational memory.
- Audit-aware reasoning.
- Predictive alerts.
- Human-in-the-loop recommendations.

InventoryGPT must not mutate operational truth directly unless the action is verified through InsoraOps workflows.

---

## 2. Core Architectural Principle

InventoryGPT should never guess operational data.

It must answer from live operational sources:

1. Product catalog.
2. Website product catalog.
3. Stock batches.
4. Warehouse inventory ledger.
5. Store timeline.
6. Dispatch/order records.
7. Return/damage/recovery records.
8. Audit logs.
9. AI memory/recommendation tables.

If data is missing, InventoryGPT must say what it checked and what is missing.

---

## 3. Current Immediate Chat Failure Found And Fixed

### Failure

User asked:

- `8793287932489 also tell me this is belong to which category`

InventoryGPT correctly answered:

- Product: cricket bat
- Category: sports
- Price: 1000
- Stock: Out of Stock

Then user asked follow-ups:

- `yes also show me the description bro`
- `ok then show me price also`

InventoryGPT failed because the follow-up message did not contain the SKU. The backend was not carrying the last product context forward into deterministic product lookup.

### Fix Applied

File changed:

- `src/app/api/inventorygpt/route.js`

Implemented:

- Extract last SKU from `conversationHistory`.
- Detect product follow-up intent:
  - description
  - price
  - stock
  - category
- Re-query both catalogs using the last SKU.
- Return deterministic text answer with `render: "text"`.

### Expected Behavior Now

After InventoryGPT answers for SKU `8793287932489`, these follow-ups should work:

- `show me description`
- `show me price also`
- `show stock also`
- `which category is this`

InventoryGPT should answer using the same product context without asking for the SKU again.

---

## 4. Current Real Database Status

The server database exists and schema is rich, but many operational tables currently have low/zero rows.

Important observed status:

- `dispatch_product`: has product rows.
- `product_categories`: has category rows.
- `website_products`: has website catalog rows.
- `website_categories`: has website category rows.
- `audit_logs`: has audit rows.
- Many operational movement/order/AI tables currently have zero rows.

This means planning must focus on schema relation and future operational flow, not only current row count.

---

## 5. Product Catalog Model

### 5.1 Product Catalog

Table: `dispatch_product`

Important fields from `DESCRIBE`:

- `p_id` primary key.
- `product_name`.
- `product_variant`.
- `barcode` unique SKU/barcode.
- `description`.
- `category_id`.
- `price`.
- `cost_price`.
- `weight`.
- `dimensions`.
- `is_active`.
- `tenant_id`.

Relation:

- `dispatch_product.category_id` → `product_categories.id`.

InventoryGPT meaning:

This is the operational product catalog used for warehouse/dispatch/inventory flows.

InventoryGPT must use this catalog for:

- SKU lookup.
- Product name.
- Category.
- Description.
- Cost/price.
- Product dimensions and weight.
- Operational margin analysis.

### 5.2 Product Categories

Table: `product_categories`

Important fields:

- `id` primary key.
- `name` unique.
- `display_name`.
- `description`.
- `parent_id`.
- `is_active`.
- `tenant_id`.

Relation:

- Parent-child category hierarchy through `parent_id`.

InventoryGPT meaning:

Used for operational catalog grouping and category-based analysis.

---

## 6. Website Product Catalog Model

### 6.1 Website Products

Table: `website_products`

Important fields:

- `id` primary key.
- `product_name`.
- `description`.
- `key_features`.
- `short_description`.
- `price`.
- `offer_price`.
- `offer_percentage`.
- `category_id`.
- `sku` unique.
- `stock_quantity`.
- `min_stock_level`.
- `weight`.
- `dimensions`.
- `is_active`.
- `is_featured`.
- `tags`.
- `attributes`.

Relation:

- `website_products.category_id` → `website_categories.id`.

InventoryGPT meaning:

This is the customer-facing ecommerce product catalog.

InventoryGPT must treat this separately from operational stock because website stock may not equal warehouse physical stock.

### 6.2 Website Categories

Table: `website_categories`

Important fields:

- `id` primary key.
- `name` unique.
- `slug` unique.
- `parent_id`.
- `is_active`.
- `sort_order`.
- `image_url`.

InventoryGPT meaning:

Used for customer-facing catalog, website category questions, SEO/catalog intelligence, and website product grouping.

---

## 7. Inventory Truth Model

Inventory truth must be separated into different stock layers.

### 7.1 Warehouse Physical Stock

Primary table: `stock_batches`

Important fields:

- `id` primary key.
- `product_name`.
- `barcode`.
- `variant`.
- `warehouse`.
- `source_type` enum:
  - OPENING
  - PURCHASE
  - SELF_TRANSFER
  - RETURN
  - RECOVER
- `source_ref_id`.
- `parent_batch_id`.
- `qty_initial`.
- `qty_available`.
- `unit_cost`.
- `status`.
- `tenant_id`.

InventoryGPT meaning:

This is the main warehouse stock truth table.

InventoryGPT should use it for:

- Current warehouse stock.
- FIFO batch analysis.
- Available stock.
- Warehouse-level stock health.
- Dead stock detection.
- Transfer source suitability.

### 7.2 Legacy / Aggregated Inventory

Table: `inventory`

Important fields:

- `product`.
- `code`.
- `warehouse`.
- `warehouse_code`.
- `stock`.
- `opening`.
- `return`.
- `qty_reserved`.

InventoryGPT meaning:

This appears to be older or synced inventory. It should not be treated as primary truth unless confirmed by the controller flow.

Use carefully for compatibility, not final stock truth.

### 7.3 Store Inventory

Table: `store_inventory`

Important fields:

- `store_code`.
- `product_name`.
- `barcode`.
- `category`.
- `stock`.
- `quantity`.
- `price`.
- `warehouse_id`.

InventoryGPT meaning:

Store-level stock is separate from warehouse stock.

InventoryGPT must never mix store stock with warehouse stock unless it labels the location type.

---

## 8. Product Journey And Timeline Model

### 8.1 Warehouse Ledger

Table: `inventory_ledger_base`

Important fields:

- `id` primary key.
- `event_time`.
- `movement_type`.
- `barcode`.
- `product_name`.
- `location_code`.
- `qty`.
- `direction` enum IN/OUT.
- `reference`.
- `reversed_qty`.
- `tenant_id`.

Relation:

- `inventory_ledger_base.location_code` → `dispatch_warehouse.warehouse_code`.

InventoryGPT meaning:

This is the key table for product journey.

InventoryGPT should use it to answer:

- Where did this product come from?
- When was stock added?
- When was stock dispatched?
- Was it damaged?
- Was it recovered?
- Was it returned?
- Was it transferred?
- What is the running balance?

Timeline movement types should be interpreted as:

- OPENING: initial stock.
- BULK_UPLOAD: stock import.
- PURCHASE: inbound purchase.
- DISPATCH: outbound order/dispatch.
- DAMAGE: stock removed due to damage.
- RECOVER: stock recovered back.
- RETURN: stock returned.
- SELF_TRANSFER: warehouse/store transfer.
- MANUAL: manual correction.

### 8.2 Store Timeline

Table: `store_timeline`

Important fields:

- `store_code`.
- `product_barcode`.
- `product_name`.
- `movement_type` enum:
  - OPENING
  - SELF_TRANSFER
  - DISPATCH
  - RETURN
  - DAMAGE
  - RECOVER
  - MANUAL
- `direction` IN/OUT.
- `quantity`.
- `balance_after`.
- `reference`.
- `user_id`.
- `created_at`.

InventoryGPT meaning:

This is store product journey.

Warehouse timeline and store timeline are different. InventoryGPT must combine them only when answering a complete product journey across all locations.

---

## 9. Orders And Dispatch Model

### 9.1 Website Orders

Table: `website_orders`

Important fields:

- `id` primary key.
- `user_id`.
- `order_number`.
- `status`.
- `total_amount`.
- `payment_status`.
- `payment_method`.
- `shipping_address`.
- `billing_address`.
- `order_date`.
- `tracking_number`.

Relation:

- `website_order_items.order_id` → `website_orders.id`.
- `website_order_status_history.order_id` → `website_orders.id`.
- `website_order_inventory_sync.website_order_id` → `website_orders.id`.

InventoryGPT meaning:

Used for customer-facing order analysis.

InventoryGPT should support:

- Order status.
- Revenue summary.
- Product-wise order demand.
- Regional order analysis from shipping address.
- Customer order history.
- Website stock sync risk.

### 9.2 Website Order Items

Table: `website_order_items`

Important fields:

- `order_id`.
- `product_id`.
- `product_name`.
- `quantity`.
- `unit_price`.
- `total_price`.
- `customization`.

InventoryGPT meaning:

Used for product demand and sales velocity.

### 9.3 Warehouse Dispatch

Table: `warehouse_dispatch`

Important fields:

- `id` primary key.
- `status`.
- `warehouse`.
- `order_ref`.
- `customer`.
- `product_name`.
- `qty`.
- `barcode`.
- `awb`.
- `logistics`.
- `invoice_amount`.
- `processed_by`.
- `timestamp`.
- customer address fields.
- Shiprocket fields.

Relation:

- `warehouse_dispatch_items.dispatch_id` → `warehouse_dispatch.id`.

InventoryGPT meaning:

Dispatch is the operational outbound fulfillment signal.

InventoryGPT should use it for:

- Product journey outbound events.
- Warehouse performance.
- Customer/order trace.
- Logistics analysis.
- Revenue and invoice comparison.
- Delivery risk.

---

## 10. Transfer And Redistribution Model

### 10.1 Self Transfer

Table: `self_transfer`

Important fields:

- `id` primary key.
- `transfer_reference` unique.
- `order_ref`.
- `transfer_type`.
- `source_location`.
- `destination_location`.
- `awb_number`.
- `logistics`.
- `payment_mode`.
- `executive`.
- `invoice_amount`.
- parcel dimensions/weight.
- `status`.
- `created_at`.

### 10.2 Self Transfer Items

Table: `self_transfer_items`

Important fields:

- `transfer_id`.
- `product_name`.
- `barcode`.
- `variant`.
- `qty`.

Relation:

- `self_transfer_items.transfer_id` → `self_transfer.id`.

InventoryGPT meaning:

This is the natural execution bridge for AI redistribution recommendations.

InventoryGPT should recommend transfers, but InsoraOps should execute them through verified transfer workflows.

---

## 11. Audit And Observability Model

### 11.1 Audit Logs

Table: `audit_logs`

Important fields:

- `event_type`.
- `user_id`.
- `user_name`.
- `user_email`.
- `user_role`.
- `action`.
- `resource_type`.
- `resource_id`.
- `resource_name`.
- `description`.
- `details`.
- `old_values`.
- `new_values`.
- `status`.
- `severity`.
- `ip_address`.
- `request_method`.
- `request_url`.
- `response_status`.
- `before_state_json`.
- `after_state_json`.
- `bulk_operation_id`.

Relation:

- `audit_logs.user_id` → `users.id`.

InventoryGPT meaning:

InventoryGPT should use audit logs for:

- Who changed stock?
- Who created/updated/deleted records?
- Was a change manual or system-generated?
- What changed before vs after?
- Was there a failed operational attempt?
- Is there an audit trail for a disputed inventory state?

### 11.2 Operational Event Store

Table: `operational_event_store`

Important fields:

- `event_id` primary key.
- `event_type`.
- `source_service`.
- `payload`.
- `timestamp`.
- `retry_count`.
- `status`.
- `correlation_id`.
- `idempotency_key`.
- `version`.
- `last_error`.

InventoryGPT meaning:

This is the foundation for future event-driven operations.

InventoryGPT should use it for:

- Event replay.
- Distributed workflow tracing.
- Retry/dead-letter analysis.
- Consistency auditing.
- Saga monitoring.

---

## 12. AI Intelligence Tables

### 12.1 AI Recommendations

Table: `ai_inventory_recommendations`

Important fields:

- `id`.
- `recommendation_type`.
- `sku_id`.
- `source_location`.
- `target_location`.
- `confidence_score`.
- `expected_savings`.
- `recommendation`.
- `status` enum:
  - pending
  - accepted
  - rejected
  - executed
  - measured
  - closed

InventoryGPT meaning:

This is where InventoryGPT should store structured recommendations.

Current gap:

- `sku_id`, `source_location`, `target_location` are numeric, but actual operational keys often use `barcode` and warehouse/store code.
- Recommendation JSON text currently carries extra details.

Recommended improvement:

Add or consistently use these fields:

- `sku` / `barcode`.
- `source_location_code`.
- `source_location_type`.
- `target_location_code`.
- `target_location_type`.
- `recommended_qty`.
- `reason_code`.
- `evidence_json`.
- `execution_plan_json`.

### 12.2 AI Operational Memory

Table: `ai_operational_memory`

Important fields:

- `entity_type` enum REGION/WAREHOUSE/SKU/COURIER.
- `entity_id`.
- `pattern_description`.
- `confidence_in_pattern`.
- `first_detected_at`.
- `last_applied_at`.

InventoryGPT meaning:

This is long-term operational memory.

Examples:

- SKU `X` sells faster in SOUTH region.
- Warehouse `BLR_WH` has recurring dispatch delays.
- Courier `Y` has high RTO in one region.
- Category `sports` has seasonal spikes.

### 12.3 Regional Sales Analytics

Table: `regional_sales_analytics`

Important fields:

- `sku_id`.
- `sku`.
- `region`.
- `warehouse_id`.
- `marketplace`.
- `total_orders`.
- `total_revenue`.
- `avg_shipping_cost`.
- `top_sku`.
- `total_sales`.
- `out_of_stock_incidents`.

InventoryGPT meaning:

This table should power regional demand intelligence.

---

## 13. Current Code Workflow Observations

### Inventory Dashboard

Frontend:

- `/inventory`

Backend:

- `GET /api/inventory`
- `GET /api/timeline/:barcode`
- `POST /api/inventory/update-stock`

Tables:

- `stock_batches`
- `inventory_ledger_base`
- `inventory_adjustments`
- `damage_recovery_log`

InventoryGPT should understand this as the warehouse stock dashboard.

### Bulk Upload

Frontend:

- `/inventory/bulk-upload`

Backend:

- `/api/bulk-upload`

Tables:

- `stock_batches`
- `inventory_ledger_base`

Meaning:

Inbound stock creation.

### Timeline

Backend:

- `timelineController.getProductTimeline`

Tables:

- `inventory_ledger_base`
- `warehouse_dispatch`
- `returns_main`
- `damage_recovery_log`
- `stock_batches`

Meaning:

This is the primary product journey engine.

### Store Timeline

Backend:

- `/api/store-timeline/:storeCode`

Tables:

- `store_timeline`
- `store_inventory`

Meaning:

Store-level movement history.

### Damage / Return

Observed issue:

- `/inventory/damage` appears to import return modal.
- `/inventory/return` appears to import damage recovery modal.

This should be reviewed before execution.

### Store Inventory Page

Observed issue:

- `/inventory/store` calls `/api/store-inventory/*`.
- Backend route may not exist or may be stale.

This needs correction or endpoint mapping.

---

## 14. InventoryGPT Required Capabilities

### 14.1 Product Intelligence

InventoryGPT should answer:

- What is this SKU?
- Which catalog does it belong to?
- Which category?
- What is the price?
- What is the cost price?
- What is the description?
- Is it listed on the website?
- Is it active/inactive?
- What are its dimensions/weight?
- Which catalog fields are missing?

### 14.2 Stock Intelligence

InventoryGPT should answer:

- Current stock by warehouse.
- Current stock by store.
- Total physical stock.
- Sellable stock.
- Reserved stock.
- Out-of-stock status.
- Low stock status.
- Dead stock candidates.
- Stock mismatch between website and warehouse.

### 14.3 Product Journey Intelligence

InventoryGPT should answer:

- Complete movement timeline for a SKU.
- Opening stock.
- Bulk uploads.
- Dispatches.
- Returns.
- Damage.
- Recovery.
- Transfers.
- Current balance.
- Who performed important actions.
- References/AWB/order links.

### 14.4 Order Intelligence

InventoryGPT should answer:

- Recent orders.
- Order status.
- Order item details.
- Regional order distribution.
- Revenue by region.
- Product sales velocity.
- Pending/failed/cancelled order signals.
- Order-to-stock sync status.

### 14.5 Warehouse Intelligence

InventoryGPT should answer:

- Warehouse health.
- Warehouse stock load.
- Warehouse dispatch activity.
- Warehouse dead stock ratio.
- Warehouse risk level.
- Which warehouse should fulfill which region?
- Which warehouse needs stock?
- Which warehouse has excess stock?

### 14.6 Transfer Intelligence

InventoryGPT should recommend:

- Source warehouse/store.
- Destination warehouse/store.
- SKU.
- Quantity.
- Reason.
- Confidence.
- Expected impact.
- Risk.
- Required human approval.

### 14.7 Audit-Aware Intelligence

InventoryGPT should answer:

- Who changed this stock?
- When was this product edited?
- Which user created a transfer?
- Was a failed action logged?
- What changed before and after?
- Is this inventory change verified?

### 14.8 Predictive Intelligence

InventoryGPT should generate:

- Stockout alerts.
- Reorder alerts.
- Demand surge alerts.
- Dead stock alerts.
- Transfer opportunities.
- Regional demand imbalance warnings.
- Fulfillment cost warnings.

---

## 15. Recommended InventoryGPT Data Access Layer

InventoryGPT should not directly scatter queries everywhere.

Create a deterministic data access layer:

### Product Resolver

Inputs:

- SKU/barcode.
- Product name.
- Website product ID.

Checks:

1. `dispatch_product`.
2. `website_products`.
3. `stock_batches`.
4. `inventory_ledger_base`.

Output:

- Unified product object.
- Catalog source.
- Category.
- Description.
- Price/cost.
- Website listing status.

### Stock Resolver

Inputs:

- SKU/barcode.
- Warehouse/store.
- Location type.

Checks:

1. `stock_batches` for warehouse.
2. `store_inventory` for store.
3. `inventory` fallback.

Output:

- Physical stock.
- Store stock.
- Batch count.
- Sellable stock.
- Source table.

### Timeline Resolver

Inputs:

- SKU/barcode.
- Warehouse/store.
- Date range.

Checks:

1. `inventory_ledger_base`.
2. `store_timeline`.
3. `warehouse_dispatch`.
4. `returns_main`.
5. `damage_recovery_log`.
6. `self_transfer`.

Output:

- Ordered timeline.
- Running balance.
- Movement explanation.
- References.
- Actor/user details where possible.

### Order Resolver

Inputs:

- Order number.
- SKU.
- Region.
- Customer.
- Date range.

Checks:

1. `website_orders`.
2. `website_order_items`.
3. `warehouse_dispatch`.
4. `warehouse_dispatch_items`.
5. `website_order_status_history`.

Output:

- Order status.
- Product list.
- Revenue.
- Region.
- Fulfillment state.

### Audit Resolver

Inputs:

- Resource type.
- Resource ID.
- SKU.
- User.
- Date range.

Checks:

1. `audit_logs`.
2. `user_activity_log`.
3. `operational_event_store`.

Output:

- Action trail.
- Before/after values.
- User info.
- Severity.
- Failure/success.

---

## 16. Recommended Execution Phases

### Phase 1 — Deterministic Product Brain

Build the product resolver.

Features:

- SKU lookup across both catalogs.
- Follow-up memory for last product.
- Price/description/category/stock responses.
- Catalog source labeling.
- No hallucination.

Status:

- Basic SKU/follow-up fix started.
- Needs cleaner shared resolver module.

### Phase 2 — Stock Brain

Build stock resolver.

Features:

- Warehouse stock by SKU.
- Store stock by SKU.
- Total physical stock.
- Website vs warehouse mismatch.
- Low stock and out-of-stock answers.

### Phase 3 — Product Journey Brain

Build timeline resolver.

Features:

- Complete product journey.
- Warehouse timeline.
- Store timeline.
- Running balance.
- Dispatch/return/damage/recovery/transfer explanation.
- Product journey summary.

### Phase 4 — Order Brain

Build order resolver.

Features:

- Website order tracking.
- Warehouse dispatch tracking.
- Order item analysis.
- Region extraction from shipping address.
- Product demand from order items.

### Phase 5 — Audit Brain

Build audit resolver.

Features:

- Who changed what.
- Before/after state.
- Suspicious changes.
- Failed operations.
- Manual corrections.

### Phase 6 — Recommendation Brain

Build structured recommendations.

Features:

- Dead stock detection.
- Transfer recommendation.
- Stockout prediction.
- Regional demand recommendations.
- Human approval.
- Recommendation status lifecycle.

### Phase 7 — Command Center

Build UI for InventoryGPT insights.

Features:

- Product journey panel.
- Warehouse health panel.
- Risk radar.
- Recommendation queue.
- Audit feed.
- AI confidence/trust metrics.

### Phase 8 — Operational Memory

Build memory learning.

Features:

- Store recurring issues.
- SKU movement patterns.
- Warehouse behavior.
- Courier/logistics performance.
- Seasonal/regional demand patterns.

### Phase 9 — Safe Execution Bridge

InventoryGPT can suggest actions, but InsoraOps executes.

Features:

- Recommendation → transfer draft.
- Recommendation → reorder draft.
- Recommendation → alert.
- Human approval required.
- Audit log required.
- Rollback/reversal path required.

---

## 17. Critical Risks To Fix Before Full Execution

1. Damage and return frontend routes appear swapped.
2. Store inventory page may call missing backend endpoints.
3. Mixed warehouse tables: `dispatch_warehouse` and `warehouses`.
4. Mixed product tables: `dispatch_product`, `products`, and `website_products`.
5. `inventory` table may be stale compared to `stock_batches`.
6. Movement records may use `returns` while active returns use `returns_main`.
7. InventoryGPT recommendation table uses numeric location/SKU IDs while actual operations often use barcodes/codes.
8. Website stock and warehouse stock are separate and must not be treated as identical.
9. Many AI tables exist but are empty; feature code must handle empty states clearly.
10. Follow-up chat memory must remain deterministic and not depend on LLM guessing.

---

## 18. Final InventoryGPT Definition

InventoryGPT is not a generic chatbot.

InventoryGPT is a live business operations intelligence system that understands:

- Products.
- Catalogs.
- Stock.
- Warehouses.
- Stores.
- Orders.
- Dispatches.
- Transfers.
- Returns.
- Damage and recovery.
- Audit trails.
- Product journeys.
- Regional demand.
- AI recommendations.
- Operational memory.

It should help business users grow by answering operational questions, finding risk, explaining movement, recommending actions, and preserving inventory truth.

---

## 19. Next Execution Checklist

Before coding the full system, review and approve this plan.

Suggested next implementation order:

1. Create shared InventoryGPT resolver library.
2. Move product lookup logic out of route file into resolver.
3. Implement product follow-up memory properly.
4. Implement stock resolver.
5. Implement timeline/product journey resolver.
6. Implement order resolver.
7. Implement audit resolver.
8. Add structured response format for UI cards/tables.
9. Build InventoryGPT command center panels.
10. Add recommendation lifecycle and execution bridge.

---

## 20. Review Notes

This plan should be reviewed by the business/product owner before execution.

After review, execution should start with deterministic resolvers, not LLM prompts.

The correct architecture is:

- Data first.
- Timeline first.
- Audit first.
- AI second.
- Human approval before execution.
