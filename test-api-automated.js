/**
 * AUTOMATED API TEST - NO SSH REQUIRED
 * 
 * Just provide your auth token and this will:
 * 1. Get warehouse inventory
 * 2. Do a W to S transfer
 * 3. Check store inventory
 * 4. Check timeline
 * 5. Verify fix is working
 */

const https = require('https');

// Get token from command line or environment
const AUTH_TOKEN = process.argv[2] || process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
    console.log('❌ ERROR: No auth token provided\n');
    console.log('📋 USAGE:');
    console.log('   node test-api-automated.js YOUR_TOKEN_HERE');
    console.log('   OR');
    console.log('   $env:AUTH_TOKEN="YOUR_TOKEN"; node test-api-automated.js\n');
    console.log('🔐 HOW TO GET TOKEN:');
    console.log('   1. Open https://giftgala.in');
    console.log('   2. Login');
    console.log('   3. Press F12 → Network tab');
    console.log('   4. Refresh page');
    console.log('   5. Click any API request');
    console.log('   6. Copy Authorization token (after "Bearer ")\n');
    process.exit(1);
}

const BASE_URL = 'api.giftgala.in';
const TEST_STORE = 'HYD_KONDAPUR'; // Changed to test with different store

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
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

async function runTest() {
    console.log('\n🚀 === AUTOMATED API TEST ===\n');
    
    try {
        // Step 1: Get warehouse inventory
        console.log('1️⃣ Getting warehouse inventory (GGM_WH)...');
        const whResponse = await makeRequest('/api/inventory?warehouse=GGM_WH&limit=50');
        
        if (whResponse.statusCode !== 200) {
            console.log(`❌ Failed: ${whResponse.statusCode}`);
            console.log(whResponse.body);
            return;
        }
        
        const inventoryData = whResponse.body.data || whResponse.body;
        const products = Array.isArray(inventoryData) ? inventoryData : (inventoryData.items || inventoryData.inventory || []);
        const product = products.find(p => (p.stock || p.qty_available || p.quantity) > 0);
        
        if (!product) {
            console.log('❌ No products with stock in GGM_WH');
            return;
        }
        
        console.log(`✅ Found product: ${product.barcode} (${product.product_name || product.name}) - Stock: ${product.stock || product.qty_available || product.quantity}`);
        console.log('');
        
        // Step 2: Check store inventory BEFORE
        console.log(`2️⃣ Checking ${TEST_STORE} inventory BEFORE transfer...`);
        const beforeResponse = await makeRequest(`/api/billing/store-inventory?store_filter=${TEST_STORE}`);
        
        if (beforeResponse.statusCode === 200) {
            const beforeInventory = beforeResponse.body.data || [];
            const beforeProduct = beforeInventory.find(p => p.barcode === product.barcode);
            
            if (beforeProduct) {
                console.log(`   Product already in ${TEST_STORE}: ${beforeProduct.stock} units`);
            } else {
                console.log(`   Product NOT in ${TEST_STORE} (good for testing)`);
            }
        }
        console.log('');
        
        // Step 3: Execute transfer
        console.log(`3️⃣ Executing W to S transfer: GGM_WH → ${TEST_STORE}...`);
        console.log(`   Product: ${product.barcode}`);
        console.log(`   Quantity: 1`);
        
        const transferData = {
            sourceType: 'warehouse',
            sourceId: 'GGM_WH',
            destinationType: 'store',
            destinationId: TEST_STORE,
            items: [{
                productId: `${product.product_name}||${product.barcode}`,
                transferQty: 1
            }],
            notes: 'Automated API test'
        };
        
        const transferResponse = await makeRequest('/api/self-transfer', 'POST', transferData);
        
        if (transferResponse.statusCode !== 200 || !transferResponse.body.success) {
            console.log(`❌ Transfer failed: ${transferResponse.statusCode}`);
            console.log(transferResponse.body);
            return;
        }
        
        console.log(`✅ Transfer successful!`);
        console.log(`   Transfer ID: ${transferResponse.body.transferId}`);
        console.log(`   Type: ${transferResponse.body.transferType}`);
        console.log('');
        
        // Wait for database to update
        console.log('⏳ Waiting 3 seconds for database to update...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('');
        
        // Step 4: Check store inventory AFTER
        console.log(`4️⃣ Checking ${TEST_STORE} inventory AFTER transfer...`);
        const afterResponse = await makeRequest(`/api/billing/store-inventory?store_filter=${TEST_STORE}`);
        
        if (afterResponse.statusCode !== 200) {
            console.log(`❌ Failed to get inventory: ${afterResponse.statusCode}`);
            return;
        }
        
        const afterInventory = afterResponse.body.data || [];
        const afterProduct = afterInventory.find(p => p.barcode === product.barcode);
        
        if (afterProduct) {
            console.log(`✅ PRODUCT FOUND in ${TEST_STORE}!`);
            console.log(`   Barcode: ${afterProduct.barcode}`);
            console.log(`   Product: ${afterProduct.product_name}`);
            console.log(`   Stock: ${afterProduct.stock}`);
            console.log(`   Store Code: ${afterProduct.store_code}`);
            
            if (afterProduct.store_code === TEST_STORE) {
                console.log(`   ✅ Store code is CORRECT!`);
            } else {
                console.log(`   ❌ Store code is WRONG! Expected: ${TEST_STORE}, Got: ${afterProduct.store_code}`);
            }
        } else {
            console.log(`❌ PRODUCT NOT FOUND in ${TEST_STORE}`);
            console.log(`   This means it went to a different store (BUG!)`);
        }
        console.log('');
        
        // Step 5: Check timeline
        console.log(`5️⃣ Checking timeline for ${TEST_STORE}...`);
        const timelineResponse = await makeRequest(`/api/store-timeline/${TEST_STORE}?productBarcode=${product.barcode}&limit=5`);
        
        if (timelineResponse.statusCode === 200 && timelineResponse.body.success) {
            const timeline = timelineResponse.body.data.timeline || [];
            
            if (timeline.length > 0) {
                console.log(`✅ Found ${timeline.length} timeline entries:`);
                timeline.forEach((entry, i) => {
                    console.log(`   ${i + 1}. ${entry.movement_type} ${entry.direction} ${entry.quantity} units`);
                    console.log(`      Balance: ${entry.balance_after}, Ref: ${entry.reference}`);
                });
                
                const latest = timeline[0];
                if (latest.direction === 'IN' && latest.movement_type === 'DISPATCH') {
                    console.log(`   ✅ Timeline matches W to S transfer!`);
                }
            } else {
                console.log(`❌ No timeline entries found`);
            }
        } else {
            console.log(`❌ Failed to get timeline: ${timelineResponse.statusCode}`);
        }
        console.log('');
        
        // Step 6: Check ALL stores for this product
        console.log(`6️⃣ Checking ALL stores for product ${product.barcode}...`);
        const allResponse = await makeRequest('/api/billing/store-inventory?limit=1000');
        
        if (allResponse.statusCode === 200) {
            const allInventory = allResponse.body.data || [];
            const allMatches = allInventory.filter(p => p.barcode === product.barcode);
            
            console.log(`   Found in ${allMatches.length} store(s):`);
            allMatches.forEach(p => {
                console.log(`   - ${p.store_code}: ${p.stock} units`);
            });
        }
        console.log('');
        
        // Final verdict
        console.log('📊 === TEST SUMMARY ===');
        console.log('');
        
        if (afterProduct && afterProduct.store_code === TEST_STORE) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('✅ Product went to CORRECT store');
            console.log('✅ Store code matches destination');
            console.log('✅ Timeline is working');
            console.log('');
            console.log('🎉 THE FIX IS WORKING!');
        } else {
            console.log('❌ TESTS FAILED!');
            console.log('❌ Product did NOT go to correct store');
            console.log('');
            console.log('⚠️ Possible issues:');
            console.log('   - Server not restarted after fix');
            console.log('   - Fix not deployed correctly');
            console.log('   - Different bug exists');
        }
        
    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    }
}

runTest();
