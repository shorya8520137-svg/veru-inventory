// const API_BASE = 'http://localhost:3001'; // Local testing
const API_BASE = 'https://api.giftgala.in'; // Production testing

// Test credentials
const TEST_USER = {
    email: 'admin@company.com',
    password: 'Admin@123'
};

async function testAPIs() {
    console.log('🔐 Step 1: Logging in to get token...\n');
    
    try {
        // Login to get token
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(TEST_USER)
        });

        const loginData = await loginResponse.json();
        
        if (!loginData.token) {
            console.error('❌ Login failed:', loginData.message || 'No token received');
            return;
        }

        const token = loginData.token;
        console.log('✅ Login successful!');
        console.log('👤 User:', loginData.user?.email);
        console.log('🎫 Token:', token.substring(0, 20) + '...\n');

        // Test Warehouses API
        console.log('📦 Step 2: Testing Warehouses API...\n');
        const warehousesResponse = await fetch(`${API_BASE}/api/warehouse-management/warehouses`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const warehousesData = await warehousesResponse.json();
        
        console.log('📊 Warehouses API Response:');
        console.log('   Status:', warehousesResponse.status);
        console.log('   Success:', warehousesData.success);
        console.log('   Count:', warehousesData.warehouses?.length || 0);
        
        if (warehousesData.warehouses && warehousesData.warehouses.length > 0) {
            console.log('\n✅ Warehouses found:');
            warehousesData.warehouses.forEach((wh, i) => {
                console.log(`   ${i + 1}. ${wh.warehouse_name || wh.name} (${wh.warehouse_code || wh.code})`);
                console.log(`      Location: ${wh.city}, ${wh.state}`);
                console.log(`      Manager: ${wh.manager_name || 'N/A'}`);
            });
            
            console.log('\n📋 Sample warehouse data:');
            console.log(JSON.stringify(warehousesData.warehouses[0], null, 2));
        } else {
            console.log('⚠️ No warehouses found!');
            console.log('Response:', JSON.stringify(warehousesData, null, 2));
        }

        // Test Stores API
        console.log('\n\n🏪 Step 3: Testing Stores API...\n');
        const storesResponse = await fetch(`${API_BASE}/api/warehouse-management/stores`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const storesData = await storesResponse.json();
        
        console.log('📊 Stores API Response:');
        console.log('   Status:', storesResponse.status);
        console.log('   Success:', storesData.success);
        console.log('   Count:', storesData.stores?.length || 0);
        
        if (storesData.stores && storesData.stores.length > 0) {
            console.log('\n✅ Stores found:');
            storesData.stores.forEach((store, i) => {
                console.log(`   ${i + 1}. ${store.store_name} (${store.store_code})`);
                console.log(`      Location: ${store.city}, ${store.state}`);
                console.log(`      Manager: ${store.manager_name || 'N/A'}`);
            });
            
            console.log('\n📋 Sample store data:');
            console.log(JSON.stringify(storesData.stores[0], null, 2));
        } else {
            console.log('⚠️ No stores found!');
            console.log('Response:', JSON.stringify(storesData, null, 2));
        }

        console.log('\n\n✅ API Testing Complete!');

    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        console.error(error);
    }
}

// Run the tests
testAPIs();
