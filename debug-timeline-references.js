const axios = require('axios');

// Debug timeline references vs actual database
async function debugTimelineReferences() {
    const API_BASE = 'https://api.giftgala.in';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';

    console.log('🔍 Debugging Timeline References...\n');

    try {
        // Check timeline for a barcode that might have self-transfers
        const barcodes = ['2025-8999', '2005-999', 'CONDOM'];
        
        for (const barcode of barcodes) {
            console.log(`📋 Checking timeline for barcode: ${barcode}`);
            
            try {
                const timelineResponse = await axios.get(`${API_BASE}/api/timeline/${barcode}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (timelineResponse.data.success && timelineResponse.data.data.timeline) {
                    const timeline = timelineResponse.data.data.timeline;
                    const selfTransferEntries = timeline.filter(entry => entry.type === 'SELF_TRANSFER');
                    
                    console.log(`   Total entries: ${timeline.length}`);
                    console.log(`   Self-transfer entries: ${selfTransferEntries.length}`);
                    
                    if (selfTransferEntries.length > 0) {
                        console.log('   📦 Self-transfer entries:');
                        selfTransferEntries.forEach((entry, index) => {
                            console.log(`      ${index + 1}. ${entry.timestamp} - REF: "${entry.reference}" - ${entry.warehouse} - ${entry.direction} ${entry.quantity}`);
                        });
                        
                        // Test if these references work with the API
                        for (const entry of selfTransferEntries.slice(0, 2)) {
                            if (entry.reference) {
                                console.log(`\n   🧪 Testing reference: ${entry.reference}`);
                                try {
                                    const detailResponse = await axios.get(`${API_BASE}/api/self-transfer/${entry.reference}`, {
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    console.log(`      ✅ API works for ${entry.reference}`);
                                } catch (apiError) {
                                    console.log(`      ❌ API failed for ${entry.reference}: ${apiError.response?.status} - ${apiError.response?.data?.message}`);
                                }
                            }
                        }
                    }
                    
                    // Show all entry types for this barcode
                    const entryTypes = [...new Set(timeline.map(entry => entry.type))];
                    console.log(`   📊 Entry types: ${entryTypes.join(', ')}`);
                    
                } else {
                    console.log(`   ❌ No timeline data for ${barcode}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Timeline API failed for ${barcode}: ${error.response?.status}`);
            }
            
            console.log(''); // Empty line for readability
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

// Run debug
debugTimelineReferences();