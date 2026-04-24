# Timeline API Documentation

## Base Configuration

### Domain
```
https://api.giftgala.in
```

### Authentication
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs
```

## API Endpoints

### 1. Get Product Timeline

**Endpoint:**
```
GET /api/timeline/{barcode}
```

**Example:**
```bash
curl -X GET "https://api.giftgala.in/api/timeline/2005-999" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs"
```

**Query Parameters:**
- `warehouse` - Filter by warehouse (e.g., BLR_WH, GGM_WH)
- `dateFrom` - Start date (YYYY-MM-DD)
- `dateTo` - End date (YYYY-MM-DD)
- `limit` - Maximum entries (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "product_code": "2005-999",
    "warehouse_filter": "ALL",
    "timeline": [
      {
        "id": 2679,
        "timestamp": "2026-02-07T07:24:54.000Z",
        "type": "DAMAGE",
        "product_name": "Baby Cloth Set (7 piece set) Blue",
        "barcode": "2005-999",
        "warehouse": "BLR_WH",
        "quantity": 1,
        "direction": "OUT",
        "reference": "damage#85",
        "source": "ledger",
        "balance_after": 5,
        "description": "Reported 1 units as damaged"
      }
    ],
    "current_stock": [
      {
        "barcode": "2005-999",
        "product_name": "Baby Cloth Set (7 piece set) Blue",
        "warehouse": "BLR_WH",
        "current_stock": "5",
        "batch_count": 1
      }
    ],
    "summary": {
      "total_entries": 12,
      "opening_stock": 0,
      "total_in": 14,
      "total_out": 9,
      "net_movement": 5,
      "current_stock": 5,
      "breakdown": {
        "opening": 0,
        "bulk_upload": 0,
        "dispatch": 2,
        "damage": 5,
        "recovery": 1,
        "returns": 0,
        "self_transfer_in": 0,
        "self_transfer_out": 0
      }
    }
  }
}
```

### 2. Get Timeline with Warehouse Filter

**Endpoint:**
```
GET /api/timeline/{barcode}?warehouse={warehouse_code}
```

**Example:**
```bash
curl -X GET "https://api.giftgala.in/api/timeline/2005-999?warehouse=BLR_WH" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs"
```

### 3. Get Timeline with Date Range

**Endpoint:**
```
GET /api/timeline/{barcode}?dateFrom={start_date}&dateTo={end_date}
```

**Example:**
```bash
curl -X GET "https://api.giftgala.in/api/timeline/2005-999?dateFrom=2026-01-01&dateTo=2026-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs"
```

### 4. Get Complete Timeline Data

**Endpoint:**
```
GET /api/timeline/{barcode}?warehouse={warehouse}&dateFrom={start}&dateTo={end}&limit=1000
```

**Example:**
```bash
curl -X GET "https://api.giftgala.in/api/timeline/2005-999?warehouse=BLR_WH&dateFrom=2026-01-01&dateTo=2026-01-31&limit=1000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs"
```

### 5. Get Timeline Summary

**Endpoint:**
```
GET /api/timeline
```

**Example:**
```bash
curl -X GET "https://api.giftgala.in/api/timeline" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "group_key": "2005-999",
      "product_name": "Baby Cloth Set (7 piece set) Blue",
      "barcode": "2005-999",
      "total_movements": 12,
      "total_in": "14.00",
      "total_out": "9.00",
      "last_movement": "2026-02-07T07:24:54.000Z",
      "net_movement": 5
    }
  ]
}
```

### 6. Get Timeline Summary by Warehouse

**Endpoint:**
```
GET /api/timeline?groupBy=warehouse
```

**Example:**
```bash
curl -X GET "https://api.giftgala.in/api/timeline?groupBy=warehouse" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "group_key": "BLR_WH",
      "warehouse": "BLR_WH",
      "total_movements": 2753,
      "total_in": "1398.00",
      "total_out": "67.00",
      "last_movement": "2026-03-01T16:45:48.000Z",
      "net_movement": 1331
    },
    {
      "group_key": "GGM_WH",
      "warehouse": "GGM_WH",
      "total_movements": 47,
      "total_in": "36.00",
      "total_out": "33.00",
      "last_movement": "2026-02-20T07:05:11.000Z",
      "net_movement": 3
    }
  ]
}
```

## Movement Types

The timeline includes these movement types:

- **OPENING** - Initial stock
- **BULK_UPLOAD** - Bulk inventory uploads
- **DISPATCH** - Product dispatches/sales
- **DAMAGE** - Damage reports
- **RECOVER** - Recovery from damage
- **RETURN** - Product returns
- **SELF_TRANSFER** - Internal transfers
- **MANUAL_IN** - Manual stock additions
- **MANUAL_OUT** - Manual stock reductions

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token",
  "error": "INVALID_TOKEN"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

## How to Get Token

### Login API
```bash
curl -X POST "https://api.giftgala.in/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Admin@123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Available Warehouses

- **BLR_WH** - Bangalore Warehouse
- **GGM_WH** - Gurgaon Warehouse

## Sample Barcodes for Testing

- `2005-999` - Baby Cloth Set (7 piece set) Blue
- `2460-3499` - HH_Bedding Cutie cat CC
- `2025-621` - Baby Cloth Set (5 piece set) Blue
- `1768-899` - HH Mattress cover khaki