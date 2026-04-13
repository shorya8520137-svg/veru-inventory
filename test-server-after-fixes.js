/**
 * COMPREHENSIVE SERVER TEST AFTER MODULE FIXES
 * Tests all critical APIs including 2FA functionality
 */

const https = require('https');

// Disable SSL verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SERVER_URL = 'https://52.221.231.85:8443';

class ServerTester {
    constructor() {
        this.testResults = [];
        this.authToken = null;
    }

    /**
     * Make HTTPS request
     */
    async makeRequest(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(SERVER_URL + path);
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                rejectUnauthorized: false
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(responseData);
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: jsonData
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: responseData
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    /**
     * Log test result
     */
    logResult(testName, success, message, data = null) {
        const result = {
            test: testName,
            success: success,
            message: message,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        this.testResults.push(result);
        
        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
        
        if (data && !success) {
            console.log('   Data:', JSON.stringify(data, null, 2));
        }
    }

    /**
     * Test 1: Server Health Check
     */
    async testServerHealth() {
        try {
            // Try multiple endpoints to check if server is running
            const endpoints = [
                '/api/auth/login',  // This should return 400 for missing credentials, not 500
                '/api/health',      // If it exists
                '/'                 // Root endpoint
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await this.makeRequest('GET', endpoint);
                    
                    // Server is responding if we get any HTTP response
                    if (response.statusCode) {
                        this.logResult('Server Health', true, `Server is running (${endpoint} responded with ${response.statusCode})`);
                        return true;
                    }
                } catch (error) {
                    // Continue to next endpoint
                    continue;
                }
            }
            
            this.logResult('Server Health', false, 'Server is not responding to any endpoints');
            return false;
            
        } catch (error) {
            this.logResult('Server Health', false, `Connection failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test 2: Login API
     */
    async testLogin() {
        try {
            const loginData = {
                email: 'admin@company.com',
                password: 'admin@123'
            };

            const response = await this.makeRequest('POST', '/api/auth/login', loginData);
            
            if (response.statusCode === 200 && response.data.success) {
                this.authToken = response.data.token;
                this.logResult('Login API', true, 'Login successful, token received');
                
                // Check if 2FA is required
                if (response.data.requires_2fa) {
                    this.logResult('2FA Check', true, '2FA is enabled and required');
                    return { success: true, requires2fa: true };
                } else {
                    this.logResult('2FA Check', true, '2FA not required for this user');
                    return { success: true, requires2fa: false };
                }
            } else {
                this.logResult('Login API', false, 'Login failed', response.data);
                return { success: false };
            }
        } catch (error) {
            this.logResult('Login API', false, `Login request failed: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * Test 3: 2FA Status API
     */
    async test2FAStatus() {
        if (!this.authToken) {
            this.logResult('2FA Status', false, 'No auth token available');
            return false;
        }

        try {
            const response = await this.makeRequest('GET', '/api/2fa/status', null, {
                'Authorization': `Bearer ${this.authToken}`
            });
            
            if (response.statusCode === 200) {
                this.logResult('2FA Status', true, '2FA status retrieved successfully', response.data);
                return true;
            } else {
                this.logResult('2FA Status', false, `Status check failed: ${response.statusCode}`, response.data);
                return false;
            }
        } catch (error) {
            this.logResult('2FA Status', false, `Status request failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test 4: Products API
     */
    async testProductsAPI() {
        if (!this.authToken) {
            this.logResult('Products API', false, 'No auth token available');
            return false;
        }

        try {
            const response = await this.makeRequest('GET', '/api/products', null, {
                'Authorization': `Bearer ${this.authToken}`
            });
            
            if (response.statusCode === 200) {
                const productCount = Array.isArray(response.data) ? response.data.length : 0;
                this.logResult('Products API', true, `Products retrieved successfully (${productCount} products)`);
                return true;
            } else {
                this.logResult('Products API', false, `Products request failed: ${response.statusCode}`, response.data);
                return false;
            }
        } catch (error) {
            this.logResult('Products API', false, `Products request failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test 5: Notifications API
     */
    async testNotificationsAPI() {
        if (!this.authToken) {
            this.logResult('Notifications API', false, 'No auth token available');
            return false;
        }

        try {
            const response = await this.makeRequest('GET', '/api/notifications', null, {
                'Authorization': `Bearer ${this.authToken}`
            });
            
            if (response.statusCode === 200) {
                const notificationCount = Array.isArray(response.data) ? response.data.length : 0;
                this.logResult('Notifications API', true, `Notifications retrieved successfully (${notificationCount} notifications)`);
                return true;
            } else {
                this.logResult('Notifications API', false, `Notifications request failed: ${response.statusCode}`, response.data);
                return false;
            }
        } catch (error) {
            this.logResult('Notifications API', false, `Notifications request failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test 6: Permissions API
     */
    async testPermissionsAPI() {
        if (!this.authToken) {
            this.logResult('Permissions API', false, 'No auth token available');
            return false;
        }

        try {
            const response = await this.makeRequest('GET', '/api/permissions/user', null, {
                'Authorization': `Bearer ${this.authToken}`
            });
            
            if (response.statusCode === 200) {
                this.logResult('Permissions API', true, 'User permissions retrieved successfully', response.data);
                return true;
            } else {
                this.logResult('Permissions API', false, `Permissions request failed: ${response.statusCode}`, response.data);
                return false;
            }
        } catch (error) {
            this.logResult('Permissions API', false, `Permissions request failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting comprehensive server tests...\n');
        
        // Test 1: Server Health
        const healthOk = await this.testServerHealth();
        if (!healthOk) {
            console.log('\n❌ Server health check failed. Stopping tests.');
            return this.generateReport();
        }

        // Test 2: Login
        const loginResult = await this.testLogin();
        if (!loginResult.success) {
            console.log('\n❌ Login failed. Stopping authenticated tests.');
            return this.generateReport();
        }

        // Test 3: 2FA Status
        await this.test2FAStatus();

        // Test 4: Products API
        await this.testProductsAPI();

        // Test 5: Notifications API
        await this.testNotificationsAPI();

        // Test 6: Permissions API
        await this.testPermissionsAPI();

        return this.generateReport();
    }

    /**
     * Generate test report
     */
    generateReport() {
        console.log('\n📊 TEST REPORT');
        console.log('='.repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`   - ${r.test}: ${r.message}`);
                });
        }
        
        console.log('\n✅ PASSED TESTS:');
        this.testResults
            .filter(r => r.success)
            .forEach(r => {
                console.log(`   - ${r.test}: ${r.message}`);
            });

        // Overall status
        if (passedTests === totalTests) {
            console.log('\n🎉 ALL TESTS PASSED! Server is working correctly.');
        } else if (passedTests >= totalTests * 0.8) {
            console.log('\n⚠️ Most tests passed. Minor issues detected.');
        } else {
            console.log('\n❌ Multiple test failures. Server needs attention.');
        }

        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: (passedTests / totalTests) * 100,
            results: this.testResults
        };
    }
}

// Run the tests
async function main() {
    const tester = new ServerTester();
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = ServerTester;