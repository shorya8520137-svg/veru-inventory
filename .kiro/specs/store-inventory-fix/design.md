# Design: Store Inventory Fix

## Overview
This design implements a use-case-oriented architecture to fix store inventory tracking, enable store-to-store transfers with proper stock reduction, and provide timeline visibility for stores. The architecture uses Commands for write operations and Projections for optimized read paths.

## Architecture

### Component Breakdown

Based on the architecture selection (Use-Case-Oriented), the system consists of 7 components:

#### 1. ExecuteTransferCommand
**Purpose**: Executes store-to-store transfers as atomic operations

**Responsibilities:**
- Validate source store has sufficient stock
- Create transfer record
- Exhaust source batches (FIFO)
- Create destination batches with parent linkage
- Update both store stock projections
- Append timeline entries for both stores
- Ensure all operations are atomic (single transaction)

**Inputs:**
- sourceStoreCode
- destinationStoreCode
- productBarcode
- transferQuantity
- userId (for audit)

**Outputs:**
- transferId
- newSourceStock
- newDestinationStock
- OR insufficientStockError

**Dependencies:**
- StockBatchStore (read/write batches)
- StoreStockProjection (read current stock, write updates)
- TimelineProjection (append entries)

#### 2. QueryTimelineCommand
**Purpose**: Retrieves and formats timeline data for display

**Responsibilities:**
- Query TimelineProjection with filters
- Format data for UI consumption
- Apply date range and product filters
- Sort by timestamp descending
- Calculate running balances

**Inputs:**
- storeCode
- dateFrom (optional)
- dateTo (optional)
- productFilter (optional)
- limit (default 50)

**Outputs:**
- timelineData array with:
  - timestamp
  - movementType
  - productName
  - quantity
  - direction (IN/OUT)
  - balanceAfter
  - reference

**Dependencies:**
- TimelineProjection (read-only)

#### 3. InitializeStockCommand
**Purpose**: Handles initial stock entry for stores

**Responsibilities:**
- Create initial stock batches
- Set source_type appropriately (OPENING, SELF_TRANSFER, or MANUAL)
- Update store stock projection
- Append timeline entry
- Validate no duplicate initialization

**Inputs:**
- storeCode
- productBarcode
- quantity
- source (OPENING | TRANSFER | MANUAL)
- sourceReference (optional, for transfers)

**Outputs:**
- batchId
- newStockLevel

**Dependencies:**
- StockBatchStore (write batches)
- StoreStockProjection (write updates)
- TimelineProjection (append entry)

#### 4. StockBatchStore
**Purpose**: Persistent storage layer for stock_batches table

**Responsibilities:**
- CRUD operations on stock_batches table
- Batch lifecycle management (create, exhaust, recover)
- FIFO batch selection for transfers
- Parent-child batch linkage
- Transaction management

**Schema Mapping:**
```sql
stock_batches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_name VARCHAR(255),
  prodcode VARCHAR(255),
  variant VARCHAR(255),
  warehouse VARCHAR(100),  -- stores use this field for store_code
  source_type ENUM('OPENING', 'PURCHASE', 'SELF_TRANSFER', 'RETURN', 'RECOVER'),
  source_ref_id BIGINT,
  parent_batch_id BIGINT,
  qty_initial INT UNSIGNED,
  qty_available INT UNSIGNED,
  unit_cost DECIMAL(10,2),
  status ENUM('active', 'exhausted'),
  created_at DATETIME,
  opening_key VARCHAR(255) UNIQUE,
  exhausted_at DATETIME
)
```

**Key Methods:**
- `createBatch(batchData)` → batchId
- `exhaustBatch(batchId, quantity)` → updatedBatch
- `getActiveBatches(storeCode, productBarcode)` → batches[]
- `getFIFOBatch(storeCode, productBarcode, quantity)` → batch
- `getTotalStock(storeCode, productBarcode)` → quantity

#### 5. StoreStockProjection
**Purpose**: Materialized view of current stock levels per store/product

**Responsibilities:**
- Maintain current stock levels
- Provide fast stock lookups
- Validate stock availability
- Update synchronously with batch changes

**Data Structure:**
```javascript
{
  storeCode: string,
  productBarcode: string,
  currentStock: number,
  lastUpdated: timestamp
}
```

**Storage**: In-memory cache backed by aggregation query on stock_batches

**Key Methods:**
- `getStock(storeCode, productBarcode)` → quantity
- `updateStock(storeCode, productBarcode, delta)` → newQuantity
- `rebuild(storeCode)` → void (recompute from batches)

#### 6. TimelineProjection
**Purpose**: Materialized view of movement history

**Responsibilities:**
- Store timeline entries for fast queries
- Maintain append-only log
- Support filtering and pagination
- Calculate running balances

**Data Structure:**
```javascript
{
  id: number,
  storeCode: string,
  productBarcode: string,
  productName: string,
  movementType: string,
  direction: 'IN' | 'OUT',
  quantity: number,
  balanceAfter: number,
  reference: string,
  timestamp: datetime,
  userId: string
}
```

**Storage**: Dedicated `store_timeline` table (new)

**Key Methods:**
- `appendEntry(entry)` → entryId
- `queryTimeline(storeCode, filters)` → entries[]
- `rebuild(storeCode)` → void (recompute from batches)

#### 7. StoreTimelineComponent
**Purpose**: React component for timeline UI

**Responsibilities:**
- Render timeline entries
- Provide date range filters
- Provide product search filter
- Handle pagination
- Display movement type badges
- Show running balance

**Props:**
- storeCode (required)
- initialFilters (optional)

**State:**
- timelineData
- loading
- filters (dateFrom, dateTo, productFilter)
- page

### Information Flow

```
User Action (Transfer) →
  API Endpoint (/api/self-transfer) →
    ExecuteTransferCommand →
      StockBatchStore (read FIFO batches) →
      StoreStockProjection (validate stock) →
      [BEGIN TRANSACTION]
        StockBatchStore (exhaust source batches) →
        StockBatchStore (create destination batches) →
        StoreStockProjection (update source stock) →
        StoreStockProjection (update destination stock) →
        TimelineProjection (append source entry) →
        TimelineProjection (append destination entry) →
      [COMMIT TRANSACTION] →
    Response (transferId, newStocks)

User Action (View Timeline) →
  API Endpoint (/api/store-timeline/:storeCode) →
    QueryTimelineCommand →
      TimelineProjection (query with filters) →
    Response (timelineData)
```

### Data Flow Diagrams

#### Transfer Flow
```
┌─────────────────────────────────────────────────────────────┐
│ ExecuteTransferCommand                                       │
│                                                              │
│  1. Validate inputs                                         │
│  2. Check source stock (StoreStockProjection)               │
│  3. Get FIFO batches (StockBatchStore)                      │
│  4. BEGIN TRANSACTION                                        │
│     a. Exhaust source batches                               │
│     b. Create destination batches (with parent_batch_id)    │
│     c. Update source projection (-qty)                      │
│     d. Update destination projection (+qty)                 │
│     e. Append source timeline entry (OUT)                   │
│     f. Append destination timeline entry (IN)               │
│  5. COMMIT TRANSACTION                                       │
│  6. Return success                                          │
└─────────────────────────────────────────────────────────────┘
```

#### Timeline Query Flow
```
┌─────────────────────────────────────────────────────────────┐
│ QueryTimelineCommand                                         │
│                                                              │
│  1. Parse filters (dateFrom, dateTo, product)               │
│  2. Query TimelineProjection                                │
│  3. Apply filters                                           │
│  4. Sort by timestamp DESC                                  │
│  5. Paginate (limit/offset)                                 │
│  6. Format for UI                                           │
│  7. Return timelineData                                     │
└─────────────────────────────────────────────────────────────┘
```

## API Design

### POST /api/self-transfer
**Purpose**: Execute store-to-store transfer

**Request:**
```json
{
  "sourceType": "store",
  "sourceId": "GURUGRAM-NH48",
  "destinationType": "store",
  "destinationId": "BANGALORE-MG",
  "items": [
    {
      "productId": "361313801009",
      "transferQty": 5,
      "unit": "units"
    }
  ],
  "requiresShipment": false,
  "notes": "Restocking Bangalore store",
  "transferDate": "2024-01-15T10:30:00Z"
}
```

**Response (Success):**
```json
{
  "success": true,
  "transferId": "STF-2024-1234",
  "sourceStock": {
    "GURUGRAM-NH48": {
      "361313801009": 15
    }
  },
  "destinationStock": {
    "BANGALORE-MG": {
      "361313801009": 5
    }
  },
  "message": "Transfer created successfully"
}
```

**Response (Insufficient Stock):**
```json
{
  "success": false,
  "error": "Insufficient stock at GURUGRAM-NH48 for product 361313801009. Available: 3, Requested: 5"
}
```

### GET /api/store-timeline/:storeCode
**Purpose**: Query store timeline

**Query Parameters:**
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string
- `product` (optional): product barcode
- `limit` (optional): number, default 50
- `offset` (optional): number, default 0

**Response:**
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "id": 1234,
        "timestamp": "2024-01-15T10:30:00Z",
        "movementType": "SELF_TRANSFER",
        "direction": "OUT",
        "productName": "Beach Resort Wear",
        "productBarcode": "361313801009",
        "quantity": 5,
        "balanceAfter": 15,
        "reference": "STF-2024-1234",
        "userId": "user@example.com"
      },
      {
        "id": 1233,
        "timestamp": "2024-01-14T15:20:00Z",
        "movementType": "SELF_TRANSFER",
        "direction": "IN",
        "productName": "Beach Resort Wear",
        "productBarcode": "361313801009",
        "quantity": 10,
        "balanceAfter": 20,
        "reference": "STF-2024-1200",
        "userId": "admin@example.com"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 50
  }
}
```

## Database Schema

### New Table: store_timeline

```sql
CREATE TABLE store_timeline (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_code VARCHAR(100) NOT NULL,
  product_barcode VARCHAR(255) NOT NULL,
  product_name VARCHAR(255),
  movement_type ENUM('OPENING', 'SELF_TRANSFER', 'DISPATCH', 'RETURN', 'DAMAGE', 'RECOVER', 'MANUAL') NOT NULL,
  direction ENUM('IN', 'OUT') NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  balance_after INT UNSIGNED NOT NULL,
  reference VARCHAR(255),
  user_id VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_store_product (store_code, product_barcode),
  INDEX idx_created_at (created_at),
  INDEX idx_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Modified Usage: stock_batches

**Key Points:**
- `warehouse` field stores store_code for store batches
- `source_type='SELF_TRANSFER'` for store-to-store transfers
- `parent_batch_id` links destination batch to source batch
- `opening_key` not used for stores (stores don't have opening stock)

## UI Design

### StoreTimelineComponent.jsx

**Location**: `veru-inventory-main/src/app/inventory/store/StoreTimelineComponent.jsx`

**Features:**
1. **Timeline List**: Vertical timeline with movement entries
2. **Filters**: Date range picker, product search
3. **Movement Badges**: Color-coded by type (IN=green, OUT=red)
4. **Running Balance**: Shows stock level after each movement
5. **Details Popup**: Click entry to see full details
6. **Pagination**: Load more button or infinite scroll

**Component Structure:**
```jsx
<div className="store-timeline">
  <div className="timeline-header">
    <h2>Store Timeline: {storeName}</h2>
    <div className="timeline-filters">
      <DateRangePicker onChange={handleDateChange} />
      <ProductSearch onChange={handleProductFilter} />
    </div>
  </div>
  
  <div className="timeline-content">
    {timelineData.map(entry => (
      <TimelineEntry
        key={entry.id}
        entry={entry}
        onClick={() => showDetails(entry)}
      />
    ))}
  </div>
  
  <div className="timeline-footer">
    <button onClick={loadMore}>Load More</button>
  </div>
</div>
```

## Implementation Plan

### Phase 1: Database & Store Layer
1. Create `store_timeline` table
2. Implement `StockBatchStore.js`
   - CRUD methods
   - FIFO batch selection
   - Transaction support
3. Write unit tests for StockBatchStore

### Phase 2: Projections
1. Implement `StoreStockProjection.js`
   - In-memory cache
   - Rebuild from batches
2. Implement `TimelineProjection.js`
   - Append-only log
   - Query with filters
3. Write unit tests for projections

### Phase 3: Commands
1. Implement `ExecuteTransferCommand.js`
   - Validation logic
   - FIFO batch exhaustion
   - Atomic transaction
2. Implement `QueryTimelineCommand.js`
   - Filter logic
   - Pagination
3. Implement `InitializeStockCommand.js`
   - Initial stock entry
4. Write unit tests for commands

### Phase 4: API Integration
1. Update `/api/self-transfer` endpoint to use ExecuteTransferCommand
2. Create `/api/store-timeline/:storeCode` endpoint
3. Write integration tests

### Phase 5: UI Component
1. Create `StoreTimelineComponent.jsx`
2. Add timeline route to store inventory page
3. Style timeline UI
4. Write E2E tests

### Phase 6: Testing & Deployment
1. Run full test suite
2. Test on staging with real data
3. Deploy to production
4. Monitor for issues

## Testing Strategy

### Unit Tests
- **StockBatchStore**: Test CRUD, FIFO selection, transactions
- **Projections**: Test updates, queries, rebuilds
- **Commands**: Test validation, success paths, error paths

### Integration Tests
- **Transfer Flow**: Test full transfer with database
- **Timeline Query**: Test filtering, pagination
- **Stock Consistency**: Verify batch totals match projections

### E2E Tests
- **Store Transfer**: UI → API → Database → UI
- **Timeline View**: Load timeline, apply filters, verify data
- **Error Handling**: Insufficient stock, invalid inputs

## Error Handling

### Transfer Errors
1. **Insufficient Stock**: Return 400 with clear message
2. **Invalid Store**: Return 404 with store not found
3. **Invalid Product**: Return 404 with product not found
4. **Transaction Failure**: Rollback all changes, return 500
5. **Duplicate Transfer**: Check for duplicate reference, return 409

### Timeline Errors
1. **Invalid Store**: Return 404
2. **Invalid Date Range**: Return 400
3. **Database Error**: Return 500 with generic message

## Performance Considerations

### Projections
- **StoreStockProjection**: In-memory cache, O(1) lookups
- **TimelineProjection**: Indexed queries, O(log n) with pagination

### Batch Selection
- **FIFO**: Index on (warehouse, prodcode, created_at) for fast selection
- **Exhaustion**: Update single batch, O(1)

### Timeline Queries
- **Indexes**: (store_code, product_barcode), (created_at), (reference)
- **Pagination**: Limit queries to 50 entries per page

## Security Considerations

### Authorization
- Verify user has access to source and destination stores
- Check INVENTORY_TRANSFER permission
- Log all transfers with user ID

### Validation
- Sanitize all inputs
- Validate store codes against stores table
- Validate product barcodes against products table
- Prevent negative quantities

### Audit Trail
- Timeline entries provide full audit trail
- Transfer records link to user ID
- Batch records preserve lineage via parent_batch_id

## Rollback Plan

### If Issues Arise
1. **Disable Store Transfers**: Feature flag to disable new transfers
2. **Revert API Changes**: Rollback to previous version
3. **Data Cleanup**: Script to identify and fix inconsistent batches
4. **Projection Rebuild**: Rebuild projections from batches

### Data Migration
- No schema changes to existing tables
- New `store_timeline` table can be dropped if needed
- Batch records remain valid (backward compatible)

## Success Criteria

1. ✅ Store-to-store transfers reduce source stock 100% of the time
2. ✅ Timeline shows all movements with <1 second delay
3. ✅ Stock batch counts match inventory counts with 100% accuracy
4. ✅ Zero orphaned batch records after transfers
5. ✅ Timeline queries return in <200ms for 50 entries
6. ✅ Transfer operations complete in <500ms
7. ✅ UI renders timeline in <100ms after data load

## Future Enhancements

1. **Bulk Transfers**: Transfer multiple products in one operation
2. **Scheduled Transfers**: Schedule transfers for future execution
3. **Transfer Approval**: Require approval for large transfers
4. **Stock Alerts**: Notify when store stock falls below threshold
5. **Analytics**: Dashboard showing transfer patterns and trends
