# InventoryGPT API Endpoints

Generated: 2026-05-14

Base URL: `https://api.giftgala.in`

InventoryGPT now has a backend route mounted at `/api/inventorygpt`. Token management uses the normal staff/admin JWT from login. Data-feed endpoints use the generated InventoryGPT token.

## Authentication

### Staff JWT

Used for creating and revoking InventoryGPT tokens.

```http
Authorization: Bearer <staff_jwt>
Content-Type: application/json
```

### InventoryGPT Token

Used by InventoryGPT agents or external automation to read/write feed data.

```http
Authorization: Bearer <igpt_token>
```

Alternative headers supported:

```http
X-InventoryGPT-Token: <igpt_token>
X-API-Key: <igpt_token>
```

## Token Management

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/inventorygpt` | Public | Service health and endpoint discovery. |
| `GET` | `/api/inventorygpt/tokens` | Staff JWT | List InventoryGPT tokens for the signed-in user. |
| `POST` | `/api/inventorygpt/tokens` | Staff JWT | Generate a new InventoryGPT token. |
| `DELETE` | `/api/inventorygpt/tokens/{tokenId}` | Staff JWT | Revoke an existing InventoryGPT token. |

### Create Token Body

```json
{
  "name": "InventoryGPT production agent",
  "description": "Warehouse intelligence data feed",
  "rate_limit": 1000,
  "expires_in_days": 90
}
```

The full token is returned only once in the `token` field. Store it securely.

## Data Feed APIs

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/inventorygpt/inventory-state` | InventoryGPT token | Current sellable stock grouped by SKU, product, warehouse, batch availability, and pricing context. |
| `GET` | `/api/inventorygpt/warehouse-metrics` | InventoryGPT token | Warehouse stock, dispatch, capacity, health, and risk metrics. |
| `GET` | `/api/inventorygpt/regional-demand` | InventoryGPT token | Regional sales and demand analytics. |
| `GET` | `/api/inventorygpt/recommendations` | InventoryGPT token | List AI inventory recommendations. |
| `POST` | `/api/inventorygpt/recommendations` | InventoryGPT token | Submit a new AI-generated inventory recommendation. |
| `PUT` | `/api/inventorygpt/recommendations/{id}/approve` | Staff JWT | Mark a recommendation as accepted. |
| `PUT` | `/api/inventorygpt/recommendations/{id}/reject` | Staff JWT | Mark a recommendation as rejected. |

## Query Parameters

### Regional Demand

```http
GET /api/inventorygpt/regional-demand?region=NORTH&sku=1001
```

| Parameter | Required | Notes |
|---|---|---|
| `region` | No | Filters `regional_sales_analytics.region`. |
| `sku` | No | Matches `sku_id`, `dispatch_product.barcode`, or `products.sku`. |

### Recommendations

```http
GET /api/inventorygpt/recommendations?status=pending
```

| Parameter | Required | Notes |
|---|---|---|
| `status` | No | Supported live DB values include `pending`, `accepted`, `rejected`, `executed`, `measured`, and `closed`. |

## Submit Recommendation Body

The backend accepts both the current simple DB schema fields and the richer InventoryGPT names.

```json
{
  "recommendation_type": "redistribution",
  "sku_id": 1001,
  "source_location": 1,
  "target_location": 2,
  "confidence_score": 87.5,
  "expected_savings": 1200,
  "recommendation": "Move 8 units from warehouse 1 to warehouse 2 to reduce stockout risk."
}
```

Aliases also accepted:

| Alias | Stored as |
|---|---|
| `sku` | `sku_id`, only when numeric |
| `source_warehouse` | `source_location` |
| `target_warehouse` | `target_location` |
| `estimated_savings` | `expected_savings` |

## Curl Examples

### Create Token

```bash
curl -X POST "https://api.giftgala.in/api/inventorygpt/tokens" \
  -H "Authorization: Bearer <staff_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"InventoryGPT production agent","rate_limit":1000,"expires_in_days":90}'
```

### Read Inventory State

```bash
curl "https://api.giftgala.in/api/inventorygpt/inventory-state" \
  -H "Authorization: Bearer <igpt_token>"
```

### Read Warehouse Metrics

```bash
curl "https://api.giftgala.in/api/inventorygpt/warehouse-metrics" \
  -H "Authorization: Bearer <igpt_token>"
```

### Submit Recommendation

```bash
curl -X POST "https://api.giftgala.in/api/inventorygpt/recommendations" \
  -H "Authorization: Bearer <igpt_token>" \
  -H "Content-Type: application/json" \
  -d '{"recommendation_type":"redistribution","sku_id":1001,"source_location":1,"target_location":2,"confidence_score":87.5,"expected_savings":1200,"recommendation":"Move stock to balance regional demand."}'
```

## Backend Files

| File | Responsibility |
|---|---|
| `routes/inventoryGptRoutes.js` | Express backend routes for token management and data-feed APIs. |
| `server.js` | Mounts `/api/inventorygpt` before the global JWT middleware so feed tokens can authenticate correctly. |
| `src/app/profile/page.jsx` | Profile API tab with nested Storefront API and InventoryGPT API sections. |
| `src/app/profile/profile.module.css` | Nested API tab, InventoryGPT token, and responsive layout styles. |
