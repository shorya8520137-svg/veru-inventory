/**
 * Check current stock via API
 */

const https = require('https');
const fs = require('fs');

const API_BASE = 'https://api.giftgala.in';
const BARCODE = '972946773347';
const WAREHOUSE = 'BLR_WH';

// Get token
const envContent = fs.readFileSync('.env.production', 'utf8');
const tokenMatch = envContent.match(/NEXT_PUBLIC_TEST_TOKEN=(.+)/);

if (!tokenMatch) {
    console.error('❌ Token not found in .env.production');
    process.exit(1);
}

const token = tokenMatch[1].trim();

console.log('🔍 Checking stock for:');
console.log('   Product: Lounge / Resort Casual Product 11');
console.log('   Barcode:', BARCODE);
console.log('   Warehouse:', WAREHOUSE);
console.log('');

// Fetch timeline which includes current stock
const url = `${API_BASE}/api/timeline/${BARCODE}?warehouse=${WAREHOUSE}`;

https.get(url, {
    headers: { 'Authorization': `Bearer ${token}` }
}, (res) => {
    let data = '';
    
    res.on('data', chunk => data += chunk);
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            if (!response.success) {
                console.error('❌ API Error:', response);
                return;
            }
            
            const currentStock = response.data?.current_stock || [];
            const timeline = response.data?.timeline || [];
            const summary = response.data?.summary || {};
            
            console.log('✅ API Response received\n');
            console.log('═══════════════════════════════════════════════');
            console.log('📊 CURRENT STOCK');
            console.log('═══════════════════════════════════════════════\n');
            
            if (currentStock.length > 0) {
                const stock = currentStock[0];
                console.log(`   Product: ${stock.product_name}`);
                console.log(`   Barcode: ${stock.barcode}`);
                console.log(`   Warehouse: ${stock.warehouse}`);
                console.log(`   Current Stock: ${stock.current_stock} units`);
                console.log(`   Batch Count: ${stock.batch_count}`);
            } else {
                console.log('   ⚠️  No stock found');
            }
            
            console.log('\n═══════════════════════════════════════════════');
            console.log('📈 SUMMARY');
            console.log('═══════════════════════════════════════════════\n');
            
            console.log(`   Opening Stock: ${summary.opening_stock || 0}`);
            console.log(`   Total IN: ${summary.total_in || 0}`);
            console.log(`   Total OUT: ${summary.total_out || 0}`);
            console.log(`   Current Stock: ${summary.current_stock || 0}`);
            
            if (summary.breakdown) {
                console.log('\n   Breakdown:');
                console.log(`   - Opening: ${summary.breakdown.opening || 0}`);
                console.log(`   - Bulk Upload: ${summary.breakdown.bulk_upload || 0}`);
                console.log(`   - Dispatch: ${summary.breakdown.dispatch || 0}`);
                console.log(`   - Damage: ${summary.breakdown.damage || 0}`);
                console.log(`   - Recovery: ${summary.breakdown.recovery || 0}`);
                console.log(`   - Returns: ${summary.breakdown.returns || 0}`);
                console.log(`   - Transfer IN: ${summary.breakdown.self_transfer_in || 0}`);
                console.log(`   - Transfer OUT: ${summary.breakdown.self_transfer_out || 0}`);
            }
            
            console.log('\n═══════════════════════════════════════════════');
            console.log('📜 RECENT TIMELINE (Last 10)');
            console.log('═══════════════════════════════════════════════\n');
            
            const recentTimeline = timeline.slice(0, 10);
            
            if (recentTimeline.length === 0) {
                console.log('   ⚠️  No timeline entries');
            } else {
                recentTimeline.forEach((entry, index) => {
                    const direction = entry.direction === 'IN' ? '📥' : '📤';
                    const qty = entry.direction === 'IN' ? `+${entry.quantity}` : `-${entry.quantity}`;
                    const date = entry.timestamp.split('T')[0];
                    const time = entry.timestamp.split('T')[1]?.slice(0, 8);
                    
                    console.log(`${index + 1}. ${direction} ${entry.type} | ${qty} units | Balance: ${entry.balance_after}`);
                    console.log(`   Date: ${date} ${time}`);
                    console.log(`   Reference: ${entry.reference || 'N/A'}`);
                    if (entry.description) {
                        console.log(`   Description: ${entry.description}`);
                    }
                    console.log('');
                });
            }
            
            console.log('═══════════════════════════════════════════════\n');
            
        } catch (error) {
            console.error('❌ Parse error:', error);
        }
    });
}).on('error', (error) => {
    console.error('❌ Request error:', error);
});
