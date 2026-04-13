# Website Orders - Missing Data Issue

## Problem
The website orders page is showing "N/A" for:
- Customer address
- Product details  
- Phone numbers

## Root Cause
The `website_orders` table in your database likely has:
1. NULL or empty `shipping_address` field
2. No linked items in `website_order_items` table
3. Orders might be coming from a different source without complete data

## Solution Options

### Option 1: Check Current Data (Run on Server)
```bash
# SSH into server
ssh -i "C:\Users\Public\e2c.pem.pem" ubuntu@13.212.52.15

# Connect to MySQL
mysql -u your_user -p your_database

# Run this query to check data
SELECT 
    id,
    order_number,
    shipping_address,
    total_amount,
    created_at
FROM website_orders
LIMIT 5;
```

### Option 2: The Data Structure Expected

The API expects `shipping_address` to be a JSON string like:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA"
}
```

### Option 3: Sample Data Insert

If the table is empty, you can insert sample data:

```sql
-- Insert sample order
INSERT INTO website_orders (
    order_number,
    user_id,
    status,
    total_amount,
    currency,
    payment_status,
    payment_method,
    shipping_address,
    order_date
) VALUES (
    'ORD-2026-001',
    1,
    'Processing',
    1499.00,
    'INR',
    'Paid',
    'Card',
    '{"name":"Shorya Singh","email":"singhshorya997@gmail.com","phone":"+91-9876543210","addressLine1":"123 Main Street","city":"Bangalore","state":"Karnataka","postalCode":"560001","country":"India"}',
    NOW()
);

-- Get the order ID
SET @order_id = LAST_INSERT_ID();

-- Insert order items
INSERT INTO website_order_items (
    order_id,
    product_name,
    quantity,
    unit_price,
    total_price
) VALUES
(@order_id, 'Premium Wireless Headphones', 1, 1499.00, 1499.00);
```

### Option 4: Check API Response

Test the API directly to see what data is being returned:

```bash
# On your local machine or server
curl -k -H "Authorization: Bearer YOUR_TOKEN" \
  "https://13.212.52.15:8443/api/website/orders?page=1&limit=5"
```

## Frontend Code Status
✅ Frontend is correctly configured to display:
- customer_name
- customer_email  
- customer_phone
- shipping_address_text
- item_count
- total_amount
- payment_method
- payment_status

## Next Steps

1. **Check if data exists**: Run the SQL queries above
2. **If no data**: Insert sample data using the SQL above
3. **If data exists but showing N/A**: The `shipping_address` field needs to be a proper JSON string
4. **Test API**: Use curl to verify API is returning correct data

## Files Involved
- **Backend**: `controllers/websiteOrderController.js` (Line 728 - getAllOrders)
- **Frontend**: `src/app/order/websiteorder/websiteorder.jsx`
- **Database**: `website_orders` and `website_order_items` tables
