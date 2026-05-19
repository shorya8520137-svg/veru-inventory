# InventoryGPT Database Analysis - Complete Schema Reference

**Document Version:** 1.0  
**Last Updated:** Phase 10 Complete  
**Database:** `inventory_db` (MySQL 8.0+)  
**Tables:** 50+ across Phases 5-10  
**Engine:** InnoDB (ACID compliance, referential integrity)

---

## Table of Contents

1. [Database Architecture Overview](#database-architecture-overview)
2. [Phase Breakdown & Evolution](#phase-breakdown--evolution)
3. [Complete Table Reference](#complete-table-reference)
4. [Entity Relationship Diagrams](#entity-relationship-diagrams)
5. [Data Flow & Query Patterns](#data-flow--query-patterns)
6. [Storage & Performance Estimates](#storage--performance-estimates)
7. [Key Relationships & Dependencies](#key-relationships--dependencies)
8. [Critical Queries & Examples](#critical-queries--examples)

---

## Database Architecture Overview

The InventoryGPT system uses a **distributed event-driven architecture** with the following characteristics:

### Core Design Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                      INVENTORYGPT ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API LAYER (Express.js)                                  │   │
│  │  • Transfer Tasks API                                    │   │
│  │  • Event Publishing API                                  │   │
│  │  • Dashboard Monitoring API                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  EVENT BUS (Redis Streams)                               │   │
│  │  • Publish events asynchronously                          │   │
│  │  • Distribute work to consumers                           │   │
│  │  • Persistent stream storage                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  OPERATIONAL LAYER (Event Processing)                    │   │
│  │  • Event Orchestrator (consumer groups)                  │   │
│  │  • Event Processor (handler dispatch)                    │   │
│  │  • Saga Orchestrator (distributed transactions)          │   │
│  │  • Distributed Locks (concurrency control)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  DATA PERSISTENCE LAYER (MySQL)                          │   │
│  │  • Operational Event Store                               │   │
│  │  • Inventory State Tracking                              │   │
│  │  • AI Analytics & Metrics                                │   │
│  │  • Workflow Saga Management                              │   │
│  │  • Resilience & Recovery                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Characteristics

| Aspect | Details |
|--------|---------|
| **Event Pattern** | Redis Streams → MySQL Event Store → Consumer Processing |
| **Concurrency Control** | Distributed Redis locks (token-based) |
| **Failure Recovery** | Exponential backoff retry with dead-letter queue |
| **Transaction Model** | Saga pattern for distributed transactions |
| **Idempotency** | Correlation IDs + Idempotency Keys prevent duplicates |
| **Observability** | Complete event audit trail + metrics collection |

---

## Phase Breakdown & Evolution

### Phase 5: Core Inventory & AI Recommendations (Foundation)

**Purpose:** Establish core inventory tracking and AI agent framework

**Tables Created:**
- `ai_inventory_recommendations` - AI agent recommendations
- `ai_recommendation_results` - Outcome tracking for recommendations

**Key Features:**
- Stores recommendations from 4 agents (redistribution, dead-stock, marketplace, warehouse-risk)
- Tracks confidence scores and estimated savings
- Links recommendations to actual results

### Phase 6: Operational Memory & Accuracy (Intelligence)

**Purpose:** Build operational knowledge base and accuracy tracking

**Tables Created:**
- `ai_recommendation_accuracy` - Per-agent accuracy metrics
- `ai_warehouse_reputation` - Warehouse health & risk scoring
- `ai_operational_memory` - Pattern storage for context injection

**Key Features:**
- Running accuracy scores for each agent
- Warehouse health scoring (delay risk, RTO risk)
- Pattern library for historical context

### Phase 7: Predictive Alerts (Forecasting)

**Purpose:** Enable proactive risk detection

**Tables Created:**
- `ai_predictive_alerts` - Forward-looking risk alerts

**Key Features:**
- Region/warehouse/SKU level alerts
- Estimated days to impact
- Confidence scoring
- Alert status management (active/mitigated/ignored)

### Phase 8: Transfer Lifecycle & Economics (Execution)

**Purpose:** Manage transfer workflows and financial viability

**Tables Created:**
- `inventory_transfer_tasks` - Transfer task tracking (full lifecycle)
- `inventory_state_tracking` - Multi-dimensional inventory state
- `customer_loyalty_scores` - Customer value & retention metrics
- `fulfillment_economic_analysis` - Cost-benefit analysis per transfer

**Key Features:**
- 12-state transfer workflow
- Physical/planned/in-transit/reserved/sellable stock tracking
- Loyalty tier-based override decisions
- Economic viability assessment

### Phase 9: Command Center & Observability (Visibility)

**Purpose:** Real-time monitoring and operational visibility

**Tables Created:**
- `operational_event_feed` - All operational events (INFO/WARNING/CRITICAL)
- `ai_accuracy_tracking` - Real-time accuracy calculation with GENERATED column
- `transfer_timeline_events` - Historical state change log (audit trail)
- `system_observability_logs` - Service health metrics
- `warehouse_heatmap_metrics` - Warehouse congestion & performance
- `predictive_risk_tracking` - Real-time risk status

**Key Features:**
- Complete event feed for dashboard visualization
- Generated column for dynamic accuracy calculation
- Timeline for transfer state changes
- Service-level monitoring
- Predictive risk monitoring

### Phase 10: Distributed Event Infrastructure & Resilience (Reliability)

**Purpose:** Event-driven architecture, fault tolerance, and recovery

**Tables Created:**
- `operational_event_store` - All events (central source of truth)
- `event_retry_queue` - Pending retries with backoff timing
- `dead_letter_events` - Failed events (audit trail)
- `distributed_lock_tracking` - Active locks for concurrency control
- `inventory_reconciliation_logs` - Mismatch detection
- `event_consistency_audits` - Drift detection
- `workflow_saga_tracking` - Distributed transaction state
- `marketplace_sync_failures` - Marketplace resilience tracking
- `operational_event_metrics` - Performance metrics
- `system_recovery_checkpoints` - Crash recovery state

**Key Features:**
- Central event persistence with status tracking
- Automatic retry with exponential backoff (5s → 10s → 20s → 40s)
- Dead-letter queue for manual inspection
- Saga pattern for multi-step workflows
- Idempotency guarantees (correlation ID + idempotency key)

---

## Complete Table Reference

### PHASE 5 TABLES

#### `ai_inventory_recommendations`
**Purpose:** Store AI agent recommendations  
**Type:** Core transactional table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | BIGINT(20) | PK, AUTO_INCREMENT | Unique recommendation ID |
| `agent_type` | VARCHAR(100) | NOT NULL | REDISTRIBUTION, DEAD_STOCK, MARKETPLACE, WAREHOUSE_RISK |
| `recommendation_text` | TEXT | NOT NULL | Human-readable recommendation |
| `sku` | VARCHAR(100) | NOT NULL | Product identifier |
| `source_location` | VARCHAR(100) | | Source warehouse |
| `target_location` | VARCHAR(100) | | Target warehouse |
| `estimated_quantity` | INT | | Units involved |
| `confidence_score` | DECIMAL(5,2) | | 0-100 confidence |
| `status` | ENUM | DEFAULT 'pending' | pending, accepted, rejected, executed, measured, closed |
| `created_at` | TIMESTAMP | DEFAULT NOW | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW | Last update |

**Key Relationships:** Referenced by `ai_recommendation_results`  
**Indexes:** PRIMARY KEY (id), INDEX (agent_type, status), INDEX (sku)  
**Row Count Estimate:** 1,000-10,000/month (varies by agent activity)

#### `ai_recommendation_results`
**Purpose:** Track outcomes of recommendations  
**Type:** Result/measurement table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `result_id` | INT | PK, AUTO_INCREMENT | Result ID |
| `recommendation_id` | BIGINT(20) | FK → ai_inventory_recommendations | Reference to recommendation |
| `confidence_score` | DECIMAL(5,2) | | Confidence at time of measurement |
| `estimated_savings` | DECIMAL(10,2) | | Predicted financial impact |
| `actual_savings` | DECIMAL(10,2) | | Realized financial impact |
| `execution_success` | BOOLEAN | DEFAULT FALSE | Success flag |
| `outcome_measured_at` | TIMESTAMP | DEFAULT NOW | Measurement time |

**Key Relationships:** Foreign key to `ai_inventory_recommendations`  
**Indexes:** PRIMARY KEY (result_id), FK INDEX (recommendation_id)  
**Query Pattern:** JOIN with ai_inventory_recommendations to compute agent accuracy

---

### PHASE 6 TABLES

#### `ai_recommendation_accuracy`
**Purpose:** Aggregate per-agent accuracy metrics  
**Type:** Metric summary table (updated by triggers/batch jobs)

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `agent_type` | VARCHAR(100) | PK | REDISTRIBUTION, DEAD_STOCK, MARKETPLACE, WAREHOUSE_RISK |
| `total_recommendations` | INT | DEFAULT 0 | Total recommendations issued |
| `successful_executions` | INT | DEFAULT 0 | Successful outcomes |
| `running_accuracy_score` | DECIMAL(5,2) | DEFAULT 100 | (successful/total) * 100 |
| `last_updated` | TIMESTAMP | DEFAULT NOW | Last metric update |

**Key Relationships:** None (summary table)  
**Indexes:** PRIMARY KEY (agent_type)  
**Calculation:** `running_accuracy_score = (successful_executions / total_recommendations) * 100`

#### `ai_warehouse_reputation`
**Purpose:** Warehouse health & reliability scoring  
**Type:** Attribute table (updated hourly/daily)

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `warehouse_id` | VARCHAR(100) | PK | Unique warehouse identifier |
| `health_score` | INT | DEFAULT 100 | 0-100 warehouse health |
| `delay_risk_level` | ENUM | DEFAULT 'LOW' | LOW, MEDIUM, HIGH, CRITICAL |
| `rto_risk_level` | ENUM | DEFAULT 'LOW' | Recovery time objective risk |
| `operational_stability` | ENUM | DEFAULT 'HIGH' | LOW, MEDIUM, HIGH |
| `last_evaluated` | TIMESTAMP | DEFAULT NOW | Last evaluation time |

**Key Relationships:** Used by transfer_task_creation and risk assessment engines  
**Indexes:** PRIMARY KEY (warehouse_id)  
**Update Frequency:** Hourly/Daily batch job

#### `ai_operational_memory`
**Purpose:** Pattern library for AI context injection  
**Type:** Knowledge base table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `memory_id` | INT | PK, AUTO_INCREMENT | Memory entry ID |
| `entity_type` | ENUM | NOT NULL | REGION, WAREHOUSE, SKU, COURIER |
| `entity_id` | VARCHAR(100) | NOT NULL | Specific entity identifier |
| `pattern_description` | TEXT | NOT NULL | Human-readable pattern |
| `confidence_in_pattern` | DECIMAL(5,2) | DEFAULT 90 | Confidence 0-100 |
| `first_detected_at` | TIMESTAMP | DEFAULT NOW | Detection time |
| `last_applied_at` | TIMESTAMP | DEFAULT NOW | Last usage time |

**Key Relationships:** None (reference table)  
**Indexes:** PRIMARY KEY (memory_id), INDEX (entity_type, entity_id), INDEX (last_applied_at)  
**Query Pattern:** Query by entity to get contextual patterns for AI prompts

---

### PHASE 7 TABLES

#### `ai_predictive_alerts`
**Purpose:** Forward-looking risk predictions  
**Type:** Alert/notification table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `alert_id` | INT | PK, AUTO_INCREMENT | Alert ID |
| `entity_type` | ENUM | NOT NULL | REGION, WAREHOUSE, SKU |
| `entity_id` | VARCHAR(100) | NOT NULL | Specific entity |
| `predicted_event` | TEXT | NOT NULL | Risk description (e.g., "STOCKOUT", "OVERLOAD") |
| `estimated_days_to_impact` | INT | | Days until predicted event |
| `confidence_score` | DECIMAL(5,2) | | 0-100 confidence |
| `status` | ENUM | DEFAULT 'active' | active, mitigated, ignored |
| `created_at` | TIMESTAMP | DEFAULT NOW | Alert creation time |

**Key Relationships:** None (alert table)  
**Indexes:** PRIMARY KEY (alert_id), INDEX (entity_type, entity_id, status)  
**Update Pattern:** Continuously updated by predictive engine

---

### PHASE 8 TABLES

#### `inventory_transfer_tasks`
**Purpose:** Core transfer workflow tracking  
**Type:** Central execution table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `task_id` | VARCHAR(50) | PK | Unique transfer task ID |
| `recommendation_id` | BIGINT | FK → ai_inventory_recommendations | Origin recommendation |
| `source_warehouse` | VARCHAR(100) | NOT NULL | Source location |
| `target_destination` | VARCHAR(100) | NOT NULL | Target location |
| `sku` | VARCHAR(100) | NOT NULL | Product identifier |
| `quantity` | INT | NOT NULL | Units to transfer |
| `status` | ENUM | DEFAULT 'RECOMMENDED' | 12-state workflow (see below) |
| `created_at` | TIMESTAMP | DEFAULT NOW | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW | Last update |

**Status Workflow (12 states):**
```
RECOMMENDED → APPROVED → TASK_CREATED → DISPATCH_PENDING → DISPATCHED
    ↓
COMPLETED (success path)
    
RECOMMENDED → ... → IN_TRANSIT → RECEIVED → VERIFIED → COMPLETED

Failed paths:
    → FAILED (any stage)
    → CANCELLED (manual cancellation)
    → DELAYED (timing issue)
```

**Key Relationships:** Foreign key to `ai_inventory_recommendations`  
**Indexes:** PRIMARY KEY (task_id), INDEX (source_warehouse), INDEX (sku), INDEX (status, updated_at)  
**Row Count Estimate:** 100-1,000/day depending on transfer volume

#### `inventory_state_tracking`
**Purpose:** Multi-dimensional inventory visibility  
**Type:** State snapshot table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `sku` | VARCHAR(100) | PK (part 1) | Product identifier |
| `location_id` | VARCHAR(100) | PK (part 2) | Warehouse/location |
| `physical_stock` | INT | DEFAULT 0 | Physically counted units |
| `planned_stock` | INT | DEFAULT 0 | Planned receipts |
| `in_transit_stock` | INT | DEFAULT 0 | Units in shipment |
| `reserved_stock` | INT | DEFAULT 0 | Reserved for orders |
| `sellable_stock` | INT | DEFAULT 0 | Available to sell |
| `last_verified_at` | TIMESTAMP | DEFAULT NOW | Last verification |

**Key Calculation:**
```
sellable_stock = physical_stock + planned_stock - reserved_stock
```

**Key Relationships:** Referenced by transfer workflow  
**Indexes:** PRIMARY KEY (sku, location_id), INDEX (last_verified_at)  
**Row Count Estimate:** ~10,000-100,000 (depends on SKU x Location combinations)

#### `customer_loyalty_scores`
**Purpose:** Customer value assessment for transfer override decisions  
**Type:** Attribute table (updated monthly/weekly)

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `customer_id` | VARCHAR(50) | PK | Unique customer ID |
| `lifetime_value` | DECIMAL(10,2) | | Total historical spending |
| `loyalty_duration_days` | INT | | Days as customer |
| `retention_probability` | DECIMAL(5,2) | | 0-100% probability |
| `loyalty_tier` | ENUM | DEFAULT 'STANDARD' | STANDARD, VIP, PLATINUM |

**Tier Logic:**
- STANDARD: 0-99 lifetime value
- VIP: $10,000+ lifetime value, 90%+ retention
- PLATINUM: VIP + 2+ year loyalty

**Key Relationships:** Referenced by fulfillment economics decision engine  
**Indexes:** PRIMARY KEY (customer_id), INDEX (loyalty_tier)  
**Row Count Estimate:** Variable (customer base size)

#### `fulfillment_economic_analysis`
**Purpose:** Cost-benefit analysis driving transfer viability  
**Type:** Analysis/decision table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `analysis_id` | INT | PK, AUTO_INCREMENT | Analysis record ID |
| `task_id` | VARCHAR(50) | FK → inventory_transfer_tasks | Transfer reference |
| `product_margin` | DECIMAL(10,2) | | Product profit margin |
| `transfer_cost` | DECIMAL(10,2) | | Shipping + handling cost |
| `net_profit` | DECIMAL(10,2) | | Margin - cost |
| `economically_viable` | BOOLEAN | | net_profit > 0 |
| `loyalty_override_applied` | BOOLEAN | DEFAULT FALSE | VIP customer override |
| `created_at` | TIMESTAMP | DEFAULT NOW | Analysis time |

**Decision Logic:**
```
IF economically_viable = FALSE AND loyalty_override_applied = FALSE
  THEN reject transfer
ELSE IF economically_viable = TRUE OR (loyalty_tier = VIP AND economically_viable = FALSE)
  THEN approve transfer
```

**Key Relationships:** Foreign key to `inventory_transfer_tasks`  
**Indexes:** PRIMARY KEY (analysis_id), FK INDEX (task_id)

---

### PHASE 9 TABLES

#### `operational_event_feed`
**Purpose:** Central event log for dashboard visualization  
**Type:** Event log table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `event_id` | INT | PK, AUTO_INCREMENT | Event ID |
| `event_type` | VARCHAR(50) | NOT NULL | TRANSFER_DELAYED, PREDICTION_ALERT, VIP_OVERRIDE, etc. |
| `severity` | VARCHAR(20) | DEFAULT 'INFO' | INFO, WARNING, CRITICAL |
| `message` | TEXT | NOT NULL | Human-readable message |
| `metadata` | JSON | | Contextual data (task_id, sku, reason, etc.) |
| `created_at` | TIMESTAMP | DEFAULT NOW | Event time |

**Severity Levels:**
- INFO: Routine operations (transfers completed, alerts issued)
- WARNING: Potential issues (delays, accuracy drops)
- CRITICAL: System alerts (stockouts, failed retries)

**Key Relationships:** None (feed table)  
**Indexes:** PRIMARY KEY (event_id), INDEX (event_type, severity, created_at)  
**Row Count Estimate:** 1,000-10,000/day

#### `ai_accuracy_tracking`
**Purpose:** Real-time agent accuracy with GENERATED column  
**Type:** Metric table (computed)

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `tracking_id` | INT | PK, AUTO_INCREMENT | Tracking record ID |
| `agent_name` | VARCHAR(50) | NOT NULL | Agent identifier |
| `total_recommendations` | INT | DEFAULT 0 | Total issued |
| `successful_executions` | INT | DEFAULT 0 | Successful |
| `failed_executions` | INT | DEFAULT 0 | Failed |
| `false_positives` | INT | DEFAULT 0 | False alerts |
| `false_negatives` | INT | DEFAULT 0 | Missed events |
| `accuracy_score` | DECIMAL(5,2) | GENERATED ALWAYS AS | (successful/total) * 100 |
| `last_updated` | TIMESTAMP | DEFAULT NOW | Update time |

**Formula (GENERATED STORED COLUMN):**
```sql
CASE 
  WHEN total_recommendations = 0 THEN 0.00
  ELSE (successful_executions / total_recommendations) * 100 
END
```

**Key Relationships:** None (metric table)  
**Indexes:** PRIMARY KEY (tracking_id), INDEX (agent_name)  
**Special Feature:** Computed accuracy prevents manual entry errors

#### `transfer_timeline_events`
**Purpose:** Historical audit trail of transfer state changes  
**Type:** Event log table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `timeline_id` | INT | PK, AUTO_INCREMENT | Timeline record ID |
| `task_id` | VARCHAR(50) | FK → inventory_transfer_tasks | Transfer reference |
| `previous_state` | VARCHAR(50) | | Prior status |
| `new_state` | VARCHAR(50) | NOT NULL | Current status |
| `changed_by` | VARCHAR(50) | DEFAULT 'SYSTEM' | Who changed it |
| `notes` | TEXT | | Reason/context |
| `created_at` | TIMESTAMP | DEFAULT NOW | Change timestamp |

**Key Relationships:** Foreign key to `inventory_transfer_tasks` with CASCADE delete  
**Indexes:** PRIMARY KEY (timeline_id), FK INDEX (task_id), INDEX (created_at)  
**Query Pattern:** Retrieve timeline by task_id to show state progression

#### `system_observability_logs`
**Purpose:** Service-level health metrics  
**Type:** System metrics table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `log_id` | INT | PK, AUTO_INCREMENT | Log ID |
| `service_name` | VARCHAR(50) | NOT NULL | Service identifier |
| `status_code` | INT | | HTTP/service status (200, 500, etc.) |
| `error_message` | TEXT | | Error details if applicable |
| `latency_ms` | INT | | Response time in milliseconds |
| `created_at` | TIMESTAMP | DEFAULT NOW | Log time |

**Key Relationships:** None (metrics table)  
**Indexes:** PRIMARY KEY (log_id), INDEX (service_name, created_at)  
**Row Count Estimate:** 100-1,000/hour

#### `warehouse_heatmap_metrics`
**Purpose:** Real-time warehouse congestion & health visualization  
**Type:** State snapshot table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `metric_id` | INT | PK, AUTO_INCREMENT | Metric record ID |
| `warehouse_id` | VARCHAR(50) | NOT NULL | Warehouse identifier |
| `health_score` | DECIMAL(5,2) | DEFAULT 100 | 0-100 health |
| `congestion_level` | VARCHAR(20) | DEFAULT 'LOW' | LOW, MEDIUM, HIGH |
| `active_tasks` | INT | DEFAULT 0 | Current transfers |
| `delayed_tasks` | INT | DEFAULT 0 | Delayed transfers |
| `last_calculated` | TIMESTAMP | DEFAULT NOW | Calculation time |

**Congestion Formula:**
```
IF active_tasks > capacity_threshold THEN HIGH
ELSE IF active_tasks > capacity_threshold * 0.7 THEN MEDIUM
ELSE LOW
```

**Key Relationships:** None (snapshot table)  
**Indexes:** PRIMARY KEY (metric_id), INDEX (warehouse_id), INDEX (last_calculated)  
**Update Frequency:** Every 5-15 minutes (real-time updates)

#### `predictive_risk_tracking`
**Purpose:** Real-time risk monitoring for proactive mitigation  
**Type:** Alert/status table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `risk_id` | INT | PK, AUTO_INCREMENT | Risk record ID |
| `entity_id` | VARCHAR(50) | NOT NULL | SKU or warehouse ID |
| `risk_type` | VARCHAR(50) | NOT NULL | STOCKOUT, OVERLOAD, DELAY, etc. |
| `confidence_score` | DECIMAL(5,2) | | 0-100 confidence |
| `days_to_impact` | INT | | Days until risk materializes |
| `severity` | VARCHAR(20) | DEFAULT 'MEDIUM' | LOW, MEDIUM, HIGH, CRITICAL |
| `status` | VARCHAR(20) | DEFAULT 'ACTIVE' | ACTIVE, MITIGATED, IGNORED |
| `created_at` | TIMESTAMP | DEFAULT NOW | Detection time |

**Key Relationships:** None (alert table)  
**Indexes:** PRIMARY KEY (risk_id), INDEX (entity_id, status), INDEX (created_at)  
**Update Pattern:** Continuous updates by predictive engine

---

### PHASE 10 TABLES

#### `operational_event_store`
**Purpose:** Central source of truth for all operational events  
**Type:** Core event table (immutable log)

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `event_id` | VARCHAR(64) | PK | UUID of event |
| `event_type` | VARCHAR(128) | NOT NULL | TRANSFER_APPROVED, TASK_CREATED, RECEIPT_CONFIRMED, etc. |
| `source_service` | VARCHAR(128) | NOT NULL | Originating service (e.g., "transfer-workflow-service") |
| `payload` | JSON | | Full event data |
| `timestamp` | DATETIME | NOT NULL | Event occurrence time |
| `retry_count` | INT | DEFAULT 0 | Number of retry attempts |
| `status` | VARCHAR(64) | DEFAULT 'PENDING' | PENDING, PROCESSING, COMPLETED, FAILED, DEAD_LETTER |
| `correlation_id` | VARCHAR(128) | | Trace ID for related events |
| `idempotency_key` | VARCHAR(255) | | Duplicate prevention key |
| `version` | VARCHAR(32) | DEFAULT 'v1' | Schema version |
| `last_error` | TEXT | | Error message from last failure |
| `updated_at` | DATETIME | DEFAULT NOW | Last status update |

**Key Relationships:** Referenced by `event_retry_queue`, `dead_letter_events`  
**Indexes:** PRIMARY KEY (event_id), INDEX (event_type, status), INDEX (correlation_id), INDEX (idempotency_key), INDEX (timestamp)  
**Event Lifecycle:** PENDING → PROCESSING → COMPLETED (or FAILED → retry queue → DEAD_LETTER)

#### `event_retry_queue`
**Purpose:** Track pending retries with exponential backoff  
**Type:** Retry management table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `event_id` | VARCHAR(64) | PK | Reference to operational_event_store |
| `retry_count` | INT | NOT NULL | Current retry attempt (0, 1, 2, 3) |
| `next_attempt_at` | DATETIME | NOT NULL | Scheduled retry time |
| `last_error` | TEXT | | Error from last attempt |
| `status` | VARCHAR(32) | DEFAULT 'PENDING' | PENDING, IN_PROGRESS |

**Backoff Calculation:**
```
Attempt 0: next_attempt = now + 5 seconds
Attempt 1: next_attempt = now + 10 seconds
Attempt 2: next_attempt = now + 20 seconds
Attempt 3: next_attempt = now + 40 seconds
(max retries = 3, then move to dead letter)
```

**Key Relationships:** Foreign key to `operational_event_store`  
**Indexes:** PRIMARY KEY (event_id), INDEX (next_attempt_at, status)  
**Query Pattern:** `SELECT * FROM event_retry_queue WHERE status = 'PENDING' AND next_attempt_at <= NOW()`

#### `dead_letter_events`
**Purpose:** Audit trail of exhausted retry events  
**Type:** Dead-letter queue table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Dead letter record ID |
| `event_id` | VARCHAR(64) | NOT NULL | Original event ID |
| `event_type` | VARCHAR(128) | NOT NULL | Event type |
| `source_service` | VARCHAR(128) | NOT NULL | Originating service |
| `payload` | JSON | | Full event payload for replay |
| `timestamp` | DATETIME | NOT NULL | Original event time |
| `correlation_id` | VARCHAR(128) | | Trace ID |
| `last_error` | TEXT | | Final error message |
| `version` | VARCHAR(32) | | Schema version |
| `moved_at` | DATETIME | DEFAULT NOW | Time moved to DLQ |

**Key Relationships:** None (read-only audit table)  
**Indexes:** PRIMARY KEY (id), INDEX (event_id), INDEX (moved_at), INDEX (correlation_id)  
**Operational Use:** Manual inspection and potential replay via playback engine  
**Row Count Estimate:** 0-10/hour (should be minimal in healthy system)

#### `distributed_lock_tracking`
**Purpose:** Track active distributed locks for concurrency control  
**Type:** Lock state table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `lock_key` | VARCHAR(255) | PK | Lock identifier (e.g., "INVENTORY_MUTATION_SKU001_WH001") |
| `lock_token` | VARCHAR(255) | | Unique token for lock holder |
| `acquired_at` | DATETIME | NOT NULL | Lock acquisition time |
| `expires_at` | DATETIME | NOT NULL | Lock expiration (TTL) |
| `owner` | VARCHAR(255) | | Process/service holding lock |

**Lock Pattern (Redis NX SET):**
```
SET lock_key lock_token EX ttl_seconds NX
(Succeeds only if key doesn't exist)

Release:
DELETE lock_key IF token matches (Lua script prevents wrong owner release)
```

**Key Relationships:** None (state table)  
**Indexes:** PRIMARY KEY (lock_key), INDEX (expires_at)  
**Safety Guarantee:** Token-based release prevents accidental unlock by wrong process  
**Typical TTL:** 30-60 seconds for inventory mutations

#### `inventory_reconciliation_logs`
**Purpose:** Log inventory mismatches (marketplace vs physical vs logical)  
**Type:** Issue tracking table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Log record ID |
| `issue_type` | VARCHAR(128) | | MARKETPLACE_MISMATCH, PHYSICAL_VARIANCE, LOGICAL_ERROR, etc. |
| `source_reference` | VARCHAR(255) | | Related entity (SKU, task_id, warehouse_id) |
| `payload` | JSON | | Mismatch details (expected vs actual) |
| `detected_at` | DATETIME | NOT NULL | Detection time |

**Key Relationships:** None (issue log)  
**Indexes:** PRIMARY KEY (id), INDEX (issue_type), INDEX (source_reference), INDEX (detected_at)  
**Row Count Estimate:** 1-100/day (depending on data quality)

#### `event_consistency_audits`
**Purpose:** Detect synchronization drift between distributed systems  
**Type:** Audit/validation table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Audit record ID |
| `event_id` | VARCHAR(64) | | Event being audited |
| `payload` | JSON | | Event data snapshot |
| `drift_detected` | TINYINT(1) | DEFAULT 0 | Boolean: drift found (0=no, 1=yes) |
| `audit_time` | DATETIME | NOT NULL | Audit execution time |

**Key Relationships:** None (audit table)  
**Indexes:** PRIMARY KEY (id), INDEX (event_id), INDEX (drift_detected), INDEX (audit_time)  
**Validation Logic:** Compare state before/after event against expected outcomes

#### `workflow_saga_tracking`
**Purpose:** Track saga pattern workflows for distributed transactions  
**Type:** Transaction coordination table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `saga_id` | VARCHAR(128) | PK | Unique saga identifier |
| `workflow_type` | VARCHAR(128) | | TRANSFER_WORKFLOW, RECONCILIATION_WORKFLOW, etc. |
| `payload` | JSON | | Complete saga context |
| `status` | VARCHAR(64) | DEFAULT 'STARTED' | STARTED, PROCESSING, COMPLETED, COMPENSATING, ROLLED_BACK |
| `started_at` | DATETIME | NOT NULL | Saga start time |
| `completed_at` | DATETIME | | Saga end time (NULL if incomplete) |
| `rollback_reason` | TEXT | | Reason for rollback if applicable |

**Saga States:**
```
STARTED → PROCESSING → COMPLETED (success)
       → COMPENSATING → ROLLED_BACK (failure)
```

**Key Relationships:** None (coordination table)  
**Indexes:** PRIMARY KEY (saga_id), INDEX (workflow_type, status), INDEX (started_at)  
**Duration Tracking:** `DATEDIFF(SECOND, started_at, completed_at)` for SLA monitoring

#### `marketplace_sync_failures`
**Purpose:** Track marketplace API failures and resilience events  
**Type:** Failure tracking table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Failure record ID |
| `marketplace` | VARCHAR(128) | | AMAZON, EBAY, SHOPIFY, etc. |
| `payload` | JSON | | Request/response data |
| `failure_reason` | TEXT | | Error message |
| `occurred_at` | DATETIME | NOT NULL | Failure time |

**Key Relationships:** None (failure log)  
**Indexes:** PRIMARY KEY (id), INDEX (marketplace, occurred_at)  
**Row Count Estimate:** 0-50/day (indicates resilience issues if high)

#### `operational_event_metrics`
**Purpose:** Collect performance metrics for events  
**Type:** Metrics table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Metric record ID |
| `metric_name` | VARCHAR(128) | | event_latency_ms, processing_time_ms, retry_count, etc. |
| `metric_value` | VARCHAR(255) | | Numeric or categorical value |
| `metadata` | JSON | | Additional context (event_type, service, etc.) |
| `recorded_at` | DATETIME | NOT NULL | Metric collection time |

**Common Metrics:**
- `event_latency_ms`: Time from event publication to processing start
- `processing_time_ms`: Time to complete event processing
- `queue_depth`: Number of pending events
- `retry_rate`: % of events requiring retry

**Key Relationships:** None (metrics table)  
**Indexes:** PRIMARY KEY (id), INDEX (metric_name, recorded_at)  
**Retention:** Consider partitioning by date for historical data

#### `system_recovery_checkpoints`
**Purpose:** Track system state for crash recovery  
**Type:** Recovery state table

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Checkpoint record ID |
| `checkpoint_id` | VARCHAR(128) | | Unique checkpoint identifier |
| `payload` | JSON | | System state snapshot |
| `created_at` | DATETIME | NOT NULL | Checkpoint time |

**Payload Content:**
```json
{
  "last_processed_event_id": "evt_12345",
  "last_processed_timestamp": "2024-01-15T10:30:00Z",
  "active_sagas": ["saga_001", "saga_002"],
  "pending_retries": 15,
  "system_version": "v1.0.0"
}
```

**Key Relationships:** None (checkpoint table)  
**Indexes:** PRIMARY KEY (id), UNIQUE INDEX (checkpoint_id), INDEX (created_at)  
**Recovery Logic:** On system startup, load latest checkpoint and resume from last_processed_event_id

---

## Entity Relationship Diagrams

### Overall Database Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         InventoryGPT Database Map                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────┐                                                             │
│  │  AI ANALYTICS   │                                                             │
│  ├─────────────────┤                                                             │
│  │ • Recommendations                                                             │
│  │ • Accuracy Metrics                                                            │
│  │ • Operational Memory                                                          │
│  │ • Warehouse Reputation                                                        │
│  │ • Predictive Alerts                                                           │
│  └────────┬────────┘                                                             │
│           │ INFORMS                                                              │
│           ▼                                                                      │
│  ┌────────────────────────────────────────────┐                                 │
│  │  TRANSFER EXECUTION                        │                                 │
│  ├────────────────────────────────────────────┤                                 │
│  │ • Transfer Tasks (12-state workflow)       │◄─── (references recommendations) │
│  │ • Inventory State (physical/planned/etc.)  │                                 │
│  │ • Customer Loyalty (override decisions)    │                                 │
│  │ • Fulfillment Economics (viability)        │                                 │
│  │ • Transfer Timeline (state audit trail)    │                                 │
│  └────────┬─────────────────────────────────┘                                 │
│           │ PUBLISHES                                                            │
│           ▼                                                                      │
│  ┌────────────────────────────────────────────┐                                 │
│  │  EVENT INFRASTRUCTURE (Phase 10)           │                                 │
│  ├────────────────────────────────────────────┤                                 │
│  │ • Operational Event Store (source of truth)│                                 │
│  │ • Event Retry Queue (backoff management)   │                                 │
│  │ • Dead Letter Queue (failure audit)        │                                 │
│  │ • Distributed Locks (concurrency control)  │                                 │
│  │ • Workflow Saga Tracking (transactions)    │                                 │
│  │ • Consistency Audits (drift detection)     │                                 │
│  │ • Recovery Checkpoints (crash recovery)    │                                 │
│  └────────┬─────────────────────────────────┘                                 │
│           │                                                                      │
│           ▼                                                                      │
│  ┌────────────────────────────────────────────┐                                 │
│  │  OPERATIONAL OBSERVABILITY                 │                                 │
│  ├────────────────────────────────────────────┤                                 │
│  │ • Event Feed (INFO/WARNING/CRITICAL)       │                                 │
│  │ • System Logs (service health)             │                                 │
│  │ • Warehouse Heatmaps (congestion)          │                                 │
│  │ • Event Metrics (performance tracking)     │                                 │
│  │ • Risk Tracking (real-time alerts)         │                                 │
│  └────────────────────────────────────────────┘                                 │
│                          │                                                      │
│                          ▼                                                      │
│              ┌──────────────────────┐                                           │
│              │  DASHBOARD UI        │                                           │
│              │  (Real-time views)   │                                           │
│              └──────────────────────┘                                           │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Foreign Key Relationships

```
ai_inventory_recommendations
  │
  ├──►  ai_recommendation_results (result_id → recommendation_id)
  │
  └──►  inventory_transfer_tasks (task_id references recommendation_id)
         │
         ├──►  transfer_timeline_events (timeline_id → task_id)
         │
         ├──►  fulfillment_economic_analysis (analysis_id → task_id)
         │
         └──►  inventory_state_tracking (sku, location_id)
                 │
                 └──►  inventory_transfer_tasks (references sku)

operational_event_store
  │
  ├──►  event_retry_queue (event_id references)
  │
  ├──►  dead_letter_events (copies of failed events)
  │
  ├──►  workflow_saga_tracking (events trigger sagas)
  │
  └──►  operational_event_metrics (metrics from events)
```

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                   EVENT-DRIVEN DATA FLOW                          │
└──────────────────────────────────────────────────────────────────┘

1. RECOMMENDATION PHASE
   ┌─────────────────────────────────────────┐
   │ AI Agents Analyze Inventory             │
   │ (Redistribution, Dead-Stock, etc.)      │
   └─────────────────────────────────────────┘
           │
           ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ INSERT INTO ai_inventory_recommendations (...)              │
   │ • agent_type, sku, source_location, target_location, etc.   │
   │ • confidence_score, estimated_savings                       │
   └─────────────────────────────────────────────────────────────┘
           │
           ▼
   ┌─────────────────────────────────────────┐
   │ Create Transfer Task                    │
   │ INSERT INTO inventory_transfer_tasks    │
   │ (task_id, recommendation_id, ...)      │
   └─────────────────────────────────────────┘

2. APPROVAL PHASE
   ┌─────────────────────────────────────────┐
   │ Check Economic Viability                │
   │ • Margin analysis                       │
   │ • Transfer cost calculation             │
   │ • Loyalty override for VIP customers    │
   └─────────────────────────────────────────┘
           │
           ▼
   ┌────────────────────────────────────────────────────────────┐
   │ INSERT INTO fulfillment_economic_analysis (...)            │
   │ IF net_profit > 0 OR (loyalty_tier = VIP AND override)     │
   │   THEN UPDATE inventory_transfer_tasks SET status = APPROVED│
   └────────────────────────────────────────────────────────────┘

3. EXECUTION PHASE
   ┌─────────────────────────────────────────┐
   │ Publish TRANSFER_APPROVED Event         │
   │ → Redis Streams                         │
   │ → operational_event_store (persist)     │
   └─────────────────────────────────────────┘
           │
           ▼
   ┌─────────────────────────────────────────────────────────┐
   │ Event Consumer Loop (ioredis XREADGROUP)                │
   │ • Acquire Distributed Lock (prevent concurrent mutations)│
   │ • UPDATE inventory_state_tracking (allocate stock)       │
   │ • Emit TRANSFER_TASK_CREATED event                       │
   │ • Release Lock                                           │
   │ • XACK acknowledgment                                    │
   └─────────────────────────────────────────────────────────┘

4. RECEIPT PHASE
   ┌─────────────────────────────────────────────────────────┐
   │ Publish TRANSFER_RECEIPT_CONFIRMED Event               │
   │ • Verify physical receipt at destination                │
   │ • Check quantity received                               │
   │ • Log reconciliation if mismatch                         │
   │   (INSERT INTO inventory_reconciliation_logs)            │
   └─────────────────────────────────────────────────────────┘
           │
           ▼
   ┌────────────────────────────────────────────────────────┐
   │ UPDATE inventory_transfer_tasks SET status = VERIFIED   │
   │ UPDATE inventory_state_tracking (update locations)      │
   │ INSERT INTO transfer_timeline_events (audit trail)      │
   │ INSERT INTO ai_recommendation_results (measure outcome)  │
   └────────────────────────────────────────────────────────┘

5. COMPLETION PHASE
   ┌─────────────────────────────────────────┐
   │ Publish TRANSFER_COMPLETED Event        │
   │ • Update saga status to COMPLETED       │
   │ • Calculate actual savings               │
   │ • Update agent accuracy metrics         │
   └─────────────────────────────────────────┘
           │
           ▼
   ┌────────────────────────────────────────────────────────┐
   │ Dashboard Visualization Ready                          │
   │ • Event Feed shows completion                          │
   │ • Transfer timeline displays full lifecycle            │
   │ • Agent accuracy updates in real-time                  │
   │ • Warehouse heatmaps update congestion               │
   └────────────────────────────────────────────────────────┘

6. FAILURE HANDLING
   ┌─────────────────────────────────────────┐
   │ If Event Processing Fails               │
   │ • Record error in operational_event_store│
   │ • Schedule retry in event_retry_queue    │
   │   (next_attempt = NOW + exponential_delay)
   └─────────────────────────────────────────┘
           │
           ▼ (after 3 retries exhausted)
   ┌───────────────────────────────────────────┐
   │ INSERT INTO dead_letter_events            │
   │ • Full payload preserved for manual replay│
   │ • Operational alert (CRITICAL)            │
   │ • INSERT INTO operational_event_feed      │
   └───────────────────────────────────────────┘
```

---

## Data Flow & Query Patterns

### Critical Query Patterns

#### 1. Transfer Approval Workflow
```sql
-- Get pending transfers ready for approval
SELECT t.task_id, t.sku, t.quantity, t.source_warehouse, t.target_destination
FROM inventory_transfer_tasks t
WHERE t.status = 'RECOMMENDED'
  AND t.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY t.created_at DESC;

-- Check economic viability
SELECT ea.task_id, ea.product_margin, ea.transfer_cost, ea.net_profit, ea.economically_viable,
       cl.loyalty_tier
FROM fulfillment_economic_analysis ea
JOIN inventory_transfer_tasks t ON ea.task_id = t.task_id
LEFT JOIN customer_loyalty_scores cl ON cl.customer_id = 'CUST_ID_HERE'
WHERE ea.task_id = 'TASK_ID_HERE';

-- Apply loyalty override if needed
UPDATE inventory_transfer_tasks
SET status = 'APPROVED'
WHERE task_id = 'TASK_ID' 
  AND (SELECT economically_viable FROM fulfillment_economic_analysis WHERE task_id = 'TASK_ID')
   OR (SELECT loyalty_tier FROM customer_loyalty_scores WHERE customer_id = 'VIP_CUST') IN ('VIP', 'PLATINUM');
```

#### 2. Inventory State Tracking
```sql
-- Get current sellable inventory per SKU/location
SELECT sku, location_id, 
       physical_stock, planned_stock, in_transit_stock, reserved_stock, sellable_stock,
       last_verified_at
FROM inventory_state_tracking
WHERE sku = 'SKU_001' OR location_id = 'WAREHOUSE_A'
ORDER BY last_verified_at DESC;

-- Calculate total sellable stock across all locations
SELECT sku, SUM(sellable_stock) as total_sellable
FROM inventory_state_tracking
GROUP BY sku
HAVING total_sellable > 0;

-- Update inventory after transfer completion
UPDATE inventory_state_tracking
SET physical_stock = physical_stock - ?,  -- decrement source
    in_transit_stock = in_transit_stock + ?,
    last_verified_at = NOW()
WHERE sku = ? AND location_id = ? (source warehouse);

UPDATE inventory_state_tracking
SET in_transit_stock = in_transit_stock - ?,
    physical_stock = physical_stock + ?,
    last_verified_at = NOW()
WHERE sku = ? AND location_id = ? (target warehouse);
```

#### 3. Event Processing & Retry Management
```sql
-- Get events ready for retry (next attempt time reached)
SELECT event_id, retry_count, last_error
FROM event_retry_queue
WHERE status = 'PENDING' AND next_attempt_at <= NOW()
ORDER BY next_attempt_at ASC
LIMIT 100;

-- Retrieve full event for processing
SELECT oe.*, erq.retry_count
FROM operational_event_store oe
LEFT JOIN event_retry_queue erq ON oe.event_id = erq.event_id
WHERE oe.event_id = ? AND oe.status IN ('PENDING', 'PROCESSING');

-- Schedule next retry
UPDATE event_retry_queue
SET retry_count = retry_count + 1,
    next_attempt_at = DATE_ADD(NOW(), INTERVAL ? SECOND),
    last_error = ?,
    status = 'PENDING'
WHERE event_id = ?;

-- Move to dead letter after max retries
INSERT INTO dead_letter_events (event_id, event_type, source_service, payload, timestamp, correlation_id, last_error, version)
SELECT event_id, event_type, source_service, payload, timestamp, correlation_id, last_error, version
FROM operational_event_store
WHERE event_id = ?;

DELETE FROM event_retry_queue WHERE event_id = ?;
```

#### 4. Agent Accuracy Metrics
```sql
-- Calculate agent accuracy in real-time
SELECT agent_name, total_recommendations, successful_executions,
       ROUND((successful_executions / NULLIF(total_recommendations, 0)) * 100, 2) as accuracy_pct
FROM ai_accuracy_tracking
ORDER BY accuracy_pct DESC;

-- Update accuracy after recommendation measured
UPDATE ai_accuracy_tracking
SET total_recommendations = total_recommendations + 1,
    successful_executions = successful_executions + 1  -- if success
WHERE agent_name = ?;

-- Track false positives (prediction fired but didn't materialize)
UPDATE ai_accuracy_tracking
SET false_positives = false_positives + 1
WHERE agent_name = ?;
```

#### 5. Saga State Tracking
```sql
-- Get active sagas
SELECT saga_id, workflow_type, status, started_at,
       TIMESTAMPDIFF(SECOND, started_at, NOW()) as duration_seconds
FROM workflow_saga_tracking
WHERE status IN ('STARTED', 'PROCESSING')
ORDER BY started_at ASC;

-- Check saga completion for SLA monitoring
SELECT saga_id, workflow_type,
       TIMESTAMPDIFF(SECOND, started_at, completed_at) as total_duration_seconds
FROM workflow_saga_tracking
WHERE status = 'COMPLETED'
  AND completed_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY completed_at DESC;

-- Rollback saga if processing exceeds timeout
UPDATE workflow_saga_tracking
SET status = 'COMPENSATING', rollback_reason = 'TIMEOUT_EXCEEDED'
WHERE saga_id = ? AND TIMESTAMPDIFF(SECOND, started_at, NOW()) > 600;  -- 10 min timeout
```

#### 6. Transfer Timeline Audit Trail
```sql
-- Get complete state change history for a transfer
SELECT task_id, previous_state, new_state, changed_by, notes, created_at
FROM transfer_timeline_events
WHERE task_id = ?
ORDER BY created_at ASC;

-- Detect delayed transfers (stuck in same state too long)
SELECT t.task_id, t.status, MAX(tte.created_at) as last_state_change,
       TIMESTAMPDIFF(HOUR, MAX(tte.created_at), NOW()) as hours_in_state
FROM inventory_transfer_tasks t
LEFT JOIN transfer_timeline_events tte ON t.task_id = tte.task_id
WHERE t.status NOT IN ('COMPLETED', 'CANCELLED', 'FAILED')
GROUP BY t.task_id, t.status
HAVING hours_in_state > 24;  -- stuck for >24 hours
```

#### 7. Warehouse Heatmap & Congestion Analysis
```sql
-- Get warehouse health snapshot
SELECT warehouse_id, health_score, congestion_level, active_tasks, delayed_tasks,
       ROUND(delayed_tasks / NULLIF(active_tasks, 0) * 100, 2) as delay_rate_pct
FROM warehouse_heatmap_metrics
ORDER BY health_score ASC;  -- unhealthiest first

-- Calculate congestion based on active transfers
SELECT warehouse_id, 
       COUNT(*) as active_transfer_count,
       CASE 
         WHEN COUNT(*) > 100 THEN 'HIGH'
         WHEN COUNT(*) > 50 THEN 'MEDIUM'
         ELSE 'LOW'
       END as congestion_level
FROM inventory_transfer_tasks
WHERE status IN ('APPROVED', 'TASK_CREATED', 'DISPATCH_PENDING', 'DISPATCHED', 'IN_TRANSIT')
  AND (source_warehouse = 'WAREHOUSE_ID' OR target_destination = 'WAREHOUSE_ID')
GROUP BY warehouse_id;
```

#### 8. Dead Letter Queue Inspection
```sql
-- Find failed events for manual inspection
SELECT event_id, event_type, source_service, last_error, moved_at
FROM dead_letter_events
WHERE moved_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY moved_at DESC;

-- Group failures by event type
SELECT event_type, COUNT(*) as failure_count, 
       GROUP_CONCAT(DISTINCT last_error SEPARATOR '; ') as unique_errors
FROM dead_letter_events
WHERE moved_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY event_type
ORDER BY failure_count DESC;
```

---

## Storage & Performance Estimates

### Database Size Projection

| Phase | Tables | Estimated Rows | Storage/Month | Key Drivers |
|-------|--------|-----------------|---------------|----|
| 5 | 2 | 10,000-50,000 | 5-10 MB | Recommendation volume |
| 6 | 3 | 50 (aggregate) | <1 MB | Summary tables |
| 7 | 1 | 1,000-5,000 | 1-2 MB | Alert volume |
| 8 | 4 | 100-1,000 (per day) | 20-50 MB | Transfer activity |
| 9 | 6 | 100K-1M | 50-200 MB | Event feed + observability |
| 10 | 10 | 50K-500K | 100-300 MB | Event store growth |
| **Total** | **26+** | **~1-2M rows** | **~150-500 MB** | All phases |

### Query Performance Indexes

| Table | Column(s) | Index Type | Purpose |
|-------|-----------|-----------|---------|
| operational_event_store | (event_type, status) | COMPOSITE | Filter events by type/status |
| operational_event_store | (correlation_id) | B-TREE | Trace related events |
| operational_event_store | (timestamp) | B-TREE | Time-range queries |
| event_retry_queue | (next_attempt_at, status) | COMPOSITE | Find retries ready to process |
| inventory_transfer_tasks | (source_warehouse) | B-TREE | Warehouse source queries |
| inventory_transfer_tasks | (status, updated_at) | COMPOSITE | Status trend analysis |
| transfer_timeline_events | (task_id) | B-TREE | Timeline retrieval |
| operational_event_feed | (event_type, severity, created_at) | COMPOSITE | Dashboard filtering |
| warehouse_heatmap_metrics | (warehouse_id) | B-TREE | Warehouse lookup |
| ai_operational_memory | (entity_type, entity_id) | COMPOSITE | Context retrieval |

### Query Latency Targets

| Query Type | Target Latency | Typical Use Case |
|-----------|-----------------|-----------------|
| Status lookup (PK) | <5 ms | Single event/transfer lookup |
| Status filter (indexed range) | <50 ms | List pending transfers |
| Timeline retrieval | <100 ms | Show transfer history |
| Aggregate metrics | <500 ms | Dashboard widget |
| Event feed pagination | <200 ms | Event log view |
| Retry queue scan | <1 s | Background job |

### Optimization Strategies

1. **Partitioning by Date** (for high-volume tables)
   ```sql
   -- Partition operational_event_store by month
   ALTER TABLE operational_event_store PARTITION BY RANGE (YEAR_MONTH(timestamp)) (
     PARTITION p202401 VALUES LESS THAN (202402),
     PARTITION p202402 VALUES LESS THAN (202403),
     -- ...
   );
   ```

2. **Archive Strategy** (keep hot data in main table, move cold to archive)
   - Keep last 90 days in operational_event_store
   - Archive older events to separate operational_event_store_archive table
   - Keep dead_letter_events indefinitely (compliance)

3. **Connection Pooling** (mysql2 pool)
   - Pool size: 20-30 connections for production
   - Queue timeout: 5-10 seconds
   - Idle timeout: 60 seconds

---

## Key Relationships & Dependencies

### Data Lineage (Input → Processing → Output)

```
ai_inventory_recommendations
         ↓ (input)
inventory_transfer_tasks (created from recommendation)
         ↓ (executes)
inventory_state_tracking (allocates stock during transfer)
         ↓ (produces events)
operational_event_store (publishes TRANSFER_APPROVED, TASK_CREATED, RECEIPT_CONFIRMED)
         ↓ (consumed by)
event_processor (handles events with locks + saga coordination)
         ↓ (updates)
transfer_timeline_events (state changes logged)
         ↓ (generates outcome)
ai_recommendation_results (measures success/failure)
         ↓ (aggregates)
ai_accuracy_tracking (computes accuracy % for dashboard)
```

### Transaction Guarantees

| Operation | ACID Guarantee | Implementation |
|-----------|-----------------|-----------------|
| Stock Allocation | Atomic | Distributed lock + single transaction |
| Event Processing | At-least-once | Event stored first, then processed |
| Transfer Completion | Atomic | Saga pattern coordinates multi-step |
| Retry After Failure | Idempotent | Idempotency key prevents duplicates |

### Cascade Rules

```
DELETE FROM ai_inventory_recommendations
  CASCADE → ai_recommendation_results (orphaned results deleted)
  CASCADE → inventory_transfer_tasks (tasks cancelled)
    CASCADE → transfer_timeline_events (timeline cleared)
    CASCADE → fulfillment_economic_analysis (analysis removed)

DELETE FROM inventory_transfer_tasks
  CASCADE → transfer_timeline_events
  CASCADE → fulfillment_economic_analysis
```

---

## Critical Queries & Examples

### Real-World Use Cases

#### Use Case 1: Reconcile Inventory After Failed Transfer
```sql
-- Detect mismatch
SELECT irl.id, irl.issue_type, irl.source_reference, irl.payload, irl.detected_at
FROM inventory_reconciliation_logs irl
WHERE irl.detected_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY irl.detected_at DESC;

-- Get expected vs actual state
SELECT ist.sku, ist.location_id, ist.physical_stock as expected_stock,
       JSON_EXTRACT(irl.payload, '$.actual_stock') as actual_stock,
       JSON_EXTRACT(irl.payload, '$.variance') as variance
FROM inventory_reconciliation_logs irl
JOIN inventory_state_tracking ist ON irl.source_reference = ist.sku
WHERE irl.issue_type = 'PHYSICAL_VARIANCE'
  AND irl.detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Correct inventory
UPDATE inventory_state_tracking
SET physical_stock = physical_stock + ?,  -- adjust for variance
    last_verified_at = NOW()
WHERE sku = ? AND location_id = ?;
```

#### Use Case 2: Investigate Dead Letter Queue for Replay
```sql
-- Identify patterns in failed events
SELECT event_type, COUNT(*) as failure_count,
       GROUP_CONCAT(DISTINCT last_error SEPARATOR ' | ') as error_types,
       MIN(moved_at) as first_failure, MAX(moved_at) as last_failure
FROM dead_letter_events
WHERE moved_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY event_type
ORDER BY failure_count DESC;

-- Extract payload for manual processing
SELECT event_id, payload
FROM dead_letter_events
WHERE event_type = 'TRANSFER_APPROVED' AND moved_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
LIMIT 10;

-- Re-insert for replay (after fixing root cause)
INSERT INTO operational_event_store (event_id, event_type, source_service, payload, timestamp, status)
SELECT UUID(), event_type, source_service, payload, NOW(), 'PENDING'
FROM dead_letter_events
WHERE event_id = ? AND event_type = 'TRANSFER_APPROVED';

-- Remove from DLQ
DELETE FROM dead_letter_events WHERE event_id = ?;
```

#### Use Case 3: Monitor System Health for Dashboard
```sql
-- Event processing lag (events waiting in queue)
SELECT COUNT(*) as pending_events, 
       MAX(TIMESTAMPDIFF(MINUTE, timestamp, NOW())) as oldest_pending_minutes
FROM operational_event_store
WHERE status IN ('PENDING', 'PROCESSING');

-- Retry queue status
SELECT COUNT(*) as events_in_retry,
       AVG(retry_count) as avg_retry_attempts,
       COUNT(CASE WHEN retry_count >= 3 THEN 1 END) as near_dead_letter_count
FROM event_retry_queue;

-- Saga completion rate (SLA tracking)
SELECT workflow_type, 
       COUNT(*) as total_sagas,
       SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'ROLLED_BACK' THEN 1 ELSE 0 END) as failed,
       ROUND(AVG(TIMESTAMPDIFF(SECOND, started_at, COALESCE(completed_at, NOW()))), 2) as avg_duration_sec
FROM workflow_saga_tracking
WHERE started_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY workflow_type;

-- Agent accuracy trend
SELECT agent_name, 
       total_recommendations, successful_executions,
       ROUND((successful_executions / NULLIF(total_recommendations, 0)) * 100, 2) as accuracy_pct,
       false_positives, false_negatives
FROM ai_accuracy_tracking
WHERE last_updated >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY accuracy_pct DESC;
```

#### Use Case 4: Transfer Delay Analysis
```sql
-- Find transfers delayed in specific states
SELECT t.task_id, t.sku, t.source_warehouse, t.target_destination,
       t.status, t.updated_at,
       TIMESTAMPDIFF(HOUR, t.updated_at, NOW()) as hours_in_state
FROM inventory_transfer_tasks t
WHERE t.status IN ('IN_TRANSIT', 'DISPATCH_PENDING')
  AND t.updated_at < DATE_SUB(NOW(), INTERVAL 12 HOUR)
ORDER BY hours_in_state DESC;

-- Check warehouse reputation to understand delay risk
SELECT wh.warehouse_id, wh.health_score, wh.delay_risk_level, 
       wh.operational_stability, wh.last_evaluated,
       (SELECT COUNT(*) FROM inventory_transfer_tasks WHERE source_warehouse = wh.warehouse_id AND status NOT IN ('COMPLETED', 'CANCELLED', 'FAILED')) as active_transfers
FROM ai_warehouse_reputation wh
WHERE delay_risk_level IN ('MEDIUM', 'HIGH', 'CRITICAL')
ORDER BY health_score ASC;

-- Create predictive alert for likely delays
INSERT INTO predictive_risk_tracking (entity_id, risk_type, confidence_score, days_to_impact, severity, status)
VALUES 
  ('WAREHOUSE_A', 'DELAY', 0.85, 1, 'HIGH', 'ACTIVE'),
  ('SKU_XYZ', 'STOCKOUT', 0.92, 2, 'CRITICAL', 'ACTIVE');
```

---

## Summary: InventoryGPT Database Architecture

### By The Numbers
- **26+ tables** across 6 phases
- **~1-2M rows** in production (estimated)
- **150-500 MB** total storage (projected)
- **5+ ms** fastest query latency (PK lookups)
- **<1 s** worst-case query latency (full scans with aggregation)
- **10 critical relationships** (FKs with CASCADE deletes)
- **12-state transfer workflow** (inventory_transfer_tasks.status)
- **3-tier accuracy measurement** (agent, per-warehouse, per-customer)

### Architectural Principles
1. **Event-Driven**: Redis Streams as primary event bus, MySQL for persistence
2. **Distributed Transactions**: Saga pattern for multi-step workflows
3. **Resilience**: Exponential backoff retry + dead-letter queue
4. **Concurrency Control**: Token-based distributed Redis locks
5. **Observability**: Complete audit trails (timeline events, event store, metrics)
6. **Idempotency**: Correlation IDs + idempotency keys prevent duplicate processing

### Key Phases
- **Phases 5-6**: AI Analytics Foundation & Accuracy Tracking
- **Phase 7**: Predictive Intelligence
- **Phase 8**: Transfer Execution & Economics
- **Phase 9**: Command Center & Real-Time Visibility
- **Phase 10**: Distributed Event Infrastructure & Operational Resilience

---

**Generated for InventoryGPT Project | MySQL 8.0+ | InnoDB Engine | Production Ready**
