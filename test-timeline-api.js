const axios = require('axios');

// Timeline API Test Script
async function testTimelineAPI() {
    console.log('🔍 Testing Timeline API with Token...\n');
    
    // Configuration
    const API_BASE = 'https://api.giftgala.in';
    const TEST_BARCODE = '2005-999'; // Use a known barcode from your system
    
    // Using the complete authentication token
    const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';
    
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Test 1: Get timeline for specific product
        console.log('📊 Test 1: Get timeline for specific product');
        console.log(`🔗 GET ${API_BASE}/api/timeline/${TEST_BARCODE}`);
        
        const response1 = await axios.get(`${API_BASE}/api/timeline/${TEST_BARCODE}`, { headers });
        
        console.log('✅ Status:', response1.status);
        console.log('📋 Response Data:');
        console.log(JSON.stringify(response1.data, null, 2));
        console.log('\n' + '='.repeat(80) + '\n');
        
        // Test 2: Get timeline with warehouse filter
        console.log('📊 Test 2: Get timeline with warehouse filter');
        console.log(`🔗 GET ${API_BASE}/api/timeline/${TEST_BARCODE}?warehouse=BLR_WH`);
        
        const response2 = await axios.get(`${API_BASE}/api/timeline/${TEST_BARCODE}?warehouse=BLR_WH`, { headers });
        
        console.log('✅ Status:', response2.status);
        console.log('📋 Response Data:');
        console.log(JSON.stringify(response2.data, null, 2));
        console.log('\n' + '='.repeat(80) + '\n');
        
        // Test 3: Get timeline with date filters
        console.log('📊 Test 3: Get timeline with date filters');
        const dateFrom = '2026-01-01';
        const dateTo = '2026-01-31';
        console.log(`🔗 GET ${API_BASE}/api/timeline/${TEST_BARCODE}?dateFrom=${dateFrom}&dateTo=${dateTo}`);
        
        const response3 = await axios.get(`${API_BASE}/api/timeline/${TEST_BARCODE}?dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers });
        
        console.log('✅ Status:', response3.status);
        console.log('📋 Response Data:');
        console.log(JSON.stringify(response3.data, null, 2));
        console.log('\n' + '='.repeat(80) + '\n');
        
        // Test 4: Get timeline summary
        console.log('📊 Test 4: Get timeline summary');
        console.log(`🔗 GET ${API_BASE}/api/timeline`);
        
        const response4 = await axios.get(`${API_BASE}/api/timeline`, { headers });
        
        console.log('✅ Status:', response4.status);
        console.log('📋 Response Data:');
        console.log(JSON.stringify(response4.data, null, 2));
        console.log('\n' + '='.repeat(80) + '\n');
        
        // Test 5: Get timeline summary grouped by warehouse
        console.log('📊 Test 5: Get timeline summary grouped by warehouse');
        console.log(`🔗 GET ${API_BASE}/api/timeline?groupBy=warehouse`);
        
        const response5 = await axios.get(`${API_BASE}/api/timeline?groupBy=warehouse`, { headers });
        
        console.log('✅ Status:', response5.status);
        console.log('📋 Response Data:');
        console.log(JSON.stringify(response5.data, null, 2));
        
        console.log('\n🎉 All timeline API tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Timeline API Test Error:');
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📋 Response:', error.response.data);
            console.error('🔗 URL:', error.config.url);
            
            if (error.response.status === 401) {
                console.error('\n💡 Authentication Error - Token might be:');
                console.error('   - Expired');
                console.error('   - Invalid');
                console.error('   - Missing');
                console.error('   - Please get a fresh token from browser localStorage');
            }
            
            if (error.response.status === 403) {
                console.error('\n💡 Permission Error - User might not have:');
                console.error('   - inventory.timeline permission');
                console.error('   - Access to timeline data');
            }
            
        } else if (error.request) {
            console.error('📡 Network Error:', error.message);
            console.error('💡 Check if API server is running and accessible');
        } else {
            console.error('⚙️ Setup Error:', error.message);
        }
    }
}

// Helper function to test with different barcodes
async function testMultipleBarcodes() {
    const testBarcodes = [
        '2005-999',
        '2460-3499', 
        'TEST-001'
    ];
    
    console.log('🔍 Testing Timeline API with Multiple Barcodes...\n');
    
    for (const barcode of testBarcodes) {
        console.log(`📊 Testing barcode: ${barcode}`);
        
        try {
            const response = await axios.get(`https://api.giftgala.in/api/timeline/${barcode}`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`✅ ${barcode}: ${response.data.data?.timeline?.length || 0} timeline entries`);
            
        } catch (error) {
            console.log(`❌ ${barcode}: ${error.response?.status || 'Network Error'} - ${error.response?.data?.message || error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }
}

// CURL command generator
function generateCurlCommands() {
    console.log('📋 CURL Commands for Timeline API Testing:\n');
    
    const TOKEN = 'YOUR_TOKEN_HERE';
    const API_BASE = 'https://api.giftgala.in';
    const BARCODE = '2005-999';
    
    const commands = [
        {
            name: 'Get Product Timeline',
            curl: `curl -X GET "${API_BASE}/api/timeline/${BARCODE}" \\
  -H "Authorization: Bearer ${TOKEN}" \\
  -H "Content-Type: application/json"`
        },
        {
            name: 'Get Timeline with Warehouse Filter',
            curl: `curl -X GET "${API_BASE}/api/timeline/${BARCODE}?warehouse=BLR_WH" \\
  -H "Authorization: Bearer ${TOKEN}" \\
  -H "Content-Type: application/json"`
        },
        {
            name: 'Get Timeline with Date Range',
            curl: `curl -X GET "${API_BASE}/api/timeline/${BARCODE}?dateFrom=2026-01-01&dateTo=2026-01-31" \\
  -H "Authorization: Bearer ${TOKEN}" \\
  -H "Content-Type: application/json"`
        },
        {
            name: 'Get Timeline Summary',
            curl: `curl -X GET "${API_BASE}/api/timeline" \\
  -H "Authorization: Bearer ${TOKEN}" \\
  -H "Content-Type: application/json"`
        },
        {
            name: 'Get Timeline Summary by Warehouse',
            curl: `curl -X GET "${API_BASE}/api/timeline?groupBy=warehouse" \\
  -H "Authorization: Bearer ${TOKEN}" \\
  -H "Content-Type: application/json"`
        }
    ];
    
    commands.forEach((cmd, index) => {
        console.log(`${index + 1}. ${cmd.name}:`);
        console.log(cmd.curl);
        console.log('');
    });
    
    console.log('💡 Replace YOUR_TOKEN_HERE with your actual authentication token');
}

// Run the tests
if (require.main === module) {
    console.log('🚀 Timeline API Test Options:');
    console.log('1. Run full API tests');
    console.log('2. Generate CURL commands');
    console.log('3. Test multiple barcodes\n');
    
    // Uncomment the test you want to run:
    testTimelineAPI();
    // generateCurlCommands();
    // testMultipleBarcodes();
}

module.exports = {
    testTimelineAPI,
    testMultipleBarcodes,
    generateCurlCommands
};