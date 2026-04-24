# Timeline API CURL Commands

## Quick Test Commands

Replace `YOUR_TOKEN_HERE` with your actual authentication token.

### 1. Get Timeline for Specific Product
```bash
curl -X GET "https://api.giftgala.in/api/timeline/2005-999" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 2. Get Timeline with Warehouse Filter
```bash
curl -X GET "https://api.giftgala.in/api/timeline/2005-999?warehouse=BLR_WH" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3. Get Timeline with Date Range
```bash
curl -X GET "https://api.giftgala.in/api/timeline/2005-999?dateFrom=2026-01-01&dateTo=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 4. Get Timeline Summary
```bash
curl -X GET "https://api.giftgala.in/api/timeline" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 5. Get Timeline Summary by Warehouse
```bash
curl -X GET "https://api.giftgala.in/api/timeline?groupBy=warehouse" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

## How to Get Your Token

### Method 1: Browser Console
1. Go to https://api.giftgala.in and login
2. Open Developer Tools (F12)
3. Go to Console tab
4. Type: `localStorage.getItem("token")`
5. Copy the token value

### Method 2: Login API
```bash
curl -X POST "https://api.giftgala.in/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

## Expected Response Format

### Successful Timeline Response
```json
{
  "success": true,
  "data": {
    "product_code": "2005-999",
    "warehouse_filter": "ALL",
    "timeline": [
      {
        "id": 1,
        "timestamp": "2026-01-31T10:30:00.000Z",
        "type": "OPENING",
        "product_name": "Baby Cloth Set (7 piece set)",
        "barcode": "2005-999",
        "warehouse": "BLR_WH",
        "quantity": 10,
        "direction": "IN",
        "reference": "BULK_UPLOAD_123",
        "balance_after": 10,
        "description": "Opening stock: 10 units"
      }
    ],
    "summary": {
      "total_entries": 5,
      "opening_stock": 10,
      "total_in": 15,
      "total_out": 5,
      "current_stock": 10,
      "breakdown": {
        "opening": 10,
        "bulk_upload": 5,
        "dispatch": 3,
        "damage": 2,
        "recovery": 0,
        "returns": 0,
        "self_transfer_in": 0,
        "self_transfer_out": 0
      }
    }
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

## Testing Different Barcodes

Try these known barcodes:
- `2005-999`
- `2460-3499`
- Any barcode from your inventory

## Query Parameters

### For Product Timeline (`/api/timeline/:barcode`)
- `warehouse` - Filter by warehouse (e.g., `BLR_WH`, `GGM_WH`)
- `dateFrom` - Start date (YYYY-MM-DD format)
- `dateTo` - End date (YYYY-MM-DD format)
- `limit` - Maximum number of entries (default: 50)

### For Timeline Summary (`/api/timeline`)
- `warehouse` - Filter by warehouse
- `dateFrom` - Start date
- `dateTo` - End date
- `groupBy` - Group by `product` or `warehouse` (default: `product`)

## PowerShell Commands (Windows)

If using PowerShell on Windows:

```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://api.giftgala.in/api/timeline/2005-999" -Headers $headers -Method GET
```