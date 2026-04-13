# Website Products API Documentation

## 🌐 Overview
This API provides endpoints for managing and displaying products on your website. All endpoints are **public** (no authentication required) for easy website integration.

**Base URL:** `https://54.169.31.95:8443/api/website`

---

## 📦 Products API

### 1. Get All Products (with Pagination & Filters)
**Perfect for product listing pages, search results, and category pages**

```http
GET /api/website/products
```

#### Query Parameters:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 20 | Number of products per page |
| `search` | string | "" | Search in product name, description, SKU |
| `category` | string | "" | Filter by category slug |
| `minPrice` | number | 0 | Minimum price filter |
| `maxPrice` | number | 999999 | Maximum price filter |
| `featured` | boolean | "" | Filter featured products (true/false) |
| `active` | boolean | true | Filter active products |
| `sortBy` | string | created_at | Sort by: product_name, price, created_at, stock_quantity |
| `sortOrder` | string | DESC | Sort order: ASC or DESC |

#### Example Requests:
```javascript
// Get first 12 products
fetch('https://54.169.31.95:8443/api/website/products?limit=12')

// Search for "laptop" products
fetch('https://54.169.31.95:8443/api/website/products?search=laptop')

// Get products in "electronics" category, sorted by price
fetch('https://54.169.31.95:8443/api/website/products?category=electronics&sortBy=price&sortOrder=ASC')

// Get featured products under $100
fetch('https://54.169.31.95:8443/api/website/products?featured=true&maxPrice=100')
```

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_name": "Wireless Headphones",
      "description": "High-quality wireless headphones with noise cancellation",
      "short_description": "Premium wireless headphones",
      "price": 199.99,
      "offer_price": 149.99,
      "image_url": "https://example.com/headphones.jpg",
      "sku": "WH-001",
      "stock_quantity": 50,
      "min_stock_level": 10,
      "is_active": true,
      "is_featured": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "category_name": "Electronics",
      "category_slug": "electronics",
      "final_price": 149.99,
      "discount_percentage": 25.00
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 2. Get Single Product
**Perfect for product detail pages**

```http
GET /api/website/products/{id}
```

#### Example:
```javascript
fetch('https://54.169.31.95:8443/api/website/products/1')
```

#### Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_name": "Wireless Headphones",
    "description": "High-quality wireless headphones...",
    "short_description": "Premium wireless headphones",
    "price": 199.99,
    "offer_price": 149.99,
    "image_url": "https://example.com/headphones.jpg",
    "additional_images": ["image1.jpg", "image2.jpg"],
    "sku": "WH-001",
    "stock_quantity": 50,
    "weight": "0.5",
    "dimensions": "20x15x8 cm",
    "is_active": true,
    "is_featured": true,
    "meta_title": "Best Wireless Headphones",
    "meta_description": "Shop premium wireless headphones...",
    "tags": ["wireless", "audio", "premium"],
    "attributes": {"color": "black", "warranty": "2 years"},
    "category_name": "Electronics",
    "category_slug": "electronics",
    "final_price": 149.99,
    "discount_percentage": 25.00,
    "variants": []
  }
}
```

### 3. Get Featured Products
**Perfect for homepage featured sections**

```http
GET /api/website/products/featured?limit=8
```

#### Example:
```javascript
// Get 8 featured products for homepage
fetch('https://54.169.31.95:8443/api/website/products/featured?limit=8')
```

---

## 📂 Categories API

### 1. Get All Categories
**Perfect for navigation menus and category filters**

```http
GET /api/website/categories
```

#### Example:
```javascript
fetch('https://54.169.31.95:8443/api/website/categories')
```

#### Response:
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
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "product_count": 25,
      "parent_name": null
    },
    {
      "id": 2,
      "name": "Smartphones",
      "description": "Mobile phones and accessories",
      "slug": "smartphones",
      "parent_id": 1,
      "sort_order": 1,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "product_count": 12,
      "parent_name": "Electronics"
    }
  ]
}
```

### 2. Create Category
**For adding new product categories**

```http
POST /api/website/categories
```

#### Request Body:
```json
{
  "name": "New Category",
  "description": "Category description",
  "slug": "new-category",
  "parent_id": null,
  "sort_order": 0
}
```

#### Example:
```javascript
fetch('https://54.169.31.95:8443/api/website/categories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Gaming',
    description: 'Gaming products and accessories',
    slug: 'gaming'
  })
})
```

### 3. Update Category
**For editing existing categories**

```http
PUT /api/website/categories/{id}
```

#### Example:
```javascript
fetch('https://54.169.31.95:8443/api/website/categories/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Updated Category Name',
    description: 'Updated description'
  })
})
```

### 4. Delete Category
**For removing categories (only if no products are assigned)**

```http
DELETE /api/website/categories/{id}
```

#### Example:
```javascript
fetch('https://54.169.31.95:8443/api/website/categories/1', {
  method: 'DELETE'
})
```

#### Response:
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Note:** Categories with active products cannot be deleted. You'll get an error:
```json
{
  "success": false,
  "message": "Cannot delete category with active products"
}
```

---

## 🚀 Website Integration Examples

### 1. Product Listing Page
```javascript
async function loadProducts(page = 1, category = '', search = '') {
    const params = new URLSearchParams({
        page: page,
        limit: 12,
        ...(category && { category }),
        ...(search && { search })
    });
    
    const response = await fetch(`https://54.169.31.95:8443/api/website/products?${params}`);
    const data = await response.json();
    
    if (data.success) {
        displayProducts(data.data);
        displayPagination(data.pagination);
    }
}

function displayProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image_url}" alt="${product.product_name}">
            <h3>${product.product_name}</h3>
            <p>${product.short_description}</p>
            <div class="price">
                ${product.offer_price ? 
                    `<span class="original-price">$${product.price}</span>
                     <span class="sale-price">$${product.offer_price}</span>
                     <span class="discount">${product.discount_percentage}% OFF</span>` :
                    `<span class="price">$${product.price}</span>`
                }
            </div>
            <button onclick="viewProduct(${product.id})">View Details</button>
        </div>
    `).join('');
}
```

### 2. Category Navigation
```javascript
async function loadCategories() {
    const response = await fetch('https://54.169.31.95:8443/api/website/categories');
    const data = await response.json();
    
    if (data.success) {
        const nav = document.getElementById('category-nav');
        nav.innerHTML = data.data.map(category => `
            <a href="/products?category=${category.slug}" class="category-link">
                ${category.name} (${category.product_count})
            </a>
        `).join('');
    }
}
```

### 3. Product Search
```javascript
async function searchProducts(query) {
    const response = await fetch(`https://54.169.31.95:8443/api/website/products?search=${encodeURIComponent(query)}&limit=20`);
    const data = await response.json();
    
    if (data.success) {
        displaySearchResults(data.data, data.pagination.total);
    }
}

function displaySearchResults(products, total) {
    const container = document.getElementById('search-results');
    container.innerHTML = `
        <h2>Found ${total} products</h2>
        <div class="products-grid">
            ${products.map(product => `
                <div class="product-item">
                    <img src="${product.image_url}" alt="${product.product_name}">
                    <h4>${product.product_name}</h4>
                    <p class="price">$${product.final_price}</p>
                </div>
            `).join('')}
        </div>
    `;
}
```

### 4. Featured Products Section
```javascript
async function loadFeaturedProducts() {
    const response = await fetch('https://54.169.31.95:8443/api/website/products/featured?limit=6');
    const data = await response.json();
    
    if (data.success) {
        const section = document.getElementById('featured-products');
        section.innerHTML = `
            <h2>Featured Products</h2>
            <div class="featured-grid">
                ${data.data.map(product => `
                    <div class="featured-product">
                        <img src="${product.image_url}" alt="${product.product_name}">
                        <h3>${product.product_name}</h3>
                        <p class="price">$${product.final_price}</p>
                        ${product.discount_percentage > 0 ? 
                            `<span class="badge">-${product.discount_percentage}%</span>` : ''
                        }
                    </div>
                `).join('')}
            </div>
        `;
    }
}
```

---

## 🔧 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (product/category doesn't exist)
- `500` - Server Error

### Example Error Handling:
```javascript
async function fetchProducts() {
    try {
        const response = await fetch('https://54.169.31.95:8443/api/website/products');
        const data = await response.json();
        
        if (!data.success) {
            console.error('API Error:', data.message);
            return;
        }
        
        // Handle successful response
        displayProducts(data.data);
        
    } catch (error) {
        console.error('Network Error:', error);
        // Show user-friendly error message
    }
}
```

---

## 📱 CORS & Security

- **CORS enabled** for all domains
- **No authentication required** for public endpoints
- **HTTPS only** for production
- **Rate limiting** may apply for high-traffic usage

---

## 🎯 Best Practices

1. **Cache responses** when possible to reduce API calls
2. **Handle loading states** for better user experience
3. **Implement pagination** for large product lists
4. **Use product slugs** for SEO-friendly URLs
5. **Optimize images** returned from `image_url` field
6. **Handle empty states** when no products found

---

## 📞 Support

For API issues or questions:
- Check server logs for detailed error information
- Verify the server is running on `https://54.169.31.95:8443`
- Test endpoints using the provided test scripts

**Test the API:**
```bash
node test-website-auth-bypass.js
```

---

## 🔄 Changelog

- **v1.0** - Initial release with products and categories endpoints
- **v1.1** - Added featured products endpoint
- **v1.2** - Added advanced filtering and search capabilities
- **v1.3** - Fixed authentication issues, made all endpoints public