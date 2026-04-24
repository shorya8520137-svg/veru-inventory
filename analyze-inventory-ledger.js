const https = require('https');

// Analyze inventory_ledger_base table to understand self-transfer transactions
const analyzeInventoryLedger = () => {
    console.log('🔍 ANALYZING INVENTORY_LEDGER_BASE TABLE...');
    console.log('');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';
    
    // First check what movement types exist in the ledger
    console.log('📊 Step 1: Check existing movement types in inventory_ledger_base');
    console.log('   Expected types: OPENING, BULK_UPLOAD, DISPATCH, DAMAGE, RECOVER, SELF_TRANSFER');
    console.log('');
    
    // Check recent entries for barcode 2005-999 (the one with store inventory)
    const timelineOptions = {
        hostname: 'api.giftgala.in',
        port: 443,
        path: '/api/timeline/2005-999',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    console.log('📋 Step 2: Analyzing timeline for barcode 2005-999 (has store inventory entry)');
    
    const timelineReq = https.request(timelineOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                
                if (response.success && response.data && response.data.timeline) {
                    const timeline = response.data.timeline;
                    
                    console.log(`✅ Found ${timeline.length} total timeline entries`);
                    console.log('');
                    
                    // Analyze movement types
                    const movementTypes = {};
                    timeline.forEach(entry => {
                        movementTypes[entry.type] = (movementTypes[entry.type] || 0) + 1;
                    });
                    
                    console.log('📊 MOVEMENT TYPES ANALYSIS:');
                    Object.keys(movementTypes).forEach(type => {
                        console.log(`   ${type}: ${movementTypes[type]} entries`);
                    });
                    console.log('');
                    
                    // Check for SELF_TRANSFER specifically
                    const selfTransferEntries = timeline.filter(entry => entry.type === 'SELF_TRANSFER');
                    console.log(`🔄 SELF_TRANSFER entries: ${selfTransferEntries.length}`);
                    
                    if (selfTransferEntries.length === 0) {
                        console.log('❌ PROBLEM CONFIRMED: No SELF_TRANSFER entries in inventory_ledger_base');
                        console.log('');
                        
                        // Check recent self-transfers to see what should be there
                        checkRecentSelfTransfers();
                    } else {
                        console.log('✅ SELF_TRANSFER entries found:');
                        selfTransferEntries.forEach((entry, index) => {
                            console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.direction} - Qty: ${entry.quantity} - Ref: ${entry.reference}`);
                        });
                    }
                    
                    console.log('');
                    console.log('📋 RECENT TIMELINE ENTRIES (Last 5):');
                    timeline.slice(0, 5).forEach((entry, index) => {
                        console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.type} - ${entry.direction} - Qty: ${entry.quantity} - Ref: ${entry.reference || 'N/A'}`);
                    });
                    
                } else {
                    console.log('❌ Failed to get timeline data');
                }
            } catch (error) {
                console.error('❌ Error parsing timeline:', error);
            }
        });
    });
    
    timelineReq.on('error', (error) => {
        console.error('❌ Timeline request error:', error);
    });
    
    timelineReq.end();
    
    function checkRecentSelfTransfers() {
        console.log('');
        console.log('📋 Step 3: Checking recent self-transfers that should have created timeline entries');
        
        const transferOptions = {
            hostname: 'api.giftgala.in',
            port: 443,
            path: '/api/self-transfer',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const transferReq = https.request(transferOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.success && response.transfers) {
                        console.log(`✅ Found ${response.transfers.length} self-transfers in database`);
                        console.log('');
                        
                        // Show recent transfers
                        console.log('📊 RECENT SELF-TRANSFERS:');
                        response.transfers.slice(0, 5).forEach((transfer, index) => {
                            console.log(`   ${index + 1}. ${transfer.transfer_reference} - ${transfer.transfer_type} - ${transfer.created_at}`);
                            console.log(`      ${transfer.source_location} → ${transfer.destination_location}`);
                        });
                        
                        console.log('');
                        console.log('🔧 ROOT CAUSE ANALYSIS:');
                        console.log('   ✅ Self-transfers are being created in self_transfer table');
                        console.log('   ❌ Timeline entries are NOT being created in inventory_ledger_base table');
                        console.log('   🎯 ISSUE: Timeline creation function is not working properly');
                        console.log('');
                        
                        console.log('💡 SOLUTION NEEDED:');
                        console.log('   1. Fix timeline creation function in selfTransferRoutes.js');
                        console.log('   2. Ensure createTimelineEntries function is being called');
                        console.log('   3. Add proper error handling for database inserts');
                        console.log('   4. Test with a fresh self-transfer');
                        console.log('');
                        
                        console.log('🔍 EXPECTED TIMELINE ENTRIES FOR SELF-TRANSFER:');
                        console.log('   For W to S transfer (BLR_WH → GGM_NH48):');
                        console.log('   - BLR_WH: OUT entry (warehouse loses stock)');
                        console.log('   - No GGM_NH48 entry (store, not tracked in warehouse timeline)');
                        console.log('');
                        console.log('   For W to W transfer (BLR_WH → GGM_WH):');
                        console.log('   - BLR_WH: OUT entry');
                        console.log('   - GGM_WH: IN entry');
                        console.log('');
                        
                        console.log('📋 INVENTORY_LEDGER_BASE TABLE STRUCTURE NEEDED:');
                        console.log('   - event_time: TIMESTAMP');
                        console.log('   - movement_type: "SELF_TRANSFER"');
                        console.log('   - barcode: product barcode');
                        console.log('   - product_name: product name');
                        console.log('   - location_code: warehouse code (BLR_WH, GGM_WH, etc.)');
                        console.log('   - qty: quantity moved');
                        console.log('   - direction: "IN" or "OUT"');
                        console.log('   - reference: transfer reference (TRF_xxxxx)');
                        
                    } else {
                        console.log('❌ Failed to get self-transfers');
                    }
                } catch (error) {
                    console.error('❌ Error parsing transfers:', error);
                }
            });
        });
        
        transferReq.on('error', (error) => {
            console.error('❌ Transfer request error:', error);
        });
        
        transferReq.end();
    }
};

// Run the analysis
analyzeInventoryLedger();