#!/usr/bin/env node

/**
 * Website Products API Test Suite
 * Tests all API endpoints for the Website Product Management system
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    BASE_URL: 'https://54.169.31.95:8443', // Update with your server URL
    TEST_USER: {
        email: 'admin@company.com', // Updated to use email instead of username
        password: 'Admin@123' // Updated to use correct password
    },
    TIMEOUT: 10000
};

let authToken = null;
let testResults = [];

// Utility function to make HTTPS requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            ...options,
            rejectUnauthorized: false, // For self-signed certificates
            timeout: CONFIG.TIMEOUT
        }, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = responseData ? JSON.parse(responseData) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsed,
                        raw: responseData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: responseData,
                        raw: responseData
                    });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

// Test result logging
function logTest(testName, success, message, details = null) {
    const result = {
        test: testName,
        success,
        message,
        details,
        timestamp: new Date().toISOString()
    };
    testResults.push(result);
    
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}: ${message}`);
    if (details && !success) {
        console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
}

// Authentication
async function authenticate() {
    console.log('\n🔐 Testing Authentication...');
    
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            email: CONFIG.TEST_USER.email,
            password: CONFIG.TEST_USER.password
        });

        if (response.statusCode === 200 && response.data.token) {
            authToken = response.data.token;
            logTest('Authentication', true, 'Successfully authenticated');
            return true;
        } else {
            logTest('Authentication', false, 'Failed to authenticate', response.data);
            return false;
        }
    } catch (error) {
        logTest('Authentication', false, 'Authentication error: ' + error.message);
        return false;
    }
}

// Test Categories API
async function testCategoriesAPI() {
    console.log('\n🏷️ Testing Categories API...');

    // 1. Get Categories (Public)
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/categories',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            logTest('Get Categories (Public)', true, `Retrieved ${response.data.data?.length || 0} categories`);
        } else {
            logTest('Get Categories (Public)', false, 'Failed to get categories', response.data);
        }
    } catch (error) {
        logTest('Get Categories (Public)', false, 'Error: ' + error.message);
    }

    if (!authToken) return;

    // 2. Create Category (Protected)
    try {
        const testCategory = {
            name: `Test Category ${Date.now()}`,
            description: 'Test category created by API test',
            sort_order: 99
        };

        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/categories',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        }, testCategory);

        if (response.statusCode === 201) {
            logTest('Create Category', true, 'Category created successfully', response.data.data);
            
            // Store category ID for further tests
            global.testCategoryId = response.data.data?.id;
        } else {
            logTest('Create Category', false, 'Failed to create category', response.data);
        }
    } catch (error) {
        logTest('Create Category', false, 'Error: ' + error.message);
    }

    // 3. Update Category (Protected)
    if (global.testCategoryId) {
        try {
            const updateData = {
                description: 'Updated test category description'
            };

            const response = await makeRequest({
                hostname: '54.169.31.95',
                port: 8443,
                path: `/api/website/categories/${global.testCategoryId}`,
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }, updateData);

            if (response.statusCode === 200) {
                logTest('Update Category', true, 'Category updated successfully');
            } else {
                logTest('Update Category', false, 'Failed to update category', response.data);
            }
        } catch (error) {
            logTest('Update Category', false, 'Error: ' + error.message);
        }
    }
}

// Test Products API
async function testProductsAPI() {
    console.log('\n📦 Testing Products API...');

    // 1. Get Products (Public)
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/products?page=1&limit=5',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            logTest('Get Products (Public)', true, `Retrieved ${response.data.data?.length || 0} products`);
        } else {
            logTest('Get Products (Public)', false, 'Failed to get products', response.data);
        }
    } catch (error) {
        logTest('Get Products (Public)', false, 'Error: ' + error.message);
    }

    // 2. Get Featured Products (Public)
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/products/featured?limit=3',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            logTest('Get Featured Products', true, `Retrieved ${response.data.data?.length || 0} featured products`);
        } else {
            logTest('Get Featured Products', false, 'Failed to get featured products', response.data);
        }
    } catch (error) {
        logTest('Get Featured Products', false, 'Error: ' + error.message);
    }

    if (!authToken) return;

    // 3. Create Product (Protected)
    try {
        const testProduct = {
            product_name: `Test Product ${Date.now()}`,
            description: 'Test product created by API test suite',
            short_description: 'Test product for API testing',
            price: 29.99,
            offer_price: 24.99,
            category_id: global.testCategoryId || 1, // Use test category or fallback to 1
            stock_quantity: 100,
            min_stock_level: 10,
            is_active: true,
            is_featured: false
        };

        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/products',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        }, testProduct);

        if (response.statusCode === 201) {
            logTest('Create Product', true, 'Product created successfully', response.data.data);
            global.testProductId = response.data.data?.id;
        } else {
            logTest('Create Product', false, 'Failed to create product', response.data);
        }
    } catch (error) {
        logTest('Create Product', false, 'Error: ' + error.message);
    }

    // 4. Get Single Product (Public)
    if (global.testProductId) {
        try {
            const response = await makeRequest({
                hostname: '54.169.31.95',
                port: 8443,
                path: `/api/website/products/${global.testProductId}`,
                method: 'GET'
            });

            if (response.statusCode === 200) {
                logTest('Get Single Product', true, 'Retrieved product details');
            } else {
                logTest('Get Single Product', false, 'Failed to get product', response.data);
            }
        } catch (error) {
            logTest('Get Single Product', false, 'Error: ' + error.message);
        }
    }

    // 5. Update Product (Protected)
    if (global.testProductId) {
        try {
            const updateData = {
                price: 34.99,
                offer_price: 29.99,
                is_featured: true
            };

            const response = await makeRequest({
                hostname: '54.169.31.95',
                port: 8443,
                path: `/api/website/products/${global.testProductId}`,
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }, updateData);

            if (response.statusCode === 200) {
                logTest('Update Product', true, 'Product updated successfully');
            } else {
                logTest('Update Product', false, 'Failed to update product', response.data);
            }
        } catch (error) {
            logTest('Update Product', false, 'Error: ' + error.message);
        }
    }
}

// Test Search and Filtering
async function testSearchAndFiltering() {
    console.log('\n🔍 Testing Search and Filtering...');

    // 1. Search Products
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/products?search=test&limit=5',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            logTest('Search Products', true, `Found ${response.data.data?.length || 0} products matching "test"`);
        } else {
            logTest('Search Products', false, 'Failed to search products', response.data);
        }
    } catch (error) {
        logTest('Search Products', false, 'Error: ' + error.message);
    }

    // 2. Filter by Category
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/products?category=electronics&limit=5',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            logTest('Filter by Category', true, `Found ${response.data.data?.length || 0} electronics products`);
        } else {
            logTest('Filter by Category', false, 'Failed to filter by category', response.data);
        }
    } catch (error) {
        logTest('Filter by Category', false, 'Error: ' + error.message);
    }

    // 3. Price Range Filter
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/products?minPrice=20&maxPrice=100&limit=5',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            logTest('Price Range Filter', true, `Found ${response.data.data?.length || 0} products in $20-$100 range`);
        } else {
            logTest('Price Range Filter', false, 'Failed to filter by price range', response.data);
        }
    } catch (error) {
        logTest('Price Range Filter', false, 'Error: ' + error.message);
    }
}

// Test Bulk Upload Status (without actual file upload)
async function testBulkUploadStatus() {
    console.log('\n📤 Testing Bulk Upload Status...');

    if (!authToken) return;

    // Test getting status for non-existent upload
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/bulk-upload/999/status',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.statusCode === 404) {
            logTest('Bulk Upload Status (Not Found)', true, 'Correctly returned 404 for non-existent upload');
        } else {
            logTest('Bulk Upload Status (Not Found)', false, 'Unexpected response for non-existent upload', response.data);
        }
    } catch (error) {
        logTest('Bulk Upload Status (Not Found)', false, 'Error: ' + error.message);
    }
}

// Test Error Handling
async function testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');

    // 1. Test unauthorized access
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/products',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { product_name: 'Test' });

        if (response.statusCode === 401) {
            logTest('Unauthorized Access', true, 'Correctly returned 401 for unauthorized request');
        } else {
            logTest('Unauthorized Access', false, 'Did not properly handle unauthorized request', response.data);
        }
    } catch (error) {
        logTest('Unauthorized Access', false, 'Error: ' + error.message);
    }

    // 2. Test invalid product creation
    if (authToken) {
        try {
            const response = await makeRequest({
                hostname: '54.169.31.95',
                port: 8443,
                path: '/api/website/products',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }, { /* missing required fields */ });

            if (response.statusCode === 400) {
                logTest('Invalid Product Creation', true, 'Correctly returned 400 for invalid data');
            } else {
                logTest('Invalid Product Creation', false, 'Did not properly validate product data', response.data);
            }
        } catch (error) {
            logTest('Invalid Product Creation', false, 'Error: ' + error.message);
        }
    }

    // 3. Test non-existent product
    try {
        const response = await makeRequest({
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/website/products/99999',
            method: 'GET'
        });

        if (response.statusCode === 404) {
            logTest('Non-existent Product', true, 'Correctly returned 404 for non-existent product');
        } else {
            logTest('Non-existent Product', false, 'Did not properly handle non-existent product', response.data);
        }
    } catch (error) {
        logTest('Non-existent Product', false, 'Error: ' + error.message);
    }
}

// Cleanup test data
async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    if (!authToken) return;

    // Delete test product
    if (global.testProductId) {
        try {
            const response = await makeRequest({
                hostname: '54.169.31.95',
                port: 8443,
                path: `/api/website/products/${global.testProductId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.statusCode === 200) {
                logTest('Cleanup - Delete Product', true, 'Test product deleted successfully');
            } else {
                logTest('Cleanup - Delete Product', false, 'Failed to delete test product', response.data);
            }
        } catch (error) {
            logTest('Cleanup - Delete Product', false, 'Error: ' + error.message);
        }
    }

    // Delete test category
    if (global.testCategoryId) {
        try {
            const response = await makeRequest({
                hostname: '54.169.31.95',
                port: 8443,
                path: `/api/website/categories/${global.testCategoryId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.statusCode === 200) {
                logTest('Cleanup - Delete Category', true, 'Test category deleted successfully');
            } else {
                logTest('Cleanup - Delete Category', false, 'Failed to delete test category', response.data);
            }
        } catch (error) {
            logTest('Cleanup - Delete Category', false, 'Error: ' + error.message);
        }
    }
}

// Generate test report
function generateReport() {
    console.log('\n📊 Test Report Summary');
    console.log('='.repeat(50));

    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${successRate}%`);

    if (failedTests > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.filter(r => !r.success).forEach(test => {
            console.log(`  - ${test.test}: ${test.message}`);
        });
    }

    // Save detailed report to file
    const reportData = {
        summary: {
            totalTests,
            passedTests,
            failedTests,
            successRate: parseFloat(successRate),
            timestamp: new Date().toISOString()
        },
        tests: testResults
    };

    const reportFile = 'website-products-api-test-report.json';
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Website Products API Test Suite');
    console.log('='.repeat(50));

    try {
        // Authentication is required for protected endpoints
        const authenticated = await authenticate();

        // Run all tests
        await testCategoriesAPI();
        await testProductsAPI();
        await testSearchAndFiltering();
        await testBulkUploadStatus();
        await testErrorHandling();

        // Cleanup
        if (authenticated) {
            await cleanup();
        }

        // Generate report
        generateReport();

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, CONFIG };