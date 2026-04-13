/**
 * API TESTER WITH JWT TOKEN
 * Test return, damage, and recovery APIs with a provided JWT token
 * Usage: node test-with-token.js [JWT_TOKEN]
 */

const https = require('https');

// Get JWT token from command line argument
const JWT_TOKEN = process.argv[2];

const CONFIG = {
    API_BASE: 'https://54.169.31.95:8443',
    COLORS: {
        GREEN: '\x1b[32m',
        RED: '\x1b[31m',
        YELLOW: '\x1b[33m',
        BLUE: '\x1b[34m',
        CYAN: '\x1b[36m',
        MAGENTA: '\x1b[35m',
        RESET: '\x1b[0m',
        BOLD: '\x1b[1m'
    }
};

class AuthenticatedAPITester {
    constructor(token) {
        this.token = token;
        this.responses = [];
    }

    log(message, color = 'RESET') {
        console.log(`${CONFIG.COLORS[color]}${message}${CONFIG.COLORS.RESET}`);
    }

    async makeRequest(endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(`${CONFIG.API_BASE}${endpoint}`);
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || 8443,
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
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
                            headers: res.headers,
                            data: jsonData
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
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

    async testEndpoint(name, endpoint, method = 'GET', body = null) {
        this.log(`\n🔍 Testing ${name}`, 'BOLD');
        this.log(`📡 ${method} ${endpoint}`, 'CYAN');
        
        if (body) {
            this.log(`📤 Request Body:`, 'YELLOW');
            this.log(JSON.stringify(body, null, 2), 'YELLOW');
        }

        try {
            const response = await this.makeRequest(endpoint, {
                method,
                body
            });

            const statusColor = response.statusCode >= 200 && response.statusCode < 300 ? 'GREEN' :
                               response.statusCode >= 400 && response.statusCode < 500 ? 'YELLOW' :
                               'RED';

            this.log(`📥 Response Status: ${response.statusCode}`, statusColor);
            this.log(`📥 Response Body:`, statusColor);
            this.log(JSON.stringify(response.data, null, 2), statusColor);

            this.responses.push({
                name,
                endpoint,
                method,
                requestBody: body,
                statusCode: response.statusCode,
                responseBody: response.data
            });

            return response;

        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'RED');
            this.responses.push({
                name,
                endpoint,
                method,
                requestBody: body,
                error: error.message
            });
            return null;
        }
    }

    async runTests() {
        if (!this.token) {
            this.log('❌ No JWT token provided!', 'RED');
            this.log('Usage: node test-with-token.js [JWT_TOKEN]', 'YELLOW');
            this.log('Example: node test-with-token.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 'YELLOW');
            return;
        }

        this.log('🚀 TESTING AUTHENTICATED API ENDPOINTS', 'BOLD');
        this.log(`🌐 API Endpoint: ${CONFIG.API_BASE}`, 'CYAN');
        this.log(`🔐 JWT Token: ${this.token.substring(0, 50)}...`, 'CYAN');
        this.log('='.repeat(70), 'CYAN');

        // Test 1: Return API - Create Return
        this.log('\n📦 RETURN API TESTS', 'MAGENTA');
        await this.testEndpoint(
            'Return API - Create Return',
            '/api/returns',
            'POST',
            {
                order_ref: 'TEST_ORDER_001',
                awb: 'AWB123456789',
                product_type: 'Test Product Return',
                warehouse: 'GGM_WH',
                quantity: 1,
                barcode: 'RETURN_TEST_001',
                has_parts: false,
                return_reason: 'Customer return - defective',
                condition: 'good',
                processed_by: 'Test User'
            }
        );

        // Test 2: Return API - Get Returns
        await this.testEndpoint(
            'Return API - Get Returns',
            '/api/returns'
        );

        // Test 3: Return API - Get Warehouses
        await this.testEndpoint(
            'Return API - Get Warehouses',
            '/api/returns/warehouses'
        );

        // Test 4: Damage API Tests
        this.log('\n💥 DAMAGE API TESTS', 'MAGENTA');
        await this.testEndpoint(
            'Damage API - Report Damage',
            '/api/damage-recovery/damage',
            'POST',
            {
                product_type: 'Test Product for Damage',
                barcode: 'DAMAGE_TEST_001',
                warehouse: 'GGM_WH',
                quantity: 2,
                inventory_location: 'A1-B2-C3',
                damage_reason: 'Product damaged during handling',
                notes: 'Test damage report'
            }
        );

        // Test 5: Recovery API Tests
        this.log('\n🔄 RECOVERY API TESTS', 'MAGENTA');
        await this.testEndpoint(
            'Recovery API - Recover Stock',
            '/api/damage-recovery/recover',
            'POST',
            {
                product_type: 'Test Product for Recovery',
                barcode: 'RECOVERY_TEST_001',
                warehouse: 'GGM_WH',
                quantity: 1,
                inventory_location: 'A1-B2-C4',
                recovery_notes: 'Stock recovered after inspection'
            }
        );

        // Test 6: Get Damage Recovery Log
        await this.testEndpoint(
            'Damage Recovery - Get Log',
            '/api/damage-recovery/log'
        );

        // Test 7: Get Warehouses
        await this.testEndpoint(
            'Damage API - Get Warehouses',
            '/api/damage-recovery/warehouses'
        );

        this.generateSummary();
    }

    generateSummary() {
        this.log('\n📊 AUTHENTICATED API TEST SUMMARY', 'BOLD');
        this.log('='.repeat(70), 'CYAN');

        const successful = this.responses.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
        const authErrors = this.responses.filter(r => r.statusCode === 401).length;
        const permissionErrors = this.responses.filter(r => r.statusCode === 403).length;
        const clientErrors = this.responses.filter(r => r.statusCode >= 400 && r.statusCode < 500).length;
        const serverErrors = this.responses.filter(r => r.statusCode >= 500).length;

        this.log(`📊 Total Endpoints Tested: ${this.responses.length}`, 'BLUE');
        this.log(`✅ Successful (2xx): ${successful}`, 'GREEN');
        this.log(`🔐 Auth Errors (401): ${authErrors}`, 'YELLOW');
        this.log(`🚫 Permission Errors (403): ${permissionErrors}`, 'YELLOW');
        this.log(`❌ Client Errors (4xx): ${clientErrors}`, 'RED');
        this.log(`💥 Server Errors (5xx): ${serverErrors}`, 'RED');

        this.log('\n📋 Detailed Results:', 'BOLD');
        this.responses.forEach(response => {
            const statusColor = response.statusCode >= 200 && response.statusCode < 300 ? 'GREEN' :
                               response.statusCode === 401 ? 'YELLOW' :
                               response.statusCode === 403 ? 'YELLOW' :
                               response.statusCode >= 400 ? 'RED' : 'BLUE';
            
            this.log(`  ${response.name}: ${response.statusCode || 'ERROR'}`, statusColor);
            
            // Show key response details
            if (response.responseBody && response.responseBody.success === true) {
                if (response.responseBody.return_id) {
                    this.log(`    ✅ Return ID: ${response.responseBody.return_id}`, 'GREEN');
                }
                if (response.responseBody.damage_id) {
                    this.log(`    ✅ Damage ID: ${response.responseBody.damage_id}`, 'GREEN');
                }
                if (response.responseBody.recovery_id) {
                    this.log(`    ✅ Recovery ID: ${response.responseBody.recovery_id}`, 'GREEN');
                }
                if (response.responseBody.data && Array.isArray(response.responseBody.data)) {
                    this.log(`    ✅ Records: ${response.responseBody.data.length}`, 'GREEN');
                }
            } else if (response.responseBody && response.responseBody.message) {
                this.log(`    ❌ Error: ${response.responseBody.message}`, 'RED');
            }
        });

        // Save detailed responses
        require('fs').writeFileSync(
            'authenticated-api-responses.json',
            JSON.stringify(this.responses, null, 2)
        );

        this.log(`\n📄 Detailed responses saved to: authenticated-api-responses.json`, 'CYAN');
        
        this.log('\n🎯 Key Findings:', 'BOLD');
        if (successful > 0) {
            this.log(`  ✅ ${successful} endpoints working correctly`, 'GREEN');
        }
        if (serverErrors > 0) {
            this.log(`  💥 ${serverErrors} endpoints have server errors (check audit logging)`, 'RED');
        }
        if (permissionErrors > 0) {
            this.log(`  🚫 ${permissionErrors} endpoints have permission issues`, 'YELLOW');
        }
        if (authErrors > 0) {
            this.log(`  🔐 ${authErrors} endpoints have authentication issues`, 'YELLOW');
        }
    }
}

// Run tests
if (!JWT_TOKEN) {
    console.log('❌ Please provide a JWT token as an argument');
    console.log('Usage: node test-with-token.js [JWT_TOKEN]');
    console.log('\n💡 To get a JWT token:');
    console.log('1. Run: node test-with-2fa.js');
    console.log('2. Enter your 2FA code when prompted');
    console.log('3. Copy the JWT token from the output');
    console.log('4. Run: node test-with-token.js [COPIED_TOKEN]');
    process.exit(1);
}

const tester = new AuthenticatedAPITester(JWT_TOKEN);
tester.runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});