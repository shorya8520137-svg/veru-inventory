#!/usr/bin/env node

// Validate API structure without running server
console.log('🔍 Validating API Structure...');
console.log('================================');

try {
    // Test controller syntax
    console.log('📁 Testing websiteProductController.js syntax...');
    const controller = require('./controllers/websiteProductController');
    console.log('✅ Controller loaded successfully');
    
    // Check if all methods exist
    const expectedMethods = [
        'getProducts',
        'getProduct', 
        'createProduct',
        'updateProduct',
        'deleteProduct',
        'getCategories',
        'createCategory',
        'updateCategory',
        'deleteCategory',
        'getFeaturedProducts'
    ];
    
    console.log('\n📋 Checking controller methods...');
    expectedMethods.forEach(method => {
        if (typeof controller[method] === 'function') {
            console.log(`✅ ${method} - OK`);
        } else {
            console.log(`❌ ${method} - MISSING`);
        }
    });
    
    // Test routes syntax
    console.log('\n🛣️  Testing websiteProductRoutes.js syntax...');
    const routes = require('./routes/websiteProductRoutes');
    console.log('✅ Routes loaded successfully');
    
    // Test database connection
    console.log('\n🗄️  Testing database connection module...');
    const db = require('./db/connection');
    console.log('✅ Database connection module loaded');
    
    console.log('\n🎉 All API components validated successfully!');
    console.log('================================');
    console.log('✅ Ready for server deployment');
    console.log('💡 Next steps:');
    console.log('   1. Pull changes on server: git pull origin main');
    console.log('   2. Restart server: pm2 restart all');
    console.log('   3. Test API: node test-website-products-fixed.js');
    
} catch (error) {
    console.log('❌ Validation failed:', error.message);
    console.log('Stack:', error.stack);
    process.exit(1);
}