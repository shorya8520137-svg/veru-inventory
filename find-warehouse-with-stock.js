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

async function findWarehouse() {
    console.log('🔍 Finding warehouses with stock...\n');
    
    const warehouses = ['GGM_WH', 'BLR_WH', 'DEL_WH', 'MUM_WH', 'HYD_WH', 'AMD_WH'];
    
    for (const wh of warehouses) {
        const response = await makeRequest(`/api/products/inventory/by-warehouse/${wh}`);
        
        if (response.statusCode === 200 && response.body.success) {
            const inventory = response.body.data.inventory || [];
            const totalStock = response.body.data.stats.totalProducts || 0;
            
            console.log(`${wh}: ${totalStock} products, ${inventory.length} items`);
            
            if (inventory.length > 0) {
                console.log(`  ✅ Has stock! First product: ${inventory[0].barcode}`);
            }
        }
    }
}

findWarehouse().catch(console.error);
