const https = require('https');

// Test self-transfer details API with a transfer that has more complete data
const testRichTransferDetails = () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';
    
    // Test with a transfer that has AWB, logistics, executive data
    const transferRef = 'SELF_TRANSFER_89238923_1770037831522';
    
    console.log('🔍 Testing Rich Self-Transfer Details API...');
    console.log(`📋 Testing transfer: ${transferRef}`);
    
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
                console.log('✅ Rich transfer details response:', JSON.stringify(detailResponse, null, 2));
                
                if (detailResponse.success && detailResponse.data && detailResponse.data.transfer) {
                    const transfer = detailResponse.data.transfer;
                    console.log('\n📊 Rich Transfer Details Summary:');
                    console.log(`   Reference: ${transfer.transfer_reference}`);
                    console.log(`   Type: ${transfer.transfer_type}`);
                    console.log(`   From: ${transfer.source_display || transfer.source_location}`);
                    console.log(`   To: ${transfer.destination_display || transfer.destination_location}`);
                    console.log(`   Status: ${transfer.status}`);
                    console.log(`   AWB: ${transfer.awb_number || 'N/A'}`);
                    console.log(`   Logistics: ${transfer.logistics || 'N/A'}`);
                    console.log(`   Executive: ${transfer.executive || 'N/A'}`);
                    console.log(`   Invoice: ₹${transfer.invoice_amount || '0'}`);
                    console.log(`   Order Ref: ${transfer.order_ref || 'N/A'}`);
                    console.log(`   Payment Mode: ${transfer.payment_mode || 'N/A'}`);
                    console.log(`   Remarks: ${transfer.remarks || 'N/A'}`);
                    console.log(`   Items: ${transfer.items ? transfer.items.length : 0}`);
                    
                    if (transfer.items && transfer.items.length > 0) {
                        console.log('\n📦 Items:');
                        transfer.items.forEach((item, index) => {
                            console.log(`   ${index + 1}. ${item.product_name} (${item.barcode}) - Qty: ${item.quantity}`);
                        });
                    }
                    
                    console.log('\n🎯 Modal Features Test:');
                    console.log(`   ✅ Transfer Overview: ${transfer.transfer_reference ? 'PASS' : 'FAIL'}`);
                    console.log(`   ✅ Source/Destination: ${transfer.source_display && transfer.destination_display ? 'PASS' : 'FAIL'}`);
                    console.log(`   ✅ Additional Details: ${transfer.awb_number || transfer.logistics || transfer.executive ? 'PASS' : 'FAIL'}`);
                    console.log(`   ✅ Remarks: ${transfer.remarks ? 'PASS' : 'FAIL'}`);
                    console.log(`   ✅ Items List: ${transfer.items && transfer.items.length > 0 ? 'PASS' : 'FAIL'}`);
                    
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
};

// Run the test
testRichTransferDetails();