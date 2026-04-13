# Inventory Management System - Features Documentation

## Overview
This document provides comprehensive documentation for key features in the Inventory Management System, including Movement Records tracking, Warehouse Activity management, Order Activity functionality, Stock Edit capabilities, and Return column tracking.

---

## 1. Movement Records Tab

### Location
`/inventory/movement-records` or accessible via Inventory section

### Files
**Frontend:**
- `src/app/inventory/movement-records/InventoryMovementRecords.jsx` - Main component
- `src/app/inventory/movement-records/movementRecords.module.css` - Styles

**Backend:**
- `controllers/movementRecordsController.js` - API controller
- `routes/inventoryRoutes.js` - Route definitions

### Purpose
Track all inventory movements including returns, damage reports, and recovery operations across all warehouses.

### Features

#### 1.1 Movement Types
- **Damage**: Track damaged inventory items
- **Recovery**: Track recovered/repaired items
- **Returns**: Track customer returns

#### 1.2 Statistics Dashboard
Real-time statistics displayed at the top:
- **Total Movements**: Overall count of all inventory movements
- **Damage Reports**: Number of damage incidents
- **Recoveries**: Number of recovered items
- **Returns**: Number of returned items

#### 1.3 Filters
- **Search**: Search by product name, barcode, or order reference
- **Movement Type**: Filter by Damage, Recovery, or Returns
- **Warehouse**: Filter by specific warehouse (GGM_WH, BLR_WH, MUM_WH, AMD_WH, HYD_WH)
- **Date Range**: Filter by date from/to

#### 1.4 Data Display
Table columns:
- Date & Time
- Type (with color-coded badges)
- Product Name & Variant
- Barcode
- Warehouse
- Quantity (with +/- indicators)
- Reference (Order/AWB)
- Status

#### 1.5 Export Functionality
- Export to CSV with all applied filters
- Includes all movement data for reporting

#### 1.6 Pagination
- 50 records per page
- Navigate through pages with Previous/Next buttons

### API Endpoints
```
GET /api/inventory/movement-records
Parameters:
- page: Page number
- limit: Items per page
- movement_type: damage|recover|return
- warehouse: Warehouse code
- search: Search query
- dateFrom: Start date (YYYY-MM-DD)
- dateTo: End date (YYYY-MM-DD)
```

### Permissions Required
- `INVENTORY_VIEW`: View movement records

---

## 2. Warehouse Order Activity

### Location
`/warehouse-order-activity`

### Files
**Frontend:**
- `src/app/warehouse-order-activity/page.jsx` - Main component
- `src/app/website-order-activity/websiteOrderActivity.module.css` - Styles

**Backend:**
- `controllers/warehouseOrderActivityController.js` - API controller
- `routes/warehouseOrderActivityRoutes.js` - Route definitions
- `routes/warehouseAddressRoutes.js` - Warehouse address API

**Database:**
- `warehouse-order-activity-schema.sql` - Database schema
- `updated-warehouse-activity-schema.sql` - Updated schema

**Setup Scripts:**
- `setup-warehouse-order-activity.js` - Setup script
- `install-warehouse-activity.sh` - Installation script
- `deploy-warehouse-activity.sh` - Deployment script

### Purpose
Manage and track all warehouse order activities including dispatch, cancellations, and order processing. Generate shipping manifests and export data.

### Features

#### 2.1 Activity Tracking
Tracks all orders processed through warehouses with complete details:
- AWB Number
- Order Reference
- Customer Name
- Product Name
- Logistics Partner
- Warehouse Location
- Processed By (Staff member)
- Status (Dispatch/Cancel)
- Remarks
- Created Date

#### 2.2 Advanced Filters
- **Status**: Dispatch or Cancel
- **Warehouse**: Filter by specific warehouse
- **Processed By**: Filter by staff member (warehouse-specific)
- **Customer Name**: Search by customer
- **AWB Number**: Search by AWB
- **Logistics**: Filter by logistics partner (Delhivery, Blue Dart, Ecom Express, DTDC)
- **Date Range**: From/To date filters

#### 2.3 Warehouse Staff Management
Dynamic staff lists per warehouse:
- **MUM_WH**: Abhishek, Aniket, Rashid
- **BLR_WH**: Mandhata, Rajbhar
- **GGM_WH**: Pankaj Rajput, Pankaj Rawat, Nagdeo Pandey
- **AMD_WH**: Rushant, Vikas
- **HYD_WH**: Divya, Robin

#### 2.4 Selection & Bulk Operations
- Checkbox selection for individual items
- Select All functionality
- Bulk export of selected items

#### 2.5 Export Options
Three export formats:
1. **CSV Export**: Spreadsheet format with all activity data
2. **Excel Export**: XLSX format with formatted columns
3. **PDF Shipping Manifest**: Professional delivery manifest with:
   - Company branding (HUNYHUNY OVERSEAS PVT LTD)
   - Logistics partner (DELHIVERY)
   - Complete order table with S.No, AWB, Customer, Product, Warehouse, Status
   - Delivery summary section
   - Signature section for delivery person
   - Company footer with contact details

#### 2.6 PDF Manifest Features
- Consolidated shipping manifest for multiple orders
- Warehouse address integration
- Barcode representation for products
- Professional layout with company branding
- Signature section for handover
- Auto-pagination for large orders

#### 2.7 Pagination
- 10 items per page
- Page navigation controls

### API Endpoints
```
GET /api/warehouse-order-activity
GET /api/warehouse-order-activity/warehouse-staff
GET /api/warehouse-order-activity/logistics
POST /api/warehouse-addresses
```

### Database Schema
```sql
warehouse_order_activity table:
- id
- awb
- order_ref
- customer_name
- product_name
- logistics
- warehouse
- processed_by
- status
- remarks
- created_at
```

---

## 3. Activity Button in OrderSheet.jsx

### Location
Order Sheet page - each order row has an "Activity" button

### Files
**Frontend:**
- `src/app/order/OrderSheet.jsx` - Main order sheet component with Activity button
- `src/app/order/order.module.css` - Styles
- `src/components/OrderActivityForm.jsx` - Activity form modal component
- `src/components/OrderActivityForm.module.css` - Activity form styles

**Backend:**
- `controllers/warehouseOrderActivityController.js` - Handles activity submission
- `routes/warehouseOrderActivityRoutes.js` - API routes

### Purpose
Submit warehouse order activity directly from the order sheet for tracking and manifest generation.

### Features

#### 3.1 Activity Form Modal
Opens when clicking "Activity" button on any order:
- Pre-filled with order data (AWB, Customer, Product, Warehouse)
- Editable fields for corrections
- Additional fields:
  - Logistics Partner selection
  - Processed By (staff member)
  - Status (Dispatch/Cancel)
  - Remarks

#### 3.2 Data Flow
1. User clicks "Activity" button on order
2. Modal opens with pre-populated data from order
3. User confirms/edits details
4. Submits to `warehouse_order_activity` table
5. Data becomes available in Warehouse Activity page
6. Can be included in shipping manifests

#### 3.3 Integration
- Seamless integration with Order Sheet
- No page navigation required
- Real-time submission
- Success/error feedback

### Implementation
```javascript
// Open activity form
const openOrderActivityForm = (order) => {
    setSelectedOrderForActivity(order);
    setShowOrderActivityForm(true);
};

// Submit activity
const handleOrderActivitySubmit = async (formData) => {
    const response = await fetch('/api/warehouse-order-activity', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
};
```

---

## 4. Stock Edit in InventorySheet.jsx

### Location
Inventory Sheet page - "Edit Stock" button on each inventory item

### Files
**Frontend:**
- `src/app/inventory/InventorySheet.jsx` - Main inventory component with Stock Edit modal
- `src/app/inventory/inventory.module.css` - Styles

**Backend:**
- `controllers/inventoryController.js` - Inventory management controller
- `controllers/manualStockController.js` - Manual stock update controller
- `routes/inventoryRoutes.js` - API routes

**Database:**
- `complete-inventory-analysis.sql` - Inventory database analysis

### Purpose
Manually adjust inventory stock levels with proper tracking and audit trail.

### Features

#### 4.1 Stock Update Modal
Opens when clicking "Edit Stock" button:
- Shows current stock level
- Product details (name, barcode, warehouse)
- Update type selection
- Quantity input
- Reason selection
- Notes field

#### 4.2 Update Types
Three types of stock adjustments:
1. **Adjustment**: Direct stock level adjustment
2. **Stock In**: Add stock (receiving, returns)
3. **Stock Out**: Remove stock (damage, loss, theft)

#### 4.3 Reason Codes
Pre-defined reasons for stock changes:
- Physical Count Correction
- Damage
- Loss/Theft
- Return from Customer
- Supplier Return
- Transfer
- System Error Correction
- Other (with notes)

#### 4.4 Validation
- Quantity must be positive number
- Reason is required
- Notes optional but recommended
- Current stock displayed for reference

#### 4.5 Audit Trail
All stock updates are logged with:
- Product ID and Barcode
- Warehouse
- Adjustment Type
- Quantity Changed
- Reason
- Notes
- Timestamp
- User who made the change

#### 4.6 Real-time Updates
- Immediate UI update after successful save
- Stock level refreshes automatically
- Success/error messages displayed

### API Endpoint
```
POST /api/inventory/manual-stock-update
Body:
{
    "product_id": number,
    "barcode": string,
    "warehouse": string,
    "adjustment_type": "adjustment|in|out",
    "quantity": number,
    "reason": string,
    "notes": string,
    "current_stock": number
}
```

### Implementation
```javascript
const openStockUpdateModal = (item) => {
    setSelectedItemForUpdate(item);
    setShowStockUpdateModal(true);
};

const handleStockUpdate = async () => {
    const updateData = {
        product_id: selectedItemForUpdate.id,
        barcode: selectedItemForUpdate.barcode,
        warehouse: selectedItemForUpdate.warehouse,
        adjustment_type: stockUpdateType,
        quantity: quantity,
        reason: stockUpdateReason,
        notes: stockUpdateNotes
    };
    
    await fetch('/api/inventory/manual-stock-update', {
        method: 'POST',
        body: JSON.stringify(updateData)
    });
};
```

### Permissions Required
- `INVENTORY_EDIT`: Edit stock levels
- `INVENTORY_VIEW`: View inventory

---

## 5. Return Column in Table

### Location
Multiple locations:
- Order Sheet table
- Movement Records table
- Inventory Sheet (as part of movement tracking)

### Files
**Frontend:**
- `src/app/order/OrderSheet.jsx` - Order sheet with return count display
- `src/app/inventory/movement-records/InventoryMovementRecords.jsx` - Movement records with return tracking
- `src/app/inventory/InventorySheet.jsx` - Inventory with return data

**Backend:**
- `controllers/movementRecordsController.js` - Movement records including returns
- `controllers/orderTrackingController.js` - Order tracking with return data
- `routes/inventoryRoutes.js` - Inventory routes

### Purpose
Track and display return counts for products and orders.

### Features

#### 5.1 Return Count Display
- Shows number of returns for each product/order
- Color-coded for visibility
- Integrated with movement records

#### 5.2 Return Tracking
Returns are tracked through:
- Movement Records system (movement_type: 'return')
- Linked to original orders via AWB/Order Reference
- Associated with specific products and warehouses

#### 5.3 Data Sources
Return data comes from:
- `inventory_movement_records` table with type='return'
- Aggregated counts displayed in main tables
- Real-time updates when returns are processed

#### 5.4 Return Processing Flow
1. Customer initiates return
2. Return logged in Movement Records
3. Return count incremented for product
4. Stock adjusted in inventory
5. Return visible in all relevant tables

### Implementation in OrderSheet
```javascript
// In order mapping
return_count: 0, // Not tracked in warehouse_dispatch
// Returns are tracked separately in movement_records
```

### Implementation in Movement Records
```javascript
const MOVEMENT_TYPES = [
    { value: 'return', label: 'Returns', icon: RotateCcw, color: '#3b82f6' }
];

// Stats include return count
stats: {
    returnCount: 0
}
```

---

## Common Features Across All Modules

### 1. Permission-Based Access
All features respect user permissions:
- View permissions for read-only access
- Edit permissions for modifications
- Export permissions for data export
- Warehouse-specific permissions

### 2. Real-time Updates
- Immediate UI feedback
- Success/error toast messages
- Auto-refresh after changes
- Optimistic UI updates

### 3. Responsive Design
- Mobile-friendly layouts
- Touch-optimized controls
- Adaptive table displays
- Modal dialogs for forms

### 4. Data Export
- CSV format for spreadsheets
- Excel format with formatting
- PDF format for documents
- Filtered export (only selected/filtered data)

### 5. Search & Filter
- Real-time search
- Multiple filter combinations
- Date range filtering
- Warehouse filtering
- Status filtering

### 6. Pagination
- Configurable page sizes
- Page navigation controls
- Total count display
- Current page indicator

---

## Technical Stack

### Frontend
- **Framework**: Next.js 16 (React)
- **Styling**: CSS Modules
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **Excel Export**: xlsx
- **State Management**: React Hooks

### Backend
- **Server**: Node.js + Express
- **Database**: MySQL
- **Authentication**: JWT tokens
- **API**: RESTful endpoints

### Database Tables
- `inventory` - Product inventory data
- `warehouse_dispatch` - Dispatch records
- `warehouse_order_activity` - Order activity tracking
- `inventory_movement_records` - Movement tracking
- `manual_stock_adjustments` - Stock edit audit trail

---

## Best Practices

### 1. Data Integrity
- Always validate input data
- Use transactions for stock updates
- Maintain audit trails
- Log all changes

### 2. User Experience
- Provide clear feedback
- Show loading states
- Handle errors gracefully
- Confirm destructive actions

### 3. Performance
- Paginate large datasets
- Cache frequently accessed data
- Optimize database queries
- Use indexes on search fields

### 4. Security
- Validate permissions on every request
- Sanitize user input
- Use parameterized queries
- Implement rate limiting

---

## Future Enhancements

### Planned Features
1. **Batch Operations**: Bulk stock updates
2. **Advanced Analytics**: Movement trends and insights
3. **Automated Alerts**: Low stock notifications
4. **Barcode Scanning**: Mobile barcode integration
5. **Return Automation**: Automated return processing
6. **Integration**: Third-party logistics integration

---

## File Reference Guide

### Frontend Components

#### Pages
- `src/app/inventory/InventorySheet.jsx` - Main inventory management page
- `src/app/inventory/movement-records/InventoryMovementRecords.jsx` - Movement records tracking
- `src/app/order/OrderSheet.jsx` - Order management and tracking
- `src/app/warehouse-order-activity/page.jsx` - Warehouse activity management
- `src/app/website-order-activity/page.jsx` - Website order activity

#### Components
- `src/components/OrderActivityForm.jsx` - Order activity submission form
- `src/components/OperationsTabs.jsx` - Operations tab navigation
- `src/components/TopNavBar.jsx` - Top navigation bar
- `src/components/ui/sidebar.jsx` - Sidebar navigation

#### Styles
- `src/app/inventory/inventory.module.css` - Inventory page styles
- `src/app/inventory/movement-records/movementRecords.module.css` - Movement records styles
- `src/app/order/order.module.css` - Order sheet styles
- `src/app/website-order-activity/websiteOrderActivity.module.css` - Activity page styles
- `src/components/OrderActivityForm.module.css` - Activity form styles
- `src/components/OperationsTabs.module.css` - Operations tabs styles

### Backend Controllers

- `controllers/inventoryController.js` - Inventory CRUD operations
- `controllers/manualStockController.js` - Manual stock adjustments
- `controllers/movementRecordsController.js` - Movement records tracking
- `controllers/orderTrackingController.js` - Order tracking and status updates
- `controllers/warehouseOrderActivityController.js` - Warehouse activity management
- `controllers/productController.js` - Product management
- `controllers/damageRecoveryController.js` - Damage and recovery tracking

### Backend Routes

- `routes/inventoryRoutes.js` - Inventory API endpoints
- `routes/warehouseOrderActivityRoutes.js` - Warehouse activity endpoints
- `routes/warehouseAddressRoutes.js` - Warehouse address endpoints
- `routes/permissionsRoutes.js` - Permission management

### Database Schemas

- `warehouse-order-activity-schema.sql` - Warehouse activity table schema
- `updated-warehouse-activity-schema.sql` - Updated activity schema
- `complete-inventory-analysis.sql` - Inventory database analysis
- `fix-audit-logs-table.sql` - Audit logs table fixes

### Setup & Deployment Scripts

- `setup-warehouse-order-activity.js` - Warehouse activity setup
- `install-warehouse-activity.sh` - Installation script
- `deploy-warehouse-activity.sh` - Deployment script
- `deploy-warehouse-activity.cmd` - Windows deployment

### Context & Services

- `src/contexts/PermissionsContext.jsx` - Permission management context
- `services/DatabaseOnlyNotificationService.js` - Notification service

### Middleware

- `middleware/auth.js` - Authentication middleware

### Documentation Files

- `FEATURES_DOCUMENTATION.md` - This file
- `WAREHOUSE_ORDER_ACTIVITY_IMPLEMENTATION.md` - Warehouse activity implementation guide

---

## Support & Maintenance

### Common Issues

#### Issue: Stock count mismatch
**Solution**: Use Manual Stock Update with "Physical Count Correction" reason

#### Issue: Missing movement records
**Solution**: Check date filters and warehouse selection

#### Issue: Export not working
**Solution**: Verify permissions and check browser pop-up blocker

#### Issue: Activity form not submitting
**Solution**: Ensure all required fields are filled

### Contact
For technical support or feature requests, contact the development team.

---

## Changelog

### Version 1.0 (Current)
- Movement Records tracking
- Warehouse Activity management
- Order Activity integration
- Manual Stock Edit
- Return column tracking
- PDF Manifest generation
- Multi-format export

---

**Last Updated**: February 2026
**Document Version**: 1.0
**System Version**: Stocksphere Phase 1
