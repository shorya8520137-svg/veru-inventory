/**
 * FRESH DAMAGE & RETURN API TEST SCRIPT
 * Tests both damage recovery and return APIs with JWT authentication
 * Endpoint: https://54.169.31.95:8443
 * Credentials: admin@company.com / Admin@123
 */

const https = require('https');

// Configuration
const CONFIG = {
    API_BASE: 'https://54.169.31.95:8443',
    TEST_USER: {
        email: 'admin@company.com',
        password: 'Admin@123'
    },
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

class APITester {
    constructor() {
        this.token = null;
        this.testResults = [];
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

            if (this.token) {
                requestOptions.headers['Authorization'] = `Bearer ${this.token}`;
            }

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

    recordTest(testName, passed, message, response = null) {
        const result = { test: testName, passed, message, timestamp: new Date().toISOString() };
        if (response) {
            result.statusCode = response.statusCode;
            result.responseData = response.data;
        }
        this.testResults.push(result);
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const color = passed ? 'GREEN' : 'RED';
        this.log(`${status} - ${testName}: ${message}`, color);
        
        if (response && !passed) {
            this.log(`   Status: ${response.statusCode}`, 'YELLOW');
            this.log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'YELLOW');
        }
    }

    async login() {
        this.log('\n🔐 Testing Authentication...', 'BOLD');
        
        try {
            const response = await this.makeRequest('/api/auth/login', {
                method: 'POST',
                body: CONFIG.TEST_USER
            });

            if (response.statusCode === 200 && response.data.success && response.data.token) {
                this.token = response.data.token;
                this.recordTest('Authentication', true, 'Login successful');
                this.log(`🎫 JWT Token: ${this.token.substring(0, 50)}...`, 'CYAN');
                return true;
            } else {
                this.recordTest('Authentication', false, 'Login failed', response);
                return false;
            }
        } catch (error) {
            this.recordTest('Authentication', false, `Login error: ${error.message}`);
            return false;
        }
    }

    async testDamageAPI() {
        this.log('\n💥 Testing Damage API...', 'BOLD');

        const damageData = {
            product_type: 'Test Product for Damage',
            barcode: 'DAMAGE_TEST_001',
            warehouse: 'GGM_WH',
            quantity: 2,
            inventory_location: 'A1-B2-C3',
            damage_reason: 'Product damaged during handling',
            notes: 'Test damage report'
        };

        try {
            const response = await this.makeRequest('/api/damage-recovery/damage', {
                method: 'POST',
                body: damageData
            });

            if (response.statusCode === 201 && response.data.success) {
                this.recordTest('Damage Report', true, 
                    `Damage reported with ID: ${response.data.damage_id}`);
            } else {
                this.recordTest('Damage Report', false, 
                    'Failed to report damage', response);
            }
        } catch (error) {
            this.recordTest('Damage Report', false, `Error: ${error.message}`);
        }
    }

    async testReturnAPI() {
        this.log('\n📦 Testing Return API...', 'BOLD');

        const returnData = {
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
        };

        try {
            const response = await this.makeRequest('/api/returns', {
                method: 'POST',
                body: returnData
            });

            if (response.statusCode === 201 && response.data.success) {
                this.recordTest('Return Creation', true, 
                    `Return created with ID: ${response.data.return_id}`);
            } else {
                this.recordTest('Return Creation', false, 
                    'Failed to create return', response);
            }
        } catch (error) {
            this.recordTest('Return Creation', false, `Error: ${error.message}`);
        }
    }

    async testRecoveryAPI() {
        this.log('\n🔄 Testing Recovery API...', 'BOLD');

        const recoveryData = {
            product_type: 'Test Product for Recovery',
            barcode: 'RECOVERY_TEST_001',
            warehouse: 'GGM_WH',
            quantity: 1,
            inventory_location: 'A1-B2-C4',
            recovery_notes: 'Stock recovered after inspection'
        };

        try {
            const response = await this.makeRequest('/api/damage-recovery/recover', {
                method: 'POST',
                body: recoveryData
            });

            if (response.statusCode === 201 && response.data.success) {
                this.recordTest('Stock Recovery', true, 
                    `Stock recovered with ID: ${response.data.recovery_id}`);
            } else {
                this.recordTest('Stock Recovery', false, 
                    'Failed to recover stock', response);
            }
        } catch (error) {
            this.recordTest('Stock Recovery', false, `Error: ${error.message}`);
        }
    }

    generateReport() {
        this.log('\n📊 TEST REPORT', 'BOLD');
        this.log('='.repeat(60), 'CYAN');

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        this.log(`🎯 API Endpoint: ${CONFIG.API_BASE}`, 'BLUE');
        this.log(`👤 Test User: ${CONFIG.TEST_USER.email}`, 'BLUE');
        this.log(`📊 Total Tests: ${totalTests}`, 'BLUE');
        this.log(`✅ Passed: ${passedTests}`, 'GREEN');
        this.log(`❌ Failed: ${failedTests}`, failedTests > 0 ? 'RED' : 'GREEN');
        this.log(`📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'GREEN' : 'RED');

        if (failedTests > 0) {
            this.log('\n❌ FAILED TESTS:', 'RED');
            this.testResults
                .filter(r => !r.passed)
                .forEach(test => {
                    this.log(`  • ${test.test}: ${test.message}`, 'RED');
                });
        }

        this.log('\n✅ PASSED TESTS:', 'GREEN');
        this.testResults
            .filter(r => r.passed)
            .forEach(test => {
                this.log(`  • ${test.test}: ${test.message}`, 'GREEN');
            });
    }

    async runAllTests() {
        this.log('🚀 STARTING DAMAGE & RETURN API TESTS', 'BOLD');
        this.log(`🌐 API Endpoint: ${CONFIG.API_BASE}`, 'CYAN');
        this.log(`👤 Test User: ${CONFIG.TEST_USER.email}`, 'CYAN');
        this.log('='.repeat(60), 'CYAN');

        const loginSuccess = await this.login();
        if (!loginSuccess) {
            this.log('❌ Cannot proceed without authentication', 'RED');
            this.generateReport();
            return;
        }

        await this.testDamageAPI();
        await this.testReturnAPI();
        await this.testRecoveryAPI();

        this.generateReport();
    }
}

// Run tests
const tester = new APITester();
tester.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});