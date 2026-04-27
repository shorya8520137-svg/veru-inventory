const https = require('https');

const API_BASE = 'https://api.giftgala.in';

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, API_BASE);
        
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            agent
        };

        const req = https.request(url, requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

async function test() {
    console.log('🔐 Logging in...');
    
    const loginResponse = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: {
            email: 'admin@company.com',
            password: 'Admin@123'
        }
    });

    if (!loginResponse.data.token) {
        console.error('❌ Login failed');
        return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    const barcode = '972946773347';
    const storeCode = 'BLR_WH';
    
    console.log(`📋 Fetching timeline for ${barcode} at ${storeCode}...\n`);
    
    const timelineResponse = await makeRequest(
        `/api/store-timeline/${storeCode}?productBarcode=${barcode}&limit=10`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('📦 Timeline Response:');
    console.log(JSON.stringify(timelineResponse.data, null, 2));
    
    if (timelineResponse.data.success && timelineResponse.data.data.timeline) {
        const damageEntries = timelineResponse.data.data.timeline.filter(t => 
            t.movement_type === 'DAMAGE' || t.movement_type === 'DAMAGED'
        );
        
        console.log('\n\n🔍 DAMAGE Entries Found:', damageEntries.length);
        
        damageEntries.forEach((entry, index) => {
            console.log(`\n--- DAMAGE Entry ${index + 1} ---`);
            console.log('movement_type:', entry.movement_type);
            console.log('reference:', entry.reference);
            console.log('quantity:', entry.quantity);
            console.log('balance_after:', entry.balance_after);
            console.log('warehouse:', entry.warehouse);
            console.log('product_name:', entry.product_name);
            console.log('barcode:', entry.barcode);
            console.log('damage_details:', JSON.stringify(entry.damage_details, null, 2));
            console.log('notes:', entry.notes);
        });
    }
}

test().catch(console.error);
