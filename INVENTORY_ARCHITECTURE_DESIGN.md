# Inventory System — Enterprise Architecture Design
# Target: More stable than Zoho Inventory + Oracle NetSuite
# Date: April 22, 2026

---

## PART 1 — CURRENT DATABASE MAPPING (What exists now)

```
CURRENT TABLES — INVENTORY DOMAIN
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                    PRODUCT CATALOG                          │
│                                                             │
│  dispatch_product          product_categories               │
│  ─────────────────         ──────────────────               │
│  p_id (PK)                 id (PK)                          │
│  product_name              name                             │
│  product_variant           display_name                     │
│  barcode (UNIQUE)          parent_id                        │
│  price, cost_price                                          │
│  category_id ──────────────────────────────────────────►   │
│  is_active                                                  │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ barcode links everything
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  STOCK LAYER (3 tables)                     │
│                                                             │
│  inventory                 stock_batches                    │
│  ──────────                ─────────────                    │
│  code (barcode)            barcode                          │
│  warehouse                 warehouse                        │
│  stock ◄── LIVE QTY        qty_available ◄── FIFO SOURCE   │
│  opening                   qty_initial                      │
│  return                    source_type                      │
│                            status (active/exhausted)        │
│                            unit_cost                        │
│                                                             │
│  ⚠ PROBLEM: inventory.stock NOT updated on dispatch        │
│  ⚠ PROBLEM: stock_batches and inventory can diverge        │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ every movement writes here
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  AUDIT / LEDGER LAYER                       │
│                                                             │
│  inventory_ledger_base                                      │
│  ──────────────────────                                     │
│  event_time                                                 │
│  movement_type (DISPATCH/OPENING/RETURN/DAMAGE/RECOVER)     │
│  barcode, location_code                                     │
│  qty, direction (IN/OUT)                                    │
│  reference (DISPATCH_id_awb)                                │
│  reversed_qty                                               │
│                                                             │
│  ✅ This is the source of truth for all movements           │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ aggregated daily
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  SNAPSHOT LAYER (broken)                    │
│                                                             │
│  inventory_daily_snapshot      inventory_snapshots          │
│  ────────────────────────      ───────────────────          │
│  product_code, warehouse       barcode, warehouse           │
│  inventory_date                snapshot_time                │
│  opening_stock                 qty                          │
│  dispatch_qty                  source (AUTO/EOD)            │
│  damage_qty                                                 │
│  return_qty                                                 │
│  closing_stock                                              │
│                                                             │
│  ⚠ PROBLEM: No cron job fills these — EMPTY in production  │
│  ⚠ PROBLEM: Two snapshot tables doing same job (redundant) │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ dispatch creates records here
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  ORDER / DISPATCH LAYER                     │
│                                                             │
│  warehouse_dispatch            warehouse_dispatch_items     │
│  ──────────────────            ────────────────────────     │
│  id (PK)                       id (PK)                      │
│  warehouse, order_ref          dispatch_id (FK)             │
│  customer (name only)          barcode, qty                 │
│  barcode, awb                  selling_price                │
│  logistics, payment_mode                                    │
│  invoice_amount                                             │
│  status (Pending/Packed)                                    │
│                                                             │
│  ⚠ PROBLEM: No customer phone/address/city/pincode         │
│  ⚠ PROBLEM: No Shiprocket fields                           │
│  ⚠ PROBLEM: Disconnected from new orders table             │
│                                                             │
│  orders (NEW — just created)                                │
│  ──────────────────────────                                 │
│  order_id, customer_name, phone, address                    │
│  product_name, shiprocket_order_id                          │
│                                                             │
│  ⚠ PROBLEM: Completely separate from warehouse_dispatch    │
│  ⚠ PROBLEM: No stock deduction happens here                │
└─────────────────────────────────────────────────────────────┘
```

---

## PART 2 — LOOPHOLES (Critical gaps)

```
LOOPHOLE MAP
═══════════════════════════════════════════════════════════════

L1. INVENTORY SPLIT — Two sources of truth
    ┌──────────────────────────────────────────────────────┐
    │  inventory.stock  ≠  SUM(stock_batches.qty_available)│
    │                                                      │
    │  Dispatch updates stock_batches ✅                   │
    │  Dispatch does NOT update inventory.stock ❌         │
    │                                                      │
    │  Result: Product Manager shows WRONG stock           │
    │  Risk: Overselling                                   │
    └──────────────────────────────────────────────────────┘

L2. SNAPSHOT ORPHAN — Data never written
    ┌──────────────────────────────────────────────────────┐
    │  inventory_daily_snapshot — 32,767 rows (AUTO_INC)   │
    │  but actual data rows = 0 (empty)                    │
    │                                                      │
    │  inventory_snapshots — 4,106 AUTO_INC                │
    │  but actual data rows = 0 (empty)                    │
    │                                                      │
    │  Result: No historical data, no reports possible     │
    │  Risk: Cannot detect shrinkage or theft              │
    └──────────────────────────────────────────────────────┘

L3. ORDER LIFECYCLE BROKEN
    ┌──────────────────────────────────────────────────────┐
    │  Customer places order (Shiprocket)                  │
    │         ↓                                            │
    │  orders table (new) — no stock deduction             │
    │         ↓                                            │
    │  ??? — no link to warehouse_dispatch                 │
    │         ↓                                            │
    │  warehouse_dispatch — stock deducted                 │
    │         ↓                                            │
    │  Shiprocket — order created (maybe)                  │
    │                                                      │
    │  Result: Order can exist without dispatch            │
    │  Result: Dispatch can exist without Shiprocket order │
    └──────────────────────────────────────────────────────┘

L4. RACE CONDITION — No stock reservation
    ┌──────────────────────────────────────────────────────┐
    │  Agent A checks stock: 1 unit available              │
    │  Agent B checks stock: 1 unit available              │
    │  Agent A dispatches: success                         │
    │  Agent B dispatches: success (stock goes -1)         │
    │                                                      │
    │  Result: Negative stock possible                     │
    │  Risk: Two customers get same item                   │
    └──────────────────────────────────────────────────────┘

L5. MULTI-TENANT IMPOSSIBLE
    ┌──────────────────────────────────────────────────────┐
    │  Current: Single DB, no tenant_id anywhere           │
    │                                                      │
    │  If Client A and Client B share this system:         │
    │  - Client A can see Client B's inventory             │
    │  - Client A's dispatch affects Client B's stock      │
    │  - No data isolation                                 │
    │                                                      │
    │  Result: Cannot onboard multiple clients             │
    └──────────────────────────────────────────────────────┘

L6. AWB DUPLICATE RISK
    ┌──────────────────────────────────────────────────────┐
    │  warehouse_dispatch.awb — NO UNIQUE constraint       │
    │  Same AWB entered twice = duplicate shipment         │
    │  Courier charges double                              │
    └──────────────────────────────────────────────────────┘

L7. COST LEDGER ORPHAN
    ┌──────────────────────────────────────────────────────┐
    │  cost_ledger table exists in DB                      │
    │  No controller writes to it                          │
    │  No route reads from it                              │
    │  Cannot calculate COGS (Cost of Goods Sold)          │
    │  Cannot calculate profit per order                   │
    └──────────────────────────────────────────────────────┘
```

---

## PART 3 — TARGET ARCHITECTURE (Oracle + Zoho level, more stable)

```
ENTERPRISE INVENTORY ARCHITECTURE
═══════════════════════════════════════════════════════════════

LAYER 0 — MULTI-TENANT FOUNDATION
──────────────────────────────────
  tenants
  ────────
  id (PK)
  name, slug
  plan (starter/pro/enterprise)
  db_schema OR tenant_id column strategy

  Strategy: Row-level tenancy (add tenant_id to every table)
  Reason: Simpler than schema-per-tenant, scales to 10,000 clients

──────────────────────────────────────────────────────────────

LAYER 1 — PRODUCT CATALOG (Stable, no change needed)
──────────────────────────────────────────────────────
  products (rename from dispatch_product)
  ────────
  id, sku (barcode), name, variant
  category_id, brand_id
  cost_price, selling_price
  weight, dimensions
  hsn_code, tax_rate
  tenant_id ← ADD THIS
  is_active

  product_categories (keep, add tenant_id)
  warehouses (rename from dispatch_warehouse, add tenant_id)

──────────────────────────────────────────────────────────────

LAYER 2 — INVENTORY CORE (Redesign needed)
────────────────────────────────────────────

  inventory_positions  ← SINGLE SOURCE OF TRUTH (replaces inventory + stock_batches split)
  ────────────────────
  id (PK)
  tenant_id
  sku (barcode)
  warehouse_id
  qty_on_hand          ← actual physical stock
  qty_reserved         ← reserved for pending orders (NEW)
  qty_available        ← qty_on_hand - qty_reserved (computed)
  avg_cost             ← weighted average cost
  last_updated         ← timestamp of last movement
  version              ← optimistic locking (prevents race condition)

  UNIQUE KEY (tenant_id, sku, warehouse_id)

  Why this replaces inventory + stock_batches split:
  - Single table = no divergence possible
  - qty_reserved solves race condition
  - version field enables optimistic locking

  stock_batches (keep for FIFO cost tracking only)
  ────────────
  id, tenant_id, sku, warehouse_id
  source_type, qty_initial, qty_remaining
  unit_cost, received_date
  status (active/exhausted)

──────────────────────────────────────────────────────────────

LAYER 3 — LEDGER (Keep, enhance)
──────────────────────────────────

  inventory_ledger  ← rename from inventory_ledger_base
  ─────────────────
  id (PK)
  tenant_id
  event_time
  movement_type  ENUM(
    'OPENING', 'PURCHASE', 'SALE', 'DISPATCH',
    'RETURN_IN', 'RETURN_OUT', 'DAMAGE', 'RECOVER',
    'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT'
  )
  sku, warehouse_id
  qty, direction (IN/OUT)
  unit_cost, total_cost    ← for COGS calculation
  reference_type           ← 'ORDER'/'DISPATCH'/'TRANSFER'
  reference_id             ← FK to orders/dispatches/transfers
  created_by (user_id)
  reversed_by (ledger_id)  ← for reversals

  This is the IMMUTABLE audit log. Never update, only insert.
  All reports derive from this table.

──────────────────────────────────────────────────────────────

LAYER 4 — ORDER LIFECYCLE (Unified, replaces split)
─────────────────────────────────────────────────────

  orders  ← MASTER ORDER TABLE
  ──────
  id (PK)
  tenant_id
  order_number (human readable: ORD-2026-00001)
  order_type ENUM('B2C_ONLINE', 'B2B_OFFLINE', 'INTERNAL')
  channel ENUM('WEBSITE', 'MANUAL', 'API', 'MARKETPLACE')

  -- Customer
  customer_name, customer_phone, customer_email
  shipping_address, shipping_city, shipping_state
  shipping_pincode, shipping_country

  -- Financials
  subtotal, discount, tax, shipping_charges
  total_amount, cod_amount
  payment_method ENUM('COD', 'PREPAID', 'CREDIT')
  payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED')

  -- Fulfillment
  fulfillment_status ENUM(
    'PENDING', 'RESERVED', 'PICKING', 'PACKED',
    'DISPATCHED', 'IN_TRANSIT', 'DELIVERED',
    'CANCELLED', 'RTO', 'LOST'
  )
  warehouse_id (assigned warehouse)
  dispatch_id (FK to dispatches)

  -- Courier
  courier_name, awb_number (UNIQUE)
  shiprocket_order_id, shiprocket_shipment_id
  tracking_url
  estimated_delivery

  created_at, updated_at
  created_by

  order_items  ← LINE ITEMS
  ───────────
  id, order_id (FK), tenant_id
  sku, product_name, variant
  qty, unit_price, discount, tax
  total_price

  dispatches  ← WAREHOUSE FULFILLMENT (replaces warehouse_dispatch)
  ──────────
  id (PK)
  tenant_id
  order_id (FK) ← LINKED TO ORDER
  warehouse_id
  dispatch_number
  status ENUM('PENDING', 'PICKING', 'PACKED', 'SHIPPED')
  packed_by, dispatched_by
  packed_at, dispatched_at
  awb_number (UNIQUE)
  courier_name
  shiprocket_order_id
  remarks

  dispatch_items  ← replaces warehouse_dispatch_items
  ──────────────
  id, dispatch_id (FK), tenant_id
  sku, product_name, variant
  qty_ordered, qty_dispatched
  batch_id (FK to stock_batches for FIFO)
  unit_cost

──────────────────────────────────────────────────────────────

LAYER 5 — SNAPSHOT / REPORTING (Fix the broken layer)
───────────────────────────────────────────────────────

  inventory_daily_summary  ← replaces both snapshot tables
  ───────────────────────
  id (PK)
  tenant_id
  sku, warehouse_id
  report_date
  opening_qty
  in_qty   (purchases + returns + recoveries)
  out_qty  (dispatches + damages + transfers_out)
  closing_qty  ← opening + in - out
  avg_cost
  inventory_value  ← closing_qty × avg_cost
  created_at

  UNIQUE KEY (tenant_id, sku, warehouse_id, report_date)

  Populated by: Cron job at 11:59 PM daily
  Source: inventory_ledger (aggregate by date)

──────────────────────────────────────────────────────────────

LAYER 6 — COST & FINANCE (Fix the orphan)
───────────────────────────────────────────

  cogs_ledger  ← replaces cost_ledger (currently orphan)
  ───────────
  id (PK)
  tenant_id
  order_id (FK)
  sku, qty
  unit_cost (from stock_batches FIFO)
  total_cost
  recorded_at

  This enables:
  - Gross profit per order
  - Monthly P&L
  - Product profitability report

──────────────────────────────────────────────────────────────

LAYER 7 — CONCURRENCY CONTROL (New — prevents race condition)
──────────────────────────────────────────────────────────────

  Strategy: Optimistic Locking on inventory_positions

  On stock deduction:
  1. SELECT qty_available, version FROM inventory_positions
     WHERE sku = ? AND warehouse_id = ? AND tenant_id = ?
  2. Check qty_available >= requested_qty
  3. UPDATE inventory_positions
     SET qty_available = qty_available - ?,
         version = version + 1
     WHERE sku = ? AND warehouse_id = ? AND version = ?  ← version check
  4. If 0 rows updated → version changed → retry or reject

  This prevents two agents dispatching same last unit.

```

---

## PART 4 — MULTI-TENANT STRATEGY

```
MULTI-TENANT DESIGN
═══════════════════════════════════════════════════════════════

Option A: Row-level tenancy (RECOMMENDED for your scale)
─────────────────────────────────────────────────────────
  Every table has tenant_id column
  All queries include WHERE tenant_id = ?
  Single DB, single schema
  
  Pros: Simple, cheap, easy to migrate
  Cons: One bad query can leak data (must use middleware)
  
  Protection: Add tenant_id injection middleware in Express
  
  app.use((req, res, next) => {
    req.tenantId = req.user?.tenant_id || 1;
    next();
  });

Option B: Schema-per-tenant (for enterprise clients)
──────────────────────────────────────────────────────
  Each client gets their own MySQL schema: client_a_db, client_b_db
  Application connects to correct schema based on subdomain
  
  Pros: Complete isolation, easy backup per client
  Cons: Complex migrations, higher DB overhead
  
  Use when: Client requires data isolation (BFSI, healthcare)

RECOMMENDATION:
  Start with Option A (row-level)
  Add Option B for enterprise clients who pay premium
  Use subdomain routing: client1.yoursaas.com → tenant_id=1
```

---

## PART 5 — EXECUTION ROADMAP

```
PHASE 1 — Foundation Fix (2 weeks)
────────────────────────────────────
  Week 1:
  □ Add tenant_id to all core tables (migration script)
  □ Fix inventory.stock sync with stock_batches
  □ Add UNIQUE constraint on AWB
  □ Add customer fields to warehouse_dispatch
  □ Fix dispatch controller — update inventory on dispatch

  Week 2:
  □ Add qty_reserved to inventory (or inventory_positions)
  □ Implement optimistic locking in dispatch
  □ Fix snapshot cron job (daily at 11:59 PM)
  □ Connect orders table to warehouse_dispatch via FK

PHASE 2 — Order Lifecycle Unification (2 weeks)
─────────────────────────────────────────────────
  Week 3:
  □ Merge orders + warehouse_dispatch into unified flow
  □ Add Shiprocket call inside dispatchController
  □ Add Shiprocket token auto-refresh
  □ Connect /delivery/order page to /api/dispatch/create
  □ Connect /delivery/orders page to /api/dispatch

  Week 4:
  □ Add order status webhook from Shiprocket
  □ Implement order detail view (View button)
  □ Implement order edit before dispatch
  □ Implement shipment tracking (Track button)

PHASE 3 — Reporting & Finance (2 weeks)
─────────────────────────────────────────
  Week 5:
  □ Activate cost_ledger / cogs_ledger
  □ Daily inventory summary report
  □ Gross profit per order calculation
  □ Inventory valuation report (closing stock × avg cost)

  Week 6:
  □ Monthly P&L dashboard
  □ Shrinkage detection (snapshot vs actual)
  □ Low stock alerts
  □ Reorder point automation

PHASE 4 — Enterprise & Scale (Month 2)
────────────────────────────────────────
  □ Multi-tenant row-level isolation
  □ Schema-per-tenant for enterprise clients
  □ Redis caching for inventory reads
  □ Read replica for reports (separate from write DB)
  □ API rate limiting
  □ Swagger API documentation
  □ Automated test suite
  □ DB backup automation to S3
  □ Monitoring (Datadog / New Relic)
```

---

## PART 6 — COMPARISON: Current vs Target vs Zoho vs Oracle

```
FEATURE COMPARISON
═══════════════════════════════════════════════════════════════

Feature                  Current   Target    Zoho      Oracle
─────────────────────────────────────────────────────────────
Multi-tenant             ❌        ✅        ✅        ✅
FIFO stock tracking      ✅        ✅        ✅        ✅
Real-time stock sync     ❌        ✅        ✅        ✅
Stock reservation        ❌        ✅        ✅        ✅
Race condition safe       ❌        ✅        ✅        ✅
Daily snapshots          ❌        ✅        ✅        ✅
COGS calculation         ❌        ✅        ✅        ✅
Unified order lifecycle  ❌        ✅        ✅        ✅
Shiprocket integration   Partial   ✅        ❌        ❌
Custom courier support   ✅        ✅        Limited   Limited
AI customer support      ✅        ✅        ❌        ❌
Multi-language chat      ✅        ✅        ❌        ❌
Open source / custom     ✅        ✅        ❌        ❌
Cost                     Low       Low       $$$       $$$$
─────────────────────────────────────────────────────────────

Your advantage over Zoho/Oracle:
- Shiprocket native integration
- AI-powered customer support
- Multi-language support
- Fully customizable
- 10x cheaper to run
```

---

*Architecture designed for: 1 to 10,000 clients, 1M+ orders/month*
*Database: MySQL 8.0+ (current) → can migrate to PostgreSQL for Phase 4*
*Caching: Redis (add in Phase 4)*
*Queue: Bull/BullMQ for async jobs (snapshots, Shiprocket calls)*
