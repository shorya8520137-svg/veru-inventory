# Server Deployment Guide - Inventory Management Features

## Document Purpose
This guide provides complete instructions for deploying new inventory management features to the production server. Share this with your server team for implementation.

---

## Overview of New Features

1. **Damage & Stock Update in InventorySheet.jsx**
2. **Movement Records Tab**
3. **Warehouse Order Activity**
4. **Activity Button in OrderSheet.jsx**

---

## FEATURE 1: Damage & Stock Update in InventorySheet.jsx

### Description
Manual stock adjustment functionality with damage tracking and audit trail.

### Files to Deploy

#### Frontend Files
```
src/app/inventory/InventorySheet.jsx
src/app/inventory/inventory.module.css
```

#### Backend Files
```
controllers/inventoryController.js
controllers/manualStockController.js
controllers/damageRecoveryController.js
routes/inventoryRoutes.js
```

#### Database Files
```
complete-inventory-analysis.sql
fix-adjustment-type-column.cmd (or .sh for Linux)
```

### Changes Performed

#### 1. InventorySheet.jsx Changes
**Location**: Lines 400-600 (Stock Update Modal)

**Added Features**:
- Stock Update Modal with form
- Three update types: Adjustment, Stock In, Stock Out
- Reason selection dropdown
- Notes field for additional context
- Real-time validation
- Success/error feedback

**Key Functions Added**:
```javascript
openStockUpdateModal(item)
closeStockUpdateModal()
handleStockUpdate()
```

**State Variables Added**:
```javascript
showStockUpdateModal
selectedItemForUpdate
stockUpdateType
stockUpdateQuantity
stockUpdateReason
stockUpdateNotes
updatingStock
```

#### 2. Backend API Changes

**New Endpoint**: `POST /api/inventory/manual-stock-update`

**Controller**: `manualStockController.js`

**Request Body**:
```json
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

**Response**:
```json
{
  "success": true,
  "message": "Stock updated successfully",
  "new_stock": number
}
```

### Database Schema Required

**Table**: `manual_stock_adjustments`
```sql
CREATE TABLE IF NOT EXISTS manual_stock_adjustments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  barcode VARCHAR(50),
  warehouse VARCHAR(50),
  adjustment_type ENUM('adjustment', 'in', 'out'),
  quantity INT NOT NULL,
  previous_stock INT,
  new_stock INT,
  reason VARCHAR(255),
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Deployment Steps

1. **Backup Database**
```bash
mysqldump -u root -p inventory_db > backup_$(date +%Y%m%d).sql
```

2. **Deploy Frontend**
```bash
cd ~/inventoryfullstack
git pull origin stocksphere-phase-1-complete
npm run build
pm2 restart frontend
```

3. **Deploy Backend**
```bash
# Copy controller files
cp controllers/manualStockController.js ~/inventoryfullstack/controllers/
cp controllers/inventoryController.js ~/inventoryfullstack/controllers/
cp controllers/damageRecoveryController.js ~/inventoryfullstack/controllers/

# Restart server
pm2 restart server
```

4. **Run Database Migration**
```bash
mysql -u root -p inventory_db < complete-inventory-analysis.sql
```

---


## FEATURE 2: Movement Records Tab

### Description
Track all inventory movements including damage, recovery, and returns across warehouses.

### Files to Deploy

#### Frontend Files
```
src/app/inventory/movement-records/InventoryMovementRecords.jsx
src/app/inventory/movement-records/movementRecords.module.css
```

#### Backend Files
```
controllers/movementRecordsController.js
routes/inventoryRoutes.js (updated)
```

#### Database Files
```
fix-audit-logs-table.sql
```

### Changes Performed

#### 1. InventoryMovementRecords.jsx
**New Component**: Complete movement tracking interface

**Features Implemented**:
- Real-time movement statistics (Total, Damage, Recovery, Returns)
- Advanced filtering (Type, Warehouse, Date Range, Search)
- Pagination (50 records per page)
- CSV Export functionality
- Color-coded movement types
- Responsive table design

**Key Functions**:
```javascript
loadMovementRecords()
exportRecords()
formatDate()
getMovementTypeInfo()
```

**API Integration**:
```javascript
GET /api/inventory/movement-records
Parameters:
- page, limit
- movement_type: damage|recover|return
- warehouse: GGM_WH|BLR_WH|MUM_WH|AMD_WH|HYD_WH
- search: product/barcode search
- dateFrom, dateTo: YYYY-MM-DD
```

#### 2. Backend Controller

**File**: `controllers/movementRecordsController.js`

**New Functions**:
```javascript
getMovementRecords(req, res)
getMovementStats(req, res)
exportMovementRecords(req, res)
```

**Database Query**:
```sql
SELECT 
  mr.*,
  p.product_name,
  p.barcode,
  i.warehouse
FROM inventory_movement_records mr
LEFT JOIN products p ON mr.product_id = p.id
LEFT JOIN inventory i ON mr.product_id = i.product_id
WHERE movement_type = ?
  AND warehouse = ?
  AND DATE(event_time) BETWEEN ? AND ?
ORDER BY event_time DESC
LIMIT ? OFFSET ?
```

### Database Schema Required

**Table**: `inventory_movement_records`
```sql
CREATE TABLE IF NOT EXISTS inventory_movement_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  barcode VARCHAR(50),
  warehouse VARCHAR(50),
  movement_type ENUM('damage', 'recover', 'return') NOT NULL,
  quantity INT NOT NULL,
  direction ENUM('IN', 'OUT') NOT NULL,
  reference VARCHAR(100),
  order_ref VARCHAR(100),
  awb VARCHAR(100),
  event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  notes TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_movement_type (movement_type),
  INDEX idx_warehouse (warehouse),
  INDEX idx_event_time (event_time)
);
```

### Deployment Steps

1. **Deploy Frontend Component**
```bash
cd ~/inventoryfullstack
git pull origin stocksphere-phase-1-complete

# Verify files exist
ls -la src/app/inventory/movement-records/

npm run build
pm2 restart frontend
```

2. **Deploy Backend Controller**
```bash
cp controllers/movementRecordsController.js ~/inventoryfullstack/controllers/
pm2 restart server
```

3. **Run Database Migration**
```bash
mysql -u root -p inventory_db < fix-audit-logs-table.sql
```

4. **Verify Deployment**
```bash
# Check if table exists
mysql -u root -p inventory_db -e "DESCRIBE inventory_movement_records;"

# Test API endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://54.254.184.54:8443/api/inventory/movement-records?limit=10
```

---


## FEATURE 3: Warehouse Order Activity

### Description
Comprehensive warehouse activity tracking with PDF manifest generation and multi-format export.

### Files to Deploy

#### Frontend Files
```
src/app/warehouse-order-activity/page.jsx
src/app/website-order-activity/websiteOrderActivity.module.css
```

#### Backend Files
```
controllers/warehouseOrderActivityController.js
routes/warehouseOrderActivityRoutes.js
routes/warehouseAddressRoutes.js
```

#### Database Files
```
warehouse-order-activity-schema.sql
updated-warehouse-activity-schema.sql
update-warehouse-activity-with-staff.sql
```

#### Setup Scripts
```
setup-warehouse-order-activity.js
install-warehouse-activity.sh
deploy-warehouse-activity.sh
```

### Changes Performed

#### 1. Warehouse Activity Page Component

**File**: `src/app/warehouse-order-activity/page.jsx`

**Features Implemented**:
- Activity tracking table with filters
- Checkbox selection for bulk operations
- Three export formats: CSV, Excel, PDF
- PDF Shipping Manifest generation with:
  - Company branding (HUNYHUNY OVERSEAS PVT LTD)
  - Logistics partner integration (DELHIVERY)
  - Warehouse address integration
  - Professional layout with signatures
  - Auto-pagination for large orders
- Advanced filtering:
  - Status (Dispatch/Cancel)
  - Warehouse selection
  - Staff member (warehouse-specific)
  - Customer name search
  - AWB number search
  - Logistics partner
  - Date range
- Pagination (10 items per page)

**Key Functions**:
```javascript
fetchActivities()
fetchWarehouseStaff()
fetchLogistics()
downloadCSV()
downloadExcel()
downloadPDF()
generatePDF(activities)
drawShippingManifest(pdf, activities, addresses)
fetchWarehouseAddresses(activities)
```

**Dependencies**:
```json
{
  "jspdf": "^2.5.1",
  "xlsx": "^0.18.5"
}
```

#### 2. Backend Controllers

**File**: `controllers/warehouseOrderActivityController.js`

**Endpoints**:
```javascript
GET  /api/warehouse-order-activity
GET  /api/warehouse-order-activity/warehouse-staff
GET  /api/warehouse-order-activity/logistics
POST /api/warehouse-order-activity
POST /api/warehouse-addresses
```

**Key Functions**:
```javascript
getAllActivities(req, res)
getWarehouseStaff(req, res)
getLogistics(req, res)
createActivity(req, res)
getWarehouseAddresses(req, res)
```

### Database Schema Required

**Table**: `warehouse_order_activity`
```sql
CREATE TABLE IF NOT EXISTS warehouse_order_activity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  awb VARCHAR(100),
  order_ref VARCHAR(100),
  customer_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  logistics VARCHAR(100),
  warehouse VARCHAR(50) NOT NULL,
  processed_by VARCHAR(100),
  status ENUM('Dispatch', 'Cancel') DEFAULT 'Dispatch',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_warehouse (warehouse),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_awb (awb),
  INDEX idx_order_ref (order_ref)
);
```

**Table**: `warehouse_staff`
```sql
CREATE TABLE IF NOT EXISTS warehouse_staff (
  id INT PRIMARY KEY AUTO_INCREMENT,
  warehouse VARCHAR(50) NOT NULL,
  staff_name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_warehouse_staff (warehouse, staff_name)
);

-- Insert default staff
INSERT INTO warehouse_staff (warehouse, staff_name) VALUES
('MUM_WH', 'Abhishek'),
('MUM_WH', 'Aniket'),
('MUM_WH', 'Rashid'),
('BLR_WH', 'Mandhata'),
('BLR_WH', 'Rajbhar'),
('GGM_WH', 'Pankaj Rajput'),
('GGM_WH', 'Pankaj Rawat'),
('GGM_WH', 'Nagdeo Pandey'),
('AMD_WH', 'Rushant'),
('AMD_WH', 'Vikas'),
('HYD_WH', 'Divya'),
('HYD_WH', 'Robin');
```

**Table**: `logistics_partners`
```sql
CREATE TABLE IF NOT EXISTS logistics_partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default logistics
INSERT INTO logistics_partners (name) VALUES
('Delhivery'),
('Blue Dart'),
('Ecom Express'),
('DTDC');
```

**Table**: `warehouse_addresses`
```sql
CREATE TABLE IF NOT EXISTS warehouse_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  warehouse_code VARCHAR(50) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert warehouse addresses
INSERT INTO warehouse_addresses (warehouse_code, address, city, state, pincode, phone) VALUES
('GGM_WH', 'Plot No. 123, Sector 45, Industrial Area, Gurgaon', 'Gurgaon', 'Haryana', '122001', '9263006000'),
('BLR_WH', 'No. 456, Whitefield Road, Bangalore', 'Bangalore', 'Karnataka', '560066', '9263006000'),
('MUM_WH', 'Godown No. 789, Andheri East, Mumbai', 'Mumbai', 'Maharashtra', '400069', '9263006000'),
('AMD_WH', 'Plot No. 321, GIDC Estate, Ahmedabad', 'Ahmedabad', 'Gujarat', '380026', '9263006000'),
('HYD_WH', 'Warehouse No. 654, Kukatpally, Hyderabad', 'Hyderabad', 'Telangana', '500072', '9263006000');
```

### Deployment Steps

1. **Install Dependencies**
```bash
cd ~/inventoryfullstack
npm install jspdf xlsx
```

2. **Run Setup Script**
```bash
# Make script executable
chmod +x install-warehouse-activity.sh

# Run installation
./install-warehouse-activity.sh
```

3. **Or Manual Deployment**
```bash
# Deploy frontend
git pull origin stocksphere-phase-1-complete
npm run build
pm2 restart frontend

# Deploy backend
cp controllers/warehouseOrderActivityController.js ~/inventoryfullstack/controllers/
cp routes/warehouseOrderActivityRoutes.js ~/inventoryfullstack/routes/
cp routes/warehouseAddressRoutes.js ~/inventoryfullstack/routes/

# Update server.js to include new routes
# Add these lines to server.js:
# const warehouseActivityRoutes = require('./routes/warehouseOrderActivityRoutes');
# app.use('/api/warehouse-order-activity', warehouseActivityRoutes);
# const warehouseAddressRoutes = require('./routes/warehouseAddressRoutes');
# app.use('/api/warehouse-addresses', warehouseAddressRoutes);

pm2 restart server
```

4. **Run Database Migrations**
```bash
mysql -u root -p inventory_db < warehouse-order-activity-schema.sql
mysql -u root -p inventory_db < updated-warehouse-activity-schema.sql
mysql -u root -p inventory_db < update-warehouse-activity-with-staff.sql
```

5. **Verify Deployment**
```bash
# Check tables
mysql -u root -p inventory_db -e "SHOW TABLES LIKE 'warehouse%';"

# Test API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://54.254.184.54:8443/api/warehouse-order-activity

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://54.254.184.54:8443/api/warehouse-order-activity/warehouse-staff
```

---


## FEATURE 4: Activity Button in OrderSheet.jsx

### Description
Direct order activity submission from Order Sheet with modal form integration.

### Files to Deploy

#### Frontend Files
```
src/app/order/OrderSheet.jsx (updated)
src/app/order/order.module.css (updated)
src/components/OrderActivityForm.jsx
src/components/OrderActivityForm.module.css
```

#### Backend Files
```
controllers/warehouseOrderActivityController.js (already deployed in Feature 3)
routes/warehouseOrderActivityRoutes.js (already deployed in Feature 3)
```

### Changes Performed

#### 1. OrderSheet.jsx Updates

**Location**: Lines 100-150 (Activity Button Integration)

**Added State Variables**:
```javascript
const [showOrderActivityForm, setShowOrderActivityForm] = useState(false);
const [selectedOrderForActivity, setSelectedOrderForActivity] = useState(null);
```

**Added Functions**:
```javascript
// Open activity form modal
const openOrderActivityForm = (order) => {
    setSelectedOrderForActivity(order);
    setShowOrderActivityForm(true);
};

// Close activity form modal
const closeOrderActivityForm = () => {
    setShowOrderActivityForm(false);
    setSelectedOrderForActivity(null);
};

// Handle activity submission
const handleOrderActivitySubmit = async (formData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/warehouse-order-activity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            setSuccessMsg("✅ Order activity submitted successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } else {
            throw new Error(data.message || 'Failed to submit order activity');
        }
    } catch (error) {
        console.error('Error submitting order activity:', error);
        setSuccessMsg(`❌ Failed to submit order activity: ${error.message}`);
        setTimeout(() => setSuccessMsg(""), 3000);
        throw error;
    }
};
```

**Added UI Elements**:
```jsx
{/* Activity Button in each order row */}
<button
    onClick={() => openOrderActivityForm(order)}
    className={styles.activityBtn}
    title="Submit Activity"
>
    <Activity size={16} />
    Activity
</button>

{/* Activity Form Modal */}
{showOrderActivityForm && (
    <OrderActivityForm
        order={selectedOrderForActivity}
        onClose={closeOrderActivityForm}
        onSubmit={handleOrderActivitySubmit}
    />
)}
```

#### 2. OrderActivityForm.jsx Component

**New Component**: Complete activity submission form

**Props**:
```javascript
{
    order: Object,      // Pre-filled order data
    onClose: Function,  // Close modal callback
    onSubmit: Function  // Submit callback
}
```

**Form Fields**:
- AWB Number (pre-filled, editable)
- Order Reference (pre-filled, editable)
- Customer Name (pre-filled, editable)
- Product Name (pre-filled, editable)
- Logistics Partner (dropdown)
- Warehouse (dropdown)
- Processed By (dropdown, warehouse-specific)
- Status (Dispatch/Cancel)
- Remarks (textarea)

**Key Features**:
- Pre-population from order data
- Warehouse-specific staff loading
- Real-time validation
- Loading states
- Error handling
- Success feedback

**Component Structure**:
```jsx
export default function OrderActivityForm({ order, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        awb: order?.awb || '',
        order_ref: order?.order_ref || '',
        customer_name: order?.customer || '',
        product_name: order?.product_name || '',
        logistics: order?.logistics || '',
        warehouse: order?.warehouse || '',
        processed_by: '',
        status: 'Dispatch',
        remarks: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <form onSubmit={handleSubmit}>
                    {/* Form fields */}
                </form>
            </div>
        </div>
    );
}
```

### Deployment Steps

1. **Deploy Frontend Files**
```bash
cd ~/inventoryfullstack
git pull origin stocksphere-phase-1-complete

# Verify files
ls -la src/app/order/OrderSheet.jsx
ls -la src/components/OrderActivityForm.jsx

npm run build
pm2 restart frontend
```

2. **No Backend Changes Required**
(Backend was deployed in Feature 3)

3. **Verify Integration**
```bash
# Test the complete flow:
# 1. Login to frontend
# 2. Navigate to Order Sheet
# 3. Click "Activity" button on any order
# 4. Fill form and submit
# 5. Check warehouse-order-activity page for new entry
```

---


## Complete Deployment Checklist

### Pre-Deployment Checklist

- [ ] Backup current database
- [ ] Backup current codebase
- [ ] Verify server access (SSH, MySQL)
- [ ] Check Node.js version (v16+ required)
- [ ] Check npm packages are up to date
- [ ] Verify PM2 is running
- [ ] Check disk space availability

### Deployment Order

**IMPORTANT**: Deploy in this exact order to avoid dependency issues.

#### Step 1: Database Setup (30 minutes)
```bash
# 1. Backup database
mysqldump -u root -p inventory_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations in order
mysql -u root -p inventory_db < complete-inventory-analysis.sql
mysql -u root -p inventory_db < fix-audit-logs-table.sql
mysql -u root -p inventory_db < warehouse-order-activity-schema.sql
mysql -u root -p inventory_db < updated-warehouse-activity-schema.sql
mysql -u root -p inventory_db < update-warehouse-activity-with-staff.sql

# 3. Verify tables created
mysql -u root -p inventory_db -e "SHOW TABLES;"
```

#### Step 2: Backend Deployment (20 minutes)
```bash
cd ~/inventoryfullstack

# 1. Pull latest code
git fetch origin
git checkout stocksphere-phase-1-complete
git pull origin stocksphere-phase-1-complete

# 2. Install dependencies
npm install jspdf xlsx

# 3. Verify controller files exist
ls -la controllers/inventoryController.js
ls -la controllers/manualStockController.js
ls -la controllers/movementRecordsController.js
ls -la controllers/warehouseOrderActivityController.js
ls -la controllers/damageRecoveryController.js

# 4. Verify route files exist
ls -la routes/inventoryRoutes.js
ls -la routes/warehouseOrderActivityRoutes.js
ls -la routes/warehouseAddressRoutes.js

# 5. Check server.js includes new routes
grep -n "warehouseOrderActivityRoutes" server.js
grep -n "warehouseAddressRoutes" server.js

# 6. Restart backend
pm2 restart server
pm2 logs server --lines 50
```

#### Step 3: Frontend Deployment (15 minutes)
```bash
cd ~/inventoryfullstack

# 1. Verify frontend files exist
ls -la src/app/inventory/InventorySheet.jsx
ls -la src/app/inventory/movement-records/InventoryMovementRecords.jsx
ls -la src/app/warehouse-order-activity/page.jsx
ls -la src/app/order/OrderSheet.jsx
ls -la src/components/OrderActivityForm.jsx

# 2. Build frontend
npm run build

# 3. Restart frontend (if using PM2)
pm2 restart frontend

# Or restart Next.js server
pm2 restart all
```

#### Step 4: Verification (10 minutes)
```bash
# 1. Check PM2 status
pm2 status

# 2. Check server logs
pm2 logs server --lines 100

# 3. Test API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://54.254.184.54:8443/api/inventory/movement-records?limit=5

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://54.254.184.54:8443/api/warehouse-order-activity

# 4. Check database data
mysql -u root -p inventory_db -e "SELECT COUNT(*) FROM warehouse_order_activity;"
mysql -u root -p inventory_db -e "SELECT COUNT(*) FROM inventory_movement_records;"
```

---

## Testing Guide

### Feature 1: Stock Update Testing

1. **Login to Frontend**
   - URL: https://inventoryfullstack-one.vercel.app
   - Credentials: admin@company.com / Admin@123

2. **Navigate to Inventory**
   - Click "Inventory" in sidebar
   - Wait for inventory to load

3. **Test Stock Update**
   - Click "Edit Stock" button on any item
   - Select update type: "Adjustment"
   - Enter quantity: 10
   - Select reason: "Physical Count Correction"
   - Add notes: "Test stock update"
   - Click "Update Stock"
   - Verify success message
   - Verify stock count updated in table

4. **Verify Database**
```sql
SELECT * FROM manual_stock_adjustments 
ORDER BY created_at DESC 
LIMIT 5;
```

### Feature 2: Movement Records Testing

1. **Navigate to Movement Records**
   - Click "Inventory" → "Movement Records"

2. **Test Filters**
   - Select movement type: "Damage"
   - Select warehouse: "GGM_WH"
   - Set date range: Last 7 days
   - Click refresh
   - Verify filtered results

3. **Test Export**
   - Click "Export" button
   - Verify CSV download
   - Open CSV and verify data

4. **Verify Database**
```sql
SELECT movement_type, COUNT(*) as count 
FROM inventory_movement_records 
GROUP BY movement_type;
```

### Feature 3: Warehouse Activity Testing

1. **Navigate to Warehouse Activity**
   - Click "Warehouse Order Activity" in sidebar

2. **Test Filters**
   - Select warehouse: "GGM_WH"
   - Select processed by: "Pankaj Rajput"
   - Select status: "Dispatch"
   - Verify filtered results

3. **Test Selection & Export**
   - Check 3-5 orders
   - Click "Download CSV"
   - Verify CSV contains selected orders
   - Click "Download PDF"
   - Verify PDF manifest generated with:
     - Company branding
     - Order table
     - Signature section

4. **Verify Database**
```sql
SELECT warehouse, status, COUNT(*) as count 
FROM warehouse_order_activity 
GROUP BY warehouse, status;
```

### Feature 4: Activity Button Testing

1. **Navigate to Order Sheet**
   - Click "Orders" in sidebar

2. **Test Activity Button**
   - Click "Activity" button on any order
   - Verify modal opens with pre-filled data
   - Verify AWB, Customer, Product are populated
   - Select logistics: "Delhivery"
   - Select warehouse: "GGM_WH"
   - Select processed by: "Pankaj Rajput"
   - Select status: "Dispatch"
   - Add remarks: "Test activity submission"
   - Click "Submit"
   - Verify success message

3. **Verify in Warehouse Activity**
   - Navigate to Warehouse Activity page
   - Verify new entry appears
   - Verify all data matches

4. **Verify Database**
```sql
SELECT * FROM warehouse_order_activity 
WHERE remarks LIKE '%Test activity%' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## Troubleshooting

### Issue 1: Database Connection Error
**Symptom**: "Cannot connect to database"

**Solution**:
```bash
# Check MySQL is running
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Check credentials in .env.production
cat .env.production | grep DB_
```

### Issue 2: API 404 Errors
**Symptom**: API endpoints return 404

**Solution**:
```bash
# Check routes are registered in server.js
grep -A 5 "warehouseOrderActivity" server.js

# Restart server
pm2 restart server

# Check logs
pm2 logs server --lines 50
```

### Issue 3: Frontend Build Fails
**Symptom**: npm run build fails

**Solution**:
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install

# Try build again
npm run build
```

### Issue 4: Missing Dependencies
**Symptom**: "Module not found: jspdf" or "Module not found: xlsx"

**Solution**:
```bash
# Install missing packages
npm install jspdf xlsx

# Rebuild
npm run build
pm2 restart all
```

### Issue 5: Permission Denied Errors
**Symptom**: User cannot access features

**Solution**:
```sql
-- Check user permissions
SELECT u.username, p.permission_name 
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN permissions p ON up.permission_id = p.id
WHERE u.username = 'admin@company.com';

-- Grant required permissions
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u, permissions p
WHERE u.username = 'admin@company.com'
AND p.permission_name IN ('INVENTORY_VIEW', 'INVENTORY_EDIT', 'ORDERS_VIEW');
```

---

## Rollback Procedure

If deployment fails, follow these steps to rollback:

### 1. Rollback Database
```bash
# Restore from backup
mysql -u root -p inventory_db < backup_YYYYMMDD_HHMMSS.sql
```

### 2. Rollback Code
```bash
cd ~/inventoryfullstack

# Switch to previous stable branch
git checkout main
git pull origin main

# Rebuild
npm run build
pm2 restart all
```

### 3. Verify Rollback
```bash
# Check application is running
pm2 status

# Test basic functionality
curl https://54.254.184.54:8443/api/inventory?limit=5
```

---

## Post-Deployment Tasks

### 1. Monitor Logs
```bash
# Watch server logs for errors
pm2 logs server --lines 100 --follow

# Watch frontend logs
pm2 logs frontend --lines 100 --follow
```

### 2. Performance Check
```bash
# Check server response time
time curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://54.254.184.54:8443/api/warehouse-order-activity

# Check database query performance
mysql -u root -p inventory_db -e "
SHOW PROCESSLIST;
"
```

### 3. User Acceptance Testing
- Share testing checklist with team
- Collect feedback on new features
- Document any issues found
- Create tickets for bug fixes

### 4. Documentation Update
- Update internal wiki with new features
- Create user guides for warehouse staff
- Update API documentation
- Share deployment summary with stakeholders

---

## Support Contacts

**Development Team**:
- Lead Developer: [Your Name]
- Backend Support: [Backend Dev]
- Frontend Support: [Frontend Dev]

**Server Team**:
- Server Admin: [Server Admin]
- Database Admin: [DBA]

**Emergency Contact**:
- On-Call: [Phone Number]
- Email: [Support Email]

---

## Appendix: File Locations

### Frontend Files
```
src/app/inventory/InventorySheet.jsx
src/app/inventory/inventory.module.css
src/app/inventory/movement-records/InventoryMovementRecords.jsx
src/app/inventory/movement-records/movementRecords.module.css
src/app/warehouse-order-activity/page.jsx
src/app/website-order-activity/websiteOrderActivity.module.css
src/app/order/OrderSheet.jsx
src/app/order/order.module.css
src/components/OrderActivityForm.jsx
src/components/OrderActivityForm.module.css
```

### Backend Files
```
controllers/inventoryController.js
controllers/manualStockController.js
controllers/movementRecordsController.js
controllers/warehouseOrderActivityController.js
controllers/damageRecoveryController.js
routes/inventoryRoutes.js
routes/warehouseOrderActivityRoutes.js
routes/warehouseAddressRoutes.js
middleware/auth.js
```

### Database Files
```
complete-inventory-analysis.sql
fix-audit-logs-table.sql
warehouse-order-activity-schema.sql
updated-warehouse-activity-schema.sql
update-warehouse-activity-with-staff.sql
```

### Configuration Files
```
.env.production
server.js
package.json
next.config.js
```

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Branch**: stocksphere-phase-1-complete  
**Deployment Target**: Production Server (54.254.184.54:8443)

---

## Quick Reference Commands

```bash
# Pull latest code
git checkout stocksphere-phase-1-complete && git pull

# Install dependencies
npm install

# Build frontend
npm run build

# Restart services
pm2 restart all

# Check status
pm2 status

# View logs
pm2 logs --lines 100

# Database backup
mysqldump -u root -p inventory_db > backup_$(date +%Y%m%d).sql

# Run migrations
mysql -u root -p inventory_db < schema.sql

# Test API
curl -H "Authorization: Bearer TOKEN" https://54.254.184.54:8443/api/endpoint
```

---

**END OF DEPLOYMENT GUIDE**
