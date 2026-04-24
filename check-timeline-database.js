const https = require('https');

// Check database directly for SELF_TRANSFER entries
const checkTimelineDatabase = () => {
    console.log('🔍 Checking database for SELF_TRANSFER entries...');
    
    // Check recent self-transfer records
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';
    
    // First check recent self-transfers
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
    
    console.log('📋 Getting recent self-transfers...');
    
    const transferReq = https.request(transferOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                
                if (response.success && response.transfers) {
                    console.log(`✅ Found ${response.transfers.length} self-transfers`);
                    
                    // Show recent W to S transfers
                    const wToSTransfers = response.transfers.filter(t => t.transfer_type === 'W to S');
                    console.log(`🔄 W to S transfers: ${wToSTransfers.length}`);
                    
                    if (wToSTransfers.length > 0) {
                        console.log('\n📊 Recent W to S transfers:');
                        wToSTransfers.slice(0, 3).forEach((transfer, index) => {
                            console.log(`   ${index + 1}. ${transfer.transfer_reference} - ${transfer.created_at} - ${transfer.source_location} → ${transfer.destination_location}`);
                        });
                        
                        // Check timeline for the most recent W to S transfer
                        const recentTransfer = wToSTransfers[0];
                        console.log(`\n🔍 Checking timeline for recent W to S transfer: ${recentTransfer.transfer_reference}`);
                        
                        // Get transfer details to see items
                        checkTransferDetails(recentTransfer.transfer_reference);
                    } else {
                        console.log('❌ No W to S transfers found');
                    }
                } else {
                    console.log('❌ Failed to get transfers');
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
    
    function checkTransferDetails(transferRef) {
        const detailOptions = {
            hostname: 'api.giftgala.in',
            port: 443,
            path: `/api/self-transfer/${transferRef}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const detailReq = https.request(detailOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.success && response.data && response.data.transfer) {
                        const transfer = response.data.transfer;
                        console.log(`\n📦 Transfer Details: ${transfer.transfer_reference}`);
                        console.log(`   Type: ${transfer.transfer_type}`);
                        console.log(`   From: ${transfer.source_location} → To: ${transfer.destination_location}`);
                        console.log(`   Items: ${transfer.items ? transfer.items.length : 0}`);
                        
                        if (transfer.items && transfer.items.length > 0) {
                            transfer.items.forEach((item, index) => {
                                console.log(`   ${index + 1}. ${item.product_name} (${item.barcode}) - Qty: ${item.quantity}`);
                                
                                // Check timeline for this specific barcode
                                setTimeout(() => {
                                    checkBarcodeTimeline(item.barcode, transfer.transfer_reference);
                                }, 1000);
                            });
                        }
                    }
                } catch (error) {
                    console.error('❌ Error parsing transfer details:', error);
                }
            });
        });
        
        detailReq.on('error', (error) => {
            console.error('❌ Detail request error:', error);
        });
        
        detailReq.end();
    }
    
    function checkBarcodeTimeline(barcode, expectedRef) {
        console.log(`\n🔍 Checking timeline for barcode: ${barcode}`);
        console.log(`   Looking for reference: ${expectedRef}`);
        
        const timelineOptions = {
            hostname: 'api.giftgala.in',
            port: 443,
            path: `/api/timeline/${barcode}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
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
                        
                        // Look for SELF_TRANSFER entries
                        const selfTransferEntries = timeline.filter(entry => entry.type === 'SELF_TRANSFER');
                        const matchingEntries = timeline.filter(entry => entry.reference === expectedRef);
                        
                        console.log(`📊 Timeline Results for ${barcode}:`);
                        console.log(`   Total entries: ${timeline.length}`);
                        console.log(`   SELF_TRANSFER entries: ${selfTransferEntries.length}`);
                        console.log(`   Matching reference entries: ${matchingEntries.length}`);
                        
                        if (selfTransferEntries.length > 0) {
                            console.log('\n✅ SELF_TRANSFER entries found:');
                            selfTransferEntries.forEach((entry, index) => {
                                console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.direction} - Qty: ${entry.quantity} - Ref: ${entry.reference}`);
                            });
                        } else {
                            console.log('\n❌ NO SELF_TRANSFER entries found in timeline!');
                        }
                        
                        if (matchingEntries.length > 0) {
                            console.log('\n✅ Matching reference entries found:');
                            matchingEntries.forEach((entry, index) => {
                                console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.type} - ${entry.direction} - Qty: ${entry.quantity}`);
                            });
                        } else {
                            console.log(`\n❌ NO entries found with reference: ${expectedRef}`);
                        }
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
    }
};

// Run the check
checkTimelineDatabase();