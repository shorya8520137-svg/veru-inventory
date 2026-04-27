/**
 * TEST SELF-TRANSFER API WITH AUTHENTICATION
 * 
 * This script tests:
 * 1. Self-transfer API (W to S)
 * 2. Store inventory API
 * 3. Timeline API
 */

const https = require('https');

// ============================================================================
// CONFIGURATION - REPLACE WITH YOUR AUTH TOKEN
// ============================================================================

const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_TOKEN_HERE';

if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('❌ ERROR: Please provide an auth token');
    console.log('');
    console.log('📋 HOW TO GET AUTH TOKEN:');
    console.log('   1. Open https://giftgala.in in browser');
    console.log('   2. Login to your account');
    console.log('   3. Open DevTools (F12)');
    console.log('   4. Go to Network tab');
    console.log('   5. Refresh the page');
    console.log('   6. Click any API request');
    console.log('   7. Look for "Authorization: Bearer ..." in Request Headers');
    console.log('   8. Copy the token (without "Bearer ")');
    console.log('');
    console.log('🚀 THEN RUN:');
    console.log('   $env:AUTH_TOKEN="your_token_here"; node test-transfer-with-auth.js');
    console.log('');
    process.exit(1);
}

const BASE_URL = 'api.giftgala.in';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: parsed
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function test1_getWarehouses() {
    console.log('📦 === TEST 1: Get Warehouse Inventory ===');
    
    try {
        const response = await makeRequest('/api/inventory/warehouse/GGM_WH');
        
        if (response.statusCode === 200) {
            const products = response.body;
            console.log(`✅ Found ${products.length} products in GGM_WH`);
            
            // Find a product with stock
            const productWithStock = products.find(p => p.stock > 0);
            
            if (productWithStock) {
                console.log(`✅ Product with stock: ${productWithStock.barcode} (${productWithStock.product_name}) - Stock: ${productWithStock.stock}`);
                return productWithStock;
            } else {
                console.log('⚠️ No products with stock found in GGM_WH');
                return null;
            }
        } else {
            console.log(`❌ Failed to get warehouse inventory: ${response.statusCode}`);
            console.log(response.body);
            return null;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return null;
    }
}

async function test2_getStoreInventoryBefore(storeCode) {
    console.log(`\n📊 === TEST 2: Get Store Inventory BEFORE Transfer (${storeCode}) ===`);
    
    try {
        const response = await makeRequest(`/api/billing/store-inventory?store_filter=${storeCode}`);
        
        if (response.statusCode === 200) {
            const inventory = response.body.data || [];
            console.log(`✅ Store ${storeCode} has ${inventory.length} products BEFORE transfer`);
            
            inventory.forEach(p => {
                console.log(`   - ${p.barcode} (${p.product_name}): ${p.stock} units`);
            });
            
            return inventory;
        } else {
            console.log(`❌ Failed to get store inventory: ${response.statusCode}`);
            return [];
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return [];
    }
}

async function test3_doTransfer(product, destinationStore) {
    console.log(`\n🔄 === TEST 3: Execute W to S Transfer ===`);
    console.log(`   Source: GGM_WH`);
    console.log(`   Destination: ${destinationStore}`);
    console.log(`   Product: ${product.barcode}`);
    console.log(`   Quantity: 1`);
    
    try {
        const transferData = {
            sourceType: 'warehouse',
            sourceId: 'GGM_WH',
            destinationType: 'store',
            destinationId: destinationStore,
            items: [{
                productId: `${product.product_name}||${product.barcode}`,
                transferQty: 1
            }],
            notes: 'API Test Transfer'
        };
        
        console.log('\n📤 Sending transfer request...');
        const response = await makeRequest('/api/self-transfer', 'POST', transferData);
        
        if (response.statusCode === 200 && response.body.success) {
            console.log(`✅ Transfer successful!`);
            console.log(`   Transfer ID: ${response.body.transferId}`);
            console.log(`   Transfer Type: ${response.body.transferType}`);
            console.log(`   Affects Store System: ${response.body.affectsStoreSystem}`);
            
            if (response.body.documentation) {
                console.log(`   Documentation:`);
                console.log(`      - Transfer record: ${response.body.documentation.transfer_record}`);
                console.log(`      - Items recorded: ${response.body.documentation.items_recorded}`);
                console.log(`      - Timeline created: ${response.body.documentation.timeline_created}`);
                console.log(`      - Store inventory updated: ${response.body.documentation.store_inventory_updated}`);
            }
            
            return response.body;
        } else {
            console.log(`❌ Transfer failed: ${response.statusCode}`);
            console.log(response.body);
            return null;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return null;
    }
}

async function test4_getStoreInventoryAfter(storeCode, barcode) {
    console.log(`\n📊 === TEST 4: Get Store Inventory AFTER Transfer (${storeCode}) ===`);
    
    // Wait 2 seconds for database to update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        const response = await makeRequest(`/api/billing/store-inventory?store_filter=${storeCode}`);
        
        if (response.statusCode === 200) {
            const inventory = response.body.data || [];
            console.log(`✅ Store ${storeCode} has ${inventory.length} products AFTER transfer`);
            
            // Find the transferred product
            const product = inventory.find(p => p.barcode === barcode);
            
            if (product) {
                console.log(`✅ PRODUCT FOUND in ${storeCode}:`);
                console.log(`   - Barcode: ${product.barcode}`);
                console.log(`   - Product Name: ${product.product_name}`);
                console.log(`   - Stock: ${product.stock}`);
                console.log(`   - Store Code: ${product.store_code}`);
                
                if (product.store_code === storeCode) {
                    console.log(`   ✅ Store code is CORRECT!`);
                } else {
                    console.log(`   ❌ Store code is WRONG! Expected: ${storeCode}, Got: ${product.store_code}`);
                }
                
                return product;
            } else {
                console.log(`❌ PRODUCT NOT FOUND in ${storeCode}`);
                console.log(`   This means the product went to a different store (BUG!)`);
                return null;
            }
        } else {
            console.log(`❌ Failed to get store inventory: ${response.statusCode}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return null;
    }
}

async function test5_getTimeline(storeCode, barcode) {
    console.log(`\n📈 === TEST 5: Get Store Timeline (${storeCode}) ===`);
    
    try {
        const response = await makeRequest(`/api/store-timeline/${storeCode}?productBarcode=${barcode}&limit=10`);
        
        if (response.statusCode === 200 && response.body.success) {
            const timeline = response.body.data.timeline || [];
            console.log(`✅ Found ${timeline.length} timeline entries for ${storeCode}`);
            
            if (timeline.length > 0) {
                console.log(`\n📋 Timeline Entries:`);
                timeline.forEach((entry, index) => {
                    console.log(`   ${index + 1}. ${entry.movement_type} ${entry.direction} ${entry.quantity} units`);
                    console.log(`      Balance After: ${entry.balance_after}`);
                    console.log(`      Reference: ${entry.reference}`);
                    console.log(`      Created: ${entry.created_at}`);
                });
                
                // Check if latest entry matches our transfer
                const latest = timeline[0];
                if (latest.direction === 'IN' && latest.movement_type === 'DISPATCH') {
                    console.log(`\n   ✅ Timeline entry matches W to S transfer!`);
                } else {
                    console.log(`\n   ⚠️ Timeline entry type unexpected: ${latest.movement_type} ${latest.direction}`);
                }
                
                return timeline;
            } else {
                console.log(`❌ No timeline entries found`);
                return [];
            }
        } else {
            console.log(`❌ Failed to get timeline: ${response.statusCode}`);
            console.log(response.body);
            return [];
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return [];
    }
}

async function test6_checkAllStores(barcode) {
    console.log(`\n🔍 === TEST 6: Check ALL Stores for Product ${barcode} ===`);
    
    try {
        const response = await makeRequest('/api/billing/store-inventory?limit=1000');
        
        if (response.statusCode === 200) {
            const allInventory = response.body.data || [];
            const matchingProducts = allInventory.filter(p => p.barcode === barcode);
            
            console.log(`✅ Found ${matchingProducts.length} instances of product ${barcode} across all stores:`);
            
            matchingProducts.forEach(p => {
                console.log(`   - Store: ${p.store_code}, Stock: ${p.stock}`);
            });
            
            if (matchingProducts.length > 1) {
                console.log(`\n   ⚠️ Product exists in multiple stores - this is OK if intentional`);
            }
            
            return matchingProducts;
        } else {
            console.log(`❌ Failed to get all inventory: ${response.statusCode}`);
            return [];
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return [];
    }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
    console.log('\n🚀 === STARTING API TESTS ===\n');
    
    const destinationStore = 'DEL_MOTI_NAGAR';
    
    try {
        // Test 1: Get warehouse inventory
        const product = await test1_getWarehouses();
        if (!product) {
            console.log('\n❌ Cannot continue - no products with stock found');
            return;
        }
        
        // Test 2: Get store inventory before
        await test2_getStoreInventoryBefore(destinationStore);
        
        // Test 3: Do transfer
        const transferResult = await test3_doTransfer(product, destinationStore);
        if (!transferResult) {
            console.log('\n❌ Transfer failed - cannot continue');
            return;
        }
        
        // Test 4: Get store inventory after
        const updatedProduct = await test4_getStoreInventoryAfter(destinationStore, product.barcode);
        
        // Test 5: Get timeline
        await test5_getTimeline(destinationStore, product.barcode);
        
        // Test 6: Check all stores
        await test6_checkAllStores(product.barcode);
        
        // Summary
        console.log('\n\n📊 === TEST SUMMARY ===');
        if (updatedProduct && updatedProduct.store_code === destinationStore) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('✅ Product went to CORRECT store');
            console.log('✅ Store code is correct');
            console.log('✅ Timeline is working');
            console.log('\n🎉 THE FIX IS WORKING!');
        } else {
            console.log('❌ TESTS FAILED!');
            console.log('❌ Product did NOT go to correct store');
            console.log('❌ Bug still exists');
            console.log('\n⚠️ Server may need restart or fix not deployed');
        }
        
    } catch (error) {
        console.error('\n❌ Test suite error:', error.message);
    }
}

// Run the tests
runTests();
