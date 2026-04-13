# Product & Category API Documentation

## Overview
This document provides comprehensive documentation for the Website Product and Category APIs. These APIs allow you to manage products and categories for your e-commerce website.

**Base URL:** `https://54.169.31.95:8443/api/website`

## Authentication
- **Public Routes:** No authentication required for read operations
- **Protected Routes:** JWT token required for write operations
- **Header:** `Authorization: Bearer <your-jwt-token>`

---

## 📦 Products API

### 1. Get All Products
Retrieve a paginated list of products with filtering and sorting options.

**Endpoint:** `GET /products`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 20 | Number of products per page |
| `search` | string | - | Search in product name, description, or SKU |
| `category` | string | - | Filter by category slug |
| `minPrice` | number | 0 | Minimum price filter |
| `maxPrice` | number | 999999 | Maximum price filter |
| `featured` | boolean | - | Filter featured products (true/false) |
| `active` | boolean | true | Filter active products (true/false) |
| `sortBy` | string | created_at | Sort field (product_name, price, created_at, stock_quantity) |
| `sortOrder` | string | DESC | Sort order (ASC/DESC) |

**Example Request:**
```bash
curl -X GET "https://54.169.31.95:8443/api/website/products?page=1&limit=10&search=laptop&category=electronics&featured=true"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_name": "Gaming Laptop Pro",
      "description": "High-performance gaming laptop with RTX graphics",
      "short_description": "Ultimate gaming experience",
      "price": 1299.99,
      "offer_price": 1199.99,
      "image_url": "https://example.com/laptop.jpg",
      "sku": "WP-123456",
      "stock_quantity": 25,
      "min_stock_level": 5,
      "is_active": true,
      "is_featured": true,
      "created_at": "2025-01-01T10:00:00.000Z",
      "updated_at": "2025-01-01T10:00:00.000Z",
      "category_name": "Electronics",
      "category_slug": "electronics",
      "final_price": 1199.99,
      "discount_percentage": 7.69
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### 2. Get Single Product
Retrieve detailed information about a specific product.

**Endpoint:** `GET /products/{id}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Product ID |

**Example Request:**
```bash
curl -X GET "https://54.169.31.95:8443/api/website/products/1"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_name": "Gaming Laptop Pro",
    "description": "High-performance gaming laptop with RTX graphics",
    "short_description": "Ultimate gaming experience",
    "price": 1299.99,
    "offer_price": 1199.99,
    "image_url": "https://example.com/laptop.jpg",
    "additional_images": ["https://example.com/laptop2.jpg"],
    "sku": "WP-123456",
    "stock_quantity": 25,
    "min_stock_level": 5,
    "weight": 2.5,
    "dimensions": "35x25x2 cm",
    "is_active": true,
    "is_featured": true,
    "meta_title": "Gaming Laptop Pro - Best Performance",
    "meta_description": "Shop the best gaming laptop with RTX graphics",
    "tags": ["gaming", "laptop", "rtx"],
    "attributes": {"color": "black", "warranty": "2 years"},
    "created_at": "2025-01-01T10:00:00.000Z",
    "updated_at": "2025-01-01T10:00:00.000Z",
    "category_name": "Electronics",
    "category_slug": "electronics",
    "final_price": 1199.99,
    "discount_percentage": 7.69,
    "variants": [
      {
        "id": 1,
        "variant_name": "Color",
        "variant_value": "Black",
        "price_adjustment": 0,
        "is_active": true
      }
    ]
  }
}
```

### 3. Get Featured Products
Retrieve a list of featured products.

**Endpoint:** `GET /products/featured`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Number of featured products to return |

**Example Request:**
```bash
curl -X GET "https://54.169.31.95:8443/api/website/products/featured?limit=5"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_name": "Gaming Laptop Pro",
      "price": 1299.99,
      "offer_price": 1199.99,
      "image_url": "https://example.com/laptop.jpg",
      "category_name": "Electronics",
      "final_price": 1199.99,
      "discount_percentage": 7.69
    }
  ]
}
```

### 4. Create Product
Create a new product. **Requires Authentication.**

**Endpoint:** `POST /products`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "product_name": "Gaming Laptop Pro",
  "description": "High-performance gaming laptop with RTX graphics",
  "short_description": "Ultimate gaming experience",
  "price": 1299.99,
  "offer_price": 1199.99,
  "image_url": "https://example.com/laptop.jpg",
  "additional_images": ["https://example.com/laptop2.jpg"],
  "category_id": 1,
  "sku": "WP-123456",
  "stock_quantity": 25,
  "min_stock_level": 5,
  "weight": 2.5,
  "dimensions": "35x25x2 cm",
  "is_active": true,
  "is_featured": true,
  "meta_title": "Gaming Laptop Pro - Best Performance",
  "meta_description": "Shop the best gaming laptop with RTX graphics",
  "tags": ["gaming", "laptop", "rtx"],
  "attributes": {"color": "black", "warranty": "2 years"}
}
```

**Required Fields:**
- `product_name` (string)
- `price` (number)
- `category_id` (integer)

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "sku": "WP-123456"
  }
}
```

### 5. Update Product
Update an existing product. **Requires Authentication.**

**Endpoint:** `PUT /products/{id}`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:** (Same as Create Product, all fields optional)

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully"
}
```

### 6. Delete Product
Soft delete a product (marks as inactive). **Requires Authentication.**

**Endpoint:** `DELETE /products/{id}`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### 7. Bulk Upload Products
Upload multiple products via CSV file. **Requires Authentication.**

**Endpoint:** `POST /products/bulk-upload`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `csvFile`: CSV file (max 10MB)

**CSV Format:**
```csv
product_name,description,short_description,price,offer_price,image_url,category_name,sku,stock_quantity,min_stock_level,weight,dimensions,is_active,is_featured,meta_title,meta_description
Gaming Laptop Pro,High-performance gaming laptop,Ultimate gaming experience,1299.99,1199.99,https://example.com/laptop.jpg,Electronics,WP-123456,25,5,2.5,35x25x2 cm,true,true,Gaming Laptop Pro,Shop the best gaming laptop
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully. Processing started.",
  "uploadId": 1
}
```

### 8. Get Bulk Upload Status
Check the status of a bulk upload operation. **Requires Authentication.**

**Endpoint:** `GET /bulk-upload/{uploadId}/status`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "bulk-products-1234567890.csv",
    "total_rows": 100,
    "processed_rows": 100,
    "success_rows": 95,
    "error_rows": 5,
    "status": "completed",
    "started_at": "2025-01-01T10:00:00.000Z",
    "completed_at": "2025-01-01T10:05:00.000Z",
    "error_log": "[{\"row\": 5, \"error\": \"Category not found\"}]"
  }
}
```

---

## 🏷️ Categories API

### 1. Get All Categories
Retrieve all active categories with product counts.

**Endpoint:** `GET /categories`

**Example Request:**
```bash
curl -X GET "https://54.169.31.95:8443/api/website/categories"
```

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
      "sort_order": 1,
      "is_active": true,
      "created_at": "2025-01-01T10:00:00.000Z",
      "updated_at": "2025-01-01T10:00:00.000Z",
      "product_count": 25,
      "parent_name": null
    },
    {
      "id": 2,
      "name": "Laptops",
      "description": "Laptop computers",
      "slug": "laptops",
      "parent_id": 1,
      "sort_order": 1,
      "is_active": true,
      "created_at": "2025-01-01T10:00:00.000Z",
      "updated_at": "2025-01-01T10:00:00.000Z",
      "product_count": 10,
      "parent_name": "Electronics"
    }
  ]
}
```

### 2. Create Category
Create a new category. **Requires Authentication.**

**Endpoint:** `POST /categories`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and gadgets",
  "slug": "electronics",
  "parent_id": null,
  "sort_order": 1,
  "image_url": "https://example.com/electronics.jpg"
}
```

**Required Fields:**
- `name` (string)

**Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 1,
    "name": "Electronics",
    "slug": "electronics"
  }
}
```

### 3. Update Category
Update an existing category. **Requires Authentication.**

**Endpoint:** `PUT /categories/{id}`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:** (Same as Create Category, all fields optional)

**Response:**
```json
{
  "success": true,
  "message": "Category updated successfully"
}
```

### 4. Delete Category
Soft delete a category (marks as inactive). **Requires Authentication.**

**Endpoint:** `DELETE /categories/{id}`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Note:** Cannot delete categories that have active products.

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## 🔧 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📝 Usage Examples

### JavaScript/Node.js Example
```javascript
// Get products with authentication
const response = await fetch('https://54.169.31.95:8443/api/website/products', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

### Python Example
```python
import requests

# Create a new product
url = "https://54.169.31.95:8443/api/website/products"
headers = {
    "Authorization": "Bearer your-jwt-token",
    "Content-Type": "application/json"
}
data = {
    "product_name": "New Product",
    "price": 99.99,
    "category_id": 1
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### cURL Examples
```bash
# Get all products
curl -X GET "https://54.169.31.95:8443/api/website/products"

# Create a product
curl -X POST "https://54.169.31.95:8443/api/website/products" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"product_name":"New Product","price":99.99,"category_id":1}'

# Get categories
curl -X GET "https://54.169.31.95:8443/api/website/categories"
```

---

## 🚀 Best Practices

1. **Pagination:** Always use pagination for product listings to improve performance
2. **Caching:** Cache category data as it changes less frequently
3. **Image URLs:** Use absolute URLs for images
4. **SKU Management:** Ensure SKUs are unique across all products
5. **Error Handling:** Always check the `success` field in responses
6. **Rate Limiting:** Implement rate limiting on your client side
7. **Bulk Operations:** Use bulk upload for importing large datasets

---

## 📊 Database Schema Reference

### Products Table (`website_products`)
- `id` - Primary key
- `product_name` - Product name (required)
- `description` - Full description
- `short_description` - Brief description
- `price` - Regular price (required)
- `offer_price` - Sale price
- `image_url` - Main product image
- `additional_images` - JSON array of additional images
- `category_id` - Foreign key to categories (required)
- `sku` - Stock keeping unit (unique)
- `stock_quantity` - Current stock level
- `min_stock_level` - Minimum stock alert level
- `weight` - Product weight
- `dimensions` - Product dimensions
- `is_active` - Active status
- `is_featured` - Featured status
- `meta_title` - SEO title
- `meta_description` - SEO description
- `tags` - JSON array of tags
- `attributes` - JSON object of custom attributes
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `created_by` - User who created the product

### Categories Table (`website_categories`)
- `id` - Primary key
- `name` - Category name (required, unique)
- `description` - Category description
- `slug` - URL-friendly name (unique)
- `parent_id` - Parent category ID (for hierarchical categories)
- `sort_order` - Display order
- `image_url` - Category image
- `is_active` - Active status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

*Last updated: February 2, 2026*