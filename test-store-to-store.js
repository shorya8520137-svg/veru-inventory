/**
 * TEST STORE TO STORE TRANSFER
 * Tests S to S transfer with product name verification
 */

const https = require('https');

const BASE_URL = 'api.giftgala.in';
const SOURCE_STORE = 'HYD_KONDAPUR'; // Has 3 units of 199627757257
const DEST_STORE = 'BLR_BROOKEFIELD'; // Transfer to this store

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

let AUTH_TOKEN = null;

async function login() {
    console.log('🔐 Logging in...\n');
    
    const credentials = {
        email: 'admin@company.com',
        password: 'Admin@123'
    };
    
    try {
        let response = await makeRequest('/api/auth/login', 'POST', credentials, false);
        
        if (response.statusCode === 200 && response.body.token) {
            AUTH_TOKEN = response.body.token;
            console.log('✅ Login successful!\n');
            return true;
        }
        
        response = await makeRequest('/api/login', 'POST', credentials, false);
        
        if (response.statusCode === 200 && response.body.token) {
            AUTH_TOKEN = response.body.token;
            console.log('✅ Login successful!\n');
            return true;
        }
        
        console.log('❌ Login failed');
        return false;
        
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return false;
    }
}

async function testStoreToStoreTransfer() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║        STORE TO STORE TRANSFER TEST                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    try {
        // Login
        const loginSuccess = await login();
        if (!loginSuccess) {
            console.log('❌ Cannot proceed without authentication');
            return;
        }
        
        // Step 1: Check source store inventory
        console.log(`📦 Step 1: Checking ${SOURCE_STORE} inventory...\n`);
        const sourceResponse = await makeRequest(`/api/billing/store-inventory?store_filter=${SOURCE_STORE}`);
        
        if (sourceResponse.statusCode !== 200) {
            console.log(`❌ Failed to get source inventory: ${sourceResponse.statusCode}`);
            return;
        }
        
        const sourceInventory = sourceResponse.body.data || [];
        const product = sourceInventory.find(p => p.stock > 0);
        
        if (!product) {
            console.log(`❌ No products with stock in ${SOURCE_STORE}`);
            return;
        }
        
        console.log(`✅ Found product in ${SOURCE_STORE}:`);
        console.log(`   Barcode: ${product.barcode}`);
        console.log(`   Name: ${product.product_name}`);
        console.log(`   Stock: ${product.stock}`);
        console.log(`   Store Code: ${product.store_code}`);
        console.log('');
        
        // Step 2: Check destination store BEFORE
        console.log(`🏪 Step 2: Checking ${DEST_STORE} inventory BEFORE...\n`);
        const beforeResponse = await makeRequest(`/api/billing/store-inventory?store_filter=${DEST_STORE}`);
        
        let beforeStock = 0;
        if (beforeResponse.statusCode === 200) {
            const beforeInventory = beforeResponse.body.data || [];
            const beforeProduct = beforeInventory.find(p => p.barcode === product.barcode);
            
            if (beforeProduct) {
                beforeStock = beforeProduct.stock;
                console.log(`   Product exists: ${beforeProduct.stock} units`);
                console.log(`   Name: ${beforeProduct.product_name}`);
            } else {
                console.log(`   Product NOT in ${DEST_STORE} (will be created)`);
            }
        }
        console.log('');
        
        // Step 3: Execute S to S transfer
        console.log(`🚚 Step 3: Executing S to S transfer...\n`);
        console.log(`   Source: ${SOURCE_STORE}`);
        console.log(`   Destination: ${DEST_STORE}`);
        console.log(`   Product: ${product.barcode}`);
        console.log(`   Quantity: 1`);
        console.log('');
        
        const transferData = {
            sourceType: 'store',
            sourceId: SOURCE_STORE,
            destinationType: 'store',
            destinationId: DEST_STORE,
            items: [{
                productId: `${product.product_name}||${product.barcode}`,
                transferQty: 1
            }],
            notes: 'S to S transfer test'
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
        
        // Wait for database
        console.log('⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('');
        
        // Step 4: Check destination store AFTER
        console.log(`🔍 Step 4: Checking ${DEST_STORE} inventory AFTER...\n`);
        const afterResponse = await makeRequest(`/api/billing/store-inventory?store_filter=${DEST_STORE}`);
        
        if (afterResponse.statusCode !== 200) {
            console.log(`❌ Failed to get inventory: ${afterResponse.statusCode}`);
            return;
        }
        
        const afterInventory = afterResponse.body.data || [];
        const afterProduct = afterInventory.find(p => p.barcode === product.barcode);
        
        if (!afterProduct) {
            console.log(`❌ Product NOT found in ${DEST_STORE}!`);
            return;
        }
        
        console.log(`✅ Product found in ${DEST_STORE}:`);
        console.log(`   Barcode: ${afterProduct.barcode}`);
        console.log(`   Name: ${afterProduct.product_name}`);
        console.log(`   Stock: ${afterProduct.stock}`);
        console.log(`   Store Code: ${afterProduct.store_code}`);
        console.log('');
        
        // Verify
        const nameCorrect = afterProduct.product_name !== afterProduct.barcode;
        const storeCodeCorrect = afterProduct.store_code === DEST_STORE;
        const stockCorrect = afterProduct.stock === beforeStock + 1;
        
        if (nameCorrect) {
            console.log(`   ✅ Product name is CORRECT (not barcode)`);
        } else {
            console.log(`   ❌ Product name is WRONG (showing barcode)`);
        }
        
        if (storeCodeCorrect) {
            console.log(`   ✅ Store code is CORRECT`);
        } else {
            console.log(`   ❌ Store code is WRONG`);
        }
        
        if (stockCorrect) {
            console.log(`   ✅ Stock updated correctly: ${beforeStock} → ${afterProduct.stock}`);
        } else {
            console.log(`   ⚠️ Stock mismatch: Expected ${beforeStock + 1}, Got ${afterProduct.stock}`);
        }
        console.log('');
        
        // Step 5: Check timelines
        console.log(`📊 Step 5: Checking timelines...\n`);
        
        // Source timeline
        const sourceTimelineResponse = await makeRequest(`/api/store-timeline/${SOURCE_STORE}?productBarcode=${product.barcode}&limit=3`);
        if (sourceTimelineResponse.statusCode === 200 && sourceTimelineResponse.body.success) {
            const sourceTimeline = sourceTimelineResponse.body.data.timeline || [];
            console.log(`   ${SOURCE_STORE} timeline: ${sourceTimeline.length} entries`);
            if (sourceTimeline.length > 0) {
                const latest = sourceTimeline[0];
                console.log(`   Latest: ${latest.movement_type} ${latest.direction} - ${latest.quantity} units`);
            }
        }
        
        // Destination timeline
        const destTimelineResponse = await makeRequest(`/api/store-timeline/${DEST_STORE}?productBarcode=${product.barcode}&limit=3`);
        if (destTimelineResponse.statusCode === 200 && destTimelineResponse.body.success) {
            const destTimeline = destTimelineResponse.body.data.timeline || [];
            console.log(`   ${DEST_STORE} timeline: ${destTimeline.length} entries`);
            if (destTimeline.length > 0) {
                const latest = destTimeline[0];
                console.log(`   Latest: ${latest.movement_type} ${latest.direction} - ${latest.quantity} units`);
            }
        }
        console.log('');
        
        // Final verdict
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║                    TEST SUMMARY                        ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        
        if (nameCorrect && storeCodeCorrect && stockCorrect) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('✅ S to S transfer working correctly');
            console.log('✅ Product name showing correctly');
            console.log('✅ Store code correct');
            console.log('✅ Stock updated correctly');
            console.log('\n🎉 STORE TO STORE TRANSFER IS WORKING PERFECTLY!\n');
        } else {
            console.log('❌ SOME TESTS FAILED!');
            if (!nameCorrect) console.log('❌ Product name issue');
            if (!storeCodeCorrect) console.log('❌ Store code issue');
            if (!stockCorrect) console.log('❌ Stock update issue');
            console.log('');
        }
        
    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    }
}

testStoreToStoreTransfer();
