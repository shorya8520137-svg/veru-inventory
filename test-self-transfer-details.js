const https = require('https');

// Test self-transfer details API endpoint
const testSelfTransferDetails = () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';
    
    // First, get list of transfers to find a valid transfer reference
    const listOptions = {
        hostname: 'api.giftgala.in',
        port: 443,
        path: '/api/self-transfer',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    console.log('🔍 Testing Self-Transfer Details API...');
    console.log('📋 First, getting list of transfers...');

    const listReq = https.request(listOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ Transfer list response:', JSON.stringify(response, null, 2));
                
                if (response.success && response.transfers && response.transfers.length > 0) {
                    // Test details endpoint with first transfer
                    const firstTransfer = response.transfers[0];
                    const transferRef = firstTransfer.transfer_reference;
                    
                    console.log(`\n🔍 Testing details for transfer: ${transferRef}`);
                    
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
                    
                    const detailReq = https.request(detailOptions, (detailRes) => {
                        let detailData = '';
                        
                        detailRes.on('data', (chunk) => {
                            detailData += chunk;
                        });
                        
                        detailRes.on('end', () => {
                            try {
                                const detailResponse = JSON.parse(detailData);
                                console.log('✅ Transfer details response:', JSON.stringify(detailResponse, null, 2));
                                
                                if (detailResponse.success && detailResponse.data && detailResponse.data.transfer) {
                                    const transfer = detailResponse.data.transfer;
                                    console.log('\n📊 Transfer Details Summary:');
                                    console.log(`   Reference: ${transfer.transfer_reference}`);
                                    console.log(`   Type: ${transfer.transfer_type}`);
                                    console.log(`   From: ${transfer.source_display || transfer.source_location}`);
                                    console.log(`   To: ${transfer.destination_display || transfer.destination_location}`);
                                    console.log(`   Status: ${transfer.status}`);
                                    console.log(`   Items: ${transfer.items ? transfer.items.length : 0}`);
                                    
                                    if (transfer.items && transfer.items.length > 0) {
                                        console.log('\n📦 Items:');
                                        transfer.items.forEach((item, index) => {
                                            console.log(`   ${index + 1}. ${item.product_name} (${item.barcode}) - Qty: ${item.quantity}`);
                                        });
                                    }
                                } else {
                                    console.log('❌ Invalid details response structure');
                                }
                            } catch (error) {
                                console.error('❌ Error parsing details response:', error);
                                console.log('Raw details response:', detailData);
                            }
                        });
                    });
                    
                    detailReq.on('error', (error) => {
                        console.error('❌ Details request error:', error);
                    });
                    
                    detailReq.end();
                } else {
                    console.log('❌ No transfers found to test details endpoint');
                }
            } catch (error) {
                console.error('❌ Error parsing list response:', error);
                console.log('Raw list response:', data);
            }
        });
    });

    listReq.on('error', (error) => {
        console.error('❌ List request error:', error);
    });

    listReq.end();
};

// Run the test
testSelfTransferDetails();