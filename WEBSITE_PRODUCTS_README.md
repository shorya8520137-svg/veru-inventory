# Website Product Management System

A comprehensive product management system for e-commerce websites with bulk upload functionality.

## 🌟 Features

### Core Features
- ✅ **Product Management**: Create, read, update, delete products
- ✅ **Bulk Upload**: CSV-based bulk product import
- ✅ **Category Management**: Organize products by categories
- ✅ **Image Support**: Product images with URL support
- ✅ **Pricing & Offers**: Regular price and offer pricing
- ✅ **Stock Management**: Track inventory levels
- ✅ **Featured Products**: Mark products as featured
- ✅ **SEO Support**: Meta titles and descriptions
- ✅ **Search & Filters**: Advanced product filtering
- ✅ **Pagination**: Efficient data loading

### Advanced Features
- 🔄 **Real-time Upload Progress**: Track bulk upload status
- 📊 **Product Statistics**: Stock levels, pricing insights
- 🏷️ **Product Variants**: Size, color, and other variations
- 📱 **Responsive Design**: Mobile-friendly interface
- 🔐 **Authentication**: Secure access control
- 📝 **Audit Trail**: Track all product changes

## 🗂️ File Structure

```
inventoryfullstack/
├── controllers/
│   └── websiteProductController.js     # Backend API controller
├── routes/
│   └── websiteProductRoutes.js         # API routes definition
├── src/
│   ├── app/
│   │   └── website-products/
│   │       ├── page.jsx                # Main frontend page
│   │       └── websiteProducts.module.css # Styling
│   └── services/
│       └── api/
│           └── websiteProducts.js      # Frontend API service
├── website-product-schema.sql          # Database schema
├── sample-products-template.csv        # CSV template
└── WEBSITE_PRODUCTS_README.md         # This documentation
```

## 🗄️ Database Schema

### Tables Created
1. **website_categories** - Product categories
2. **website_products** - Main products table
3. **website_bulk_uploads** - Bulk upload tracking
4. **website_product_variants** - Product variations

### Key Features
- Foreign key relationships
- Indexes for performance
- JSON fields for flexible data
- Soft delete functionality
- Audit timestamps

## 🚀 API Endpoints

### Public Endpoints (No Authentication)
```
GET    /api/website/products              # Get products with filters
GET    /api/website/products/featured     # Get featured products
GET    /api/website/products/:id          # Get single product
GET    /api/website/categories            # Get all categories
```

### Protected Endpoints (Authentication Required)
```
POST   /api/website/products              # Create product
PUT    /api/website/products/:id          # Update product
DELETE /api/website/products/:id          # Delete product (soft)
POST   /api/website/products/bulk-upload  # Bulk upload CSV
GET    /api/website/bulk-upload/:id/status # Upload status
```

## 📊 CSV Bulk Upload Format

### Required Columns
- `product_name` - Product name (required)
- `price` - Product price (required)
- `category_name` - Category name (required, must exist)

### Optional Columns
- `description` - Full product description
- `short_description` - Brief description (max 500 chars)
- `offer_price` - Discounted price
- `image_url` - Product image URL
- `sku` - Stock keeping unit (auto-generated if empty)
- `stock_quantity` - Available stock (default: 0)
- `min_stock_level` - Minimum stock alert level (default: 0)
- `weight` - Product weight in kg
- `dimensions` - Product dimensions (e.g., "10x20x30 cm")
- `is_active` - Active status (true/false, default: true)
- `is_featured` - Featured status (true/false, default: false)
- `meta_title` - SEO title
- `meta_description` - SEO description

### Sample CSV
```csv
product_name,description,price,offer_price,category_name,image_url,stock_quantity
"Wireless Headphones","Premium headphones with noise cancellation",99.99,79.99,"Electronics","https://example.com/headphones.jpg",50
"Cotton T-Shirt","100% organic cotton t-shirt",24.99,,"Clothing","https://example.com/tshirt.jpg",100
```

## 🎨 Frontend Features

### Main Interface
- **Product Grid/Table**: Sortable, filterable product list
- **Search Bar**: Real-time product search
- **Category Filter**: Filter by product categories
- **Price Range Filter**: Min/max price filtering
- **Status Filters**: Active/inactive, featured/non-featured

### Product Management
- **Add Product Modal**: Complete product creation form
- **Edit Product**: In-place product editing
- **Delete Product**: Soft delete with confirmation
- **Bulk Actions**: Mass operations on selected products

### Bulk Upload
- **CSV Upload**: Drag-and-drop or file picker
- **Progress Tracking**: Real-time upload progress
- **Error Reporting**: Detailed error logs
- **Template Download**: Sample CSV template

## 🔧 Setup Instructions

### 1. Database Setup
```sql
-- Run the schema file
mysql -u username -p database_name < website-product-schema.sql
```

### 2. Backend Setup
The routes are automatically loaded in `server.js`:
```javascript
app.use("/api/website", require("./routes/websiteProductRoutes"));
```

### 3. Frontend Access
Navigate to: `http://localhost:3000/website-products`

### 4. Upload Directory
Ensure the upload directory exists:
```bash
mkdir -p uploads/bulk-products
```

## 🔐 Authentication

### Required Permissions
- **View Products**: Public access for product listing
- **Manage Products**: Authentication required for CRUD operations
- **Bulk Upload**: Authentication required for CSV uploads

### Token Usage
```javascript
// Frontend automatically includes token
const token = localStorage.getItem('authToken');
```

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 1200px - Full feature set
- **Tablet**: 768px - 1200px - Adapted layout
- **Mobile**: < 768px - Stacked layout, touch-friendly

### Mobile Features
- Touch-friendly buttons
- Swipe gestures
- Optimized forms
- Collapsible filters

## 🚀 Performance Optimizations

### Backend
- **Database Indexes**: Optimized queries
- **Pagination**: Efficient data loading
- **File Streaming**: Large CSV handling
- **Connection Pooling**: Database optimization

### Frontend
- **Lazy Loading**: On-demand data fetching
- **Debounced Search**: Reduced API calls
- **Caching**: Local storage for categories
- **Optimistic Updates**: Immediate UI feedback

## 🔍 Search & Filtering

### Search Capabilities
- Product name search
- Description search
- SKU search
- Category search

### Filter Options
- Category selection
- Price range (min/max)
- Stock status
- Featured status
- Active/inactive status
- Date range

### Sorting Options
- Product name (A-Z, Z-A)
- Price (low to high, high to low)
- Created date (newest, oldest)
- Stock quantity
- Category name

## 📈 Analytics & Reporting

### Available Metrics
- Total products count
- Active/inactive products
- Featured products count
- Low stock alerts
- Category distribution
- Price range analysis

### Export Options
- CSV export with filters
- Product reports
- Stock reports
- Category reports

## 🛠️ Customization

### Adding New Fields
1. Update database schema
2. Modify controller validation
3. Update frontend forms
4. Add to CSV template

### Custom Categories
Categories are managed through the database and can be added via:
```sql
INSERT INTO website_categories (name, description, slug) 
VALUES ('New Category', 'Description', 'new-category');
```

## 🐛 Troubleshooting

### Common Issues

#### CSV Upload Fails
- Check file format (must be .csv)
- Verify required columns exist
- Ensure categories exist in database
- Check file size (max 10MB)

#### Products Not Displaying
- Verify `is_active = true`
- Check category assignment
- Ensure proper authentication

#### Search Not Working
- Check API endpoint connectivity
- Verify search parameters
- Check database indexes

### Error Codes
- **400**: Bad request (missing required fields)
- **401**: Unauthorized (authentication required)
- **404**: Product/category not found
- **500**: Server error (check logs)

## 🔄 Future Enhancements

### Planned Features
- [ ] Product reviews and ratings
- [ ] Advanced image management
- [ ] Product bundles and packages
- [ ] Inventory alerts and notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Product import from external sources
- [ ] Automated pricing rules

### API Improvements
- [ ] GraphQL support
- [ ] Webhook notifications
- [ ] Rate limiting
- [ ] API versioning
- [ ] Advanced caching

## 📞 Support

For issues or questions regarding the Website Product Management system:

1. Check this documentation
2. Review error logs in browser console
3. Check server logs for backend issues
4. Verify database connectivity
5. Ensure proper authentication

## 📄 License

This Website Product Management system is part of the InventoryFullStack project and follows the same licensing terms.