const axios = require('axios');

// Test self-transfer API endpoint
async function testSelfTransferAPI() {
    const API_BASE = 'https://api.giftgala.in';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';

    console.log('🧪 Testing Self-Transfer API Endpoint...\n');

    try {
        // Test the specific reference from the screenshot: ST-10023
        const reference = 'ST-10023';
        console.log(`📋 Testing reference: ${reference}`);
        
        const response = await axios.get(`${API_BASE}/api/self-transfer/${reference}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ API Response Status:', response.status);
        console.log('📄 Response Data Structure:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Check if response matches expected format
        if (response.data.success && response.data.data && response.data.data.transfer) {
            console.log('\n✅ Response format is correct!');
            const transfer = response.data.data.transfer;
            console.log('📋 Transfer Details:');
            console.log(`   - Reference: ${transfer.transfer_reference}`);
            console.log(`   - Type: ${transfer.transfer_type}`);
            console.log(`   - Source: ${transfer.source_location} (${transfer.source_display || 'No display name'})`);
            console.log(`   - Destination: ${transfer.destination_location} (${transfer.destination_display || 'No display name'})`);
            console.log(`   - Items: ${transfer.items ? transfer.items.length : 0} items`);
            
            if (transfer.items && transfer.items.length > 0) {
                console.log('📦 Items:');
                transfer.items.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.product_name} (${item.barcode}) - Qty: ${item.quantity}`);
                });
            }
        } else {
            console.log('❌ Response format is incorrect!');
            console.log('Expected: { success: true, data: { transfer: {...} } }');
        }
        
    } catch (error) {
        console.error('❌ API Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run test
testSelfTransferAPI();