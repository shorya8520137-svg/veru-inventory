/**
 * CRITICAL INVENTORY SYNCHRONIZATION ANALYSIS
 * 
 * This script analyzes the inventory synchronization issue where:
 * 1. Timeline shows stock reduction (16 → 15) 
 * 2. Live stock still shows 16
 * 3. Bangalore warehouse shows 0 stock instead of transferred product
 * 4. Duplicate self-transfer entries appearing
 * 
 * COMMERCIAL SOFTWARE BUG ANALYSIS
 */

const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'inventory_db'
});

async function analyzeInventorySynchronization() {
    console.log('🔍 CRITICAL INVENTORY SYNCHRONIZATION ANALYSIS');
    console.log('=' .repeat(60));
    
    try {
        // 1. Check HH_Bedding Cutie cat CC in inventory_ledger_base (timeline)
        console.log('\n📊 1. TIMELINE ANALYSIS (inventory_ledger_base)');
        const timelineQuery = `
            SELECT 
                id, event_time, movement_type, barcode, product_name, 
                location_code, qty, direction, reference, created_at
            FROM inventory_ledger_base 
            WHERE product_name LIKE '%HH_Bedding Cutie cat CC%' 
            OR barcode = '2460-3499'
            ORDER BY event_time DESC
            LIMIT 20
        `;
        
        const timelineResults = await queryDatabase(timelineQuery);
        console.log(`Found ${timelineResults.length} timeline entries:`);
        
        timelineResults.forEach(entry => {
            console.log(`  ${entry.event_time} | ${entry.movement_type} | ${entry.location_code} | ${entry.direction} ${entry.qty} | ${entry.reference}`);
        });
        
        // 2. Check stock_batches (live stock)
        console.log('\n📦 2. LIVE STOCK ANALYSIS (stock_batches)');
        const stockQuery = `
            SELECT 
                id, barcode, product_name, warehouse, qty_available, 
                price, status, created_at, updated_at
            FROM stock_batches 
            WHERE product_name LIKE '%HH_Bedding Cutie cat CC%' 
            OR barcode = '2460-3499'
            ORDER BY warehouse, created_at DESC
        `;
        
        const stockResults = await queryDatabase(stockQuery);
        console.log(`Found ${stockResults.length} stock batch entries:`);
        
        let totalStock = 0;
        stockResults.forEach(batch => {
            console.log(`  ${batch.warehouse} | ${batch.barcode} | Qty: ${batch.qty_available} | Status: ${batch.status} | Updated: ${batch.updated_at}`);
            if (batch.status === 'active') {
                totalStock += parseInt(batch.qty_available);
            }
        });
        
        console.log(`\n📊 TOTAL LIVE STOCK: ${totalStock}`);
        
        // 3. Check self_transfer table for duplicates
        console.log('\n🔄 3. SELF-TRANSFER ANALYSIS');
        const transferQuery = `
            SELECT 
                id, transfer_reference, transfer_type, source_location, 
                destination_location, status, created_at
            FROM self_transfer 
            ORDER BY created_at DESC
            LIMIT 10
        `;
        
        const transferResults = await queryDatabase(transferQuery);
        console.log(`Found ${transferResults.length} self-transfer entries:`);
        
        transferResults.forEach(transfer => {
            console.log(`  ID: ${transfer.id} | ${transfer.transfer_reference} | ${transfer.source_location} → ${transfer.destination_location} | ${transfer.created_at}`);
        });
        
        // 4. Check self_transfer_items for the specific product
        console.log('\n📋 4. TRANSFER ITEMS ANALYSIS');
        const itemsQuery = `
            SELECT 
                sti.id, sti.transfer_id, sti.product_name, sti.barcode, sti.qty,
                st.transfer_reference, st.source_location, st.destination_location, st.created_at
            FROM self_transfer_items sti
            JOIN self_transfer st ON sti.transfer_id = st.id
            WHERE sti.product_name LIKE '%HH_Bedding Cutie cat CC%' 
            OR sti.barcode = '2460-3499'
            ORDER BY st.created_at DESC
        `;
        
        const itemsResults = await queryDatabase(itemsQuery);
        console.log(`Found ${itemsResults.length} transfer item entries:`);
        
        itemsResults.forEach(item => {
            console.log(`  Transfer: ${item.transfer_reference} | ${item.source_location} → ${item.destination_location} | Qty: ${item.qty} | ${item.created_at}`);
        });
        
        // 5. Calculate expected vs actual stock
        console.log('\n🧮 5. STOCK RECONCILIATION ANALYSIS');
        
        // Get initial stock from bulk upload
        const initialStockQuery = `
            SELECT SUM(qty) as initial_stock
            FROM inventory_ledger_base 
            WHERE barcode = '2460-3499' 
            AND movement_type = 'BULK_UPLOAD' 
            AND direction = 'IN'
        `;
        
        const initialStock = await queryDatabase(initialStockQuery);
        const initialQty = initialStock[0]?.initial_stock || 0;
        
        // Get all outbound movements
        const outboundQuery = `
            SELECT SUM(qty) as total_out
            FROM inventory_ledger_base 
            WHERE barcode = '2460-3499' 
            AND direction = 'OUT'
        `;
        
        const outbound = await queryDatabase(outboundQuery);
        const totalOut = outbound[0]?.total_out || 0;
        
        // Get all inbound movements (excluding bulk upload)
        const inboundQuery = `
            SELECT SUM(qty) as total_in
            FROM inventory_ledger_base 
            WHERE barcode = '2460-3499' 
            AND direction = 'IN'
            AND movement_type != 'BULK_UPLOAD'
        `;
        
        const inbound = await queryDatabase(inboundQuery);
        const totalIn = inbound[0]?.total_in || 0;
        
        const expectedStock = initialQty - totalOut + totalIn;
        
        console.log(`📊 STOCK RECONCILIATION:`);
        console.log(`  Initial Stock (Bulk Upload): ${initialQty}`);
        console.log(`  Total OUT movements: ${totalOut}`);
        console.log(`  Total IN movements (excl. bulk): ${totalIn}`);
        console.log(`  EXPECTED STOCK: ${expectedStock}`);
        console.log(`  ACTUAL STOCK (stock_batches): ${totalStock}`);
        console.log(`  DISCREPANCY: ${totalStock - expectedStock}`);
        
        // 6. Identify the root cause
        console.log('\n🚨 6. ROOT CAUSE ANALYSIS');
        
        if (totalStock !== expectedStock) {
            console.log('❌ CRITICAL BUG IDENTIFIED:');
            console.log('   Timeline entries are created but stock_batches table is NOT updated');
            console.log('   This causes timeline to show reduced stock while live stock remains unchanged');
            
            // Check if updateWarehouseStock function is being called
            console.log('\n🔍 Checking recent self-transfer timeline entries:');
            const recentTransferQuery = `
                SELECT 
                    event_time, location_code, qty, direction, reference
                FROM inventory_ledger_base 
                WHERE movement_type = 'SELF_TRANSFER'
                AND barcode = '2460-3499'
                ORDER BY event_time DESC
                LIMIT 5
            `;
            
            const recentTransfers = await queryDatabase(recentTransferQuery);
            recentTransfers.forEach(entry => {
                console.log(`  ${entry.event_time} | ${entry.location_code} | ${entry.direction} ${entry.qty} | ${entry.reference}`);
            });
            
            console.log('\n💡 SOLUTION REQUIRED:');
            console.log('   1. Fix updateWarehouseStock() function to properly update stock_batches');
            console.log('   2. Ensure transaction consistency between timeline and stock tables');
            console.log('   3. Add validation to prevent duplicate self-transfer entries');
            console.log('   4. Implement stock reconciliation mechanism');
        } else {
            console.log('✅ Stock levels are synchronized correctly');
        }
        
        // 7. Check for duplicate transfer issue
        console.log('\n🔍 7. DUPLICATE TRANSFER ANALYSIS');
        const duplicateQuery = `
            SELECT 
                transfer_reference, COUNT(*) as count
            FROM self_transfer 
            GROUP BY transfer_reference 
            HAVING COUNT(*) > 1
        `;
        
        const duplicates = await queryDatabase(duplicateQuery);
        if (duplicates.length > 0) {
            console.log('❌ DUPLICATE TRANSFERS FOUND:');
            duplicates.forEach(dup => {
                console.log(`  ${dup.transfer_reference}: ${dup.count} entries`);
            });
        } else {
            console.log('✅ No duplicate transfer references found');
        }
        
    } catch (error) {
        console.error('❌ Analysis failed:', error);
    } finally {
        db.end();
    }
}

function queryDatabase(sql) {
    return new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// Run the analysis
analyzeInventorySynchronization();