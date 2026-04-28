const https = require('https');

const API_BASE = 'https://api.giftgala.in';

function httpsGet(url, token) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        }).on('error', reject);
    });
}

function httpsPost(path, body, token) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const req = https.request({
            hostname: 'api.giftgala.in', port: 443, path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData), 'Authorization': `Bearer ${token}` }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(postData); req.end();
    });
}

async function main() {
    // Login
    const loginRes = await httpsPost('/api/auth/login', { email: 'admin@company.com', password: 'Admin@123' }, '');
    const token = loginRes.data.token;
    console.log('✅ Logged in\n');

    // Get stores
    const storesRes = await httpsGet(`${API_BASE}/api/warehouse-management/stores`, token);
    const stores = storesRes.data.stores || [];
    console.log('📦 Stores:', stores.map(s => `${s.store_name} (${s.store_code})`).join(', '));
    
    if (stores.length === 0) {
        console.log('❌ No stores found');
        return;
    }

    const storeCode = 'DEL_MOTI_NAGAR'; // This store has data from the screenshot
    console.log(`\n🔍 Fetching timeline for store: ${storeCode}\n`);

    // Get store timeline
    const timelineRes = await httpsGet(`${API_BASE}/api/store-timeline/${storeCode}?limit=10`, token);
    
    if (!timelineRes.data.success) {
        console.log('❌ Timeline API failed:', timelineRes.data);
        return;
    }

    const timeline = timelineRes.data.data?.timeline || [];
    console.log(`📜 Timeline entries: ${timeline.length}\n`);
    
    if (timeline.length > 0) {
        console.log('=== FIRST ENTRY FULL STRUCTURE ===');
        console.log(JSON.stringify(timeline[0], null, 2));
        
        console.log('\n=== ALL ENTRIES (key fields) ===');
        timeline.forEach((entry, i) => {
            console.log(`${i+1}. movement_type: "${entry.movement_type}" | type: "${entry.type}" | direction: "${entry.direction}" | reference: "${entry.reference}"`);
        });
        
        // Find SELF_TRANSFER entries
        const transfers = timeline.filter(e => 
            e.movement_type === 'SELF_TRANSFER' || e.type === 'SELF_TRANSFER'
        );
        console.log(`\n🔄 SELF_TRANSFER entries: ${transfers.length}`);
        if (transfers.length > 0) {
            console.log('First transfer:', JSON.stringify(transfers[0], null, 2));
        }
    }
}

main().catch(console.error);
