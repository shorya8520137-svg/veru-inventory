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

    // Test product tracking for barcode with known stock
    const barcode = '972946773347';
    const warehouse = 'BLR_WH';
    
    console.log(`📊 Testing product tracking for ${barcode} at ${warehouse}...`);
    
    const trackingResponse = await makeRequest(
        `/api/product-tracking/${barcode}?warehouse=${warehouse}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('\n📦 Response:');
    console.log(JSON.stringify(trackingResponse, null, 2));
    
    // Also test without warehouse parameter
    console.log(`\n📊 Testing product tracking for ${barcode} (no warehouse filter)...`);
    
    const trackingResponse2 = await makeRequest(
        `/api/product-tracking/${barcode}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('\n📦 Response:');
    console.log(JSON.stringify(trackingResponse2, null, 2));
}

test().catch(console.error);
