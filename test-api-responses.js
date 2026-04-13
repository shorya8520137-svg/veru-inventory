/**
 * API RESPONSE TESTER
 * Tests API endpoints to show response structures
 * Shows what responses look like for return, damage, and recovery APIs
 */

const https = require('https');

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

class APIResponseTester {
    constructor() {
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

            this.log(`📥 Response Status: ${response.statusCode}`, 'BLUE');
            this.log(`📥 Response Body:`, 'GREEN');
            this.log(JSON.stringify(response.data, null, 2), 'GREEN');

            this.responses.push({
                name,
                endpoint,
                method,
                requestBody: body,
                statusCode: response.statusCode,
                responseBody: response.data
            });

        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'RED');
            this.responses.push({
                name,
                endpoint,
                method,
                requestBody: body,
                error: error.message
            });
        }
    }

    async runTests() {
        this.log('🚀 TESTING API RESPONSE STRUCTURES', 'BOLD');
        this.log(`🌐 API Endpoint: ${CONFIG.API_BASE}`, 'CYAN');
        this.log('='.repeat(70), 'CYAN');

        // Test 1: Return API - Create Return
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

        // Test 3: Damage API - Report Damage
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

        // Test 4: Recovery API - Recover Stock
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

        // Test 5: Damage Recovery Log
        await this.testEndpoint(
            'Damage Recovery - Get Log',
            '/api/damage-recovery/log'
        );

        // Test 6: Return API - Get Warehouses
        await this.testEndpoint(
            'Return API - Get Warehouses',
            '/api/returns/warehouses'
        );

        // Test 7: Damage API - Get Warehouses
        await this.testEndpoint(
            'Damage API - Get Warehouses',
            '/api/damage-recovery/warehouses'
        );

        // Test 8: Return API - Product Suggestions
        await this.testEndpoint(
            'Return API - Product Suggestions',
            '/api/returns/suggestions/products?search=test'
        );

        // Test 9: Damage API - Search Products
        await this.testEndpoint(
            'Damage API - Search Products',
            '/api/damage-recovery/search-products?search=test'
        );

        // Test 10: Return API - Bulk Returns
        await this.testEndpoint(
            'Return API - Bulk Returns',
            '/api/returns/bulk',
            'POST',
            {
                returns: [
                    {
                        order_ref: 'BULK_001',
                        awb: 'BULK_AWB_001',
                        product_type: 'Bulk Product 1',
                        warehouse: 'GGM_WH',
                        quantity: 1,
                        barcode: 'BULK_BARCODE_001',
                        condition: 'good'
                    }
                ]
            }
        );

        this.generateSummary();
    }

    generateSummary() {
        this.log('\n📊 API RESPONSE SUMMARY', 'BOLD');
        this.log('='.repeat(70), 'CYAN');

        const authRequired = this.responses.filter(r => r.statusCode === 401).length;
        const successful = this.responses.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
        const clientErrors = this.responses.filter(r => r.statusCode >= 400 && r.statusCode < 500).length;
        const serverErrors = this.responses.filter(r => r.statusCode >= 500).length;

        this.log(`📊 Total Endpoints Tested: ${this.responses.length}`, 'BLUE');
        this.log(`✅ Successful (2xx): ${successful}`, 'GREEN');
        this.log(`🔐 Auth Required (401): ${authRequired}`, 'YELLOW');
        this.log(`❌ Client Errors (4xx): ${clientErrors}`, 'RED');
        this.log(`💥 Server Errors (5xx): ${serverErrors}`, 'RED');

        this.log('\n📋 Response Status Breakdown:', 'BOLD');
        this.responses.forEach(response => {
            const statusColor = response.statusCode >= 200 && response.statusCode < 300 ? 'GREEN' :
                               response.statusCode === 401 ? 'YELLOW' :
                               response.statusCode >= 400 ? 'RED' : 'BLUE';
            
            this.log(`  ${response.name}: ${response.statusCode || 'ERROR'}`, statusColor);
        });

        // Save detailed responses to file
        require('fs').writeFileSync(
            'api-responses-detailed.json',
            JSON.stringify(this.responses, null, 2)
        );

        this.log(`\n📄 Detailed responses saved to: api-responses-detailed.json`, 'CYAN');
        
        this.log('\n🎯 Key Findings:', 'BOLD');
        if (authRequired > 0) {
            this.log(`  • ${authRequired} endpoints require authentication (JWT token)`, 'YELLOW');
        }
        if (successful > 0) {
            this.log(`  • ${successful} endpoints are accessible without auth`, 'GREEN');
        }
        if (serverErrors > 0) {
            this.log(`  • ${serverErrors} endpoints have server errors (check audit logging fixes)`, 'RED');
        }
        
        this.log('\n💡 Next Steps:', 'BOLD');
        this.log('  1. Use 2FA authentication to get JWT token', 'CYAN');
        this.log('  2. Re-run tests with valid JWT token', 'CYAN');
        this.log('  3. Check server logs for any audit logging errors', 'CYAN');
    }
}

// Run tests
const tester = new APIResponseTester();
tester.runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});