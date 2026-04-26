# Architecture Selection: Store Inventory Fix (Billing-Centric)

## Recommended Architecture: Synchronous Integration (Billing-Triggers-Stock)

### Rationale
The synchronous integration architecture minimizes cross-cutting concerns (27% vs 30-33% in alternatives) and provides the best evolvability (1.3 components/requirement). BillingIntegrationService acts as a single orchestrator that creates billing entries and immediately triggers stock reduction in the same transaction, ensuring strong consistency and atomicity. The synchronous approach eliminates eventual consistency complexity and provides immediate feedback to users. The main trade-off is tight coupling between billing and stock reduction, but this is desirable behavior for this use case.

### Components
| Component | Owned State | Responsibility |
|-----------|-------------|----------------|
| TransferController | HTTP request/response | Handles transfer API endpoint |
| BillingIntegrationService | transaction state | Creates billing entry and triggers stock reduction synchronously |
| StockReductionService | validation state | Validates and reduces stock using FIFO batches |
| StockBatchRepository | stockBatches | CRUD operations on stock_batches table |
| TimelineService | timelineEntries | Logs movements to timeline |
| StoreTimelineComponent | UI state | React component for timeline display |

### Information Flow
| From \ To | TransferController | BillingIntegrationService | StockReductionService | StockBatchRepository | TimelineService | StoreTimelineComponent |
|-----------|-------------------|--------------------------|----------------------|---------------------|----------------|----------------------|
| **TransferController** | - | → | | | | |
| **BillingIntegrationService** | ← | - | → | → | → | |
| **StockReductionService** | | ← | - | → | | |
| **StockBatchRepository** | | | ← | - | | |
| **TimelineService** | | ← | | | - | |
| **StoreTimelineComponent** | | | | | ← | - |

### Requirement Allocation
| Requirement | Component(s) |
|-------------|--------------|
| REQ-1.1 | BillingIntegrationService |
| REQ-1.2 | BillingIntegrationService |
| REQ-1.3 | BillingIntegrationService, StockReductionService |
| REQ-1.4 | BillingIntegrationService |
| REQ-1.5 | BillingIntegrationService |
| REQ-2.1 | BillingIntegrationService, StockReductionService |
| REQ-2.2 | BillingIntegrationService, StockReductionService |
| REQ-2.3 | StockReductionService, StockBatchRepository |
| REQ-2.4 | StockReductionService, StockBatchRepository |
| REQ-2.5 | BillingIntegrationService |
| REQ-3.1 | StockReductionService, StockBatchRepository |
| REQ-3.2 | StockReductionService, StockBatchRepository |
| REQ-3.3 | StockReductionService, StockBatchRepository |
| REQ-3.4 | BillingIntegrationService |
| REQ-4.1 | BillingIntegrationService |
| REQ-4.2 | BillingIntegrationService |
| REQ-4.3 | BillingIntegrationService |
| REQ-4.4 | BillingIntegrationService |
| REQ-4.5 | BillingIntegrationService |
| REQ-5.1 | TimelineService, StoreTimelineComponent |
| REQ-5.2 | TimelineService |
| REQ-5.3 | TimelineService |
| REQ-5.4 | TimelineService |
| REQ-5.5 | StoreTimelineComponent |
| REQ-6.1 | StockBatchRepository |
| REQ-6.2 | StockBatchRepository |
| REQ-6.3 | StockBatchRepository |
| REQ-6.4 | StockReductionService |
| REQ-7.1 | StockReductionService, StockBatchRepository |
| REQ-7.2 | TimelineService, BillingIntegrationService |
| REQ-7.3 | BillingIntegrationService, StockBatchRepository |
| REQ-7.4 | BillingIntegrationService, StockBatchRepository, TimelineService |

### Key Design-Induced Invariants
1. **Billing-Stock Atomicity**: Billing entry creation and stock reduction must succeed or fail together (single transaction)
2. **Synchronous Consistency**: Stock levels are immediately consistent after billing entry creation (no eventual consistency)
3. **Single Orchestrator**: BillingIntegrationService is the only component that can create billing entries and trigger stock reduction
4. **FIFO Enforcement**: StockReductionService must always use FIFO batch selection for stock reduction
5. **Timeline Completeness**: Every billing entry must have a corresponding timeline entry
6. **Rollback Safety**: If any step fails, the entire transaction must rollback (no partial updates)

### Alternatives Considered
| Candidate | Strength | Weakness | Why Not Selected |
|-----------|----------|----------|-----------------|
| Event-Driven | Highly scalable, low god object score (33%), resilient to failures | Eventual consistency, more complex, requires reconciliation logic | Eventual consistency is undesirable for billing-stock coupling; adds unnecessary complexity |
| Hybrid (Callback) | Flexible, extensible, modular | Highest cross-cutting concerns (33%), highest god object score (40%), worst evolvability (1.6) | Callback pattern adds complexity without significant benefits; StockBatchManager becomes god object |

### Metrics Summary
| Metric | Selected (Sync Integration) | Alt A (Event-Driven) | Alt B (Hybrid) |
|--------|----------|-------|-------|
| Cross-cutting reqs % | **27%** | 30% | 33% |
| Cross-cutting invariants % | **33%** | 44% | 44% |
| Flow density | **0.13** | 0.20 | 0.17 |
| God object score | 37% | **33%** | 40% |
| Sync cycles | **0** | **0** | **0** |
| Max fan-in | **3** | **3** | **3** |
| Max fan-out | **3** | **3** | **3** |
| Evolvability cost | **1.3** | 1.5 | 1.6 |

### Implementation Notes

**File Structure:**
```
veru-inventory-main/
├── services/
│   ├── BillingIntegrationService.js
│   ├── StockReductionService.js
│   └── TimelineService.js
├── repositories/
│   └── StockBatchRepository.js
├── routes/
│   └── selfTransferRoutes.js (update existing)
└── src/app/inventory/store/
    └── StoreTimelineComponent.jsx
```

**Key Integration Points:**
1. **Existing API**: Update `/api/self-transfer` endpoint to use BillingIntegrationService
2. **Existing Billing**: BillingIntegrationService creates entries in existing `bills` table
3. **Database**: StockBatchRepository uses existing `stock_batches` table
4. **Timeline**: TimelineService uses new `store_timeline` table
5. **UI**: StoreTimelineComponent is a separate file from warehouse timeline

**Transaction Flow:**
```
POST /api/self-transfer
  ↓
TransferController
  ↓
BillingIntegrationService.createTransferWithBilling()
  ↓
[BEGIN TRANSACTION]
  1. Create billing entry (bills table)
  2. StockReductionService.reduceStock()
     a. Validate source stock
     b. Get FIFO batches
     c. Exhaust source batches
     d. Create destination batches
  3. TimelineService.logMovement()
     a. Log source OUT entry
     b. Log destination IN entry
[COMMIT TRANSACTION]
  ↓
Return success with billing reference
```

**Error Handling:**
- Insufficient stock → Rollback transaction, return 400
- Billing creation fails → Rollback transaction, return 500
- Stock reduction fails → Rollback transaction, return 500
- Timeline logging fails → Rollback transaction, return 500

**Testing Strategy:**
- Unit test BillingIntegrationService with mocked dependencies
- Unit test StockReductionService with mocked StockBatchRepository
- Integration test full transaction flow with real database
- E2E test UI → API → Database → UI flow
- Test rollback scenarios (insufficient stock, database errors)

**Backward Compatibility:**
- Existing `createStoreBillingDocumentation` function will be replaced by BillingIntegrationService
- Existing billing entries remain valid
- Existing stock_batches remain valid
- No schema changes to existing tables
