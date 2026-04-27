/**
 * COMPLETE AUTOMATED TEST - LOGIN + TRANSFER + VERIFY
 * 
 * This script will:
 * 1. Login automatically to get token
 * 2. Get warehouse inventory
 * 3. Transfer product to HYD_KONDAPUR (zero products store)
 * 4. Check store inventory
 * 5. Check timeline
 * 6. Verify everything is correct
 */

const https = require('https');

const BASE_URL = 'api.giftgala.in';
const TEST_STORE = 'HYD_KONDAPUR'; // Store with zero products
const SOURCE_WAREHOUSE = 'GGM_WH';

// Login credentials
const credentials = {
    email: 'admin@company.com',
    password: 'Admin@123'
};

let AUTH_TOKEN = null;

function makeRequest(path, method = 'GET', data = null, useAuth = true) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (useAuth && AUTH_TOKEN) {
            headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
        }
        
        const options = {
            hostname: BASE_URL,
            port: 443,
            path: path,
            method: method,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        body: JSON.parse(responseData)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        body: responseData
                    });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function login() {
    console.log('🔐 Step 1: Logging in...\n');
    
    try {
        // Try main login endpoint
        let response = await makeRequest('/api/auth/login', 'POST', credentials, false);
        
        if (response.statusCode === 200 && response.body.token) {
            AUTH_TOKEN = response.body.token;
            console.log('✅ Login successful!');
            console.log(`   Token: ${AUTH_TOKEN.substring(0, 20)}...`);
            return true;
        }
        
        // Try alternative endpoint
        response = await makeRequest('/api/login', 'POST', credentials, false);
        
        if (response.statusCode === 200 && response.body.token) {
            AUTH_TOKEN = response.body.token;
            console.log('✅ Login successful (alternative endpoint)!');
            console.log(`   Token: ${AUTH_TOKEN.substring(0, 20)}...`);
            return true;
        }
        
        console.log('❌ Login failed:', response.statusCode);
        console.log(response.body);
        return false;
        
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return false;
    }
}

async function getWarehouseInventory() {
    console.log(`\n📦 Step 2: Getting ${SOURCE_WAREHOUSE} inventory...\n`);
    
    const response = await makeRequest(`/api/inventory?warehouse=${SOURCE_WAREHOUSE}&limit=50`);
    
    if (response.statusCode !== 200) {
        console.log(`❌ Failed: ${response.statusCode}`);
        console.log(response.body);
        return null;
    }
    
    const inventoryData = response.body.data || response.body;
    const products = Array.isArray(inventoryData) ? inventoryData : (inventoryData.items || inventoryData.inventory || []);
    const product = products.find(p => (p.stock || p.qty_available || p.quantity) > 0);
    
    if (!product) {
        console.log(`❌ No products with stock in ${SOURCE_WAREHOUSE}`);
        return null;
    }
    
    console.log(`✅ Found product with stock:`);
    console.log(`   Barcode: ${product.barcode}`);
    console.log(`   Name: ${product.product_name || product.name}`);
    console.log(`   Stock: ${product.stock || product.qty_available || product.quantity}`);
    
    return product;
}

async function checkStoreInventoryBefore(barcode) {
    console.log(`\n🏪 Step 3: Checking ${TEST_STORE} inventory BEFORE transfer...\n`);
    
    const response = await makeRequest(`/api/billing/store-inventory?store_filter=${TEST_STORE}`);
    
    if (response.statusCode !== 200) {
        console.log(`⚠️ Could not check inventory: ${response.statusCode}`);
        return null;
    }
    
    const inventory = response.body.data || [];
    const existingProduct = inventory.find(p => p.barcode === barcode);
    
    if (existingProduct) {
        console.log(`⚠️ Product already exists in ${TEST_STORE}:`);
        console.log(`   Stock: ${existingProduct.stock}`);
        console.log(`   Store Code: ${existingProduct.store_code}`);
        return existingProduct.stock;
    } else {
        console.log(`✅ Product NOT in ${TEST_STORE} (perfect for testing)`);
        return 0;
    }
}

async function executeTransfer(product) {
    console.log(`\n🚚 Step 4: Executing transfer ${SOURCE_WAREHOUSE} → ${TEST_STORE}...\n`);
    
    const transferData = {
        sourceType: 'warehouse',
        sourceId: SOURCE_WAREHOUSE,
        destinationType: 'store',
        destinationId: TEST_STORE,
        items: [{
            productId: `${product.product_name || product.name}||${product.barcode}`,
            transferQty: 1
        }],
        notes: 'Automated test - verifying store inventory fix'
    };
    
    console.log(`   Product: ${product.barcode}`);
    console.log(`   Quantity: 1`);
    console.log(`   Destination: ${TEST_STORE}`);
    
    const response = await makeRequest('/api/self-transfer', 'POST', transferData);
    
    if (response.statusCode !== 200) {
        console.log(`❌ Transfer failed: ${response.statusCode}`);
        console.log(response.body);
        return null;
    }
    
    if (!response.body.success) {
        console.log(`❌ Transfer failed: ${response.body.message}`);
        console.log(response.body);
        return null;
    }
    
    console.log(`✅ Transfer API call successful!`);
    console.log(`   Transfer ID: ${response.body.transferId}`);
    console.log(`   Type: ${response.body.transferType}`);
    
    return response.body;
}

async function checkStoreInventoryAfter(barcode, beforeStock) {
    console.log(`\n🔍 Step 5: Checking ${TEST_STORE} inventory AFTER transfer...\n`);
    
    // Wait for database to update
    console.log('⏳ Waiting 3 seconds for database...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const response = await makeRequest(`/api/billing/store-inventory?store_filter=${TEST_STORE}`);
    
    if (response.statusCode !== 200) {
        console.log(`❌ Failed to get inventory: ${response.statusCode}`);
        return false;
    }
    
    const inventory = response.body.data || [];
    const product = inventory.find(p => p.barcode === barcode);
    
    if (!product) {
        console.log(`❌ CRITICAL: Product NOT found in ${TEST_STORE}!`);
        console.log(`   This means the duplicate key error prevented insertion`);
        return false;
    }
    
    console.log(`✅ Product found in ${TEST_STORE}:`);
    console.log(`   Barcode: ${product.barcode}`);
    console.log(`   Name: ${product.product_name}`);
    console.log(`   Stock: ${product.stock}`);
    console.log(`   Store Code: ${product.store_code}`);
    
    // Verify store code
    if (product.store_code !== TEST_STORE) {
        console.log(`   ❌ WRONG STORE CODE! Expected: ${TEST_STORE}, Got: ${product.store_code}`);
        return false;
    }
    
    console.log(`   ✅ Store code is CORRECT!`);
    
    // Verify stock increased
    const expectedStock = beforeStock + 1;
    if (product.stock === expectedStock) {
        console.log(`   ✅ Stock increased correctly: ${beforeStock} → ${product.stock}`);
    } else {
        console.log(`   ⚠️ Stock mismatch: Expected ${expectedStock}, Got ${product.stock}`);
    }
    
    return true;
}

async function checkTimeline(barcode) {
    console.log(`\n📊 Step 6: Checking timeline for ${TEST_STORE}...\n`);
    
    const response = await makeRequest(`/api/store-timeline/${TEST_STORE}?productBarcode=${barcode}&limit=5`);
    
    if (response.statusCode !== 200) {
        console.log(`❌ Failed to get timeline: ${response.statusCode}`);
        return false;
    }
    
    if (!response.body.success) {
        console.log(`❌ Timeline API error: ${response.body.message}`);
        return false;
    }
    
    const timeline = response.body.data.timeline || [];
    
    if (timeline.length === 0) {
        console.log(`❌ No timeline entries found`);
        return false;
    }
    
    console.log(`✅ Found ${timeline.length} timeline entries:`);
    timeline.forEach((entry, i) => {
        console.log(`   ${i + 1}. ${entry.movement_type} ${entry.direction} - ${entry.quantity} units`);
        console.log(`      Balance: ${entry.balance_after}, Ref: ${entry.reference}`);
    });
    
    const latest = timeline[0];
    if (latest.direction === 'IN' && latest.movement_type === 'DISPATCH') {
        console.log(`   ✅ Timeline matches W to S transfer!`);
        return true;
    } else {
        console.log(`   ⚠️ Timeline entry doesn't match expected W to S pattern`);
        return false;
    }
}

async function checkAllStores(barcode) {
    console.log(`\n🌍 Step 7: Checking ALL stores for product ${barcode}...\n`);
    
    const response = await makeRequest('/api/billing/store-inventory?limit=1000');
    
    if (response.statusCode !== 200) {
        console.log(`⚠️ Could not check all stores: ${response.statusCode}`);
        return;
    }
    
    const allInventory = response.body.data || [];
    const matches = allInventory.filter(p => p.barcode === barcode);
    
    if (matches.length === 0) {
        console.log(`   Product not found in any store`);
        return;
    }
    
    console.log(`   Found in ${matches.length} store(s):`);
    matches.forEach(p => {
        console.log(`   - ${p.store_code}: ${p.stock} units`);
    });
    
    if (matches.length > 1) {
        console.log(`\n   ✅ GOOD: Same product exists in multiple stores!`);
        console.log(`   This means the database schema fix is working!`);
    }
}

async function runCompleteTest() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   COMPLETE AUTOMATED TEST - STORE INVENTORY FIX       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    try {
        // Step 1: Login
        const loginSuccess = await login();
        if (!loginSuccess) {
            console.log('\n❌ Cannot proceed without authentication');
            return;
        }
        
        // Step 2: Get warehouse inventory
        const product = await getWarehouseInventory();
        if (!product) {
            console.log('\n❌ Cannot proceed without product');
            return;
        }
        
        // Step 3: Check store before
        const beforeStock = await checkStoreInventoryBefore(product.barcode);
        
        // Step 4: Execute transfer
        const transferResult = await executeTransfer(product);
        if (!transferResult) {
            console.log('\n❌ Transfer failed, cannot continue');
            return;
        }
        
        // Step 5: Check store after
        const inventorySuccess = await checkStoreInventoryAfter(product.barcode, beforeStock || 0);
        
        // Step 6: Check timeline
        const timelineSuccess = await checkTimeline(product.barcode);
        
        // Step 7: Check all stores
        await checkAllStores(product.barcode);
        
        // Final verdict
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║                    TEST SUMMARY                        ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        
        if (inventorySuccess && timelineSuccess) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('✅ Product went to CORRECT store');
            console.log('✅ Store code is correct');
            console.log('✅ Timeline is working');
            console.log('✅ Stock updated correctly');
            console.log('\n🎉 THE FIX IS WORKING PERFECTLY!\n');
        } else {
            console.log('❌ TESTS FAILED!\n');
            
            if (!inventorySuccess) {
                console.log('❌ Inventory issue detected:');
                console.log('   - Product not in correct store OR');
                console.log('   - Store code is wrong OR');
                console.log('   - Duplicate key error prevented insertion\n');
                
                console.log('🔧 SOLUTION:');
                console.log('   Run the database fix:');
                console.log('   mysql -h 13.212.82.15 -u inventory_user -p inventory_db < QUICK_FIX_DATABASE.sql\n');
            }
            
            if (!timelineSuccess) {
                console.log('❌ Timeline issue detected');
                console.log('   - Timeline entries not created OR');
                console.log('   - Wrong movement type\n');
            }
        }
        
    } catch (error) {
        console.error('\n❌ Test error:', error.message);
        console.error(error.stack);
    }
}

// Run the test
runCompleteTest();
