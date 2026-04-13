#!/usr/bin/env node

/**
 * Complete Website Order API Test Suite
 * Tests all order API endpoints to ensure they work properly
 */

const https = require('https');
const fs = require('fs');

// Configuration
const config = {
    baseUrl: 'https://54.169.31.95:8443',
    testUser: {
        username: 'ordertest',
        password: 'testpass123'
    }
};

// Disable SSL verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

class WebsiteOrderAPITester {
    constructor() {
        this.token = null;
        this.testResults = [];
        this.createdOrderId = null;
    }

    // Helper method to make HTTP requests
    async makeRequest(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, config.baseUrl);
            
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
                        const parsedData = JSON.parse(responseData);
                        resolve({
                            statusCode: res.statusCode,
                            data: parsedData,
                            headers: res.headers
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            data: responseData,
                            headers: res.headers
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

    // Log test results
    logTest(testName, success, details = '') {
        const result = {
            test: testName,
            success: success,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${testName}`);
        if (details) {
            console.log(`   Details: ${details}`);
        }
        console.log('');
    }

    // Test 1: Server Health Check
    async testServerHealth() {
        try {
            console.log('🔍 Testing Server Health...');
            const response = await this.makeRequest('GET', '/');
            
            if (response.statusCode === 200 && response.data.status === 'OK') {
                this.logTest('Server Health Check', true, 'Server is running and responding');
                return true;
            } else {
                this.logTest('Server Health Check', false, `Unexpected response: ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.logTest('Server Health Check', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test 2: User Authentication
    async testAuthentication() {
        try {
            console.log('🔐 Testing User Authentication...');
            
            const loginData = {
                username: config.testUser.username,
                password: config.testUser.password
            };

            const response = await this.makeRequest('POST', '/api/auth/login', loginData);
            
            if (response.statusCode === 200 && response.data.success && response.data.token) {
                this.token = response.data.token;
                this.logTest('User Authentication', true, `Token received: ${this.token.substring(0, 20)}...`);
                return true;
            } else {
                this.logTest('User Authentication', false, `Login failed: ${JSON.stringify(response.data)}`);
                return false;
            }
        } catch (error) {
            this.logTest('User Authentication', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test 3: Create Order
    async testCreateOrder() {
        try {
            console.log('📦 Testing Order Creation...');
            
            if (!this.token) {
                this.logTest('Create Order', false, 'No authentication token available');
                return false;
            }

            const orderData = {
                cartItems: [
                    {
                        productId: 'test_product_001',
                        quantity: 2,
                        customization: {
                            text: 'Happy Birthday Mom!',
                            color: 'blue',
                            size: 'large',
                            font: 'script'
                        }
                    },
                    {
                        productId: 'test_product_002',
                        quantity: 1,
                        customization: {
                            text: 'Best Dad Ever',
                            color: 'black'
                        }
                    }
                ],
                customer: {
                    email: 'testcustomer@example.com',
                    firstName: 'John',
                    lastName: 'Doe'
                },
                shippingAddress: {
                    name: 'John Doe',
                    phone: '+1-555-123-4567',
                    email: 'john.doe@example.com',
                    addressLine1: '123 Test Street',
                    addressLine2: 'Apt 4B',
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'United States'
                },
                billingAddress: {
                    name: 'John Doe',
                    phone: '+1-555-123-4567',
                    email: 'john.doe@example.com',
                    addressLine1: '456 Billing Ave',
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10002',
                    country: 'United States'
                },
                paymentMethod: 'credit_card',
                notes: 'Please ring doorbell twice. Gift wrapping requested.'
            };

            const headers = {
                'Authorization': `Bearer ${this.token}`
            };

            const response = await this.makeRequest('POST', '/api/website/orders', orderData, headers);
            
            if (response.statusCode === 201 && response.data.success) {
                this.createdOrderId = response.data.data.orderId;
                this.logTest('Create Order', true, 
                    `Order created successfully. ID: ${this.createdOrderId}, Number: ${response.data.data.orderNumber}`);
                return true;
            } else {
                this.logTest('Create Order', false, 
                    `Order creation failed: ${JSON.stringify(response.data)}`);
                return false;
            }
        } catch (error) {
            this.logTest('Create Order', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test 4: Get User Orders
    async testGetUserOrders() {
        try {
            console.log('📋 Testing Get User Orders...');
            
            if (!this.token) {
                this.logTest('Get User Orders', false, 'No authentication token available');
                return false;
            }

            const headers = {
                'Authorization': `Bearer ${this.token}`
            };

            const response = await this.makeRequest('GET', '/api/website/orders?page=1&limit=10', null, headers);
            
            if (response.statusCode === 200 && response.data.success) {
                const orders = response.data.data.orders;
                this.logTest('Get User Orders', true, 
                    `Retrieved ${orders.length} orders. Pagination: ${JSON.stringify(response.data.data.pagination)}`);
                return true;
            } else {
                this.logTest('Get User Orders', false, 
                    `Failed to get orders: ${JSON.stringify(response.data)}`);
                return false;
            }
        } catch (error) {
            this.logTest('Get User Orders', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test 5: Get Order Details
    async testGetOrderDetails() {
        try {
            console.log('🔍 Testing Get Order Details...');
            
            if (!this.token || !this.createdOrderId) {
                this.logTest('Get Order Details', false, 'No authentication token or order ID available');
                return false;
            }

            const headers = {
                'Authorization': `Bearer ${this.token}`
            };

            const response = await this.makeRequest('GET', `/api/website/orders/${this.createdOrderId}`, null, headers);
            
            if (response.statusCode === 200 && response.data.success) {
                const order = response.data.data;
                this.logTest('Get Order Details', true, 
                    `Order details retrieved. Status: ${order.status}, Items: ${order.items?.length || 0}`);
                return true;
            } else {
                this.logTest('Get Order Details', false, 
                    `Failed to get order details: ${JSON.stringify(response.data)}`);
                return false;
            }
        } catch (error) {
            this.logTest('Get Order Details', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test 6: Track Order
    async testTrackOrder() {
        try {
            console.log('🚚 Testing Order Tracking...');
            
            if (!this.token || !this.createdOrderId) {
                this.logTest('Track Order', false, 'No authentication token or order ID available');
                return false;
            }

            const headers = {
                'Authorization': `Bearer ${this.token}`
            };

            const response = await this.makeRequest('GET', `/api/website/orders/${this.createdOrderId}/tracking`, null, headers);
            
            if (response.statusCode === 200 && response.data.success) {
                const tracking = response.data.data;
                this.logTest('Track Order', true, 
                    `Tracking info retrieved. Status: ${tracking.status}, History entries: ${tracking.trackingHistory?.length || 0}`);
                return true;
            } else {
                this.logTest('Track Order', false, 
                    `Failed to track order: ${JSON.stringify(response.data)}`);
                return false;
            }
        } catch (error) {
            this.logTest('Track Order', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test 7: Update Order Status (Admin function)
    async testUpdateOrderStatus() {
        try {
            console.log('📝 Testing Order Status Update...');
            
            if (!this.token || !this.createdOrderId) {
                this.logTest('Update Order Status', false, 'No authentication token or order ID available');
                return false;
            }

            const updateData = {
                status: 'confirmed',
                trackingNumber: 'TEST123456789',
                notes: 'Order confirmed and ready for processing'
            };

            const headers = {
                'Authorization': `Bearer ${this.token}`
            };

            const response = await this.makeRequest('PUT', `/api/website/orders/${this.createdOrderId}/status`, updateData, headers);
            
            if (response.statusCode === 200 && response.data.success) {
                this.logTest('Update Order Status', true, 
                    `Order status updated to: ${updateData.status}`);
                return true;
            } else {
                this.logTest('Update Order Status', false, 
                    `Failed to update order status: ${JSON.stringify(response.data)}`);
                return false;
            }
        } catch (error) {
            this.logTest('Update Order Status', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test 8: Cancel Order
    async testCancelOrder() {
        try {
            console.log('❌ Testing Order Cancellation...');
            
            if (!this.token || !this.createdOrderId) {
                this.logTest('Cancel Order', false, 'No authentication token or order ID available');
                return false;
            }

            const cancelData = {
                reason: 'Customer requested cancellation for testing',
                refundRequested: true,
                customerNote: 'This is a test cancellation'
            };

            const headers = {
                'Authorization': `Bearer ${this.token}`
            };

            const response = await this.makeRequest('PUT', `/api/website/orders/${this.createdOrderId}/cancel`, cancelData, headers);
            
            if (response.statusCode === 200 && response.data.success) {
                this.logTest('Cancel Order', true, 
                    `Order cancelled successfully. Status: ${response.data.data.status}`);
                return true;
            } else {
                this.logTest('Cancel Order', false, 
                    `Failed to cancel order: ${JSON.stringify(response.data)}`);
                return false;
            }
        } catch (error) {
            this.logTest('Cancel Order', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test 9: Error Handling - Invalid Order Data
    async testErrorHandling() {
        try {
            console.log('⚠️ Testing Error Handling...');
            
            if (!this.token) {
                this.logTest('Error Handling', false, 'No authentication token available');
                return false;
            }

            // Test with invalid order data (missing required fields)
            const invalidOrderData = {
                cartItems: [], // Empty cart should fail
                customer: {
                    email: 'invalid-email' // Invalid email format
                }
                // Missing shipping address
            };

            const headers = {
                'Authorization': `Bearer ${this.token}`
            };

            const response = await this.makeRequest('POST', '/api/website/orders', invalidOrderData, headers);
            
            if (response.statusCode === 400 && !response.data.success) {
                this.logTest('Error Handling', true, 
                    `Properly handled invalid data: ${response.data.message}`);
                return true;
            } else {
                this.logTest('Error Handling', false, 
                    `Should have returned 400 error for invalid data: ${JSON.stringify(response.data)}`);
                return false;
            }
        } catch (error) {
            this.logTest('Error Handling', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test 10: Unauthorized Access
    async testUnauthorizedAccess() {
        try {
            console.log('🔒 Testing Unauthorized Access...');
            
            // Try to access orders without token
            const response = await this.makeRequest('GET', '/api/website/orders');
            
            if (response.statusCode === 401) {
                this.logTest('Unauthorized Access', true, 
                    'Properly rejected unauthorized request');
                return true;
            } else {
                this.logTest('Unauthorized Access', false, 
                    `Should have returned 401 for unauthorized access: ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.logTest('Unauthorized Access', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Generate test report
    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(2);

        const report = {
            summary: {
                totalTests: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`,
                timestamp: new Date().toISOString()
            },
            testResults: this.testResults,
            configuration: {
                baseUrl: config.baseUrl,
                testUser: config.testUser.username
            }
        };

        // Save report to file
        const reportFile = 'website-order-api-test-report.json';
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('📊 WEBSITE ORDER API TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${successRate}%`);
        console.log(`Report saved to: ${reportFile}`);
        console.log('='.repeat(60));

        return report;
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Website Order API Test Suite...\n');

        const tests = [
            () => this.testServerHealth(),
            () => this.testAuthentication(),
            () => this.testCreateOrder(),
            () => this.testGetUserOrders(),
            () => this.testGetOrderDetails(),
            () => this.testTrackOrder(),
            () => this.testUpdateOrderStatus(),
            () => this.testCancelOrder(),
            () => this.testErrorHandling(),
            () => this.testUnauthorizedAccess()
        ];

        for (const test of tests) {
            try {
                await test();
                // Small delay between tests
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Test execution error: ${error.message}`);
            }
        }

        return this.generateReport();
    }
}

// Run the tests
async function main() {
    const tester = new WebsiteOrderAPITester();
    
    try {
        const report = await tester.runAllTests();
        
        // Exit with appropriate code
        const hasFailures = report.summary.failed > 0;
        process.exit(hasFailures ? 1 : 0);
        
    } catch (error) {
        console.error('Test suite execution failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = WebsiteOrderAPITester;