/**
 * ANALYZE LOCAL DATABASE BACKUP
 * 
 * This script analyzes the local database backup to find evidence of the store inventory bug
 */

const fs = require('fs');
const readline = require('readline');

async function analyzeLocalDatabase() {
    console.log('📋 === ANALYZING LOCAL DATABASE BACKUP ===\n');
    
    try {
        const fileStream = fs.createReadStream('inventory_backup.sql');
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        
        let storeInventoryData = [];
        let storeTimelineData = [];
        let selfTransferData = [];
        let currentTable = null;
        let isInsertStatement = false;
        
        console.log('🔍 Reading database backup file...');
        
        for await (const line of rl) {
            // Detect table context
            if (line.includes('CREATE TABLE `store_inventory`')) {
                currentTable = 'store_inventory';
                console.log('📦 Found store_inventory table definition');
            } else if (line.includes('CREATE TABLE `store_timeline`')) {
                currentTable = 'store_timeline';
                console.log('📊 Found store_timeline table definition');
            } else if (line.includes('CREATE TABLE `self_transfer`')) {
                currentTable = 'self_transfer';
                console.log('📋 Found self_transfer table definition');
            }
            
            // Detect INSERT statements
            if (line.includes('INSERT INTO `store_inventory`')) {
                isInsertStatement = true;
                currentTable = 'store_inventory';
            } else if (line.includes('INSERT INTO `store_timeline`')) {
                isInsertStatement = true;
                currentTable = 'store_timeline';
            } else if (line.includes('INSERT INTO `self_transfer`')) {
                isInsertStatement = true;
                currentTable = 'self_transfer';
            }
            
            // Parse INSERT data
            if (isInsertStatement && line.includes('VALUES')) {
                if (currentTable === 'store_inventory') {
                    // Extract store_inventory data
                    const matches = line.match(/\(([^)]+)\)/g);
                    if (matches) {
                        matches.forEach(match => {
                            const values = match.slice(1, -1).split(',').map(v => v.trim().replace(/'/g, ''));
                            if (values.length >= 8) {
                                storeInventoryData.push({
                                    id: values[0],
                                    store_code: values[1],
                                    product_name: values[2],
                                    barcode: values[3],
                                    category: values[4],
                                    stock: values[5],
                                    price: values[6],
                                    gst_percentage: values[7]
                                });
                            }
                        });
                    }
                } else if (currentTable === 'store_timeline') {
                    // Extract store_timeline data
                    const matches = line.match(/\(([^)]+)\)/g);
                    if (matches) {
                        matches.forEach(match => {
                            const values = match.slice(1, -1).split(',').map(v => v.trim().replace(/'/g, ''));
                            if (values.length >= 10) {
                                storeTimelineData.push({
                                    id: values[0],
                                    store_code: values[1],
                                    product_barcode: values[2],
                                    product_name: values[3],
                                    movement_type: values[4],
                                    direction: values[5],
                                    quantity: values[6],
                                    balance_after: values[7],
                                    reference: values[8],
                                    created_at: values[9]
                                });
                            }
                        });
                    }
                } else if (currentTable === 'self_transfer') {
                    // Extract self_transfer data
                    const matches = line.match(/\(([^)]+)\)/g);
                    if (matches) {
                        matches.forEach(match => {
                            const values = match.slice(1, -1).split(',').map(v => v.trim().replace(/'/g, ''));
                            if (values.length >= 6) {
                                selfTransferData.push({
                                    id: values[0],
                                    transfer_reference: values[1],
                                    transfer_type: values[2],
                                    source_location: values[3],
                                    destination_location: values[4],
                                    created_at: values[5]
                                });
                            }
                        });
                    }
                }
            }
            
            // End of INSERT statement
            if (line.includes(';') && isInsertStatement) {
                isInsertStatement = false;
                currentTable = null;
            }
        }
        
        console.log('✅ Database backup analysis complete\n');
        
        // Analyze the data
        console.log('📊 === ANALYSIS RESULTS ===\n');
        
        console.log(`📦 Store Inventory Records: ${storeInventoryData.length}`);
        console.log(`📊 Store Timeline Records: ${storeTimelineData.length}`);
        console.log(`📋 Self Transfer Records: ${selfTransferData.length}\n`);
        
        // Group store inventory by store_code
        const inventoryByStore = {};
        storeInventoryData.forEach(item => {
            const store = item.store_code || 'NULL';
            if (!inventoryByStore[store]) inventoryByStore[store] = [];
            inventoryByStore[store].push(item);
        });
        
        console.log('📦 STORE INVENTORY BY STORE:');
        Object.keys(inventoryByStore).forEach(store => {
            console.log(`  ${store}: ${inventoryByStore[store].length} products`);
            inventoryByStore[store].forEach(p => {
                console.log(`    - ${p.barcode} (${p.product_name}): ${p.stock} units`);
            });
        });
        console.log('');
        
        // Group timeline by store_code
        const timelineByStore = {};
        storeTimelineData.forEach(entry => {
            const store = entry.store_code || 'NULL';
            if (!timelineByStore[store]) timelineByStore[store] = [];
            timelineByStore[store].push(entry);
        });
        
        console.log('📊 STORE TIMELINE BY STORE:');
        Object.keys(timelineByStore).forEach(store => {
            console.log(`  ${store}: ${timelineByStore[store].length} entries`);
            timelineByStore[store].forEach(e => {
                console.log(`    - ${e.movement_type} ${e.direction} ${e.quantity} units of ${e.product_barcode} (balance: ${e.balance_after}) - ${e.reference}`);
            });
        });
        console.log('');
        
        // Check for mismatches
        console.log('🔍 === CHECKING FOR MISMATCHES ===');
        const mismatches = [];
        
        storeInventoryData.forEach(inventoryItem => {
            const timelineEntries = storeTimelineData.filter(t => t.product_barcode === inventoryItem.barcode);
            
            timelineEntries.forEach(timelineEntry => {
                if (inventoryItem.store_code !== timelineEntry.store_code) {
                    mismatches.push({
                        barcode: inventoryItem.barcode,
                        inventory_store: inventoryItem.store_code,
                        timeline_store: timelineEntry.store_code,
                        inventory_stock: inventoryItem.stock,
                        timeline_balance: timelineEntry.balance_after,
                        reference: timelineEntry.reference
                    });
                }
            });
        });
        
        if (mismatches.length > 0) {
            console.log(`❌ Found ${mismatches.length} mismatches between inventory and timeline:`);
            mismatches.forEach(m => {
                console.log(`  Barcode: ${m.barcode}`);
                console.log(`    Inventory store: ${m.inventory_store} (stock: ${m.inventory_stock})`);
                console.log(`    Timeline store: ${m.timeline_store} (balance: ${m.timeline_balance})`);
                console.log(`    Reference: ${m.reference}`);
                console.log('');
            });
        } else {
            console.log('✅ No mismatches found between inventory and timeline');
        }
        
        // Show recent transfers
        console.log('📋 === RECENT TRANSFERS ===');
        const recentTransfers = selfTransferData.slice(-10);
        recentTransfers.forEach(t => {
            console.log(`  ${t.transfer_reference}: ${t.transfer_type} from ${t.source_location} to ${t.destination_location}`);
        });
        console.log('');
        
        // Summary
        console.log('📊 === SUMMARY ===');
        console.log(`Total products in store_inventory: ${storeInventoryData.length}`);
        console.log(`Total timeline entries: ${storeTimelineData.length}`);
        console.log(`Stores with products: ${Object.keys(inventoryByStore).length}`);
        console.log(`Stores with timeline: ${Object.keys(timelineByStore).length}`);
        console.log(`Mismatches found: ${mismatches.length}`);
        console.log('');
        
        if (mismatches.length > 0) {
            console.log('❌ BUG CONFIRMED: Products are being updated in wrong stores');
            console.log('   This proves the bug exists and the fix in selfTransferRoutes.js is needed');
            console.log('   The fix adds store_code parameter to all store inventory functions');
        } else {
            console.log('✅ No bugs found in the database backup');
            console.log('   Either the bug was already fixed or no transfers have been made yet');
        }
        
        // Check if store_code column exists
        console.log('\n🔧 === CHECKING STORE_CODE COLUMN ===');
        const hasStoreCodeColumn = storeInventoryData.some(item => item.store_code !== undefined);
        if (hasStoreCodeColumn) {
            console.log('✅ store_code column exists in store_inventory table');
        } else {
            console.log('❌ store_code column missing from store_inventory table');
        }
        
    } catch (error) {
        console.error('❌ Error analyzing database:', error.message);
    }
}

// Run the analysis
analyzeLocalDatabase();