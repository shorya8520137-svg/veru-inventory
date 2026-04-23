const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:5000';
let TEST_TOKEN = null;

// Test credentials (update these with valid credentials)
const TEST_CREDENTIALS = {
    email: 'admin@insora.in',
    password: 'admin123'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port || 5000,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Test functions
async function testAPI() {
    console.log('🧪 Testing Warehouse Management API\n');
    console.log(`API Base: ${API_BASE}\n`);

    try {
        // Step 1: Login to get token
        console.log('🔐 Step 1: Logging in to get JWT token...');
        const loginRes = await makeRequest('POST', '/api/auth/login', TEST_CREDENTIALS);
        console.log(`Status: ${loginRes.status}`);
        
        if (loginRes.status !== 200 || !loginRes.data.token) {
            console.error('❌ Login failed!');
            console.error('Response:', JSON.stringify(loginRes.data, null, 2));
            console.error('\nMake sure:');
            console.error('1. Backend server is running on port 5000');
            console.error('2. Database has a user with email:', TEST_CREDENTIALS.email);
            console.error('3. Password is correct');
            return;
        }

        TEST_TOKEN = loginRes.data.token;
        console.log('✅ Login successful! Token obtained.\n');
        console.log('---\n');

        // Test 1: Get all warehouses
        console.log('1️⃣  Testing GET /api/warehouse-management/warehouses');
        const warehousesRes = await makeRequest('GET', '/api/warehouse-management/warehouses', null, TEST_TOKEN);
        console.log(`Status: ${warehousesRes.status}`);
        console.log(`Response:`, JSON.stringify(warehousesRes.data, null, 2));
        console.log('\n---\n');

        // Test 2: Get all stores
        console.log('2️⃣  Testing GET /api/warehouse-management/stores');
        const storesRes = await makeRequest('GET', '/api/warehouse-management/stores', null, TEST_TOKEN);
        console.log(`Status: ${storesRes.status}`);
        console.log(`Response:`, JSON.stringify(storesRes.data, null, 2));
        console.log('\n---\n');

        // Test 3: Create a warehouse
        console.log('3️⃣  Testing POST /api/warehouse-management/warehouses');
        const newWarehouse = {
            warehouse_code: 'TEST_WH_' + Date.now(),
            warehouse_name: 'Test Warehouse',
            location: 'Test Location',
            address: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            country: 'India',
            pincode: '123456',
            phone: '+91-9876543210',
            email: 'test@warehouse.com',
            manager_name: 'Test Manager',
            capacity: 10000
        };
        const createWarehouseRes = await makeRequest('POST', '/api/warehouse-management/warehouses', newWarehouse, TEST_TOKEN);
        console.log(`Status: ${createWarehouseRes.status}`);
        console.log(`Response:`, JSON.stringify(createWarehouseRes.data, null, 2));
        console.log('\n---\n');

        // Test 4: Create a store
        console.log('4️⃣  Testing POST /api/warehouse-management/stores');
        const newStore = {
            store_code: 'TEST_ST_' + Date.now(),
            store_name: 'Test Store',
            store_type: 'retail',
            address: '456 Test Avenue',
            city: 'Test City',
            state: 'Test State',
            country: 'India',
            pincode: '654321',
            phone: '+91-9876543211',
            email: 'test@store.com',
            manager_name: 'Store Manager',
            area_sqft: 5000
        };
        const createStoreRes = await makeRequest('POST', '/api/warehouse-management/stores', newStore, TEST_TOKEN);
        console.log(`Status: ${createStoreRes.status}`);
        console.log(`Response:`, JSON.stringify(createStoreRes.data, null, 2));
        console.log('\n---\n');

        console.log('✅ All tests completed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Make sure:');
        console.error('1. Backend server is running on port 5000');
        console.error('2. Database is accessible');
    }
}

testAPI();
