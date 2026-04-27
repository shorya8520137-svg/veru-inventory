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

async function checkStockInDB(barcode, warehouse) {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    console.log(`\n📊 Checking stock in database for ${barcode} at ${warehouse}...`);
    
    const sshCommand = `ssh -i "C:\\Users\\singh\\.ssh\\pem.pem" ubuntu@52.77.209.49 "mysql -u inventory_user -p'StrongPass@123' inventory_db -e 'SELECT SUM(qty_available) as stock FROM stock_batches WHERE barcode = \\\"${barcode}\\\" AND warehouse = \\\"${warehouse}\\\" AND status = \\\"active\\\";'"`;
    
    try {
        const { stdout } = await execPromise(sshCommand);
        console.log('✅ Database result:');
        console.log(stdout);
        return stdout;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

async function test() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         DIRECT DAMAGE API TEST WITH DB VERIFICATION       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
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

    // Product with confirmed stock from database
    const product = {
        barcode: '972946773347',
        product_name: 'Lounge / Resort Casual Product 11',
        warehouse: 'BLR_WH'
    };
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST 1: CHECK STOCK BEFORE DAMAGE (via SSH)');
    console.log('═══════════════════════════════════════════════════════════');
    
    await checkStockInDB(product.barcode, product.warehouse);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 2: REPORT WAREHOUSE DAMAGE');
    console.log('═══════════════════════════════════════════════════════════');
    
    const damageQty = 3;
    const processedBy = 'Anurag Singh';
    
    console.log(`\n⚠️ Reporting DAMAGE: ${damageQty} units of ${product.product_name}`);
    console.log(`   Location: ${product.warehouse}`);
    console.log(`   Processed By: ${processedBy}\n`);
    
    const damageResponse = await makeRequest('/api/damage-recovery/damage', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: {
            product_type: product.product_name,
            barcode: product.barcode,
            inventory_location: product.warehouse,
            quantity: damageQty,
            action_type: 'damage',
            processed_by: processedBy
        }
    });

    console.log('📦 Damage API Response:');
    console.log(JSON.stringify(damageResponse, null, 2));
    
    if (damageResponse.statusCode === 201 && damageResponse.data.success) {
        console.log('\n✅ Damage reported successfully!');
        console.log(`   Damage ID: ${damageResponse.data.damage_id}`);
        console.log(`   Reference: ${damageResponse.data.reference}`);
        
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('TEST 3: CHECK STOCK AFTER DAMAGE (via SSH)');
        console.log('═══════════════════════════════════════════════════════════');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await checkStockInDB(product.barcode, product.warehouse);
        
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('TEST 4: CHECK TIMELINE ENTRY');
        console.log('═══════════════════════════════════════════════════════════');
        
        const timelineResponse = await makeRequest(
            `/api/timeline/${product.barcode}?warehouse=${product.warehouse}&limit=5`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        console.log('\n📋 Timeline API Response:');
        console.log(JSON.stringify(timelineResponse, null, 2));
        
        if (timelineResponse.statusCode === 200 && timelineResponse.data.success) {
            const damageEntries = timelineResponse.data.data.timeline.filter(t => t.type === 'DAMAGE');
            console.log(`\n✅ Found ${damageEntries.length} DAMAGE entries in timeline`);
            
            if (damageEntries.length > 0) {
                console.log('\n📝 Latest DAMAGE entry:');
                const latest = damageEntries[0];
                console.log(`   - Timestamp: ${latest.timestamp}`);
                console.log(`   - Quantity: ${latest.quantity}`);
                console.log(`   - Direction: ${latest.direction}`);
                console.log(`   - Reference: ${latest.reference}`);
                console.log(`   - Processed By: ${latest.damage_details?.processed_by || 'N/A'}`);
                console.log(`   - Balance After: ${latest.balance_after}`);
            }
        }
        
    } else {
        console.log('\n❌ Damage report failed');
        console.log(`   Message: ${damageResponse.data.message || 'Unknown error'}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 5: REPORT STORE DAMAGE');
    console.log('═══════════════════════════════════════════════════════════');
    
    const storeQty = 2;
    const storeLocation = 'STORE001';
    
    console.log(`\n⚠️ Reporting STORE DAMAGE: ${storeQty} units`);
    console.log(`   Location: ${storeLocation}`);
    console.log(`   Processed By: ${processedBy}\n`);
    
    const storeDamageResponse = await makeRequest('/api/damage-recovery/damage', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: {
            product_type: product.product_name,
            barcode: product.barcode,
            inventory_location: storeLocation,
            quantity: storeQty,
            action_type: 'damage',
            processed_by: processedBy
        }
    });

    console.log('📦 Store Damage API Response:');
    console.log(JSON.stringify(storeDamageResponse, null, 2));
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST COMPLETE                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
}

test().catch(console.error);
