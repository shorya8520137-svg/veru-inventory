/**
 * Test Cleanup API
 * Call the cleanup endpoint to clean store inventory and fix product names
 */

const https = require('https');

console.log('🧹 Testing Cleanup API...\n');

// First check status
const checkStatus = () => {
    const options = {
        hostname: 'api.giftgala.in',
        port: 443,
        path: '/api/cleanup/status',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
        }
    };

    console.log('📊 Checking current database status...');
    
    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('Current Status:', JSON.stringify(response, null, 2));
                
                if (response.success) {
                    console.log('\n🏭 Warehouse Products:');
                    response.data.warehouseProducts.forEach(p => {
                        console.log(`  - ${p.product} (${p.code}) - Stock: ${p.stock}`);
                    });
                    console.log(`\n🏪 Store Inventory Count: ${response.data.storeInventoryCount}`);
                    
                    // Now run cleanup
                    runCleanup();
                }
            } catch (e) {
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => console.error('Status check failed:', e.message));
    req.end();
};

// Run cleanup
const runCleanup = () => {
    const options = {
        hostname: 'api.giftgala.in',
        port: 443,
        path: '/api/cleanup/store-inventory',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
        }
    };

    console.log('\n🧹 Running cleanup...');
    
    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('\nCleanup Result:', JSON.stringify(response, null, 2));
                
                if (response.success) {
                    console.log('\n✅ Cleanup completed successfully!');
                    console.log(`📦 Updated ${response.data.updatedProducts} products`);
                    console.log(`🏪 Store inventory count: ${response.data.storeInventoryCount}`);
                    
                    console.log('\n🏭 Updated Warehouse Products:');
                    response.data.warehouseProducts.forEach(p => {
                        console.log(`  - ${p.product} (${p.code}) - Stock: ${p.stock}`);
                    });
                    
                    console.log('\n🎯 Ready to test self transfer!');
                    console.log('Go to frontend and test W to S transfer with iPhone 15 Pro Max');
                }
            } catch (e) {
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => console.error('Cleanup failed:', e.message));
    req.end();
};

// Start the test
checkStatus();