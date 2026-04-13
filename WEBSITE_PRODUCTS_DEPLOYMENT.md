# Website Product Management - Deployment Guide

## 🚀 Quick Setup Instructions

### 1. Database Setup
```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Run the setup script
source setup-website-products-database.sql;

# Or alternatively:
mysql -u your_username -p your_database_name < setup-website-products-database.sql
```

### 2. Verify Database Setup
```sql
-- Check if tables were created
SHOW TABLES LIKE 'website_%';

-- Should show:
-- website_categories
-- website_products  
-- website_bulk_uploads
-- website_product_variants

-- Check sample data
SELECT COUNT(*) FROM website_products;
SELECT * FROM website_categories;
```

### 3. Server Setup
```bash
# Create upload directory
mkdir -p uploads/bulk-products
chmod 755 uploads/bulk-products

# Install dependencies (if not already installed)
npm install multer csv-parser

# Restart your server
pm2 restart your-app-name
# or
node server.js
```

### 4. Test the System

#### Frontend Access
- Navigate to: `https://your-domain.com/website-products`
- Should see the Website Product Management interface

#### API Endpoints Test
```bash
# Test categories endpoint (public)
curl https://your-domain.com/api/website/categories

# Test products endpoint (public)  
curl https://your-domain.com/api/website/products?page=1&limit=5

# Test with authentication (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/website/products
```

### 5. Bulk Upload Test
1. Download the sample CSV: `sample-products-template.csv`
2. Go to Website Products page
3. Click "Bulk Upload"
4. Upload the CSV file
5. Monitor the progress

## 📋 Files Added/Modified

### New Files Created:
- `setup-website-products-database.sql` - Database setup script
- `controllers/websiteProductController.js` - Backend controller
- `routes/websiteProductRoutes.js` - API routes
- `src/app/website-products/page.jsx` - Frontend page
- `src/app/website-products/websiteProducts.module.css` - Styles
- `src/services/api/websiteProducts.js` - Frontend API service
- `sample-products-template.csv` - CSV template

### Modified Files:
- `server.js` - Added website product routes
- `src/components/ui/sidebar.jsx` - Added sidebar menu item
- `src/components/TopNavBar.jsx` - Added navigation item

## 🔧 Configuration

### Environment Variables
No additional environment variables needed. Uses existing:
- `NEXT_PUBLIC_API_BASE` - API base URL
- Database connection from existing `db/connection.js`

### Permissions
Uses existing permission system:
- `PERMISSIONS.PRODUCTS_VIEW` - Required for access

## 🧪 Testing Checklist

- [ ] Database tables created successfully
- [ ] Sample categories and products inserted
- [ ] Frontend page loads without errors
- [ ] Sidebar navigation works
- [ ] Product listing displays correctly
- [ ] Add/Edit product forms work
- [ ] Category management modal functions
- [ ] Bulk upload processes CSV files
- [ ] Search and filtering work
- [ ] Pagination functions correctly
- [ ] Authentication is enforced for protected routes

## 🐛 Troubleshooting

### Common Issues:

#### 1. Database Connection Error
```
Error: ER_NO_SUCH_TABLE: Table 'website_products' doesn't exist
```
**Solution**: Run the setup SQL script

#### 2. Upload Directory Error
```
Error: ENOENT: no such file or directory, open 'uploads/bulk-products/...'
```
**Solution**: Create upload directory with proper permissions

#### 3. Authentication Error
```
Error: Access token required
```
**Solution**: Ensure user is logged in and has proper permissions

#### 4. CSV Upload Fails
```
Error: Only CSV files are allowed
```
**Solution**: Use proper CSV format, check sample template

### Debug Commands:
```sql
-- Check table structure
DESCRIBE website_products;

-- View recent uploads
SELECT * FROM website_bulk_uploads ORDER BY started_at DESC LIMIT 5;

-- Check product counts by category
SELECT c.name, COUNT(p.id) as product_count 
FROM website_categories c 
LEFT JOIN website_products p ON c.id = p.category_id 
GROUP BY c.id;
```

## 📊 Performance Notes

- Tables are indexed for optimal query performance
- Bulk uploads are processed asynchronously
- Large CSV files (>10MB) are rejected
- Product images are stored as URLs (not uploaded files)

## 🔄 Updates & Maintenance

### Adding New Categories:
```sql
INSERT INTO website_categories (name, description, slug, sort_order) 
VALUES ('New Category', 'Description here', 'new-category', 9);
```

### Backup Important Data:
```bash
# Backup website product tables
mysqldump -u username -p database_name \
  website_categories website_products website_bulk_uploads \
  > website_products_backup.sql
```

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify database connection and table structure
3. Ensure all required files are present
4. Test API endpoints directly with curl/Postman
5. Check browser console for frontend errors

---

**System is ready for production use!** 🎉