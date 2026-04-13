/**
 * RETURN API TEST SCRIPT
 * Comprehensive testing for all return API endpoints
 * Tests authentication, CRUD operations, validation, and error handling
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
    API_BASE: process.env.API_BASE || 'http://localhost:3001',
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

class ReturnAPITester {
    constructor() {
        this.token = null;
        this.testResults = [];
        this.createdReturnIds = [];
    }

    /**
     * Colored console logging
     */
    log(message, color = 'RESET') {
        console.log(`${CONFIG.COLORS[color]}${message}${CONFIG.COLORS.RESET}`);
    }

    /**
     * Make HTTP request
     */
    async makeRequest(endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(`${CONFIG.API_BASE}${endpoint}`);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;

            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            if (this.token) {
                requestOptions.headers['Authorization'] = `Bearer ${this.token}`;
            }

            const req = client.request(requestOptions, (res) => {
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
     * Login to get authentication token
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
     * Test creating a new return
     */
    async testCreateReturn() {
        this.log('\n📦 Testing Create Return...', 'BOLD');

        // Test valid return creation
        const validReturnData = {
            order_ref: 'TEST_ORDER_001',
            awb: 'AWB123456789',
            product_type: 'Test Product',
            warehouse: 'WH001',
            quantity: 2,
            barcode: 'TEST_BARCODE_001',
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
                this.recordTest('Create Return - Valid Data', true, 
                    `Return created with ID: ${response.data.return_id}`);
            } else {
                this.recordTest('Create Return - Valid Data', false, 
                    'Failed to create return', response);
            }
        } catch (error) {
            this.recordTest('Create Return - Valid Data', false, 
                `Error: ${error.message}`);
        }

        // Test validation - missing required fields
        const invalidReturnData = {
            order_ref: 'TEST_ORDER_002',
            awb: 'AWB987654321'
            // Missing required fields: product_type, warehouse, barcode
        };

        try {
            const response = await this.makeRequest('/api/returns', {
                method: 'POST',
                body: invalidReturnData
            });

            if (response.statusCode === 400) {
                this.recordTest('Create Return - Validation', true, 
                    'Correctly rejected invalid data');
            } else {
                this.recordTest('Create Return - Validation', false, 
                    'Should have rejected invalid data', response);
            }
        } catch (error) {
            this.recordTest('Create Return - Validation', false, 
                `Error: ${error.message}`);
        }

        // Test damaged condition return
        const damagedReturnData = {
            ...validReturnData,
            order_ref: 'TEST_ORDER_003',
            awb: 'AWB111222333',
            barcode: 'TEST_BARCODE_002',
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
                this.recordTest('Create Return - Damaged Condition', true, 
                    `Damaged return created: ${response.data.return_id}`);
            } else {
                this.recordTest('Create Return - Damaged Condition', false, 
                    'Failed to create damaged return', response);
            }
        } catch (error) {
            this.recordTest('Create Return - Damaged Condition', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test getting returns with filters
     */
    async testGetReturns() {
        this.log('\n📋 Testing Get Returns...', 'BOLD');

        // Test get all returns
        try {
            const response = await this.makeRequest('/api/returns');

            if (response.statusCode === 200 && response.data.success) {
                this.recordTest('Get All Returns', true, 
                    `Retrieved ${response.data.data.length} returns`);
            } else {
                this.recordTest('Get All Returns', false, 
                    'Failed to get returns', response);
            }
        } catch (error) {
            this.recordTest('Get All Returns', false, `Error: ${error.message}`);
        }

        // Test with warehouse filter
        try {
            const response = await this.makeRequest('/api/returns?warehouse=WH001');

            if (response.statusCode === 200 && response.data.success) {
                this.recordTest('Get Returns - Warehouse Filter', true, 
                    `Retrieved ${response.data.data.length} returns for WH001`);
            } else {
                this.recordTest('Get Returns - Warehouse Filter', false, 
                    'Failed to get filtered returns', response);
            }
        } catch (error) {
            this.recordTest('Get Returns - Warehouse Filter', false, 
                `Error: ${error.message}`);
        }

        // Test with search filter
        try {
            const response = await this.makeRequest('/api/returns?search=TEST_ORDER');

            if (response.statusCode === 200 && response.data.success) {
                this.recordTest('Get Returns - Search Filter', true, 
                    `Search returned ${response.data.data.length} results`);
            } else {
                this.recordTest('Get Returns - Search Filter', false, 
                    'Failed to search returns', response);
            }
        } catch (error) {
            this.recordTest('Get Returns - Search Filter', false, 
                `Error: ${error.message}`);
        }

        // Test pagination
        try {
            const response = await this.makeRequest('/api/returns?page=1&limit=5');

            if (response.statusCode === 200 && response.data.success && response.data.pagination) {
                this.recordTest('Get Returns - Pagination', true, 
                    `Pagination working: page ${response.data.pagination.page}, limit ${response.data.pagination.limit}`);
            } else {
                this.recordTest('Get Returns - Pagination', false, 
                    'Pagination not working correctly', response);
            }
        } catch (error) {
            this.recordTest('Get Returns - Pagination', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test getting return by ID
     */
    async testGetReturnById() {
        this.log('\n🔍 Testing Get Return By ID...', 'BOLD');

        if (this.createdReturnIds.length === 0) {
            this.recordTest('Get Return By ID', false, 'No return IDs available for testing');
            return;
        }

        const returnId = this.createdReturnIds[0];

        // Test valid ID
        try {
            const response = await this.makeRequest(`/api/returns/${returnId}`);

            if (response.statusCode === 200 && response.data.success) {
                this.recordTest('Get Return By ID - Valid', true, 
                    `Retrieved return ${returnId}`);
            } else {
                this.recordTest('Get Return By ID - Valid', false, 
                    'Failed to get return by ID', response);
            }
        } catch (error) {
            this.recordTest('Get Return By ID - Valid', false, 
                `Error: ${error.message}`);
        }

        // Test invalid ID
        try {
            const response = await this.makeRequest('/api/returns/99999');

            if (response.statusCode === 404) {
                this.recordTest('Get Return By ID - Invalid', true, 
                    'Correctly returned 404 for invalid ID');
            } else {
                this.recordTest('Get Return By ID - Invalid', false, 
                    'Should return 404 for invalid ID', response);
            }
        } catch (error) {
            this.recordTest('Get Return By ID - Invalid', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test product suggestions
     */
    async testProductSuggestions() {
        this.log('\n🔎 Testing Product Suggestions...', 'BOLD');

        // Test with search term
        try {
            const response = await this.makeRequest('/api/returns/suggestions/products?search=test');

            if (response.statusCode === 200) {
                this.recordTest('Product Suggestions - Valid Search', true, 
                    `Retrieved ${Array.isArray(response.data) ? response.data.length : 0} suggestions`);
            } else {
                this.recordTest('Product Suggestions - Valid Search', false, 
                    'Failed to get product suggestions', response);
            }
        } catch (error) {
            this.recordTest('Product Suggestions - Valid Search', false, 
                `Error: ${error.message}`);
        }

        // Test with short search term (should return empty)
        try {
            const response = await this.makeRequest('/api/returns/suggestions/products?search=a');

            if (response.statusCode === 200 && Array.isArray(response.data) && response.data.length === 0) {
                this.recordTest('Product Suggestions - Short Search', true, 
                    'Correctly returned empty array for short search');
            } else {
                this.recordTest('Product Suggestions - Short Search', false, 
                    'Should return empty array for short search', response);
            }
        } catch (error) {
            this.recordTest('Product Suggestions - Short Search', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test bulk return processing
     */
    async testBulkReturns() {
        this.log('\n📦📦 Testing Bulk Returns...', 'BOLD');

        const bulkReturnsData = {
            returns: [
                {
                    order_ref: 'BULK_001',
                    awb: 'BULK_AWB_001',
                    product_type: 'Bulk Product 1',
                    warehouse: 'WH001',
                    quantity: 1,
                    barcode: 'BULK_BARCODE_001',
                    condition: 'good'
                },
                {
                    order_ref: 'BULK_002',
                    awb: 'BULK_AWB_002',
                    product_type: 'Bulk Product 2',
                    warehouse: 'WH001',
                    quantity: 2,
                    barcode: 'BULK_BARCODE_002',
                    condition: 'damaged'
                }
            ]
        };

        try {
            const response = await this.makeRequest('/api/returns/bulk', {
                method: 'POST',
                body: bulkReturnsData
            });

            if (response.statusCode === 200 && response.data.success) {
                this.recordTest('Bulk Returns - Valid Data', true, 
                    `Processed ${bulkReturnsData.returns.length} bulk returns`);
            } else {
                this.recordTest('Bulk Returns - Valid Data', false, 
                    'Failed to process bulk returns', response);
            }
        } catch (error) {
            this.recordTest('Bulk Returns - Valid Data', false, 
                `Error: ${error.message}`);
        }

        // Test bulk returns with invalid data
        const invalidBulkData = {
            returns: [
                {
                    order_ref: 'BULK_003',
                    // Missing required fields
                },
                {
                    order_ref: 'BULK_004',
                    product_type: 'Valid Product',
                    warehouse: 'WH001',
                    barcode: 'VALID_BARCODE'
                }
            ]
        };

        try {
            const response = await this.makeRequest('/api/returns/bulk', {
                method: 'POST',
                body: invalidBulkData
            });

            if (response.statusCode === 400) {
                this.recordTest('Bulk Returns - Invalid Data', true, 
                    'Correctly rejected bulk returns with invalid data');
            } else {
                this.recordTest('Bulk Returns - Invalid Data', false, 
                    'Should reject bulk returns with invalid data', response);
            }
        } catch (error) {
            this.recordTest('Bulk Returns - Invalid Data', false, 
                `Error: ${error.message}`);
        }
    }

    /**
     * Test warehouses endpoint
     */
    async testGetWarehouses() {
        this.log('\n🏢 Testing Get Warehouses...', 'BOLD');

        try {
            const response = await this.makeRequest('/api/returns/warehouses');

            if (response.statusCode === 200 && Array.isArray(response.data)) {
                this.recordTest('Get Warehouses', true, 
                    `Retrieved ${response.data.length} warehouses`);
            } else {
                this.recordTest('Get Warehouses', false, 
                    'Failed to get warehouses', response);
            }
        } catch (error) {
            this.recordTest('Get Warehouses', false, `Error: ${error.message}`);
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
                this.recordTest('Authentication Required', true, 
                    'Correctly requires authentication');
            } else {
                this.recordTest('Authentication Required', false, 
                    'Should require authentication', response);
            }
        } catch (error) {
            this.recordTest('Authentication Required', false, 
                `Error: ${error.message}`);
        }

        this.token = originalToken; // Restore token
    }

    /**
     * Generate test report
     */
    generateReport() {
        this.log('\n📊 TEST REPORT', 'BOLD');
        this.log('='.repeat(50), 'CYAN');

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        this.log(`Total Tests: ${totalTests}`, 'BLUE');
        this.log(`Passed: ${passedTests}`, 'GREEN');
        this.log(`Failed: ${failedTests}`, failedTests > 0 ? 'RED' : 'GREEN');
        this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'GREEN' : 'RED');

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
                totalTests,
                passedTests,
                failedTests,
                successRate: `${successRate}%`,
                timestamp: new Date().toISOString()
            },
            tests: this.testResults
        };

        require('fs').writeFileSync(
            'return-api-test-report.json', 
            JSON.stringify(reportData, null, 2)
        );

        this.log(`\n📄 Detailed report saved to: return-api-test-report.json`, 'CYAN');
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        this.log('🚀 STARTING RETURN API TESTS', 'BOLD');
        this.log(`API Base: ${CONFIG.API_BASE}`, 'CYAN');
        this.log(`Test User: ${CONFIG.TEST_USER.email}`, 'CYAN');
        this.log('='.repeat(50), 'CYAN');

        // Login first
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            this.log('❌ Cannot proceed without authentication', 'RED');
            this.generateReport();
            return;
        }

        // Run all tests
        await this.testCreateReturn();
        await this.testGetReturns();
        await this.testGetReturnById();
        await this.testProductSuggestions();
        await this.testBulkReturns();
        await this.testGetWarehouses();
        await this.testAuthenticationRequired();

        // Generate final report
        this.generateReport();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new ReturnAPITester();
    tester.runAllTests().catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = ReturnAPITester;