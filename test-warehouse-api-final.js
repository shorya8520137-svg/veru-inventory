const https = require('https');

const API_BASE = 'https://api.giftgala.in';
const TOKEN = 'test-token'; // You'll need a valid token

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testAPIs() {
    console.log('🧪 Testing Warehouse Management APIs\n');
    console.log(`API Base: ${API_BASE}\n`);

    try {
        // Test 1: GET Warehouses
        console.log('1️⃣  Testing GET /api/warehouse-management/warehouses');
        const warehousesRes = await makeRequest('GET', '/api/warehouse-management/warehouses');
        console.log(`   Status: ${warehousesRes.status}`);
        console.log(`   Response:`, JSON.stringify(warehousesRes.body, null, 2));
        console.log('');

        // Test 2: GET Stores
        console.log('2️⃣  Testing GET /api/warehouse-management/stores');
        const storesRes = await makeRequest('GET', '/api/warehouse-management/stores');
        console.log(`   Status: ${storesRes.status}`);
        console.log(`   Response:`, JSON.stringify(storesRes.body, null, 2));
        console.log('');

        // Test 3: POST Create Warehouse
        console.log('3️⃣  Testing POST /api/warehouse-management/warehouses');
        const newWarehouse = {
            warehouse_code: 'TEST_WH_' + Date.now(),
            warehouse_name: 'Test Warehouse',
            address: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            phone: '+91-9999999999',
            email: 'test@insora.in',
            manager_name: 'Test Manager',
            capacity: 10000
        };
        const createWarehouseRes = await makeRequest('POST', '/api/warehouse-management/warehouses', newWarehouse);
        console.log(`   Status: ${createWarehouseRes.status}`);
        console.log(`   Response:`, JSON.stringify(createWarehouseRes.body, null, 2));
        console.log('');

        // Test 4: POST Create Store
        console.log('4️⃣  Testing POST /api/warehouse-management/stores');
        const newStore = {
            store_code: 'TEST_ST_' + Date.now(),
            store_name: 'Test Store',
            store_type: 'retail',
            address: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            phone: '+91-9999999999',
            email: 'test@insora.in',
            manager_name: 'Test Manager',
            area_sqft: 5000
        };
        const createStoreRes = await makeRequest('POST', '/api/warehouse-management/stores', newStore);
        console.log(`   Status: ${createStoreRes.status}`);
        console.log(`   Response:`, JSON.stringify(createStoreRes.body, null, 2));
        console.log('');

        console.log('✅ All tests completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAPIs();
