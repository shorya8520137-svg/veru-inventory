# Requirements: Store Inventory Fix with Billing Integration

## Feature Description
Fix store inventory system to properly integrate with the billing system. Store stock reduction is triggered by billing (not manual dispatch), and store-to-store transfers should create billing entries just like customer sales. Currently, store-to-store transfers are not creating billing entries, which is why stock is not reducing and transfers don't appear in billing history.

## Problem Statement
1. Store-to-store self-transfers are not creating billing entries (they should be treated as internal billing)
2. Without billing entries, stock is not reduced at the source store
3. Store-to-store transfers don't appear in billing history
4. Stores lack a timeline view to track all inventory movements (billing, returns, damages, recoveries)
5. Stores don't have opening stock initialization (unlike warehouses)
6. The billing-inventory integration is broken for store transfers

## Acceptance Criteria

### REQ-1: Store-to-Store Transfer Creates Billing Entry
**REQ-1.1**: When a store-to-store transfer is initiated, a billing entry MUST be created with type='INTERNAL_TRANSFER'
**REQ-1.2**: The billing entry MUST include: source store, destination store, products, quantities, transfer date, and user
**REQ-1.3**: The billing entry MUST trigger stock reduction at the source store (via existing billing-inventory integration)
**REQ-1.4**: The billing entry MUST appear in the source store's billing history
**REQ-1.5**: If billing entry creation fails, the entire transfer MUST be rolled back

### REQ-2: Billing-Triggered Stock Reduction
**REQ-2.1**: Stock reduction MUST be triggered by billing entry creation (not by transfer API directly)
**REQ-2.2**: The existing billing-inventory integration MUST handle stock reduction for INTERNAL_TRANSFER billing type
**REQ-2.3**: Stock reduction MUST use FIFO batch exhaustion from stock_batches table
**REQ-2.4**: If source store has insufficient stock, billing entry creation MUST fail with clear error
**REQ-2.5**: Stock reduction MUST happen atomically with billing entry creation

### REQ-3: Destination Store Stock Increase
**REQ-3.1**: When billing entry is created, destination store's stock MUST be increased by the transfer quantity
**REQ-3.2**: Destination stock increase MUST create new batches with source_type='SELF_TRANSFER'
**REQ-3.3**: Destination batches MUST link to source batches via parent_batch_id
**REQ-3.4**: Destination stock increase MUST happen atomically with source stock reduction

### REQ-4: Billing History Integration
**REQ-4.1**: Store-to-store transfers MUST appear in source store's billing history
**REQ-4.2**: Billing history MUST show: transfer date, destination store, products, quantities, and status
**REQ-4.3**: Billing history MUST be filterable by date range and product
**REQ-4.4**: Billing history MUST distinguish between customer sales and internal transfers
**REQ-4.5**: Each billing entry MUST have a unique reference number (e.g., STF-2024-1234)

### REQ-5: Store Timeline View
**REQ-5.1**: Each store MUST have a dedicated timeline view showing all inventory movements
**REQ-5.2**: Timeline MUST display: billing (sales + transfers), returns, damages, and recoveries
**REQ-5.3**: Timeline entries MUST show: timestamp, movement type, product details, quantity, and balance after
**REQ-5.4**: Timeline MUST be filterable by date range and product
**REQ-5.5**: Timeline MUST be accessible from the store inventory page

### REQ-6: Store Stock Initialization
**REQ-6.1**: Stores MUST support initial stock entry without requiring "opening stock" batches
**REQ-6.2**: Initial stock can be added via: bulk upload, manual entry, or warehouse-to-store transfer
**REQ-6.3**: System MUST track the source of initial stock (transfer vs manual entry)
**REQ-6.4**: Stock levels MUST be accurate from the first entry

### REQ-7: Data Consistency
**REQ-7.1**: Store inventory counts MUST match sum of active stock batches
**REQ-7.2**: Timeline entries MUST match billing records + returns + damages + recoveries
**REQ-7.3**: Billing records MUST be linked to corresponding batch records
**REQ-7.4**: System MUST prevent orphaned batches or billing entries

## User Stories

**US-1**: As a store manager, I want store-to-store transfers to create billing entries, so they appear in my billing history just like customer sales.

**US-2**: As a store manager, I want my stock to reduce automatically when a billing entry is created (whether for customer sale or internal transfer), so I don't have to manually update inventory.

**US-3**: As a store manager, I want to view a timeline of all inventory movements (billing, returns, damages, recoveries), so I can track what happened to my stock.

**US-4**: As a store manager, I want to add initial stock to my store without needing "opening stock" entries, so I can start tracking inventory easily.

**US-5**: As an accountant, I want to see all store-to-store transfers in the billing history, so I can track internal inventory movements for accounting purposes.

## Technical Constraints
- Must use existing billing system and billing-inventory integration
- Must use existing stock_batches table structure
- Must maintain backward compatibility with warehouse inventory
- Must use existing self-transfer API endpoints (but integrate with billing)
- Timeline must be a separate component/file from warehouse timeline
- No database schema changes to existing tables (can add new tables)
- Billing entry creation must trigger stock reduction (not transfer API directly)

## Success Metrics
- Store-to-store transfers create billing entries 100% of the time
- Billing entries trigger stock reduction 100% of the time
- Store-to-store transfers appear in billing history 100% of the time
- Timeline shows all movements with <1 second delay
- Stock batch counts match inventory counts with 100% accuracy
- Zero orphaned batch or billing records after transfers

## Out of Scope
- Warehouse inventory changes
- New database tables or schema modifications
- Changes to dispatch or return workflows
- Multi-store transfer (remains single source to single destination)
