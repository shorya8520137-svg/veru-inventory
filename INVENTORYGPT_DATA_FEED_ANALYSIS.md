# InventoryGPT Data Feed Analysis
**Document Version:** 1.0  
**Date:** May 2026  
**Purpose:** Map existing inventory database tables to InventoryGPT requirements and identify necessary updates

---

## Executive Summary

Your current database has **excellent operational foundations** with complete inventory tracking, logistics, and transfer systems. However, **5 key tables need enhancement columns** to feed data effectively to InventoryGPT, and **3 new AI-specific tables need creation** for AI decision-making and memory storage.

---

## Part 1: Existing Tables That Feed InventoryGPT

### Core Inventory Data Source Tables

#### 1. **`inventory`** ← PRIMARY STOCK SOURCE
**Current Use:** Warehouse stock tracking by product and location  
**InventoryGPT Role:** Source of current inventory state

| Required Data | Current Column | Status | Notes |
|---|---|---|---|
| Product identifier | `code` | ✅ Present | Maps to SKU |
| Location/Warehouse | `warehouse` + `warehouse_code` | ✅ Present | Dual-key for warehouse ID |
| Current stock | `stock` | ✅ Present | Physical inventory count |
| Reserved stock | `qty_reserved` | ✅ Present | Already reserved for orders |
| Product name | Missing | ❌ **NEEDS ADD** | For display in recommendations |
| Stock category | Missing | ❌ **NEEDS ADD** | To identify dead stock |
| Last verified timestamp | Missing | ❌ **NEEDS ADD** | For stale data detection |

**REQUIRED UPDATES:**
```sql
-- Add these columns to inventory table
ALTER TABLE inventory ADD COLUMN (
    product_name VARCHAR(255) DEFAULT NULL,
    stock_category ENUM('ACTIVE','SLOW_MOVING','DEAD_STOCK','SEASONAL') DEFAULT 'ACTIVE',
    last_verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add index for InventoryGPT queries
CREATE INDEX idx_inventory_gpt ON inventory(warehouse, stock_category, last_verified_at);
```

---

#### 2. **`inventory_snapshots`** ← HISTORICAL INVENTORY DATA
**Current Use:** Daily/periodic inventory state snapshots  
**InventoryGPT Role:** Time-series data for demand forecasting and trend analysis

| Required Data | Current Column | Status | Notes |
|---|---|---|---|
| Time period | `snapshot_time` | ✅ Present | Date of snapshot |
| Product | `barcode` | ✅ Present | Product identifier |
| Location | `warehouse` | ✅ Present | Warehouse location |
| Quantity | `qty` | ✅ Present | Stock at that time |
| Source | `source` | ✅ Present | AUTO/MANUAL/EOD/MONTH_END |
| Snapshot type | Missing | ❌ **NEEDS ADD** | To distinguish planned vs physical |

**REQUIRED UPDATES:**
```sql
-- Add snapshot classification
ALTER TABLE inventory_snapshots ADD COLUMN (
    snapshot_type ENUM('PHYSICAL','PLANNED','RECONCILED') DEFAULT 'PHYSICAL',
    delta_from_previous INT DEFAULT NULL COMMENT 'Stock change since last snapshot'
);
```

---

#### 3. **`inventory_ledger_base`** ← TRANSACTION LOG
**Current Use:** Complete audit trail of all inventory movements  
**InventoryGPT Role:** Event stream for transfer tracking and accuracy analysis

| Required Data | Current Column | Status | Notes |
|---|---|---|---|
| Movement time | `event_time` | ✅ Present | When movement occurred |
| Movement type | `movement_type` | ✅ Present | Dispatch, Return, Transfer, etc. |
| Product | `barcode` | ✅ Present | Product identifier |
| Quantity | `qty` | ✅ Present | Amount moved |
| Direction | `direction` | ✅ Present | IN/OUT |
| Location | `location_code` | ✅ Present | Warehouse code |
| Cost/Economic data | Missing | ❌ **NEEDS ADD** | For transfer cost calculation |
| AI relevance flag | Missing | ❌ **NEEDS ADD** | To mark AI-triggered movements |

**REQUIRED UPDATES:**
```sql
-- Add economic and AI tracking
ALTER TABLE inventory_ledger_base ADD COLUMN (
    transfer_cost DECIMAL(10,2) DEFAULT NULL COMMENT 'Cost of this movement',
    ai_recommended BOOLEAN DEFAULT FALSE COMMENT 'Was this AI-recommended?',
    recommendation_id BIGINT DEFAULT NULL COMMENT 'FK to ai_inventory_recommendations'
);

-- Add index for InventoryGPT event tracking
CREATE INDEX idx_ledger_ai ON inventory_ledger_base(ai_recommended, event_time);
```

---

#### 4. **`self_transfer`** + **`self_transfer_items`** ← TRANSFER WORKFLOW
**Current Use:** Inter-warehouse and inter-store transfers  
**InventoryGPT Role:** Transfer execution history and economic data

| Required Data | Current Column | Status | Notes |
|---|---|---|---|
| Transfer reference | `transfer_reference` | ✅ Present | Transfer ID |
| Source location | `source_location` | ✅ Present | From warehouse |
| Target location | `destination_location` | ✅ Present | To warehouse |
| Cost | `invoice_amount` | ✅ Present | Transfer cost |
| Status | `status` | ✅ Present | Transfer state |
| Products transferred | `self_transfer_items` | ✅ Present | SKU, barcode, qty |
| AI recommendation flag | Missing | ❌ **NEEDS ADD** | Link to recommendation |
| Savings achieved | Missing | ❌ **NEEDS ADD** | Actual vs estimated benefit |
| Execution speed | Missing | ❌ **NEEDS ADD** | Days from creation to completion |

**REQUIRED UPDATES:**
```sql
-- Add AI recommendation tracking to self_transfer
ALTER TABLE self_transfer ADD COLUMN (
    ai_recommendation_id BIGINT DEFAULT NULL COMMENT 'FK to ai_inventory_recommendations',
    estimated_savings DECIMAL(10,2) DEFAULT NULL COMMENT 'AI predicted benefit',
    actual_savings DECIMAL(10,2) DEFAULT NULL COMMENT 'Measured outcome',
    execution_days INT DEFAULT NULL COMMENT 'Days from creation to completion'
);

-- Add index for InventoryGPT analytics
CREATE INDEX idx_transfer_ai ON self_transfer(ai_recommendation_id, created_at);
```

---

#### 5. **`store_inventory`** ← RETAIL/STORE STOCK
**Current Use:** Product stock tracking at retail stores  
**InventoryGPT Role:** Demand distribution across locations

| Required Data | Current Column | Status | Notes |
|---|---|---|---|
| Store identifier | `store_code` | ✅ Present | Store location |
| Product | `barcode` | ✅ Present | Product code |
| Current stock | `stock` | ✅ Present | Available units |
| Price | `price` | ✅ Present | Selling price |
| Last update | `last_updated` | ✅ Present | When was this updated |
| Stock velocity | Missing | ❌ **NEEDS ADD** | Units/day selling rate |
| Days of stock | Missing | ❌ **NEEDS ADD** | Stock / daily velocity |
| Store performance tier | Missing | ❌ **NEEDS ADD** | High/Medium/Low performer |

**REQUIRED UPDATES:**
```sql
-- Add analytics columns
ALTER TABLE store_inventory ADD COLUMN (
    daily_velocity DECIMAL(10,2) DEFAULT NULL COMMENT 'Units sold per day',
    days_of_stock INT GENERATED ALWAYS AS (
        CASE 
            WHEN daily_velocity > 0 THEN stock / daily_velocity 
            ELSE NULL 
        END
    ) STORED COMMENT 'Calculated days of inventory',
    performance_tier ENUM('HIGH','MEDIUM','LOW') DEFAULT 'MEDIUM'
);

-- Add index for store-level analysis
CREATE INDEX idx_store_performance ON store_inventory(store_code, performance_tier, stock);
```

---

### Supporting Reference Tables

#### 6. **`warehouses`** ← WAREHOUSE MASTER DATA
**Current Use:** Warehouse definitions and metadata  
**InventoryGPT Role:** Constraint reference for transfer recommendations

**Columns Needed:**
- `warehouse_id` / `id` - Identifier ✅
- `warehouse_name` - Name ✅
- Location coordinates - For distance calculation ❌ **NEEDS ADD**
- Capacity metrics - Current utilization ❌ **NEEDS ADD**
- Performance metrics - Fulfillment speed, dead-stock ratio ❌ **NEEDS ADD**

**REQUIRED UPDATES:**
```sql
-- Enhance warehouses table with InventoryGPT metrics
ALTER TABLE warehouses ADD COLUMN (
    capacity_units INT DEFAULT NULL COMMENT 'Maximum storage units',
    current_utilization INT DEFAULT NULL COMMENT 'Current units stored',
    avg_fulfillment_days DECIMAL(5,2) DEFAULT NULL COMMENT 'Avg days to ship',
    dead_stock_ratio DECIMAL(5,2) DEFAULT 0 COMMENT 'Dead stock %',
    health_score INT DEFAULT 100 COMMENT 'Warehouse health 0-100'
);

-- Add index for warehouse selection
CREATE INDEX idx_warehouse_health ON warehouses(health_score, dead_stock_ratio);
```

---

#### 7. **`products`** ← PRODUCT MASTER
**Current Use:** Product catalog  
**InventoryGPT Role:** Product attributes for recommendation logic

**Columns Needed:**
- `product_id` - ID ✅
- `product_name` - Name ✅
- `sku` - SKU code ✅
- `price` - Price ✅
- Product margin % - For profitability ❌ **NEEDS ADD**
- Product category - For classification ❌ **NEEDS ADD**
- Product movement velocity - Historical demand ❌ **NEEDS ADD**

**REQUIRED UPDATES:**
```sql
-- Add InventoryGPT attributes to products
ALTER TABLE products ADD COLUMN (
    margin_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Product profit margin %',
    category VARCHAR(100) DEFAULT NULL,
    avg_daily_sales INT DEFAULT 0 COMMENT 'Historical daily sales'
);
```

---

## Part 2: New Tables REQUIRED for InventoryGPT AI

### Must-Create Tables

#### 1. **`ai_inventory_recommendations`** ← AI DECISION STORAGE
**Purpose:** Store AI agent recommendations for human approval/rejection  
**Critical for:** Recommendation memory, accuracy tracking, feedback loop

```sql
CREATE TABLE IF NOT EXISTS ai_inventory_recommendations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  
  -- Recommendation metadata
  recommendation_type VARCHAR(100) NOT NULL COMMENT 'REDISTRIBUTION, DEAD_STOCK, SHORTAGE_ALERT, etc',
  agent_name VARCHAR(100) NOT NULL COMMENT 'Which AI agent made this',
  confidence_score DECIMAL(5,2) NOT NULL COMMENT '0-100 confidence',
  
  -- Inventory data
  sku VARCHAR(100) NOT NULL,
  source_warehouse VARCHAR(100) NOT NULL,
  target_warehouse VARCHAR(100) NOT NULL,
  recommended_quantity INT NOT NULL,
  
  -- Economics
  estimated_savings DECIMAL(12,2) COMMENT 'Predicted financial benefit',
  transfer_cost DECIMAL(10,2) COMMENT 'Cost to execute',
  expected_revenue_impact DECIMAL(12,2) COMMENT 'Revenue uplift expected',
  
  -- Status tracking
  status ENUM('pending','approved','rejected','executed','measured','closed') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT,
  
  -- Execution tracking
  execution_reference VARCHAR(255) COMMENT 'Link to self_transfer.transfer_reference',
  actual_savings DECIMAL(12,2) COMMENT 'Actual outcome after execution',
  measured_at TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  INDEX idx_status (status, created_at),
  INDEX idx_sku (sku),
  INDEX idx_warehouses (source_warehouse, target_warehouse),
  INDEX idx_agent (agent_name, confidence_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='AI Agent Recommendation Storage - Core InventoryGPT Decision History';
```

---

#### 2. **`warehouse_performance_metrics`** ← WAREHOUSE HEALTH SCORING
**Purpose:** Store calculated warehouse performance KPIs for transfer constraint checking  
**Critical for:** Preventing bad transfers, learning from past performance

```sql
CREATE TABLE IF NOT EXISTS warehouse_performance_metrics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  
  -- Warehouse reference
  warehouse_id VARCHAR(100) NOT NULL,
  warehouse_name VARCHAR(255),
  
  -- Performance indicators
  total_transfers_executed INT DEFAULT 0,
  successful_transfers INT DEFAULT 0,
  failed_transfers INT DEFAULT 0,
  avg_fulfillment_time_days DECIMAL(5,2),
  
  -- Inventory health
  dead_stock_ratio DECIMAL(5,2) DEFAULT 0 COMMENT 'Dead stock as % of total',
  slow_moving_ratio DECIMAL(5,2) DEFAULT 0 COMMENT 'Slow moving stock %',
  stock_turnover_rate DECIMAL(5,2) DEFAULT 0 COMMENT 'Times per year inventory turns',
  
  -- Capacity
  storage_utilization_pct DECIMAL(5,2) DEFAULT 0 COMMENT 'Used capacity %',
  available_capacity INT DEFAULT 0 COMMENT 'Free storage units',
  
  -- Reliability
  rto_risk_score INT DEFAULT 0 COMMENT '0-100 risk score',
  delay_risk_level ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'LOW',
  health_score INT DEFAULT 100 COMMENT 'Overall 0-100 health',
  
  -- Timestamps
  last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE KEY uniq_warehouse (warehouse_id),
  INDEX idx_health (health_score),
  INDEX idx_risk (delay_risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Warehouse Performance KPIs - Updated hourly for AI transfer decisions';
```

---

#### 3. **`regional_sales_analytics`** ← DEMAND DISTRIBUTION
**Purpose:** Store aggregated sales/demand by region to guide inventory redistribution  
**Critical for:** Knowing where inventory should flow

```sql
CREATE TABLE IF NOT EXISTS regional_sales_analytics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  
  -- Time period
  analysis_date DATE NOT NULL,
  period_type ENUM('DAILY','WEEKLY','MONTHLY') DEFAULT 'DAILY',
  
  -- Location & product
  region VARCHAR(100) NOT NULL,
  warehouse_id VARCHAR(100),
  sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(255),
  
  -- Sales metrics
  total_units_sold INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  avg_selling_price DECIMAL(10,2),
  
  -- Demand signals
  daily_velocity DECIMAL(10,2) DEFAULT 0 COMMENT 'Units/day in this period',
  velocity_trend ENUM('UP','STABLE','DOWN') DEFAULT 'STABLE',
  stockout_incidents INT DEFAULT 0,
  
  -- Sourcing
  fulfillment_source VARCHAR(100) COMMENT 'Which warehouse supplied',
  avg_delivery_days DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  INDEX idx_region_sku (region, sku, analysis_date),
  INDEX idx_period (period_type, analysis_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Regional demand analytics - Feed InventoryGPT demand model';
```

---

## Part 3: Data Feed Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│         YOUR CURRENT OPERATIONAL DATABASE                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ INVENTORY CORE (Enhanced with InventoryGPT fields)│ │
│  │ • inventory (+ product_name, stock_category)      │ │
│  │ • inventory_snapshots (+ snapshot_type)           │ │
│  │ • store_inventory (+ daily_velocity)              │ │
│  │ • products (+ margin_percentage, category)        │ │
│  └────────────────────────────────────────────────────┘ │
│           │                                              │
│           ▼                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ TRANSFER & ECONOMICS (Enhanced with AI fields)     │ │
│  │ • self_transfer (+ ai_recommendation_id, savings) │ │
│  │ • inventory_ledger_base (+ ai_recommended flag)   │ │
│  │ • warehouses (+ health_score, metrics)            │ │
│  └────────────────────────────────────────────────────┘ │
│           │                                              │
│           ▼                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ InventoryGPT BRAIN (NEW TABLES - CREATE NOW)      │ │
│  │ • ai_inventory_recommendations (AI decisions)      │ │
│  │ • warehouse_performance_metrics (KPI scoring)      │ │
│  │ • regional_sales_analytics (demand signals)        │ │
│  └────────────────────────────────────────────────────┘ │
│           │                                              │
│           ▼                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ InventoryGPT AGENTS (External - LangGraph)         │ │
│  │ • Redistribution Agent ◄──► Recommendation Table   │ │
│  │ • Dead Stock Agent ◄──────► Warehouse Metrics      │ │
│  │ • Shortage Alert Agent ◄──► Regional Analytics    │ │
│  └────────────────────────────────────────────────────┘ │
│           │                                              │
│           ▼                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ FEEDBACK LOOP (measure → learn → improve)          │ │
│  │ Recommendations → Execution → Measurement          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Part 4: Implementation Checklist

### Phase 1: Enhance Existing Tables (Week 1-2)
- [ ] Add columns to `inventory`
  - `product_name`, `stock_category`, `last_verified_at`
- [ ] Add columns to `inventory_snapshots`
  - `snapshot_type`, `delta_from_previous`
- [ ] Add columns to `inventory_ledger_base`
  - `transfer_cost`, `ai_recommended`, `recommendation_id`
- [ ] Add columns to `self_transfer`
  - `ai_recommendation_id`, `estimated_savings`, `actual_savings`, `execution_days`
- [ ] Add columns to `store_inventory`
  - `daily_velocity`, `days_of_stock`, `performance_tier`
- [ ] Add columns to `warehouses`
  - `capacity_units`, `current_utilization`, `avg_fulfillment_days`, `dead_stock_ratio`, `health_score`
- [ ] Add columns to `products`
  - `margin_percentage`, `category`, `avg_daily_sales`

### Phase 2: Create New InventoryGPT Tables (Week 1-2)
- [ ] Create `ai_inventory_recommendations` table
- [ ] Create `warehouse_performance_metrics` table
- [ ] Create `regional_sales_analytics` table

### Phase 3: Create Indexes (Week 2)
- [ ] Add all recommended indexes for query performance
- [ ] Verify foreign key relationships

### Phase 4: Data Population Jobs (Week 3-4)
- [ ] Daily batch job to calculate `warehouse_performance_metrics`
- [ ] Daily batch job to aggregate `regional_sales_analytics`
- [ ] Hourly job to update `daily_velocity` in `store_inventory`
- [ ] Scheduled job to calculate `health_score` in `warehouses`

### Phase 5: API Endpoints for InventoryGPT (Week 4-5)
- [ ] GET `/api/inventory-state` - Current inventory view
- [ ] GET `/api/warehouse-metrics` - Warehouse health
- [ ] GET `/api/regional-demand` - Regional sales data
- [ ] POST `/api/recommendations` - Store AI recommendations
- [ ] GET `/api/recommendations` - Retrieve pending recommendations
- [ ] PUT `/api/recommendations/:id/approve` - Approve recommendation
- [ ] PUT `/api/recommendations/:id/reject` - Reject recommendation

---

## Part 5: Query Examples for InventoryGPT

### Get Current Stock State
```sql
SELECT 
  i.code as sku,
  i.warehouse,
  i.product_name,
  i.stock,
  i.qty_reserved,
  (i.stock - i.qty_reserved) as sellable_stock,
  i.stock_category,
  w.health_score
FROM inventory i
JOIN warehouses w ON i.warehouse = w.warehouse_code
WHERE i.last_verified_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY i.stock_category, w.health_score DESC;
```

### Identify Dead Stock by Warehouse
```sql
SELECT 
  i.warehouse,
  i.code as sku,
  i.product_name,
  i.stock,
  wpm.dead_stock_ratio,
  COUNT(DISTINCT DATE(ils.event_time)) as movement_days
FROM inventory i
JOIN warehouse_performance_metrics wpm ON i.warehouse = wpm.warehouse_id
LEFT JOIN inventory_ledger_base ils ON i.code = ils.barcode 
  AND ils.event_time > DATE_SUB(NOW(), INTERVAL 30 DAY)
WHERE i.stock_category = 'DEAD_STOCK'
GROUP BY i.warehouse, i.code
HAVING movement_days < 5;
```

### Get Redistribution Opportunities
```sql
SELECT 
  HIGH_DEMAND.region,
  HIGH_DEMAND.sku,
  HIGH_DEMAND.daily_velocity,
  LOW_DEMAND.warehouse as source_warehouse,
  LOW_DEMAND.current_stock,
  (LOW_DEMAND.current_stock / HIGH_DEMAND.daily_velocity) as days_available,
  st.transfer_cost
FROM regional_sales_analytics HIGH_DEMAND
JOIN inventory LOW_DEMAND ON HIGH_DEMAND.sku = LOW_DEMAND.code 
  AND LOW_DEMAND.stock > (HIGH_DEMAND.daily_velocity * 7)
WHERE HIGH_DEMAND.velocity_trend = 'UP'
  AND HIGH_DEMAND.stockout_incidents > 0;
```

### Track AI Recommendation Accuracy
```sql
SELECT 
  air.agent_name,
  COUNT(*) as total_recommendations,
  SUM(CASE WHEN air.status = 'executed' THEN 1 ELSE 0 END) as executed,
  SUM(CASE WHEN air.actual_savings > 0 THEN 1 ELSE 0 END) as successful,
  ROUND(AVG(air.confidence_score), 2) as avg_confidence,
  ROUND(AVG(air.actual_savings), 2) as avg_actual_savings,
  ROUND(AVG(air.estimated_savings), 2) as avg_estimated_savings
FROM ai_inventory_recommendations air
WHERE air.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY air.agent_name;
```

---

## Part 6: Migration SQL Script

Save and run this SQL to set up all enhancements:

```sql
-- ============================================================
-- InventoryGPT Database Enhancement Script
-- Execute this on your inventory_db database
-- ============================================================

-- 1. Enhance INVENTORY table
ALTER TABLE inventory ADD COLUMN (
    product_name VARCHAR(255) DEFAULT NULL AFTER `product`,
    stock_category ENUM('ACTIVE','SLOW_MOVING','DEAD_STOCK','SEASONAL') DEFAULT 'ACTIVE',
    last_verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_inventory_gpt ON inventory(warehouse, stock_category, last_verified_at);

-- 2. Enhance INVENTORY_SNAPSHOTS table
ALTER TABLE inventory_snapshots ADD COLUMN (
    snapshot_type ENUM('PHYSICAL','PLANNED','RECONCILED') DEFAULT 'PHYSICAL',
    delta_from_previous INT DEFAULT NULL
);

-- 3. Enhance INVENTORY_LEDGER_BASE table
ALTER TABLE inventory_ledger_base ADD COLUMN (
    transfer_cost DECIMAL(10,2) DEFAULT NULL,
    ai_recommended BOOLEAN DEFAULT FALSE,
    recommendation_id BIGINT DEFAULT NULL
);
CREATE INDEX idx_ledger_ai ON inventory_ledger_base(ai_recommended, event_time);

-- 4. Enhance SELF_TRANSFER table
ALTER TABLE self_transfer ADD COLUMN (
    ai_recommendation_id BIGINT DEFAULT NULL,
    estimated_savings DECIMAL(10,2) DEFAULT NULL,
    actual_savings DECIMAL(10,2) DEFAULT NULL,
    execution_days INT DEFAULT NULL
);
CREATE INDEX idx_transfer_ai ON self_transfer(ai_recommendation_id, created_at);

-- 5. Enhance STORE_INVENTORY table
ALTER TABLE store_inventory ADD COLUMN (
    daily_velocity DECIMAL(10,2) DEFAULT NULL,
    days_of_stock INT GENERATED ALWAYS AS (
        CASE WHEN daily_velocity > 0 THEN stock / daily_velocity ELSE NULL END
    ) STORED,
    performance_tier ENUM('HIGH','MEDIUM','LOW') DEFAULT 'MEDIUM'
);
CREATE INDEX idx_store_performance ON store_inventory(store_code, performance_tier, stock);

-- 6. Enhance WAREHOUSES table
ALTER TABLE warehouses ADD COLUMN (
    capacity_units INT DEFAULT NULL,
    current_utilization INT DEFAULT NULL,
    avg_fulfillment_days DECIMAL(5,2) DEFAULT NULL,
    dead_stock_ratio DECIMAL(5,2) DEFAULT 0,
    health_score INT DEFAULT 100
);
CREATE INDEX idx_warehouse_health ON warehouses(health_score, dead_stock_ratio);

-- 7. Enhance PRODUCTS table
ALTER TABLE products ADD COLUMN (
    margin_percentage DECIMAL(5,2) DEFAULT 0,
    category VARCHAR(100) DEFAULT NULL,
    avg_daily_sales INT DEFAULT 0
);

-- 8. Create AI_INVENTORY_RECOMMENDATIONS table
CREATE TABLE IF NOT EXISTS ai_inventory_recommendations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  recommendation_type VARCHAR(100) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  source_warehouse VARCHAR(100) NOT NULL,
  target_warehouse VARCHAR(100) NOT NULL,
  recommended_quantity INT NOT NULL,
  estimated_savings DECIMAL(12,2),
  transfer_cost DECIMAL(10,2),
  expected_revenue_impact DECIMAL(12,2),
  status ENUM('pending','approved','rejected','executed','measured','closed') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT,
  execution_reference VARCHAR(255),
  actual_savings DECIMAL(12,2),
  measured_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status, created_at),
  INDEX idx_sku (sku),
  INDEX idx_warehouses (source_warehouse, target_warehouse),
  INDEX idx_agent (agent_name, confidence_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='AI Agent Recommendation Storage - Core InventoryGPT Decision History';

-- 9. Create WAREHOUSE_PERFORMANCE_METRICS table
CREATE TABLE IF NOT EXISTS warehouse_performance_metrics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  warehouse_id VARCHAR(100) NOT NULL,
  warehouse_name VARCHAR(255),
  total_transfers_executed INT DEFAULT 0,
  successful_transfers INT DEFAULT 0,
  failed_transfers INT DEFAULT 0,
  avg_fulfillment_time_days DECIMAL(5,2),
  dead_stock_ratio DECIMAL(5,2) DEFAULT 0,
  slow_moving_ratio DECIMAL(5,2) DEFAULT 0,
  stock_turnover_rate DECIMAL(5,2) DEFAULT 0,
  storage_utilization_pct DECIMAL(5,2) DEFAULT 0,
  available_capacity INT DEFAULT 0,
  rto_risk_score INT DEFAULT 0,
  delay_risk_level ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'LOW',
  health_score INT DEFAULT 100,
  last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_warehouse (warehouse_id),
  INDEX idx_health (health_score),
  INDEX idx_risk (delay_risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Warehouse Performance KPIs - Updated hourly for AI transfer decisions';

-- 10. Create REGIONAL_SALES_ANALYTICS table
CREATE TABLE IF NOT EXISTS regional_sales_analytics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  analysis_date DATE NOT NULL,
  period_type ENUM('DAILY','WEEKLY','MONTHLY') DEFAULT 'DAILY',
  region VARCHAR(100) NOT NULL,
  warehouse_id VARCHAR(100),
  sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(255),
  total_units_sold INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  avg_selling_price DECIMAL(10,2),
  daily_velocity DECIMAL(10,2) DEFAULT 0,
  velocity_trend ENUM('UP','STABLE','DOWN') DEFAULT 'STABLE',
  stockout_incidents INT DEFAULT 0,
  fulfillment_source VARCHAR(100),
  avg_delivery_days DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_region_sku (region, sku, analysis_date),
  INDEX idx_period (period_type, analysis_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Regional demand analytics - Feed InventoryGPT demand model';

-- ============================================================
-- End of InventoryGPT Enhancement Script
-- ============================================================
```

---

## Part 7: Success Metrics

After implementation, InventoryGPT will have:

| Metric | Baseline | Target |
|--------|----------|--------|
| AI Recommendation Latency | N/A | < 2 seconds |
| Recommendation Approval Rate | N/A | > 70% |
| Recommendation Accuracy | N/A | > 80% |
| Dead Stock Detection Time | Manual | < 24 hours automated |
| Transfer Cost Savings | Manual | 15-25% estimated |
| Inventory Turnover Improvement | Baseline | +10-15% |
| Warehouse Health Visibility | Manual | Real-time automated |

---

## Conclusion

Your database foundation is **excellent**. With these targeted enhancements:

✅ **7 existing tables** will be enhanced with InventoryGPT-specific columns  
✅ **3 new tables** will be created for AI decision memory  
✅ **Zero data loss** - all changes are additive  
✅ **30-day implementation** - Phase 1 to Phase 5  
✅ **Backward compatible** - Existing queries continue to work  

**Next Steps:**
1. Review this document with your team
2. Execute the migration SQL script in Phase 1
3. Schedule Phase 2 table creation
4. Begin Phase 3-4 concurrent with development
5. Deploy API endpoints in Phase 5

---

**Questions?** This document covers all data relationships required for InventoryGPT to operate effectively.
