const https = require('https');

// Debug self-transfer timeline issue
const debugSelfTransferTimeline = () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';
    
    // Test timeline for the barcode that has self-transfer
    const barcode = '2005-999'; // From your screenshot
    
    console.log('🔍 Debugging Self-Transfer Timeline Issue...');
    console.log(`📋 Checking timeline for barcode: ${barcode}`);
    
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
                console.log('✅ Timeline response:', JSON.stringify(response, null, 2));
                
                if (response.success && response.data && response.data.timeline) {
                    const timeline = response.data.timeline;
                    console.log(`\n📊 Timeline entries found: ${timeline.length}`);
                    
                    // Check for SELF_TRANSFER entries
                    const selfTransferEntries = timeline.filter(entry => entry.type === 'SELF_TRANSFER');
                    console.log(`🔄 SELF_TRANSFER entries: ${selfTransferEntries.length}`);
                    
                    if (selfTransferEntries.length > 0) {
                        console.log('\n✅ SELF_TRANSFER entries found:');
                        selfTransferEntries.forEach((entry, index) => {
                            console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.direction} - Qty: ${entry.quantity} - Ref: ${entry.reference}`);
                        });
                    } else {
                        console.log('\n❌ NO SELF_TRANSFER entries found in timeline!');
                        console.log('📋 Available entry types:');
                        const types = [...new Set(timeline.map(entry => entry.type))];
                        types.forEach(type => {
                            const count = timeline.filter(entry => entry.type === type).length;
                            console.log(`   - ${type}: ${count} entries`);
                        });
                    }
                    
                    // Show recent entries
                    console.log('\n📋 Recent timeline entries:');
                    timeline.slice(0, 5).forEach((entry, index) => {
                        console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.type} - ${entry.direction} - Qty: ${entry.quantity}`);
                    });
                    
                } else {
                    console.log('❌ Invalid timeline response structure');
                }
            } catch (error) {
                console.error('❌ Error parsing timeline response:', error);
                console.log('Raw timeline response:', data);
            }
        });
    });
    
    timelineReq.on('error', (error) => {
        console.error('❌ Timeline request error:', error);
    });
    
    timelineReq.end();
};

// Run the debug
debugSelfTransferTimeline();