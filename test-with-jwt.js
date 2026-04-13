/**
 * SIMPLE API TEST WITH JWT TOKEN
 * Just provide the JWT token and test all APIs
 * Usage: node test-with-jwt.js YOUR_JWT_TOKEN
 */

const https = require('https');

// Get JWT token from command line
const JWT_TOKEN = process.argv[2];

if (!JWT_TOKEN) {
    console.log('❌ Please provide JWT token as argument');
    console.log('Usage: node test-with-jwt.js YOUR_JWT_TOKEN');
    process.exit(1);
}

const CONFIG = {
    API_BASE: 'https://54.169.31.95:8443',
    COLORS: {
        GREEN: '\x1b[32m',
        RED: '\x1b[31m',
        YELLOW: '\x1b[33m',
        BLUE: '\x1b[34m',
        CYAN: '\x1b[36m',
        RESET: '\x1b[0m',
        BOLD: '\x1b[1m'
    }
};

function log(message, color = 'RESET') {
    console.log(`${CONFIG.COLORS[color]}${message}${CONFIG.COLORS.RESET}`);
}

async function makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${CONFIG.API_BASE}${endpoint}`);
        
        const requestOptions = {
            hostname: url.hostname,
            port: url.port || 8443,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`,
                ...options.headers
            },
            rejectUnauthorized: false
        };

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
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

async function testAPI(name, endpoint, method = 'GET', body = null) {
    log(`\n🔍 ${name}`, 'BOLD');
    log(`📡 ${method} ${endpoint}`, 'CYAN');
    
    if (body) {
        log(`📤 REQUEST:`, 'YELLOW');
        log(JSON.stringify(body, null, 2), 'YELLOW');
    }

    try {
        const response = await makeRequest(endpoint, { method, body });
        
        const color = response.statusCode >= 200 && response.statusCode < 300 ? 'GREEN' : 'RED';
        log(`📥 RESPONSE (${response.statusCode}):`, color);
        log(JSON.stringify(response.data, null, 2), color);
        
        return response;
    } catch (error) {
        log(`❌ ERROR: ${error.message}`, 'RED');
        return null;
    }
}

async function runTests() {
    log('🚀 TESTING APIs WITH JWT TOKEN', 'BOLD');
    log(`🎫 Token: ${JWT_TOKEN.substring(0, 50)}...`, 'CYAN');
    log('='.repeat(80), 'CYAN');

    // Test 1: Create Return
    await testAPI(
        'CREATE RETURN',
        '/api/returns',
        'POST',
        {
            order_ref: 'TEST_ORDER_001',
            awb: 'AWB123456789',
            product_type: 'Samsung Galaxy S21',
            warehouse: 'GGM_WH',
            quantity: 1,
            barcode: 'RETURN_TEST_001',
            has_parts: false,
            return_reason: 'Customer return - defective',
            condition: 'good',
            processed_by: 'Test User'
        }
    );

    // Test 2: Get Returns
    await testAPI('GET RETURNS', '/api/returns');

    // Test 3: Report Damage
    await testAPI(
        'REPORT DAMAGE',
        '/api/damage-recovery/damage',
        'POST',
        {
            product_type: 'MacBook Pro 16',
            barcode: 'DAMAGE_TEST_001',
            warehouse: 'GGM_WH',
            quantity: 1,
            inventory_location: 'A1-B2-C3',
            damage_reason: 'Screen cracked',
            notes: 'Visible crack on screen'
        }
    );

    // Test 4: Recover Stock
    await testAPI(
        'RECOVER STOCK',
        '/api/damage-recovery/recover',
        'POST',
        {
            product_type: 'Dell XPS 13',
            barcode: 'RECOVERY_TEST_001',
            warehouse: 'GGM_WH',
            quantity: 1,
            inventory_location: 'A1-B2-C4',
            recovery_notes: 'Stock recovered'
        }
    );

    // Test 5: Get Damage Log
    await testAPI('GET DAMAGE LOG', '/api/damage-recovery/log');

    // Test 6: Get Warehouses
    await testAPI('GET WAREHOUSES', '/api/returns/warehouses');

    log('\n✅ ALL TESTS COMPLETED!', 'GREEN');
}

runTests().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});