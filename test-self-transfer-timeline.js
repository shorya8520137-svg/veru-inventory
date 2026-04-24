const axios = require('axios');

// Test self-transfer timeline fix
async function testSelfTransferTimeline() {
    const API_BASE = 'https://api.giftgala.in';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';

    console.log('🧪 Testing Self-Transfer Timeline Fix...\n');

    try {
        // 1. Get recent self-transfers
        console.log('1️⃣ Fetching recent self-transfers...');
        const transfersResponse = await axios.get(`${API_BASE}/api/self-transfer`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (transfersResponse.data.success && transfersResponse.data.transfers.length > 0) {
            const recentTransfer = transfersResponse.data.transfers[0];
            console.log(`✅ Found recent transfer: ${recentTransfer.transfer_reference}`);
            console.log(`   Type: ${recentTransfer.transfer_type}`);
            console.log(`   From: ${recentTransfer.source_location} → To: ${recentTransfer.destination_location}`);
            
            // 2. Get transfer details to find barcode
            console.log('\n2️⃣ Getting transfer details...');
            const detailsResponse = await axios.get(`${API_BASE}/api/self-transfer/${recentTransfer.transfer_reference}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (detailsResponse.data.success && detailsResponse.data.data.transfer.items.length > 0) {
                const firstItem = detailsResponse.data.data.transfer.items[0];
                const barcode = firstItem.barcode;
                console.log(`✅ Found barcode: ${barcode}`);
                
                // 3. Check timeline for this barcode
                console.log('\n3️⃣ Checking timeline for barcode...');
                const timelineResponse = await axios.get(`${API_BASE}/api/timeline/${barcode}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (timelineResponse.data.success) {
                    const timeline = timelineResponse.data.data.timeline;
                    const selfTransferEntries = timeline.filter(entry => entry.type === 'SELF_TRANSFER');
                    
                    console.log(`✅ Timeline entries found: ${timeline.length}`);
                    console.log(`🔄 Self-transfer entries: ${selfTransferEntries.length}`);
                    
                    if (selfTransferEntries.length > 0) {
                        console.log('\n📋 Recent self-transfer timeline entries:');
                        selfTransferEntries.slice(0, 3).forEach((entry, index) => {
                            console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.warehouse} - ${entry.direction} ${entry.quantity} - ${entry.reference}`);
                        });
                        console.log('\n✅ SUCCESS: Self-transfer entries are showing in timeline!');
                    } else {
                        console.log('\n❌ PROBLEM: No self-transfer entries found in timeline');
                        console.log('   This means timeline entries are not being created properly');
                    }
                } else {
                    console.log('❌ Failed to fetch timeline');
                }
            } else {
                console.log('❌ No transfer items found');
            }
        } else {
            console.log('❌ No recent transfers found');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run test
testSelfTransferTimeline();