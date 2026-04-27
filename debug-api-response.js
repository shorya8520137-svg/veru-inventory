const https = require('https');

const AUTH_TOKEN = process.argv[2];
const BASE_URL = 'api.giftgala.in';

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
        req.end();
    });
}

async function debug() {
    console.log('Testing warehouse inventory endpoint...\n');
    
    const response = await makeRequest('/api/products/inventory/by-warehouse/GGM_WH');
    
    console.log('Status:', response.statusCode);
    console.log('Response type:', typeof response.body);
    console.log('Is Array:', Array.isArray(response.body));
    console.log('\nFull response:');
    console.log(JSON.stringify(response.body, null, 2));
}

debug().catch(console.error);
