#!/usr/bin/env node

/**
 * Test Order API with Provided Access Token
 * Tests all order-related endpoints using the live token
 */

const https = require('https');

// Configuration
const API_BASE = 'https://54.169.31.95:8443';
const ACCESS_TOKEN = 'wk_live_60648f2d15dfa23328e53ffe52ca2fa067d21b40eb24093abb6c612f86a4e121';

// Disable SSL verification for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🧪 Testing Order API with Live Access Token');
console.log('=' .repeat(60));
console.log(`🔗 API Base: ${API_BASE}`);
console.log(`🔑 Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
console.log('');

// Helper function to make API requests
function makeRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + endpoint);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-API-Key': ACCESS_TOKEN,
                'User-Agent': 'Order-API-Test/1.0'
            },
            rejectUnauthorized: false
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data && (method === 'POST' || method === 'PUT')) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test functions
async function testGetOrders() {
    console.log('📋 Testing: GET /api/website/orders');
    try {
        const response = await makeRequest('GET', '/api/website/orders?page=1&limit=5');
        console.log(`   Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('   ✅ Success - Orders retrieved');
            if (response.data.data && Array.isArray(response.data.data)) {
                console.log(`   📊 Found ${response.data.data.length} orders`);
                if (response.data.data.length > 0) {
                    const firstOrder = response.data.data[0];
                    console.log(`   🔍 Sample Order ID: ${firstOrder.id || firstOrder.order_id}`);
                    console.log(`   💰 Total: $${firstOrder.total_amount || 'N/A'}`);
                    console.log(`   📅 Date: ${firstOrder.created_at || firstOrder.order_date || 'N/A'}`);
                }
            }
        } else {
            console.log('   ❌ Failed');
            console.log(`   📝 Response: ${JSON.stringify(response.data, null, 2)}`);
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    console.log('');
}

async function testCreateOrder() {
    console.log('📦 Testing: POST /api/website/orders (Create Order)');
    
    const orderData = {
        customer_name: "Test Customer",
        customer_email: "test@example.com",
        customer_phone: "+1234567890",
        shipping_address: {
            street: "123 Test Street",
            city: "Test City",
            state: "Test State",
            postal_code: "12345",
            country: "Test Country"
        },
        billing_address: {
            street: "123 Test Street",
            city: "Test City", 
            state: "Test State",
            postal_code: "12345",
            country: "Test Country"
        },
        items: [
            {
                product_id: 1,
                product_name: "Test Product",
                quantity: 2,
                unit_price: 25.99,
                total_price: 51.98
            }
        ],
        subtotal: 51.98,
        tax_amount: 4.16,
        shipping_cost: 9.99,
        total_amount: 66.13,
        payment_method: "credit_card",
        payment_status: "pending",
        order_notes: "Test order via API"
    };

    try {
        const response = await makeRequest('POST', '/api/website/orders', orderData);
        console.log(`   Status: ${response.status}`);
        
        if (response.status === 200 || response.status === 201) {
            console.log('   ✅ Success - Order created');
            if (response.data.data) {
                const orderId = response.data.data.id || response.data.data.order_id;
                console.log(`   🆔 Order ID: ${orderId}`);
                console.log(`   💰 Total: $${response.data.data.total_amount || orderData.total_amount}`);
                
                // Store order ID for tracking test
                global.testOrderId = orderId;
            }
        } else {
            console.log('   ❌ Failed');
            console.log(`   📝 Response: ${JSON.stringify(response.data, null, 2)}`);
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    console.log('');
}

async function testOrderTracking() {
    console.log('🔍 Testing: GET /api/website/orders/{id}/tracking');
    
    // Use the order ID from creation test, or a default
    const orderId = global.testOrderId || 1;
    
    try {
        const response = await makeRequest('GET', `/api/website/orders/${orderId}/tracking`);
        console.log(`   Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('   ✅ Success - Order tracking retrieved');
            if (response.data.data) {
                console.log(`   📦 Order Status: ${response.data.data.status || 'N/A'}`);
                console.log(`   🚚 Tracking Number: ${response.data.data.tracking_number || 'N/A'}`);
                if (response.data.data.status_history) {
                    console.log(`   📋 Status History: ${response.data.data.status_history.length} entries`);
                }
            }
        } else {
            console.log('   ❌ Failed');
            console.log(`   📝 Response: ${JSON.stringify(response.data, null, 2)}`);
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    console.log('');
}

async function testUpdateOrderStatus() {
    console.log('📝 Testing: PUT /api/website/orders/{id}/status');
    
    const orderId = global.testOrderId || 1;
    const statusData = {
        status: 'processing',
        notes: 'Order is being processed'
    };
    
    try {
        const response = await makeRequest('PUT', `/api/website/orders/${orderId}/status`, statusData);
        console.log(`   Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('   ✅ Success - Order status updated');
            if (response.data.data) {
                console.log(`   📦 New Status: ${response.data.data.status || statusData.status}`);
            }
        } else {
            console.log('   ❌ Failed');
            console.log(`   📝 Response: ${JSON.stringify(response.data, null, 2)}`);
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    console.log('');
}

async function testCancelOrder() {
    console.log('❌ Testing: PUT /api/website/orders/{id}/cancel');
    
    const orderId = global.testOrderId || 1;
    const cancelData = {
        reason: 'Customer requested cancellation',
        refund_amount: 66.13
    };
    
    try {
        const response = await makeRequest('PUT', `/api/website/orders/${orderId}/cancel`, cancelData);
        console.log(`   Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('   ✅ Success - Order cancelled');
            if (response.data.data) {
                console.log(`   📦 Status: ${response.data.data.status || 'cancelled'}`);
                console.log(`   💰 Refund: $${response.data.data.refund_amount || cancelData.refund_amount}`);
            }
        } else {
            console.log('   ❌ Failed');
            console.log(`   📝 Response: ${JSON.stringify(response.data, null, 2)}`);
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    console.log('');
}

async function testOrderStats() {
    console.log('📊 Testing: GET /api/website/orders/stats');
    
    try {
        const response = await makeRequest('GET', '/api/website/orders/stats');
        console.log(`   Status: ${response.status}`);
        
        if (response.status === 200) {
            console.log('   ✅ Success - Order statistics retrieved');
            if (response.data.data) {
                const stats = response.data.data;
                console.log(`   📈 Total Orders: ${stats.total_orders || 'N/A'}`);
                console.log(`   💰 Total Revenue: $${stats.total_revenue || 'N/A'}`);
                console.log(`   📦 Pending Orders: ${stats.pending_orders || 'N/A'}`);
                console.log(`   ✅ Completed Orders: ${stats.completed_orders || 'N/A'}`);
            }
        } else {
            console.log('   ❌ Failed');
            console.log(`   📝 Response: ${JSON.stringify(response.data, null, 2)}`);
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    console.log('');
}

// Main test execution
async function runTests() {
    console.log('🚀 Starting Order API Tests...\n');
    
    try {
        await testGetOrders();
        await testCreateOrder();
        await testOrderTracking();
        await testUpdateOrderStatus();
        await testOrderStats();
        // Note: Commenting out cancel test to preserve test data
        // await testCancelOrder();
        
        console.log('=' .repeat(60));
        console.log('✅ Order API Testing Complete!');
        console.log('');
        console.log('📋 Summary:');
        console.log('   • GET /api/website/orders - List orders');
        console.log('   • POST /api/website/orders - Create order');
        console.log('   • GET /api/website/orders/{id}/tracking - Track order');
        console.log('   • PUT /api/website/orders/{id}/status - Update status');
        console.log('   • GET /api/website/orders/stats - Order statistics');
        console.log('');
        console.log('🔑 Access Token Used:', ACCESS_TOKEN.substring(0, 30) + '...');
        console.log('🌐 API Base URL:', API_BASE);
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    }
}

// Run the tests
runTests();