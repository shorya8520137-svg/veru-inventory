const axios = require('axios');

// Test what self-transfers actually exist
async function testExistingTransfers() {
    const API_BASE = 'https://api.giftgala.in';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';

    console.log('🔍 Checking existing self-transfers...\n');

    try {
        // 1. Get list of all self-transfers
        console.log('1️⃣ Fetching all self-transfers...');
        const listResponse = await axios.get(`${API_BASE}/api/self-transfer`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (listResponse.data.success && listResponse.data.transfers) {
            console.log(`✅ Found ${listResponse.data.transfers.length} self-transfers`);
            
            listResponse.data.transfers.slice(0, 5).forEach((transfer, index) => {
                console.log(`   ${index + 1}. ${transfer.transfer_reference} - ${transfer.transfer_type} - ${transfer.source_location} → ${transfer.destination_location}`);
            });
            
            // 2. Test the first transfer's details
            if (listResponse.data.transfers.length > 0) {
                const firstTransfer = listResponse.data.transfers[0];
                console.log(`\n2️⃣ Testing details for: ${firstTransfer.transfer_reference}`);
                
                try {
                    const detailResponse = await axios.get(`${API_BASE}/api/self-transfer/${firstTransfer.transfer_reference}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    console.log('✅ Details API works!');
                    console.log('📄 Response structure:');
                    console.log(JSON.stringify(detailResponse.data, null, 2));
                    
                } catch (detailError) {
                    console.error('❌ Details API failed:');
                    console.error('Status:', detailError.response?.status);
                    console.error('Data:', detailError.response?.data);
                }
            }
            
        } else {
            console.log('❌ No self-transfers found or API failed');
            console.log('Response:', listResponse.data);
        }
        
        // 3. Check timeline for barcode 2005-999 to see what references it shows
        console.log('\n3️⃣ Checking timeline for barcode 2005-999...');
        const timelineResponse = await axios.get(`${API_BASE}/api/timeline/2005-999`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (timelineResponse.data.success && timelineResponse.data.data.timeline) {
            const selfTransferEntries = timelineResponse.data.data.timeline.filter(entry => 
                entry.type === 'SELF_TRANSFER'
            );
            
            console.log(`✅ Found ${selfTransferEntries.length} self-transfer entries in timeline`);
            selfTransferEntries.forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.reference} - ${entry.warehouse} - ${entry.direction} ${entry.quantity}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Run test
testExistingTransfers();