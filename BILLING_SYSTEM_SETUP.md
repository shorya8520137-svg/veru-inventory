# Billing System Setup Guide

## Overview
This billing system includes 3 main components:
1. **Create Bill** - Generate invoices with customer details, products, GST, and payment info
2. **Bill History** - View all generated bills with search and filters
3. **Store Inventory** - Track store stock levels that auto-reduce when bills are generated

## Database Setup

### Step 1: Run the Migration
Execute the SQL file to create required tables:

```bash
mysql -u your_username -p your_database < migrations/create-billing-tables.sql
```

Or manually run the SQL commands from `migrations/create-billing-tables.sql`

### Tables Created:
1. **bills** - Stores all invoice data
2. **store_inventory** - Tracks product stock levels
3. **store_inventory_logs** - Logs all stock movements

## Features

### 1. Create Bill Tab
- Customer details (name, phone, email, addresses)
- GST details (GSTIN, business name, place of supply)
- Product search and selection
- Quantity management
- Automatic GST calculation
- Discount and shipping
- Multiple payment modes (Cash, UPI, Card, Bank)
- Payment status (Paid, Partial, Unpaid)
- Real-time total calculation

### 2. Bill History Tab
- View all generated bills
- Search by invoice number, customer name, or phone
- Filter by payment status
- Pagination (15 records per page)
- View bill details in modal
- Export functionality
- Print and download options

### 3. Store Inventory Tab
- Real-time stock levels
- Stock status indicators (In Stock, Low Stock, Out of Stock)
- Product search
- Stock value calculation
- Stats dashboard:
  - Total Products
  - Low Stock Count
  - Out of Stock Count
  - Total Inventory Value
- Pagination (20 records per page)

## How It Works

### Bill Generation Flow:
1. User fills customer details
2. User searches and adds products
3. System calculates totals with GST
4. User selects payment mode and status
5. On "Generate Invoice":
   - Bill is saved to `bills` table
   - Stock is reduced in `store_inventory` table
   - Movement is logged in `store_inventory_logs` table
   - Transaction is atomic (all or nothing)

### Stock Management:
- Stock validation before bill generation
- Automatic stock reduction on successful bill
- Stock movement logging for audit trail
- Real-time stock status updates

## API Endpoints

### 1. Generate Bill
```
POST /api/billing/generate
```
**Body:**
```json
{
  "customer": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "billing_address": "123 Main St",
    "shipping_address": "123 Main St"
  },
  "gst_details": {
    "gstin": "22AAAAA0000A1Z5",
    "business_name": "Acme Corp",
    "place_of_supply": "New York (NY)"
  },
  "products": [
    {
      "product_id": 1,
      "barcode": "SKU-123",
      "product_name": "Product Name",
      "quantity": 2,
      "price": 100,
      "gst_percentage": 18
    }
  ],
  "payment": {
    "mode": "cash",
    "status": "paid"
  },
  "discount": 50,
  "shipping": 25,
  "totals": {
    "subtotal": 200,
    "discount": 50,
    "gstAmount": 27,
    "grandTotal": 202
  }
}
```

### 2. Get Bill History
```
GET /api/billing/history?page=1&limit=15&search=&status=all
```

### 3. Get Store Inventory
```
GET /api/billing/store-inventory?page=1&limit=20&search=&stock_filter=all
```

## Access the System

Navigate to: `/billing`

The page has 3 tabs at the top:
- **Create Bill** - Generate new invoices
- **Bill History** - View past bills
- **Store Inventory** - Check stock levels

## Sample Data

The migration includes 10 sample products in store inventory:
- Architectural Steel Beam (45 in stock)
- Precision Glass Panel (28 in stock)
- Industrial Bolt Set (150 in stock)
- Ceramic Tile Premium (200 in stock)
- LED Panel Light 40W (75 in stock)
- Copper Wire 2.5mm (8 in stock - LOW STOCK)
- PVC Pipe 4 inch (3 in stock - LOW STOCK)
- Paint Primer White (60 in stock)
- Cement Bag 50kg (0 in stock - OUT OF STOCK)
- Wooden Plank Oak (35 in stock)

## Error Handling

The system includes comprehensive error handling:
- Stock validation before bill generation
- Insufficient stock alerts
- Transaction rollback on errors
- User-friendly error messages

## Security

- All endpoints require authentication token
- SQL injection protection via parameterized queries
- Transaction-based operations for data integrity
- Input validation on all fields

## Next Steps

1. Run the migration SQL file
2. Access `/billing` in your browser
3. Start creating bills!

The system is production-ready and includes all necessary features for a complete billing solution.
