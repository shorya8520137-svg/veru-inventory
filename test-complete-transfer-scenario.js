/**
 * COMPLETE TRANSFER TEST SCENARIO
 * 
 * Test Plan:
 * 1. Check warehouse with zero products (GGM_WH or BLR_WH)
 * 2. Initiate self-transfer to that warehouse
 * 3. Test timeline API
 * 4. Verify store inventory updates correctly
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'https://api.giftgala.in';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Test Results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

function log(emoji, message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`${emoji} [${timestamp}] ${message}`);
    
    if (type === 'pass') results.passed.push(message);
    if (type === 'fail') results.failed.push(message);
    if (type === 'warn') results.warnings.push(message);
}

// ============================================================================
// TEST 1: Check Warehouse Stock
// ============================================================================
async function test1_checkWarehouseStock() {
    log('🔍', '=== TEST 1: Checking Warehouse Stock ===');
    
    try {
        // Check GGM_WH
        log('📦', 'Checking GGM_WH warehouse...');
        const ggmResponse = await api.get('/api/inventory/warehouse/GGM_WH');
        const ggmStock = ggmResponse.data;
        
        log('📊', `GGM_WH has ${ggmStock.length} products`);
        
        // Check BLR_WH
        log('📦', 'Checking BLR_WH warehouse...');
        const blrResponse = await api.get('/api/inventory/warehouse/BLR_WH');
        const blrStock = blrResponse.data;
        
        log('📊', `BLR_WH has ${blrStock.length} products`);
        
        // Find warehouse with zero or low stock
        let targetWarehouse = null;
        let sourceWarehouse = null;
        
        if (ggmStock.length === 0 || ggmStock.every(p => p.stock === 0)) {
            targetWarehouse = 'GGM_WH';
            sourceWarehouse = 'BLR_WH';
            log('✅', 'GGM_WH has zero products - will use as destination', 'pass');
        } else if (blrStock.length === 0 || blrStock.every(p => p.stock === 0)) {
            targetWarehouse = 'BLR_WH';
            sourceWarehouse = 'GGM_WH';
            log('✅', 'BLR_WH has zero products - will use as destination', 'pass');
        } else {
            targetWarehouse = 'GGM_WH';
            sourceWarehouse = 'BLR_WH';
            log('⚠️', 'Both warehouses have stock - using GGM_WH as destination anyway', 'warn');
        }
        
        return { targetWarehouse, sourceWarehouse, ggmStock, blrStock };
        
    } catch (error) {
        log('❌', `Test 1 Failed: ${error.message}`, 'fail');
        throw error;
    }
}

// ============================================================================
// TEST 2: Check Store Inventory Before Transfer
// ============================================================================
async function test2_checkStoreInventory() {
    log('🔍', '=== TEST 2: Checking Store Inventory ===');
    
    try {
        const response = await api.get('/api/billing/store-inventory?limit=100');
        const inventory = response.data.data;
        
        log('📊', `Found ${inventory.length} products in store inventory`);
        
        // Group by store_code
        const byStore = {};
        inventory.forEach(item => {
            const store = item.store_code || 'NULL';
            if (!byStore[store]) byStore[store] = [];
            byStore[store].push(item);
        });
        
        log('📋', 'Products per store:');
        Object.keys(byStore).forEach(store => {
            log('  ', `  ${store}: ${byStore[store].length} products`);
        });
        
        log('✅', 'Store inventory check complete', 'pass');
        return { inventory, byStore };
        
    } catch (error) {
        log('❌', `Test 2 Failed: ${error.message}`, 'fail');
        throw error;
    }
}

// ============================================================================
// TEST 3: Initiate W to S Transfer
// ============================================================================
async function test3_initiateTransfer(sourceWarehouse, targetStore, product) {
    log('🔍', '=== TEST 3: Initiating W to S Transfer ===');
    
    try {
        const transferData = {
            sourceType: 'warehouse',
            sourceId: sourceWarehouse,
            destinationType: 'store',
            destinationId: targetStore,
            items: [{
                productId: `${product.product_name}||${product.barcode}`,
                transferQty: 1
            }],
            notes: 'Test transfer from automated test script'
        };
        
        log('📤', `Transferring 1x ${product.barcode} from ${sourceWarehouse} to ${targetStore}`);
        
        const response = await api.post('/api/self-transfer', transferData);
        
        if (response.data.success) {
            log('✅', `Transfer successful: ${response.data.transferId}`, 'pass');
            return response.data;
        } else {
            log('❌', `Transfer failed: ${response.data.message}`, 'fail');
            return null;
        }
        
    } catch (error) {
        log('❌', `Test 3 Failed: ${error.response?.data?.message || error.message}`, 'fail');
        throw error;
    }
}

// ============================================================================
// TEST 4: Verify Store Inventory Updated
// ============================================================================
async function test4_verifyStoreInventory(targetStore, barcode) {
    log('🔍', '=== TEST 4: Verifying Store Inventory Update ===');
    
    try {
        // Wait a bit for database to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await api.get(`/api/billing/store-inventory?store_filter=${targetStore}`);
        const inventory = response.data.data;
        
        log('📊', `Store ${targetStore} now has ${inventory.length} products`);
        
        // Find the transferred product
        const product = inventory.find(p => p.barcode === barcode);
        
        if (product) {
            log('✅', `Product ${barcode} found in ${targetStore} with stock: ${product.stock}`, 'pass');
            
            if (product.store_code === targetStore) {
                log('✅', `Store code is correct: ${product.store_code}`, 'pass');
            } else {
                log('❌', `Store code is WRONG: ${product.store_code} (expected ${targetStore})`, 'fail');
            }
            
            return product;
        } else {
            log('❌', `Product ${barcode} NOT found in ${targetStore}`, 'fail');
            return null;
        }
        
    } catch (error) {
        log('❌', `Test 4 Failed: ${error.message}`, 'fail');
        throw error;
    }
}

// ============================================================================
// TEST 5: Check Timeline API
// ============================================================================
async function test5_checkTimeline(storeCode, barcode) {
    log('🔍', '=== TEST 5: Checking Timeline API ===');
    
    try {
        const response = await api.get(`/api/store-timeline/${storeCode}?productBarcode=${barcode}&limit=10`);
        
        if (response.data.success) {
            const timeline = response.data.data.timeline;
            log('📊', `Found ${timeline.length} timeline entries for ${storeCode}`);
            
            if (timeline.length > 0) {
                log('✅', 'Timeline API working', 'pass');
                
                // Show latest entry
                const latest = timeline[0];
                log('📋', `Latest entry: ${latest.movement_type} ${latest.direction} ${latest.quantity} units`);
                log('📋', `  Balance after: ${latest.balance_after}`);
                log('📋', `  Reference: ${latest.reference}`);
                log('📋', `  Created: ${latest.created_at}`);
                
                // Verify it's the transfer we just made
                if (latest.direction === 'IN' && latest.movement_type === 'DISPATCH') {
                    log('✅', 'Timeline entry matches our W to S transfer', 'pass');
                } else {
                    log('⚠️', `Timeline entry type unexpected: ${latest.movement_type} ${latest.direction}`, 'warn');
                }
                
                return timeline;
            } else {
                log('❌', 'No timeline entries found', 'fail');
                return [];
            }
        } else {
            log('❌', `Timeline API failed: ${response.data.message}`, 'fail');
            return [];
        }
        
    } catch (error) {
        log('❌', `Test 5 Failed: ${error.message}`, 'fail');
        throw error;
    }
}

// ============================================================================
// TEST 6: Test S to S Transfer
// ============================================================================
async function test6_storeToStoreTransfer(sourceStore, targetStore, barcode) {
    log('🔍', '=== TEST 6: Testing S to S Transfer ===');
    
    try {
        const transferData = {
            sourceType: 'store',
            sourceId: sourceStore,
            destinationType: 'store',
            destinationId: targetStore,
            items: [{
                productId: `Product||${barcode}`,
                transferQty: 1
            }],
            notes: 'Test S to S transfer'
        };
        
        log('📤', `Transferring 1x ${barcode} from ${sourceStore} to ${targetStore}`);
        
        const response = await api.post('/api/self-transfer', transferData);
        
        if (response.data.success) {
            log('✅', `S to S Transfer successful: ${response.data.transferId}`, 'pass');
            
            // Wait and verify
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check source store
            const sourceResponse = await api.get(`/api/billing/store-inventory?store_filter=${sourceStore}`);
            const sourceProduct = sourceResponse.data.data.find(p => p.barcode === barcode);
            
            // Check destination store
            const destResponse = await api.get(`/api/billing/store-inventory?store_filter=${targetStore}`);
            const destProduct = destResponse.data.data.find(p => p.barcode === barcode);
            
            log('📊', `Source ${sourceStore}: ${sourceProduct ? sourceProduct.stock : 0} units`);
            log('📊', `Destination ${targetStore}: ${destProduct ? destProduct.stock : 0} units`);
            
            if (destProduct && destProduct.store_code === targetStore) {
                log('✅', 'Destination store updated correctly', 'pass');
            } else {
                log('❌', 'Destination store NOT updated correctly', 'fail');
            }
            
            return response.data;
        } else {
            log('❌', `S to S Transfer failed: ${response.data.message}`, 'fail');
            return null;
        }
        
    } catch (error) {
        log('❌', `Test 6 Failed: ${error.response?.data?.message || error.message}`, 'fail');
        throw error;
    }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runAllTests() {
    console.log('\n');
    log('🚀', '========================================');
    log('🚀', '  COMPLETE TRANSFER TEST SCENARIO');
    log('🚀', '========================================');
    console.log('\n');
    
    try {
        // Test 1: Check warehouses
        const { targetWarehouse, sourceWarehouse, ggmStock, blrStock } = await test1_checkWarehouseStock();
        console.log('\n');
        
        // Test 2: Check store inventory
        const { inventory, byStore } = await test2_checkStoreInventory();
        console.log('\n');
        
        // Find a product to transfer
        const sourceStock = sourceWarehouse === 'GGM_WH' ? ggmStock : blrStock;
        const productToTransfer = sourceStock.find(p => p.stock > 0);
        
        if (!productToTransfer) {
            log('❌', 'No products with stock found in source warehouse', 'fail');
            return;
        }
        
        // Test 3: W to S Transfer
        const targetStore = 'DEL_MOTI_NAGAR'; // Choose a test store
        const transferResult = await test3_initiateTransfer(sourceWarehouse, targetStore, productToTransfer);
        console.log('\n');
        
        if (transferResult) {
            // Test 4: Verify store inventory
            const updatedProduct = await test4_verifyStoreInventory(targetStore, productToTransfer.barcode);
            console.log('\n');
            
            // Test 5: Check timeline
            await test5_checkTimeline(targetStore, productToTransfer.barcode);
            console.log('\n');
            
            // Test 6: S to S Transfer
            const anotherStore = 'HYD_KONDAPUR';
            await test6_storeToStoreTransfer(targetStore, anotherStore, productToTransfer.barcode);
            console.log('\n');
        }
        
    } catch (error) {
        log('❌', `Test suite failed: ${error.message}`, 'fail');
    }
    
    // Print summary
    console.log('\n');
    log('📊', '========================================');
    log('📊', '  TEST SUMMARY');
    log('📊', '========================================');
    log('✅', `Passed: ${results.passed.length}`);
    log('❌', `Failed: ${results.failed.length}`);
    log('⚠️', `Warnings: ${results.warnings.length}`);
    console.log('\n');
    
    if (results.failed.length > 0) {
        log('❌', 'Failed tests:');
        results.failed.forEach(msg => log('  ', `  - ${msg}`));
    }
    
    if (results.warnings.length > 0) {
        log('⚠️', 'Warnings:');
        results.warnings.forEach(msg => log('  ', `  - ${msg}`));
    }
    
    console.log('\n');
}

// Run tests
runAllTests().catch(console.error);
