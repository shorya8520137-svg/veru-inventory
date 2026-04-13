// Test script to check if websiteOrderRoutes can be loaded
console.log('🔧 Testing Website Order Routes Loading...');

try {
    // Test if the controller exists and can be loaded
    console.log('1. Testing controller...');
    const controller = require('./controllers/websiteOrderController');
    console.log('✅ Controller loaded successfully');
    console.log('Available methods:', Object.getOwnPropertyNames(controller));

    // Test if the routes file can be loaded
    console.log('\n2. Testing routes file...');
    const routes = require('./routes/websiteOrderRoutes');
    console.log('✅ Routes file loaded successfully');
    console.log('Routes type:', typeof routes);

    // Test if websiteProductRoutes exists for comparison
    console.log('\n3. Testing websiteProductRoutes for comparison...');
    const productRoutes = require('./routes/websiteProductRoutes');
    console.log('✅ Product routes loaded successfully');

    console.log('\n🎉 All files load correctly - the issue is likely in server.js routing configuration');

} catch (error) {
    console.error('❌ Error loading files:', error.message);
    console.error('Stack:', error.stack);
}