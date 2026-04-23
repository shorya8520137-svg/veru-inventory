# Self Transfer & Timeline Implementation Guide

## Overview
This guide covers the complete implementation of the Self Transfer Module and Store Timeline for the inventory management system.

## Architecture

### Components

#### 1. Frontend Components
- **SelfTransferModule.jsx** - Main transfer creation interface
- **StoreTimeline.jsx** - Timeline visualization for stores

#### 2. Backend Routes
- **selfTransferRoutes.js** - Transfer CRUD operations
- **timelineRoutes.js** - Timeline event management
- **warehouseManagementRoutes.js** - Warehouse and store management

#### 3. Database Tables
- **inventory_transfers** - Transfer records
- **transfer_items** - Items in each transfer
- **timeline_events** - Audit trail of events

## Features

### Self Transfer Module

#### Transfer Types
1. **Warehouse → Warehouse** (W→W)
   - Direct transfer between warehouses
   - No shipment required by default
   - Instant stock update

2. **Warehouse → Store** (W→S)
   - Transfer from warehouse to retail store
   - Shipment required by default
   - Courier partner selection
   - Tracking ID generation

3. **Store → Warehouse** (S→W)
   - Return stock from store to warehouse
   - Shipment required by default
   - Reverse logistics

4. **Store → Store** (S→S)
   - Inter-store transfers
   - No shipment required by default
   - Direct transfer

#### Key Features
- ✅ 4-way transfer type selector
- ✅ Dynamic form labels based on transfer type
- ✅ Source/Destination dropdowns with search
- ✅ Editable items table
- ✅ Product search and selection
- ✅ Available quantity display
- ✅ Transfer quantity input
- ✅ Unit selector (pcs, box, kg)
- ✅ Add/Remove item buttons
- ✅ Shipment section with courier selection
- ✅ Estimated delivery date
- ✅ Notes/Remarks field
- ✅ Draft & Initiate Transfer buttons
- ✅ Validation (prevent same source/dest, insufficient stock)

### Store Timeline Module

#### Features
- ✅ Store selector dropdown
- ✅ Filter by event type (All, Incoming, Outgoing, Initial Stock)
- ✅ Timeline visualization with color-coded events
- ✅ Event cards with:
  - Event type and label
  - Source/Destination information
  - Quantity transferred
  - Stock before/after
  - Timestamp
  - Notes
  - Status badge
  - Initial Stock flag
- ✅ Store info card (name, location, manager, type)
- ✅ Export button

#### Event Types
- **TRANSFER_IN** (Green) - Stock received
- **TRANSFER_OUT** (Red) - Stock transferred
- **INITIAL_STOCK** (Blue) - Initial stock received
- **IN_TRANSIT** (Yellow) - Shipment in transit
- **RECEIVED** (Green) - Shipment received
- **DAMAGED** (Red) - Damaged stock

## API Endpoints

### Self Transfer Endpoints

#### GET /api/self-transfer
Get all transfers
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.giftgala.in/api/self-transfer
```

**Response:**
```json
{
  "success": true,
  "transfers": [
    {
      "id": 1,
      "transferId": "TRF_1234567890",
      "sourceType": "warehouse",
      "sourceId": 1,
      "destinationType": "store",
      "destinationId": 1,
      "transferStatus": "COMPLETED",
      "requiresShipment": true,
      "courierPartner": "fedex",
      "trackingId": "SHP_1234567890",
      "estimatedDelivery": "2026-04-30",
      "notes": "Test transfer",
      "transferDate": "2026-04-23",
      "created_at": "2026-04-23T10:30:00Z",
      "updated_at": "2026-04-23T10:30:00Z"
    }
  ]
}
```

#### POST /api/self-transfer
Create new transfer
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "warehouse",
    "sourceId": 1,
    "destinationType": "store",
    "destinationId": 1,
    "items": [
      {
        "productId": 1,
        "transferQty": 10,
        "unit": "pcs"
      }
    ],
    "requiresShipment": true,
    "courierPartner": "fedex",
    "estimatedDelivery": "2026-04-30",
    "notes": "Test transfer"
  }' \
  https://api.giftgala.in/api/self-transfer
```

**Response:**
```json
{
  "success": true,
  "message": "Transfer initiated successfully",
  "transferId": "TRF_1234567890",
  "shipmentId": "SHP_1234567890"
}
```

#### GET /api/self-transfer/:id
Get transfer details
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.giftgala.in/api/self-transfer/TRF_1234567890
```

#### PUT /api/self-transfer/:id
Update transfer status
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transferStatus": "IN_TRANSIT",
    "trackingId": "TRACK123"
  }' \
  https://api.giftgala.in/api/self-transfer/TRF_1234567890
```

### Timeline Endpoints

#### GET /api/timeline
Get timeline events
```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://api.giftgala.in/api/timeline?entityType=store&entityId=1&type=all"
```

**Query Parameters:**
- `entityType` - 'warehouse' or 'store'
- `entityId` - ID of the entity
- `type` - Event type filter ('all', 'TRANSFER_IN', 'TRANSFER_OUT', 'INITIAL_STOCK')

**Response:**
```json
{
  "success": true,
  "timeline": [
    {
      "id": 1,
      "entityType": "store",
      "entityId": 1,
      "eventType": "TRANSFER_IN",
      "source": "warehouse_1",
      "destination": "store_1",
      "quantity": 10,
      "unit": "pcs",
      "stockBefore": 0,
      "stockAfter": 10,
      "notes": "Initial stock received",
      "transferId": "TRF_1234567890",
      "isInitialTransfer": true,
      "status": "COMPLETED",
      "timestamp": "2026-04-23T10:30:00Z"
    }
  ]
}
```

#### POST /api/timeline
Create timeline event (internal use)
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "store",
    "entityId": 1,
    "eventType": "TRANSFER_IN",
    "source": "warehouse_1",
    "destination": "store_1",
    "quantity": 10,
    "unit": "pcs",
    "stockBefore": 0,
    "stockAfter": 10,
    "notes": "Stock received",
    "transferId": "TRF_1234567890",
    "isInitialTransfer": false,
    "status": "COMPLETED"
  }' \
  https://api.giftgala.in/api/timeline
```

#### GET /api/timeline/summary/:entityType/:entityId
Get timeline summary
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.giftgala.in/api/timeline/summary/store/1
```

**Response:**
```json
{
  "success": true,
  "summary": [
    {
      "eventType": "TRANSFER_IN",
      "count": 5,
      "totalQuantity": 50,
      "lastEvent": "2026-04-23T10:30:00Z"
    }
  ]
}
```

## Database Schema

### inventory_transfers
```sql
CREATE TABLE inventory_transfers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transferId VARCHAR(50) UNIQUE NOT NULL,
    sourceType ENUM('warehouse', 'store') NOT NULL,
    sourceId INT NOT NULL,
    destinationType ENUM('warehouse', 'store') NOT NULL,
    destinationId INT NOT NULL,
    transferStatus ENUM('DRAFT', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
    requiresShipment BOOLEAN DEFAULT FALSE,
    courierPartner VARCHAR(100),
    trackingId VARCHAR(100),
    estimatedDelivery DATE,
    notes TEXT,
    transferDate DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_source (sourceType, sourceId),
    INDEX idx_destination (destinationType, destinationId),
    INDEX idx_status (transferStatus),
    INDEX idx_created (created_at)
);
```

### transfer_items
```sql
CREATE TABLE transfer_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transferId VARCHAR(50) NOT NULL,
    productId INT NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transferId) REFERENCES inventory_transfers(transferId) ON DELETE CASCADE,
    INDEX idx_transfer (transferId),
    INDEX idx_product (productId)
);
```

### timeline_events
```sql
CREATE TABLE timeline_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entityType ENUM('warehouse', 'store') NOT NULL,
    entityId INT NOT NULL,
    eventType ENUM('TRANSFER_IN', 'TRANSFER_OUT', 'INITIAL_STOCK', 'IN_TRANSIT', 'RECEIVED', 'DAMAGED', 'ADJUSTMENT') NOT NULL,
    source VARCHAR(100),
    destination VARCHAR(100),
    quantity INT NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    stockBefore INT DEFAULT 0,
    stockAfter INT DEFAULT 0,
    notes TEXT,
    transferId VARCHAR(50),
    isInitialTransfer BOOLEAN DEFAULT FALSE,
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED') DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entityType, entityId),
    INDEX idx_event_type (eventType),
    INDEX idx_transfer (transferId),
    INDEX idx_created (created_at),
    INDEX idx_initial (isInitialTransfer)
);
```

## Testing

### Manual Testing Steps

1. **Test Self Transfer Creation**
   - Navigate to Inventory → Self Transfer
   - Select transfer type (W→W, W→S, S→W, S→S)
   - Select source and destination
   - Add items
   - Click "Initiate Transfer"
   - Verify transfer is created

2. **Test Store Timeline**
   - Navigate to Inventory → Store Timeline
   - Select a store
   - Verify timeline events are displayed
   - Filter by event type
   - Check stock before/after values

3. **Test API Endpoints**
   - Use provided test script: `test-self-transfer-api.js`
   - Verify all endpoints return correct responses
   - Check error handling

### Automated Testing
```bash
node test-self-transfer-api.js
```

## Deployment

### Steps
1. ✅ Database migration applied
2. ✅ Backend routes implemented
3. ✅ Frontend components created
4. ✅ API endpoints tested
5. ⏳ Deploy to production
6. ⏳ Monitor performance

### Production Checklist
- [ ] Database backups configured
- [ ] Error logging enabled
- [ ] Performance monitoring active
- [ ] User documentation updated
- [ ] Staff training completed

## Troubleshooting

### Common Issues

#### 1. "Source and destination cannot be the same"
**Solution:** Select different source and destination entities

#### 2. "Insufficient stock"
**Solution:** Verify available quantity at source location

#### 3. "Missing required fields"
**Solution:** Ensure all required fields are filled:
- Source and destination selected
- At least one item added
- Transfer quantity > 0

#### 4. Timeline events not showing
**Solution:** 
- Verify transfer was created successfully
- Check if timeline events were created automatically
- Verify entityType and entityId match

## Performance Optimization

### Indexes
All tables have proper indexes for:
- Entity lookups (warehouse/store)
- Status filtering
- Date range queries
- Transfer lookups

### Query Optimization
- Use indexed columns in WHERE clauses
- Limit results with pagination
- Cache frequently accessed data

## Future Enhancements

1. **Bulk Transfers** - Upload multiple transfers via CSV
2. **Transfer Templates** - Save and reuse transfer configurations
3. **Approval Workflow** - Add approval step before transfer
4. **Real-time Tracking** - Integrate with courier APIs
5. **Predictive Analytics** - Suggest optimal transfer quantities
6. **Mobile App** - Mobile interface for transfers
7. **Barcode Scanning** - Scan products during transfer
8. **Multi-language Support** - Localization for different regions

## Support

For issues or questions:
1. Check this guide
2. Review API documentation
3. Check database logs
4. Contact development team

---

**Last Updated:** April 23, 2026  
**Status:** ✅ READY FOR PRODUCTION
