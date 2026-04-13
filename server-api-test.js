/**
 * SERVER-SIDE API TEST SCRIPT
 * Run this directly on the server to test APIs with correct JWT
 * Uses: HH_Bedding Cutie cat, CCGGM_WH warehouse
 */

const jwt = require('jsonwebtoken');
const https = require('https');

// Server configuration
const CONFIG = {
    API_BASE: 'https://54.169.31.95:8443',
    PRODUCT_NAME: 'HH_Bedding Cutie cat CC',
    WAREHOUSE: 'GGM_WH',
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

// Generate JWT token with server's secret
function generateJWTToken() {
    const JWT_SECRET = process.env.JWT_SECRET || 'inventory-secret-key-2024';
    
    const payload = {
        id: 1,
        email: 'admin@company.com',
        name: 'Admin User',
        role_id: 1,
        role_name: 'Admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        aud: 'inventory-users',
        iss: 'inventory-system'
    };

    try {
        const token = jwt.sign(payload, JWT_SECRET);
        log(`🎫 Generated JWT Token: ${token.substring(0, 50)}...`, 'CYAN');
        return token;
    } catch (error) {
        log(`❌ Error generating JWT: ${error.message}`, 'RED');
        return null;
    }
}

async function makeRequest(endpoint, options = {}, token) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${CONFIG.API_BASE}${endpoint}`);
        
        const requestOptions = {
            hostname: url.hostname,
            port: url.port || 8443,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
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

async function testAPI(name, endpoint, method = 'GET', body = null, token) {
    log(`\n🔍 ${name}`, 'BOLD');
    log(`📡 ${method} ${endpoint}`, 'CYAN');
    
    if (body) {
        log(`📤 REQUEST:`, 'YELLOW');
        log(JSON.stringify(body, null, 2), 'YELLOW');
    }

    try {
        const response = await makeRequest(endpoint, { method, body }, token);
        
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
    log('🚀 TESTING APIs ON SERVER WITH CORRECT JWT', 'BOLD');
    log(`📦 Product: ${CONFIG.PRODUCT_NAME}`, 'CYAN');
    log(`🏢 Warehouse: ${CONFIG.WAREHOUSE}`, 'CYAN');
    log('='.repeat(80), 'CYAN');

    // Generate JWT token
    const token = generateJWTToken();
    if (!token) {
        log('❌ Cannot generate JWT token. Exiting.', 'RED');
        return;
    }

    // Test 1: Create Return
    await testAPI(
        'CREATE RETURN',
        '/api/returns',
        'POST',
        {
            order_ref: 'TEST_ORDER_HH_001',
            awb: 'AWB_HH_123456789',
            product_type: CONFIG.PRODUCT_NAME,
            warehouse: CONFIG.WAREHOUSE,
            quantity: 1,
            barcode: 'HH_BEDDING_001',
            has_parts: false,
            return_reason: 'Customer return - wrong size',
            condition: 'good',
            processed_by: 'Admin User'
        },
        token
    );

    // Test 2: Get Returns
    await testAPI('GET RETURNS', '/api/returns', 'GET', null, token);

    // Test 3: Report Damage
    await testAPI(
        'REPORT DAMAGE',
        '/api/damage-recovery/damage',
        'POST',
        {
            product_type: CONFIG.PRODUCT_NAME,
            barcode: 'HH_BEDDING_DAMAGE_001',
            warehouse: CONFIG.WAREHOUSE,
            quantity: 1,
            inventory_location: 'A1-B2-C3',
            damage_reason: 'Torn fabric during shipping',
            notes: 'Visible tear on corner of bedding'
        },
        token
    );

    // Test 4: Recover Stock
    await testAPI(
        'RECOVER STOCK',
        '/api/damage-recovery/recover',
        'POST',
        {
            product_type: CONFIG.PRODUCT_NAME,
            barcode: 'HH_BEDDING_RECOVERY_001',
            warehouse: CONFIG.WAREHOUSE,
            quantity: 2,
            inventory_location: 'A1-B2-C4',
            recovery_notes: 'Found misplaced bedding items, recovered to inventory'
        },
        token
    );

    // Test 5: Get Damage Log
    await testAPI('GET DAMAGE LOG', '/api/damage-recovery/log', 'GET', null, token);

    // Test 6: Get Warehouses
    await testAPI('GET WAREHOUSES', '/api/returns/warehouses', 'GET', null, token);

    // Test 7: Get Returns with Warehouse Filter
    await testAPI(
        'GET RETURNS - FILTERED',
        `/api/returns?warehouse=${CONFIG.WAREHOUSE}&limit=5`,
        'GET',
        null,
        token
    );

    // Test 8: Bulk Returns
    await testAPI(
        'BULK RETURNS',
        '/api/returns/bulk',
        'POST',
        {
            returns: [
                {
                    order_ref: 'BULK_HH_001',
                    awb: 'BULK_AWB_001',
                    product_type: CONFIG.PRODUCT_NAME,
                    warehouse: CONFIG.WAREHOUSE,
                    quantity: 1,
                    barcode: 'HH_BULK_001',
                    condition: 'good'
                },
                {
                    order_ref: 'BULK_HH_002',
                    awb: 'BULK_AWB_002',
                    product_type: CONFIG.PRODUCT_NAME,
                    warehouse: CONFIG.WAREHOUSE,
                    quantity: 1,
                    barcode: 'HH_BULK_002',
                    condition: 'damaged'
                }
            ]
        },
        token
    );

    log('\n✅ ALL TESTS COMPLETED!', 'GREEN');
    log('📄 Check server logs for audit trail entries', 'CYAN');
}

// Show environment info
log('🔍 ENVIRONMENT INFO:', 'BOLD');
log(`NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`, 'BLUE');
log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`, 'BLUE');
log('');

runTests().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});