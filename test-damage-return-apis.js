/**
 * COMPREHENSIVE DAMAGE & RETURN API TEST SCRIPT
 * Tests both damage recovery and return APIs with JWT authentication
 * Endpoint: https://54.169.31.95:8443
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
    API_BASE: 'https://54.169.31.95:8443',
    TEST_USER: {
        email: 'shorya.singh@hunyhuny.com',
        password: 'admin123'
    },
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

class DamageReturnAPITester {
    constructor() {
        this.token = null;
        this.testResults = [];
        this.createdReturnIds = [];
        this.createdDamageIds = [];
        this.createdRecoveryIds = [];
    }

    /**
     * Colored console logging
     */
    log(message, color = 'RESET') {
        console.log(`${CONFIG.COLORS[color]}${message}${CONFIG.COLORS.RESET}`);
    }

    /**
     * Make HTTPS request with SSL bypass for self-signed certificates
     */
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
                // Bypass SSL certificate validation for testing
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

    /**
     * Record test result
     */
    recordTest(testName, passed, message, response = null) {
        const result = {
            test: testName,
            passed,
            message,
            timestamp: new Date().toISOString()
        };

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

    /**
     * Login to get JWT token
     */
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

    /**
     * Test damage reporting API
     */
    async testDamageReporting() {
        this.log('\n💥 Testing Damage Reporting API...', 'BOLD');

        // Test valid damage report
        const validDamageData = {
            product_type: 'Test Product for Damage',
            barcode: 'DAMAGE_TEST_001',
            warehouse: 'GGM_WH',
            quantity: 2,
            inventory_location: 'A1-B2-C3',
            damage_reason: 'Product damaged during handling',
            notes: 'Visible scratches on surface'
        };

        try {
            const response = await this.makeRequest('/api/damage-recovery/damage', {
                method: 'POST',
                body: validDamageData
            });

            if (response.statusCode === 201 && response.data.success) {
                this.createdDamageIds.push(response.data.damage_id);
                this.recordTest('Damage Report - Valid Data', true, 
                    `Damage reported with ID: ${response.data.damage_id}`);
            } else {
                this.recordTest('Damage Report - Valid Data', false, 
                    'Failed to report damage', response);
            }
        } catch (error) {
            this.recordTest('Damage Report - Valid Data', false, 
                `Error: ${error.message}`);
        }

        // Test validation - missing required fields
        const invalidDamageData = {
            product_type: 'Test Product',
            // Missing required fields: barcode, warehouse, quantity
        };

        try {
            const response = await this.makeRequest('/api/damage-recovery/damage', {
                method: 'POST',
                body: invalidDamageData
            });

            if (response.statusCode === 400) {
                this.recordTest('Damage Report - Validation', true, 
                    'Correctly rejected invalid data');
            } else {
                this.recordTest('Damage Report - Validation', false, 
                    'Should have rejected invalid data', response);
            }
        } catch (error) {
            this.recordTest('Damage Report - Validation', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test stock recovery API
     */
    async testStockRecovery() {
        this.log('\n🔄 Testing Stock Recovery API...', 'BOLD');

        // Test valid stock recovery
        const validRecoveryData = {
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
                body: validRecoveryData
            });

            if (response.statusCode === 201 && response.data.success) {
                this.createdRecoveryIds.push(response.data.recovery_id);
                this.recordTest('Stock Recovery - Valid Data', true, 
                    `Stock recovered with ID: ${response.data.recovery_id}`);
            } else {
                this.recordTest('Stock Recovery - Valid Data', false, 
                    'Failed to recover stock', response);
            }
        } catch (error) {
            this.recordTest('Stock Recovery - Valid Data', false, 
                `Error: ${error.message}`);
        }

        // Test validation - missing required fields
        const invalidRecoveryData = {
            product_type: 'Test Product',
            // Missing required fields
        };

        try {
            const response = await this.makeRequest('/api/damage-recovery/recover', {
                method: 'POST',
                body: invalidRecoveryData
            });

            if (response.statusCode === 400) {
                this.recordTest('Stock Recovery - Validation', true, 
                    'Correctly rejected invalid data');
            } else {
                this.recordTest('Stock Recovery - Validation', false, 
                    'Should have rejected invalid data', response);
            }
        } catch (error) {
            this.recordTest('Stock Recovery - Validation', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test return creation API
     */
    async testReturnCreation() {
        this.log('\n📦 Testing Return Creation API...', 'BOLD');

        // Test valid return creation
        const validReturnData = {
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
                body: validReturnData
            });

            if (response.statusCode === 201 && response.data.success) {
                this.createdReturnIds.push(response.data.return_id);
                this.recordTest('Return Creation - Valid Data', true, 
                    `Return created with ID: ${response.data.return_id}`);
            } else {
                this.recordTest('Return Creation - Valid Data', false, 
                    'Failed to create return', response);
            }
        } catch (error) {
            this.recordTest('Return Creation - Valid Data', false, 
                `Error: ${error.message}`);
        }

        // Test damaged condition return
        const damagedReturnData = {
            ...validReturnData,
            order_ref: 'TEST_ORDER_002',
            awb: 'AWB987654321',
            barcode: 'RETURN_TEST_002',
            condition: 'damaged',
            return_reason: 'Product arrived damaged'
        };

        try {
            const response = await this.makeRequest('/api/returns', {
                method: 'POST',
                body: damagedReturnData
            });

            if (response.statusCode === 201 && response.data.success) {
                this.createdReturnIds.push(response.data.return_id);
                this.recordTest('Return Creation - Damaged Condition', true, 
                    `Damaged return created: ${response.data.return_id}`);
            } else {
                this.recordTest('Return Creation - Damaged Condition', false, 
                    'Failed to create damaged return', response);
            }
        } catch (error) {
            this.recordTest('Return Creation - Damaged Condition', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test getting damage recovery log
     */
    async testDamageRecoveryLog() {
        this.log('\n📋 Testing Damage Recovery Log API...', 'BOLD');

        try {
            const response = await this.makeRequest('/api/damage-recovery/log');

            if (response.statusCode === 200 && response.data.success) {
                this.recordTest('Damage Recovery Log', true, 
                    `Retrieved ${response.data.data.length} log entries`);
            } else {
                this.recordTest('Damage Recovery Log', false, 
                    'Failed to get damage recovery log', response);
            }
        } catch (error) {
            this.recordTest('Damage Recovery Log', false, 
                `Error: ${error.message}`);
        }

        // Test with warehouse filter
        try {
            const response = await this.makeRequest('/api/damage-recovery/log?warehouse=GGM_WH');

            if (response.statusCode === 200 && response.data.success) {
                this.recordTest('Damage Recovery Log - Warehouse Filter', true, 
                    `Retrieved ${response.data.data.length} entries for GGM_WH`);
            } else {
                this.recordTest('Damage Recovery Log - Warehouse Filter', false, 
                    'Failed to get filtered log', response);
            }
        } catch (error) {
            this.recordTest('Damage Recovery Log - Warehouse Filter', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test getting returns with filters
     */
    async testGetReturns() {
        this.log('\n📋 Testing Get Returns API...', 'BOLD');

        try {
            const response = await this.makeRequest('/api/returns');

            if (response.statusCode === 200 && response.data.success) {
                this.recordTest('Get Returns', true, 
                    `Retrieved ${response.data.data.length} returns`);
            } else {
                this.recordTest('Get Returns', false, 
                    'Failed to get returns', response);
            }
        } catch (error) {
            this.recordTest('Get Returns', false, 
                `Error: ${error.message}`);
        }

        // Test with warehouse filter
        try {
            const response = await this.makeRequest('/api/returns?warehouse=GGM_WH');

            if (response.statusCode === 200 && response.data.success) {
                this.recordTest('Get Returns - Warehouse Filter', true, 
                    `Retrieved ${response.data.data.length} returns for GGM_WH`);
            } else {
                this.recordTest('Get Returns - Warehouse Filter', false, 
                    'Failed to get filtered returns', response);
            }
        } catch (error) {
            this.recordTest('Get Returns - Warehouse Filter', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test product suggestions
     */
    async testProductSuggestions() {
        this.log('\n🔎 Testing Product Suggestions...', 'BOLD');

        // Test damage recovery product search
        try {
            const response = await this.makeRequest('/api/damage-recovery/search-products?search=test');

            if (response.statusCode === 200) {
                this.recordTest('Damage Recovery - Product Search', true, 
                    `Retrieved ${Array.isArray(response.data) ? response.data.length : 0} product suggestions`);
            } else {
                this.recordTest('Damage Recovery - Product Search', false, 
                    'Failed to get product suggestions', response);
            }
        } catch (error) {
            this.recordTest('Damage Recovery - Product Search', false, 
                `Error: ${error.message}`);
        }

        // Test returns product suggestions
        try {
            const response = await this.makeRequest('/api/returns/suggestions/products?search=test');

            if (response.statusCode === 200) {
                this.recordTest('Returns - Product Suggestions', true, 
                    `Retrieved ${Array.isArray(response.data) ? response.data.length : 0} product suggestions`);
            } else {
                this.recordTest('Returns - Product Suggestions', false, 
                    'Failed to get product suggestions', response);
            }
        } catch (error) {
            this.recordTest('Returns - Product Suggestions', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test warehouse endpoints
     */
    async testWarehouseEndpoints() {
        this.log('\n🏢 Testing Warehouse Endpoints...', 'BOLD');

        // Test damage recovery warehouses
        try {
            const response = await this.makeRequest('/api/damage-recovery/warehouses');

            if (response.statusCode === 200) {
                this.recordTest('Damage Recovery - Warehouses', true, 
                    `Retrieved ${Array.isArray(response.data) ? response.data.length : 0} warehouses`);
            } else {
                this.recordTest('Damage Recovery - Warehouses', false, 
                    'Failed to get warehouses', response);
            }
        } catch (error) {
            this.recordTest('Damage Recovery - Warehouses', false, 
                `Error: ${error.message}`);
        }

        // Test returns warehouses
        try {
            const response = await this.makeRequest('/api/returns/warehouses');

            if (response.statusCode === 200) {
                this.recordTest('Returns - Warehouses', true, 
                    `Retrieved ${Array.isArray(response.data) ? response.data.length : 0} warehouses`);
            } else {
                this.recordTest('Returns - Warehouses', false, 
                    'Failed to get warehouses', response);
            }
        } catch (error) {
            this.recordTest('Returns - Warehouses', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test authentication requirements
     */
    async testAuthenticationRequired() {
        this.log('\n🔒 Testing Authentication Requirements...', 'BOLD');

        const originalToken = this.token;
        this.token = null; // Remove token

        try {
            const response = await this.makeRequest('/api/returns');

            if (response.statusCode === 401) {
                this.recordTest('Authentication Required - Returns', true, 
                    'Correctly requires authentication');
            } else {
                this.recordTest('Authentication Required - Returns', false, 
                    'Should require authentication', response);
            }
        } catch (error) {
            this.recordTest('Authentication Required - Returns', false, 
                `Error: ${error.message}`);
        }

        try {
            const response = await this.makeRequest('/api/damage-recovery/damage', {
                method: 'POST',
                body: { test: 'data' }
            });

            if (response.statusCode === 401) {
                this.recordTest('Authentication Required - Damage', true, 
                    'Correctly requires authentication');
            } else {
                this.recordTest('Authentication Required - Damage', false, 
                    'Should require authentication', response);
            }
        } catch (error) {
            this.recordTest('Authentication Required - Damage', false, 
                `Error: ${error.message}`);
        }

        this.token = originalToken; // Restore token
    }

    /**
     * Generate test report
     */
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

        if (this.createdReturnIds.length > 0) {
            this.log(`📦 Created Returns: ${this.createdReturnIds.join(', ')}`, 'CYAN');
        }
        if (this.createdDamageIds.length > 0) {
            this.log(`💥 Created Damage Reports: ${this.createdDamageIds.join(', ')}`, 'CYAN');
        }
        if (this.createdRecoveryIds.length > 0) {
            this.log(`🔄 Created Recoveries: ${this.createdRecoveryIds.join(', ')}`, 'CYAN');
        }

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

        // Save detailed report to file
        const reportData = {
            summary: {
                endpoint: CONFIG.API_BASE,
                testUser: CONFIG.TEST_USER.email,
                totalTests,
                passedTests,
                failedTests,
                successRate: `${successRate}%`,
                timestamp: new Date().toISOString(),
                createdItems: {
                    returns: this.createdReturnIds,
                    damages: this.createdDamageIds,
                    recoveries: this.createdRecoveryIds
                }
            },
            tests: this.testResults
        };

        require('fs').writeFileSync(
            'damage-return-api-test-report.json', 
            JSON.stringify(reportData, null, 2)
        );

        this.log(`\n📄 Detailed report saved to: damage-return-api-test-report.json`, 'CYAN');
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        this.log('🚀 STARTING DAMAGE & RETURN API TESTS', 'BOLD');
        this.log(`🌐 API Endpoint: ${CONFIG.API_BASE}`, 'CYAN');
        this.log(`👤 Test User: ${CONFIG.TEST_USER.email}`, 'CYAN');
        this.log('='.repeat(60), 'CYAN');

        // Login first
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            this.log('❌ Cannot proceed without authentication', 'RED');
            this.generateReport();
            return;
        }

        // Run all tests
        await this.testDamageReporting();
        await this.testStockRecovery();
        await this.testReturnCreation();
        await this.testDamageRecoveryLog();
        await this.testGetReturns();
        await this.testProductSuggestions();
        await this.testWarehouseEndpoints();
        await this.testAuthenticationRequired();

        // Generate final report
        this.generateReport();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new DamageReturnAPITester();
    tester.runAllTests().catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = DamageReturnAPITester;