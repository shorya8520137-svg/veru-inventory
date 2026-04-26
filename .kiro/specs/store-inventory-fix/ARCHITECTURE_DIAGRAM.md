# Store Inventory Fix - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER / CLIENT                                │
│                    (Store Manager / Admin)                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ POST /api/self-transfer
                                  │ {sourceType: "store", destinationType: "store", ...}
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    TRANSFER CONTROLLER                               │
│                  (selfTransferRoutes.js)                            │
│                                                                      │
│  • Validates request                                                │
│  • Detects transfer type (store-to-store vs others)                │
│  • Routes to appropriate handler                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
         Store-to-Store                  Other Transfers
         (NEW LOGIC)                    (LEGACY LOGIC)
                    │                           │
                    ↓                           ↓
┌──────────────────────────────────┐  ┌────────────────────────────┐
│  BILLING INTEGRATION SERVICE     │  │   LEGACY TRANSFER LOGIC    │
│  (BillingIntegrationService.js)  │  │   (Direct DB updates)      │
│                                   │  └────────────────────────────┘
│  Orchestrates:                    │
│  1. Billing entry creation        │
│  2. Stock reduction (FIFO)        │
│  3. Timeline logging              │
│  4. Transaction management        │
└──────────────────────────────────┘
                    │
                    │ [BEGIN TRANSACTION]
                    │
        ┌───────────┼───────────┐
        │           │           │
        ↓           ↓           ↓
┌──────────┐ ┌──────────┐ ┌──────────┐
│  STEP 1  │ │  STEP 2  │ │  STEP 3  │
│ Validate │ │  Create  │ │  Reduce  │
│  Stock   │ │ Billing  │ │  Stock   │
└──────────┘ └──────────┘ └──────────┘
        │           │           │
        └───────────┼───────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │       STEP 4          │
        │   Increase Stock      │
        │   (Destination)       │
        └───────────────────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │       STEP 5          │
        │   Log Timeline        │
        │   (Source OUT +       │
        │   Destination IN)     │
        └───────────────────────┘
                    │
                    │ [COMMIT TRANSACTION]
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         RESPONSE                                     │
│  {                                                                   │
│    success: true,                                                   │
│    transferId: "STF-1234567890",                                   │
│    billingIntegration: true,                                       │
│    transferResults: [...]                                          │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Transfer API     │  │ Timeline API     │  │ Balance API     │  │
│  │ (POST /transfer) │  │ (GET /timeline)  │  │ (GET /balance)  │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         BillingIntegrationService                          │    │
│  │  • Orchestrates billing + stock reduction                  │    │
│  │  • Manages transactions                                    │    │
│  │  • Ensures atomicity                                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                  │                                   │
│         ┌────────────────────────┼────────────────────────┐         │
│         │                        │                        │         │
│         ↓                        ↓                        ↓         │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐    │
│  │   Stock     │        │  Timeline   │        │   Billing   │    │
│  │  Reduction  │        │   Service   │        │   Service   │    │
│  │   Service   │        │             │        │  (Internal) │    │
│  └─────────────┘        └─────────────┘        └─────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       REPOSITORY LAYER                               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         StockBatchRepository                               │    │
│  │  • CRUD operations on stock_batches                        │    │
│  │  • FIFO batch selection                                    │    │
│  │  • Transaction management                                  │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │ stock_batches│  │    bills     │  │  store_timeline      │     │
│  │   (table)    │  │   (table)    │  │     (table)          │     │
│  └──────────────┘  └──────────────┘  └──────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

## Transaction Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STORE-TO-STORE TRANSFER                           │
│                                                                      │
│  Source: GURUGRAM-NH48                                              │
│  Destination: BANGALORE-MG                                          │
│  Product: Beach Resort Wear (361313801009)                         │
│  Quantity: 5 units                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: VALIDATE STOCK                                             │
│  ────────────────────────────────────────────────────────────────   │
│  Query: SELECT SUM(qty_available) FROM stock_batches               │
│         WHERE warehouse = 'GURUGRAM-NH48'                           │
│         AND prodcode = '361313801009'                               │
│                                                                      │
│  Result: 20 units available                                         │
│  Status: ✅ Sufficient stock (20 >= 5)                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: CREATE BILLING ENTRY                                       │
│  ────────────────────────────────────────────────────────────────   │
│  INSERT INTO bills (                                                │
│    invoice_number = 'STF-1234567890',                              │
│    bill_type = 'INTERNAL_TRANSFER',                                │
│    customer_name = 'Internal Transfer: GURUGRAM-NH48 → BANGALORE-MG'│
│    items = '[{"product_name": "Beach Resort Wear", ...}]'         │
│  )                                                                  │
│                                                                      │
│  Result: Billing entry ID = 456                                     │
│  Status: ✅ Billing entry created                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: REDUCE SOURCE STOCK (FIFO)                                 │
│  ────────────────────────────────────────────────────────────────   │
│  Get FIFO batches:                                                  │
│    Batch #101: 3 units (created 2024-01-01)                        │
│    Batch #102: 2 units (created 2024-01-05)                        │
│                                                                      │
│  Exhaust batches:                                                   │
│    UPDATE stock_batches                                             │
│    SET qty_available = qty_available - 3, status = 'exhausted'     │
│    WHERE id = 101                                                   │
│                                                                      │
│    UPDATE stock_batches                                             │
│    SET qty_available = qty_available - 2, status = 'exhausted'     │
│    WHERE id = 102                                                   │
│                                                                      │
│  Result: 5 units reduced from source                                │
│  Status: ✅ Source stock reduced                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: INCREASE DESTINATION STOCK                                 │
│  ────────────────────────────────────────────────────────────────   │
│  Create destination batches:                                        │
│    INSERT INTO stock_batches (                                      │
│      warehouse = 'BANGALORE-MG',                                    │
│      prodcode = '361313801009',                                     │
│      qty_initial = 3,                                               │
│      qty_available = 3,                                             │
│      source_type = 'SELF_TRANSFER',                                │
│      parent_batch_id = 101                                          │
│    ) → Batch #201                                                   │
│                                                                      │
│    INSERT INTO stock_batches (                                      │
│      warehouse = 'BANGALORE-MG',                                    │
│      prodcode = '361313801009',                                     │
│      qty_initial = 2,                                               │
│      qty_available = 2,                                             │
│      source_type = 'SELF_TRANSFER',                                │
│      parent_batch_id = 102                                          │
│    ) → Batch #202                                                   │
│                                                                      │
│  Result: 5 units added to destination                               │
│  Status: ✅ Destination stock increased                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: LOG TIMELINE ENTRIES                                       │
│  ────────────────────────────────────────────────────────────────   │
│  Source OUT entry:                                                  │
│    INSERT INTO store_timeline (                                     │
│      store_code = 'GURUGRAM-NH48',                                 │
│      product_barcode = '361313801009',                             │
│      movement_type = 'SELF_TRANSFER',                              │
│      direction = 'OUT',                                             │
│      quantity = 5,                                                  │
│      balance_after = 15,                                            │
│      reference = 'STF-1234567890'                                  │
│    ) → Entry #301                                                   │
│                                                                      │
│  Destination IN entry:                                              │
│    INSERT INTO store_timeline (                                     │
│      store_code = 'BANGALORE-MG',                                  │
│      product_barcode = '361313801009',                             │
│      movement_type = 'SELF_TRANSFER',                              │
│      direction = 'IN',                                              │
│      quantity = 5,                                                  │
│      balance_after = 5,                                             │
│      reference = 'STF-1234567890'                                  │
│    ) → Entry #302                                                   │
│                                                                      │
│  Result: Timeline entries created                                   │
│  Status: ✅ Timeline logged                                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  COMMIT TRANSACTION                                                  │
│  ────────────────────────────────────────────────────────────────   │
│  All operations successful → COMMIT                                 │
│                                                                      │
│  Final State:                                                       │
│  • Billing entry: ✅ Created (ID: 456)                              │
│  • Source stock: ✅ Reduced (20 → 15)                               │
│  • Destination stock: ✅ Increased (0 → 5)                          │
│  • Timeline: ✅ Logged (2 entries)                                  │
│  • Batches: ✅ Linked (parent_batch_id)                             │
│                                                                      │
│  Status: ✅ TRANSACTION COMMITTED                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                                   │
└─────────────────────────────────────────────────────────────────────┘

Scenario 1: INSUFFICIENT STOCK
────────────────────────────────
  Validate Stock
       │
       ↓
  Available: 3 units
  Required: 5 units
       │
       ↓
  ❌ VALIDATION FAILED
       │
       ↓
  Return 400 Error:
  "Insufficient stock at GURUGRAM-NH48 for product 361313801009.
   Available: 3, Requested: 5"
       │
       ↓
  NO TRANSACTION STARTED
  NO DATABASE CHANGES


Scenario 2: BILLING ENTRY CREATION FAILS
─────────────────────────────────────────
  [BEGIN TRANSACTION]
       │
       ↓
  Validate Stock ✅
       │
       ↓
  Create Billing Entry
       │
       ↓
  ❌ DATABASE ERROR
  (e.g., duplicate invoice_number)
       │
       ↓
  [ROLLBACK TRANSACTION]
       │
       ↓
  Return 500 Error:
  "Failed to create billing entry"
       │
       ↓
  ALL CHANGES REVERTED


Scenario 3: STOCK REDUCTION FAILS
──────────────────────────────────
  [BEGIN TRANSACTION]
       │
       ↓
  Validate Stock ✅
       │
       ↓
  Create Billing Entry ✅
       │
       ↓
  Reduce Source Stock
       │
       ↓
  ❌ BATCH EXHAUSTION ERROR
  (e.g., concurrent modification)
       │
       ↓
  [ROLLBACK TRANSACTION]
       │
       ↓
  Return 500 Error:
  "Stock reduction failed"
       │
       ↓
  ALL CHANGES REVERTED
  (including billing entry)


Scenario 4: TIMELINE LOGGING FAILS
───────────────────────────────────
  [BEGIN TRANSACTION]
       │
       ↓
  Validate Stock ✅
       │
       ↓
  Create Billing Entry ✅
       │
       ↓
  Reduce Source Stock ✅
       │
       ↓
  Increase Destination Stock ✅
       │
       ↓
  Log Timeline
       │
       ↓
  ❌ INSERT ERROR
  (e.g., table doesn't exist)
       │
       ↓
  [ROLLBACK TRANSACTION]
       │
       ↓
  Return 500 Error:
  "Timeline logging failed"
       │
       ↓
  ALL CHANGES REVERTED
  (including billing and stock)
```

## Data Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                                 │
└─────────────────────────────────────────────────────────────────────┘

bills (Billing Entries)
├── id (PK)
├── invoice_number (e.g., "STF-1234567890")
├── bill_type = 'INTERNAL_TRANSFER'
├── customer_name (e.g., "Internal Transfer: SOURCE → DEST")
├── items (JSON array)
└── created_at
         │
         │ Referenced by
         ↓
stock_batches (Source Batches)
├── id (PK) = 101
├── warehouse = 'GURUGRAM-NH48'
├── prodcode = '361313801009'
├── qty_available = 0 (exhausted)
├── status = 'exhausted'
└── source_ref_id = 456 (bills.id)
         │
         │ parent_batch_id
         ↓
stock_batches (Destination Batches)
├── id (PK) = 201
├── warehouse = 'BANGALORE-MG'
├── prodcode = '361313801009'
├── qty_available = 3
├── status = 'active'
├── source_type = 'SELF_TRANSFER'
├── parent_batch_id = 101 (links to source)
└── source_ref_id = 456 (bills.id)
         │
         │ Referenced by
         ↓
store_timeline (Timeline Entries)
├── id (PK) = 301
├── store_code = 'GURUGRAM-NH48'
├── product_barcode = '361313801009'
├── movement_type = 'SELF_TRANSFER'
├── direction = 'OUT'
├── quantity = 5
├── balance_after = 15
├── reference = 'STF-1234567890' (bills.invoice_number)
└── created_at

store_timeline (Timeline Entries)
├── id (PK) = 302
├── store_code = 'BANGALORE-MG'
├── product_barcode = '361313801009'
├── movement_type = 'SELF_TRANSFER'
├── direction = 'IN'
├── quantity = 5
├── balance_after = 5
├── reference = 'STF-1234567890' (bills.invoice_number)
└── created_at
```

## Key Design Principles

### 1. Atomicity
All operations happen in a single transaction. Either all succeed or all fail.

### 2. FIFO Enforcement
Stock is always reduced from oldest batches first, ensuring proper inventory rotation.

### 3. Parent-Child Linkage
Destination batches link to source batches via `parent_batch_id`, maintaining full traceability.

### 4. Billing-Triggered Stock Reduction
Stock reduction is triggered by billing entry creation, not by transfer API directly.

### 5. Complete Audit Trail
Every movement is logged to `store_timeline` with timestamp, quantity, and balance after.

### 6. Synchronous Consistency
No eventual consistency - stock levels are immediately accurate after transfer.

### 7. Rollback Safety
If any step fails, entire transaction rolls back with no partial updates.
