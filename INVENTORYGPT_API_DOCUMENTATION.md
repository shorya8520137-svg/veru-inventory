# InventoryGPT API Documentation

**Version:** 1.0  
**Base URL:** `https://api.giftgala.in`  
**Authentication:** Bearer Token  
**Last Updated:** May 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Data Feed Endpoints](#data-feed-endpoints)
4. [Recommendations Endpoints](#recommendations-endpoints)
5. [Token Management](#token-management)
6. [Examples](#examples)
7. [Rate Limiting](#rate-limiting)
8. [Error Handling](#error-handling)

---

## Authentication

All InventoryGPT API requests require a bearer token in the Authorization header.

### Token Generation

1. Navigate to: `/inventorygpt/tokens`
2. Click "Generate New Token"
3. Fill in token details (name, description, rate limit, expiration)
4. Copy the generated token (shown only once)
5. Use in API requests

### Authorization Header

```bash
Authorization: Bearer igpt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## API Endpoints

### Base Path
All endpoints are prefixed with: `/api/inventorygpt/`

---

## Data Feed Endpoints

### 1. Get Inventory State

**Endpoint:**
```
GET /api/inventorygpt/inventory-state
```

**Description:** Returns current inventory state across all warehouses with stock categories and health metrics.

**Authentication:** Required (Bearer Token)

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sku": "PROD-001",
      "product_name": "Product A",
      "warehouse": "WH-001",
      "stock": 150,
      "qty_reserved": 20,
      "sellable_stock": 130,
      "stock_category": "ACTIVE",
      "last_verified_at": "2026-05-14T10:30:00Z",
      "warehouse_name": "Main Warehouse",
      "health_score": 95,
      "dead_stock_ratio": 2.5,
      "price": 299.99,
      "margin_percentage": 35.50
    }
  ],
  "count": 1000,
  "timestamp": "2026-05-14T10:35:00Z"
}
```

**Use Case:** Get real-time inventory levels for optimization decisions

---

### 2. Get Warehouse Metrics

**Endpoint:**
```
GET /api/inventorygpt/warehouse-metrics
```

**Description:** Returns warehouse performance metrics and health scores for transfer decision making.

**Authentication:** Required (Bearer Token)

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "warehouse_id": "WH-001",
      "warehouse_name": "Main Warehouse",
      "total_transfers_executed": 245,
      "successful_transfers": 240,
      "failed_transfers": 5,
      "avg_fulfillment_time_days": 2.3,
      "dead_stock_ratio": 2.5,
      "slow_moving_ratio": 8.2,
      "stock_turnover_rate": 12.5,
      "storage_utilization_pct": 78.5,
      "available_capacity": 5000,
      "rto_risk_score": 15,
      "delay_risk_level": "LOW",
      "health_score": 95,
      "last_calculated": "2026-05-14T10:30:00Z",
      "total_skus": 450,
      "total_stock": 15000
    }
  ],
  "count": 8,
  "timestamp": "2026-05-14T10:35:00Z"
}
```

**Use Case:** Evaluate warehouse health before recommending transfers

---

### 3. Get Regional Demand Analytics

**Endpoint:**
```
GET /api/inventorygpt/regional-demand
```

**Description:** Returns regional sales analytics and demand signals for inventory redistribution.

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `region` (optional): Filter by region
- `sku` (optional): Filter by product SKU

**Example:**
```
GET /api/inventorygpt/regional-demand?region=NORTH&sku=PROD-001
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "analysis_date": "2026-05-14",
      "region": "NORTH",
      "warehouse_id": "WH-001",
      "sku": "PROD-001",
      "product_name": "Product A",
      "total_units_sold": 450,
      "total_revenue": 134955.50,
      "avg_selling_price": 299.90,
      "daily_velocity": 15.0,
      "velocity_trend": "UP",
      "stockout_incidents": 2,
      "fulfillment_source": "WH-001",
      "avg_delivery_days": 2.5,
      "created_at": "2026-05-14T08:00:00Z"
    }
  ],
  "count": 50,
  "filters": {
    "region": "NORTH",
    "sku": "PROD-001"
  },
  "timestamp": "2026-05-14T10:35:00Z"
}
```

**Use Case:** Identify demand hotspots for redistribution opportunities

---

## Recommendations Endpoints

### 4. Get AI Recommendations

**Endpoint:**
```
GET /api/inventorygpt/recommendations
```

**Description:** Retrieve AI-generated recommendations with filtering by status.

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `status` (optional): `pending`, `approved`, `rejected`, `executed`, `measured`, `closed`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "recommendation_type": "REDISTRIBUTION",
      "agent_name": "RedistributionAgent",
      "confidence_score": 92.5,
      "sku": "PROD-001",
      "source_warehouse": "WH-002",
      "target_warehouse": "WH-001",
      "recommended_quantity": 200,
      "estimated_savings": 5000.00,
      "transfer_cost": 500.00,
      "expected_revenue_impact": 15000.00,
      "status": "pending",
      "approved_by": null,
      "approved_at": null,
      "rejection_reason": null,
      "execution_reference": null,
      "actual_savings": null,
      "measured_at": null,
      "created_at": "2026-05-14T09:00:00Z",
      "updated_at": "2026-05-14T09:00:00Z"
    }
  ],
  "count": 15,
  "timestamp": "2026-05-14T10:35:00Z"
}
```

**Use Case:** Fetch pending recommendations for human approval

---

### 5. Submit AI Recommendation

**Endpoint:**
```
POST /api/inventorygpt/recommendations
```

**Description:** Submit a new AI-generated recommendation to the system.

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "recommendation_type": "REDISTRIBUTION",
  "agent_name": "RedistributionAgent",
  "confidence_score": 92.5,
  "sku": "PROD-001",
  "source_warehouse": "WH-002",
  "target_warehouse": "WH-001",
  "recommended_quantity": 200,
  "estimated_savings": 5000.00,
  "transfer_cost": 500.00,
  "expected_revenue_impact": 15000.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recommendation created",
  "id": 1,
  "timestamp": "2026-05-14T10:35:00Z"
}
```

**Use Case:** Programmatically submit AI recommendations

---

## Token Management

### 6. Get API Tokens

**Endpoint:**
```
GET /api/inventorygpt/tokens
```

**Description:** List all API tokens for the authenticated user.

**Authentication:** Required (JWT Token + X-User-ID header)

**Headers:**
```
Authorization: Bearer {jwt_token}
X-User-ID: {user_id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Production API",
      "description": "Production data feed",
      "token_prefix": "igpt_a1b2c3d4",
      "is_active": true,
      "rate_limit": 1000,
      "usage_count": 523,
      "last_used_at": "2026-05-14T10:30:00Z",
      "created_at": "2026-05-01T14:20:00Z",
      "expires_at": "2026-08-01T14:20:00Z"
    }
  ],
  "count": 1
}
```

---

### 7. Create API Token

**Endpoint:**
```
POST /api/inventorygpt/tokens
```

**Description:** Generate a new API token.

**Authentication:** Required (JWT Token + X-User-ID header)

**Request Body:**
```json
{
  "name": "Production API",
  "description": "For production data sync",
  "rate_limit": 1000,
  "expires_in_days": 90
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token created successfully",
  "id": 1,
  "token": "igpt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z",
  "tokenPrefix": "igpt_a1b2c3d4",
  "expiresAt": "2026-08-14T12:00:00Z"
}
```

**Important:** The full token is only shown once. Save it securely!

---

### 8. Revoke API Token

**Endpoint:**
```
DELETE /api/inventorygpt/tokens/{tokenId}
```

**Description:** Revoke/deactivate an API token.

**Authentication:** Required (JWT Token + X-User-ID header)

**Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

---

## Examples

### Example 1: Get Inventory State (Node.js)

```javascript
const token = 'igpt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z';

const response = await fetch('https://api.giftgala.in/api/inventorygpt/inventory-state', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

const data = await response.json();
console.log(data);
```

### Example 2: Get Warehouse Metrics (Python)

```python
import requests

token = 'igpt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.giftgala.in/api/inventorygpt/warehouse-metrics',
    headers=headers
)

data = response.json()
print(data)
```

### Example 3: Get Regional Demand (cURL)

```bash
curl -H "Authorization: Bearer igpt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z" \
  "https://api.giftgala.in/api/inventorygpt/regional-demand?region=NORTH"
```

### Example 4: Submit Recommendation (JavaScript)

```javascript
const token = 'igpt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z';

const recommendation = {
    recommendation_type: 'REDISTRIBUTION',
    agent_name: 'RedistributionAgent',
    confidence_score: 92.5,
    sku: 'PROD-001',
    source_warehouse: 'WH-002',
    target_warehouse: 'WH-001',
    recommended_quantity: 200,
    estimated_savings: 5000.00,
    transfer_cost: 500.00
};

const response = await fetch(
    'https://api.giftgala.in/api/inventorygpt/recommendations',
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(recommendation)
    }
);

const result = await response.json();
console.log(result);
```

---

## Rate Limiting

Each API token has a rate limit defined in requests per hour.

**Default:** 1000 requests/hour

**Headers in Response:**
- `X-RateLimit-Limit`: Total limit
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

**Example:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 975
X-RateLimit-Reset: 1684076400
```

**When Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

---

## Error Handling

### Common Error Codes

| Code | Message | Resolution |
|------|---------|-----------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Provide valid Bearer token |
| 403 | Forbidden | Token is invalid or expired |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Contact support |

### Error Response Format

```json
{
  "success": false,
  "error": "Invalid token",
  "statusCode": 401
}
```

---

## API Endpoint Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/inventory-state` | Current inventory | Token |
| GET | `/warehouse-metrics` | Warehouse KPIs | Token |
| GET | `/regional-demand` | Regional demand | Token |
| GET | `/recommendations` | Get recommendations | Token |
| POST | `/recommendations` | Submit recommendation | Token |
| GET | `/tokens` | List tokens | JWT |
| POST | `/tokens` | Create token | JWT |
| DELETE | `/tokens/{id}` | Revoke token | JWT |

---

## Support

For API issues or questions:
- Email: api-support@giftgala.in
- Documentation: https://docs.giftgala.in/inventorygpt

**Generated:** May 2026
