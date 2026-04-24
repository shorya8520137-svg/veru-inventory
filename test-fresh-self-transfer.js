const https = require('https');

// Test fresh self-transfer to see if timeline entries are created
const testFreshSelfTransfer = () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';
    
    console.log('🔄 Testing Fresh Self-Transfer with Timeline...');
    
    // Create a W to W transfer (should create timeline entries)
    const transferData = {
        sourceType: 'warehouse',
        sourceId: 'BLR_WH',
        destinationType: 'warehouse', 
        destinationId: 'GGM_WH',
        items: [
            {
                productId: 'Baby Cloth Set (7 piece set) Blue|2005-999|2005-999',
                transferQty: 1
            }
        ],
        notes: 'Testing timeline entries fix'
    };
    
    const postData = JSON.stringify(transferData);
    
    const options = {
        hostname: 'api.giftgala.in',
        port: 443,
        path: '/api/self-transfer',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    console.log('📤 Creating W to W self-transfer...');
    
    const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ Transfer creation response:', JSON.stringify(response, null, 2));
                
                if (response.success) {
                    console.log(`🎯 Transfer created: ${response.transferId}`);
                    console.log(`📊 Transfer type: ${response.transferType}`);
                    
                    // Wait 2 seconds then check timeline
                    setTimeout(() => {
                        checkTimelineAfterTransfer();
                    }, 2000);
                } else {
                    console.log('❌ Transfer creation failed');
                }
            } catch (error) {
                console.error('❌ Error parsing transfer response:', error);
                console.log('Raw response:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ Transfer request error:', error);
    });
    
    req.write(postData);
    req.end();
    
    function checkTimelineAfterTransfer() {
        console.log('\n🔍 Checking timeline after transfer...');
        
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
                        const selfTransferEntries = timeline.filter(entry => entry.type === 'SELF_TRANSFER');
                        
                        console.log(`📊 Total timeline entries: ${timeline.length}`);
                        console.log(`🔄 SELF_TRANSFER entries: ${selfTransferEntries.length}`);
                        
                        if (selfTransferEntries.length > 0) {
                            console.log('\n✅ SUCCESS! SELF_TRANSFER entries found:');
                            selfTransferEntries.forEach((entry, index) => {
                                console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.direction} - Qty: ${entry.quantity} - Warehouse: ${entry.warehouse} - Ref: ${entry.reference}`);
                            });
                            
                            // Check summary
                            const summary = response.data.summary.breakdown;
                            console.log(`\n📈 Summary - Transfer In: ${summary.self_transfer_in}, Transfer Out: ${summary.self_transfer_out}`);
                        } else {
                            console.log('\n❌ STILL NO SELF_TRANSFER entries found!');
                            console.log('🔧 This means either:');
                            console.log('   1. Server code not updated (need git pull + restart)');
                            console.log('   2. Timeline creation logic still has issues');
                            
                            // Show recent entries
                            console.log('\n📋 Recent timeline entries:');
                            timeline.slice(0, 3).forEach((entry, index) => {
                                console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.type} - ${entry.direction} - Qty: ${entry.quantity}`);
                            });
                        }
                    }
                } catch (error) {
                    console.error('❌ Error parsing timeline response:', error);
                }
            });
        });
        
        timelineReq.on('error', (error) => {
            console.error('❌ Timeline request error:', error);
        });
        
        timelineReq.end();
    }
};

// Run the test
testFreshSelfTransfer();