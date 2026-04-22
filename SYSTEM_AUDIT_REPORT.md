# System Audit Report — Veru Inventory Platform
# Date: April 22, 2026
# Target: Enterprise / Startup Grade (Zoho / Oracle Level)

---

## EXECUTIVE SUMMARY

Current system is a functional MVP but has critical architectural gaps that will cause
data integrity failures, scaling bottlenecks, and security vulnerabilities at production scale.
This report identifies all issues and provides a phased execution plan.

---

## PART 1 — CRITICAL PROBLEMS (Will break in production)

---

### P1. TWO SEPARATE ORDER SYSTEMS — DATA SPLIT

**Problem:**
- `warehouse_dispatch` table = internal warehouse dispatch
- `orders` table (newly created) = Shiprocket delivery orders
- These two are completely disconnected. No foreign key. No shared ID.
- A dispatch can happen without a Shiprocket order and vice versa.

**Future Impact:**
- Inventory deducted from warehouse but no courier assigned → stock lost silently
- Customer order created in Shiprocket but no warehouse dispatch → order never shipped
- Finance team cannot reconcile orders vs dispatches
- Returns cannot be traced back to original dispatch

**Fix Required:**
- Add `dispatch_id` FK in `orders` table
- Add `shiprocket_order_id` column in `warehouse_dispatch`
- Create unified order lifecycle: Create Order → Dispatch → Ship → Deliver

---

### P2. INVENTORY TABLE NOT UPDATED ON DISPATCH

**Problem:**
Dispatch controller updates `stock_batches` (FIFO) and `inventory_ledger_base` (audit)
but does NOT update the main `inventory` table (`stock` column).

**Future Impact:**
- `inventory.stock` shows wrong numbers
- Product Manager page shows incorrect available stock
- Overselling possible — customer orders product that is already dispatched
- Daily snapshot (`inventory_daily_snapshot`) will have wrong closing_stock

**Fix Required:**
```sql
UPDATE inventory SET stock = stock - qty
WHERE code = barcode AND warehouse = warehouse_code
```
Must be added inside the dispatch transaction.

---

### P3. NO STOCK RESERVATION SYSTEM

**Problem:**
Between "order placed" and "dispatch confirmed" there is no stock reservation.
Two agents can dispatch the same last unit simultaneously.

**Future Impact:**
- Race condition at scale → negative stock possible
- Customer A and Customer B both get confirmation for same item
- Returns and refunds spike

**Fix Required:**
- Add `reserved_qty` column to `stock_batches`
- On order create: reserve stock
- On dispatch confirm: convert reservation to deduction
- On order cancel: release reservation

---

### P4. AWB NUMBER — NO UNIQUENESS VALIDATION

**Problem:**
`warehouse_dispatch.awb` has no UNIQUE constraint in DB.
Same AWB can be entered twice by mistake.

**Future Impact:**
- Duplicate shipments in Shiprocket
- Courier billing doubles
- Tracking page shows wrong data

**Fix Required:**
```sql
ALTER TABLE warehouse_dispatch ADD UNIQUE KEY uniq_awb (awb);
```

---

### P5. NO CUSTOMER DATA IN DISPATCH TABLE

**Problem:**
`warehouse_dispatch` has only `customer` (name text field).
No phone, no address, no pincode, no email.

**Future Impact:**
- Cannot auto-create Shiprocket order from dispatch (missing required fields)
- Cannot send delivery notifications to customer
- Cannot handle NDR (Non-Delivery Report) callbacks
- Cannot process returns without customer contact

**Fix Required:**
```sql
ALTER TABLE warehouse_dispatch
ADD COLUMN customer_phone VARCHAR(20),
ADD COLUMN customer_address TEXT,
ADD COLUMN customer_city VARCHAR(100),
ADD COLUMN customer_state VARCHAR(100),
ADD COLUMN customer_pincode VARCHAR(10),
ADD COLUMN customer_email VARCHAR(255),
ADD COLUMN shiprocket_order_id VARCHAR(100),
ADD COLUMN shiprocket_shipment_id VARCHAR(100),
ADD COLUMN awb_code VARCHAR(100),
ADD COLUMN tracking_url TEXT;
```

---

### P6. SHIPROCKET TOKEN HARDCODED RISK

**Problem:**
Shiprocket token stored in `.env` as `DELIVERY_API_TOKEN` or `SHIPROCKET_API_TOKEN`.
Token expires every 24 hours (Shiprocket JWT).
No auto-refresh mechanism exists.

**Future Impact:**
- All order creation fails silently after token expiry
- No alert/notification when token expires
- Manual intervention required every day

**Fix Required:**
- Add Shiprocket token refresh endpoint: `POST /api/shiprocket/refresh-token`
- Store token in DB with expiry timestamp
- Auto-refresh before each API call if token age > 23 hours

---

### P7. NO TRANSACTION ROLLBACK FOR MULTI-PRODUCT DISPATCH

**Problem:**
In `handleFormDispatch()`, products are processed in a forEach loop.
If product 3 of 5 fails stock check, products 1 and 2 may already be partially processed.

**Future Impact:**
- Partial dispatch recorded in DB
- Stock deducted for some products but not others
- Inconsistent state — very hard to debug

**Fix Required:**
- Process all stock checks BEFORE starting any DB writes
- Use Promise.all for parallel validation
- Only begin transaction after all validations pass

---

### P8. `inventory_daily_snapshot` — NO AUTOMATED TRIGGER

**Problem:**
`inventory_daily_snapshot` table exists but no cron job or trigger populates it automatically.
Data is stale or empty.

**Future Impact:**
- Cannot generate daily/weekly inventory reports
- Cannot detect shrinkage (theft/damage)
- Audit trail incomplete for compliance

**Fix Required:**
- Add cron job: runs at 11:59 PM daily
- Calculates closing_stock = opening + IN movements - OUT movements
- Inserts/updates `inventory_daily_snapshot`

---

### P9. NO RATE LIMITING ON PUBLIC APIs

**Problem:**
Customer support endpoints (`/api/customer-support/conversations`) have no rate limiting.
Anyone can spam the system.

**Future Impact:**
- DDoS vulnerability
- DB overload from bot traffic
- Fake conversations flood support queue

**Fix Required:**
- Add `express-rate-limit` middleware
- 10 requests/minute per IP on public endpoints
- 100 requests/minute per authenticated user

---

### P10. ORDERS PAGE — ACTION BUTTONS NON-FUNCTIONAL

**Problem:**
View, Edit, Track buttons in `/delivery/orders` page are UI stubs with no implementation.

**Future Impact:**
- Support team cannot view order details
- Cannot edit wrong address before dispatch
- Cannot track shipment status

**Fix Required:**
- View: Open order detail modal with all fields
- Edit: Allow editing customer details before dispatch
- Track: Call Shiprocket tracking API and show status timeline

---

## PART 2 — MEDIUM PROBLEMS (Will cause issues at scale)

| # | Problem | Impact | Fix |
|---|---------|--------|-----|
| M1 | No pagination in Orders page (fetches 100 records) | Slow at 10,000+ orders | Add server-side pagination |
| M2 | No search index on customer_phone in dispatch | Slow customer lookup | Add INDEX on customer phone |
| M3 | `inventory_snapshots` table is empty | No historical data | Add EOD snapshot cron |
| M4 | No soft delete on dispatches | Accidental deletes permanent | Add `deleted_at` column |
| M5 | No order status webhook from Shiprocket | Status never updates | Add webhook endpoint |
| M6 | Chat widget has no auth | Anyone can open support chat | Add CAPTCHA or session token |
| M7 | DB password in plain text in scripts | Security risk | Move to env vars only |
| M8 | No backup automation | Single point of failure | Add daily mysqldump cron |
| M9 | `cost_ledger` table exists but unused | Dead code | Either use or remove |
| M10 | No multi-warehouse transfer tracking in orders | Cannot track inter-warehouse moves | Add transfer_id FK |

---

## PART 3 — EXECUTION PLAN (Phased)

---

### PHASE 1 — Data Integrity (Week 1-2) — CRITICAL

**Goal:** Fix all data corruption risks before going live.

1. ALTER `warehouse_dispatch` — add customer fields + Shiprocket fields
2. Fix dispatch controller — update `inventory` table on dispatch
3. Add UNIQUE constraint on AWB
4. Add stock reservation system (`reserved_qty` in stock_batches)
5. Fix multi-product dispatch — validate all before writing

**Files to change:**
- `controllers/dispatchController.js`
- `routes/dispatchRoutes.js`
- SQL: ALTER TABLE scripts

---

### PHASE 2 — Order Lifecycle (Week 3-4)

**Goal:** Connect Create Order → Dispatch → Shiprocket as one flow.

1. Remove `orderCreatingController.js` and `orderRoutes.js` (new files)
2. Add Shiprocket call inside `dispatchController.createDispatch()`
3. Add `shiprocket_order_id` to `warehouse_dispatch`
4. Connect `/delivery/order` page to `/api/dispatch/create`
5. Connect `/delivery/orders` page to `/api/dispatch` (existing endpoint)

**Files to change:**
- `controllers/dispatchController.js` — add Shiprocket integration
- `src/app/delivery/order/page.jsx` — point to dispatch API
- `src/app/delivery/orders/page.jsx` — point to dispatch API
- Delete: `controllers/orderCreatingController.js`
- Delete: `routes/orderRoutes.js`
- Delete: `create-orders-table.sql`

---

### PHASE 3 — Automation & Reliability (Week 5-6)

**Goal:** System runs without manual intervention.

1. Shiprocket token auto-refresh (cron every 23 hours)
2. Daily inventory snapshot cron (11:59 PM)
3. Shiprocket webhook endpoint for status updates
4. Rate limiting on all public APIs
5. DB backup automation (daily mysqldump to S3 or local)

---

### PHASE 4 — Enterprise Features (Month 2)

**Goal:** Zoho/Oracle level reporting and compliance.

1. Order detail modal with full timeline
2. Edit order before dispatch
3. Track shipment with Shiprocket status API
4. Inventory reconciliation report (snapshot vs actual)
5. Daily/weekly/monthly P&L report
6. Multi-warehouse stock transfer with full audit
7. Role-based access control audit
8. API documentation (Swagger)
9. Automated testing suite

---

## PART 4 — CURRENT SYSTEM HEALTH SCORE

| Area | Score | Status |
|------|-------|--------|
| Data Integrity | 4/10 | Critical gaps |
| Security | 5/10 | Basic auth only |
| Scalability | 5/10 | No pagination, no caching |
| Order Flow | 3/10 | Two disconnected systems |
| Inventory Accuracy | 6/10 | FIFO works, live table not updated |
| Reporting | 3/10 | Snapshots empty, no dashboards |
| Reliability | 5/10 | No token refresh, no cron |
| API Design | 7/10 | Good structure, needs rate limiting |

**Overall: 4.75/10 — MVP grade. Not production ready for scale.**

---

## CONCLUSION

The system has a solid foundation — FIFO stock management, ledger audit trail,
multi-warehouse support, and Shiprocket integration are all good architectural decisions.

The critical gap is the disconnected order systems and the inventory table not being
updated on dispatch. These two issues alone will cause data corruption at scale.

Phase 1 and Phase 2 must be completed before onboarding real customers.
Phase 3 and 4 will bring the system to Zoho/Oracle competitive level.

---
*Report generated: April 22, 2026*
*Analyst: Kiro AI*
