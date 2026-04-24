const axios = require('axios');

async function testSpecificTimeline() {
    const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwidGVuYW50X2lkIjoxLCJpYXQiOjE3NzcwMzE2ODcsImV4cCI6MTc3NzExODA4NywiYXVkIjoiaW52ZW50b3J5LXVzZXJzIiwiaXNzIjoiaW52ZW50b3J5LXN5c3RlbSJ9.i7rzBWxTT0PQMsnaVFwkZahQCumvwfKSdLVwegQDVNs';
    
    try {
        console.log('🔍 Testing Individual Timeline Entries for Movement Types...\n');
        
        const response = await axios.get('https://api.giftgala.in/api/timeline/2005-999?limit=10', {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success && response.data.data.timeline) {
            console.log('✅ Timeline API Response Structure:');
            console.log('📊 Total Timeline Entries:', response.data.data.timeline.length);
            console.log('\n📋 Individual Timeline Entries:\n');
            
            response.data.data.timeline.forEach((entry, index) => {
                console.log(`Entry ${index + 1}:`);
                console.log(`  📅 Timestamp: ${entry.timestamp}`);
                console.log(`  🏷️  Type: ${entry.type}`);
                console.log(`  📦 Product: ${entry.product_name}`);
                console.log(`  🏭 Warehouse: ${entry.warehouse}`);
                console.log(`  📊 Quantity: ${entry.quantity}`);
                console.log(`  ➡️  Direction: ${entry.direction}`);
                console.log(`  🔗 Reference: ${entry.reference}`);
                console.log(`  💰 Balance After: ${entry.balance_after}`);
                console.log(`  📝 Description: ${entry.description}`);
                console.log('  ---');
            });
            
            console.log('\n📊 Summary Breakdown:');
            const breakdown = response.data.data.summary.breakdown;
            Object.keys(breakdown).forEach(key => {
                console.log(`  ${key}: ${breakdown[key]}`);
            });
            
        } else {
            console.log('❌ No timeline data found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testSpecificTimeline();