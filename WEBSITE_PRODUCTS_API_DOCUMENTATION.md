# Website Products API Documentation

## 📋 Overview
Complete API documentation for the Website Product Management system with all endpoints, request/response formats, and testing examples.

---

## 🔐 Authentication
All protected endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📦 Products API

### 1. Get All Products (Public)
**Endpoint:** `GET /api/website/products`  
**Authentication:** Not required  
**Description:** Retrieve paginated list of products with filtering options

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string) - Search in product name, description, SKU
- `category` (string) - Filter by category slug
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `featured` (boolean) - Filter featured products
- `active` (boolean, default: true) - Filter active products
- `sortBy` (string) - Sort field (product_name, price, created_at, stock_quantity)
- `sortOrder` (string) - Sort direction (ASC, DESC)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_name": "Wireless Headphones",
      "description": "High-quality wireless headphones...",
      "short_description": "Premium wireless headphones",
      "price": 99.99,
      "offer_price": 79.99,
      "image_url": "https://example.com/image.jpg",
      "category_id": 1,
      "category_name": "Electronics",
      "category_slug": "electronics",
      "sku": "WH-001",
      "stock_quantity": 50,
      "min_stock_level": 10,
      "is_active": true,
      "is_featured": true,
      "final_price": 79.99,
      "discount_percentage": 20.00,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2. Get Single Product (Public)
**Endpoint:** `GET /api/website/products/:id`  
**Authentication:** Not required  
**Description:** Get detailed information about a specific product

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_name": "Wireless Headphones",
    "description": "High-quality wireless headphones...",
    "price": 99.99,
    "offer_price": 79.99,
    "category_name": "Electronics",
    "variants": [
      {
        "id": 1,
        "variant_name": "Color",
        "variant_value": "Black",
        "price_adjustment": 0.00,
        "stock_quantity": 25
      }
    ]
  }
}
```

### 3. Get Featured Products (Public)
**Endpoint:** `GET /api/website/products/featured`  
**Authentication:** Not required  
**Description:** Get list of featured products

**Query Parameters:**
- `limit` (number, default: 10) - Number of products to return

### 4. Create Product (Protected)
**Endpoint:** `POST /api/website/products`  
**Authentication:** Required  
**Description:** Create a new product

**Request Body:**
```json
{
  "product_name": "New Product",
  "description": "Product description",
  "short_description": "Short description",
  "price": 29.99,
  "offer_price": 24.99,
  "image_url": "https://example.com/image.jpg",
  "category_id": 1,
  "sku": "NP-001",
  "stock_quantity": 100,
  "min_stock_level": 10,
  "weight": 0.5,
  "dimensions": "10x5x2 cm",
  "is_active": true,
  "is_featured": false,
  "meta_title": "SEO Title",
  "meta_description": "SEO Description",
  "tags": ["tag1", "tag2"],
  "attributes": {"color": "red", "size": "medium"}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 123,
    "sku": "NP-001"
  }
}
```

### 5. Update Product (Protected)
**Endpoint:** `PUT /api/website/products/:id`  
**Authentication:** Required  
**Description:** Update an existing product

### 6. Delete Product (Protected)
**Endpoint:** `DELETE /api/website/products/:id`  
**Authentication:** Required  
**Description:** Soft delete a product (marks as inactive)

---

## 🏷️ Categories API

### 1. Get All Categories (Public)
**Endpoint:** `GET /api/website/categories`  
**Authentication:** Not required  
**Description:** Get all active categories with product counts

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "slug": "electronics",
      "parent_id": null,
      "parent_name": null,
      "is_active": true,
      "sort_order": 1,
      "product_count": 25,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Create Category (Protected)
**Endpoint:** `POST /api/website/categories`  
**Authentication:** Required  
**Description:** Create a new category

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description",
  "slug": "new-category",
  "parent_id": null,
  "sort_order": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 9,
    "name": "New Category",
    "slug": "new-category"
  }
}
```

### 3. Update Category (Protected)
**Endpoint:** `PUT /api/website/categories/:id`  
**Authentication:** Required  
**Description:** Update an existing category

### 4. Delete Category (Protected)
**Endpoint:** `DELETE /api/website/categories/:id`  
**Authentication:** Required  
**Description:** Soft delete a category (only if no active products)

---

## 📤 Bulk Upload API

### 1. Bulk Upload Products (Protected)
**Endpoint:** `POST /api/website/products/bulk-upload`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`  
**Description:** Upload products via CSV file

**Request:**
- Form field: `csvFile` (CSV file, max 10MB)

**CSV Format:**
```csv
product_name,description,short_description,price,offer_price,image_url,category_name,sku,stock_quantity,min_stock_level,weight,dimensions,is_active,is_featured,meta_title,meta_description
"Wireless Headphones","High-quality headphones","Premium headphones",99.99,79.99,"https://example.com/image.jpg","Electronics","WH-001",50,10,0.5,"20x18x8 cm",true,true,"Best Headphones","Premium wireless headphones"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully. Processing started.",
  "uploadId": 123
}
```

### 2. Get Upload Status (Protected)
**Endpoint:** `GET /api/website/bulk-upload/:uploadId/status`  
**Authentication:** Required  
**Description:** Check the status of a bulk upload

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "filename": "products.csv",
    "total_rows": 100,
    "processed_rows": 100,
    "success_rows": 95,
    "error_rows": 5,
    "status": "completed",
    "error_log": [
      {
        "row": 10,
        "data": {...},
        "error": "Category not found: Invalid Category"
      }
    ],
    "started_at": "2024-01-01T00:00:00.000Z",
    "completed_at": "2024-01-01T00:05:00.000Z"
  }
}
```

---

## 🔍 Error Responses

### Common Error Formats:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Common Error Messages:
- `"Access token required"` - Missing Authorization header
- `"Invalid token"` - JWT token is invalid
- `"Token expired"` - JWT token has expired
- `"Product not found"` - Product ID doesn't exist
- `"Category not found"` - Category ID doesn't exist
- `"SKU already exists"` - Duplicate SKU
- `"Only CSV files are allowed"` - Invalid file type for bulk upload

---

## 🧪 Testing Examples

### Using cURL:

#### 1. Get Products (Public)
```bash
curl -X GET "https://your-domain.com/api/website/products?page=1&limit=5"
```

#### 2. Get Categories (Public)
```bash
curl -X GET "https://your-domain.com/api/website/categories"
```

#### 3. Create Product (Protected)
```bash
curl -X POST "https://your-domain.com/api/website/products" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Test Product",
    "description": "Test description",
    "price": 29.99,
    "category_id": 1,
    "stock_quantity": 100
  }'
```

#### 4. Create Category (Protected)
```bash
curl -X POST "https://your-domain.com/api/website/categories" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "description": "Test category description",
    "sort_order": 10
  }'
```

#### 5. Bulk Upload (Protected)
```bash
curl -X POST "https://your-domain.com/api/website/products/bulk-upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "csvFile=@products.csv"
```

### Using JavaScript (Frontend):
```javascript
// Get products
const response = await fetch('/api/website/products?page=1&limit=10');
const data = await response.json();

// Create product (with auth)
const token = localStorage.getItem('authToken');
const response = await fetch('/api/website/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_name: 'New Product',
    price: 29.99,
    category_id: 1
  })
});
```

---

## 📊 Database Views

### Available Views:
1. `website_products_with_category` - Products with category information
2. `website_low_stock_products` - Products below minimum stock level
3. `website_featured_products` - Featured products only

### Example Query:
```sql
SELECT * FROM website_products_with_category 
WHERE category_slug = 'electronics' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🚀 Rate Limits & Performance

- **Public endpoints**: No rate limit
- **Protected endpoints**: Standard rate limiting applies
- **Bulk upload**: Max 10MB file size, processed asynchronously
- **Pagination**: Default 20 items per page, max 100
- **Search**: Indexed on product_name and description
- **Caching**: Categories are cached for better performance

---

## 📝 Notes

1. **Slug Generation**: If not provided, slugs are auto-generated from names
2. **SKU Generation**: If not provided, SKUs are auto-generated with timestamp
3. **Soft Deletes**: Products and categories are marked inactive, not physically deleted
4. **Parent Categories**: Categories can have parent-child relationships
5. **JSON Fields**: `additional_images`, `tags`, and `attributes` accept JSON arrays/objects
6. **Bulk Processing**: Large CSV files are processed asynchronously with status tracking

---

## 🔧 Troubleshooting

### Common Issues:
1. **401 Unauthorized**: Check if JWT token is valid and not expired
2. **Category not found**: Ensure category exists and is active
3. **SKU conflicts**: Use unique SKUs or let system auto-generate
4. **CSV upload fails**: Check file format and required columns
5. **Slow queries**: Use pagination and filters for large datasets

### Debug Endpoints:
- Check server health: `GET /api/health`
- Verify token: Decode JWT token to check expiration
- Database status: Check if tables exist and have data

---

**API Version**: 1.0  
**Last Updated**: February 2024  
**Base URL**: `https://your-domain.com/api/website`