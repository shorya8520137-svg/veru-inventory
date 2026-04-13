const https = require('https');

// Disable SSL certificate verification for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
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
                        status: res.statusCode,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
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

async function testWebsiteOrdersAfterFix() {
    console.log('🧪 Testing Website Orders API After Routing Fix...\n');

    try {
        // Test 1: Check server connectivity
        console.log('1. 🌐 Testing server connectivity...');
        const healthResponse = await makeRequest('GET', '/');
        console.log(`✅ Server Status: ${healthResponse.status}`);

        // Test 2: Test authentication with the new test user
        console.log('\n2. 🔐 Testing authentication with test user...');
        const loginResponse = await makeRequest('POST', '/api/auth/login', {
            username: 'ordertest',
            password: 'testpass123'
        });

        let token = null;
        if (loginResponse.status === 200 && loginResponse.data.success) {
            token = loginResponse.data.token;
            console.log('✅ Authentication successful with test user');
        } else {
            console.log('❌ Authentication failed:', loginResponse.data.message);
            console.log('💡 Make sure to run the database setup first');
        }

        // Test 3: Test GET orders endpoint
        console.log('\n3. 📋 Testing GET /api/website/orders...');
        const getOrdersResponse = await makeRequest('GET', '/api/website/orders?page=1&limit=10', null, token);
        
        console.log(`Status: ${getOrdersResponse.status}`);
        if (getOrdersResponse.status === 200) {
            console.log('✅ GET orders endpoint working!');
            console.log('Orders found:', getOrdersResponse.data.data?.orders?.length || 0);
        } else if (getOrdersResponse.status === 404) {
            console.log('❌ Still getting 404 - routing issue not fixed');
        } else if (getOrdersResponse.status === 401) {
            console.log('🔒 Authentication required (expected if no token)');
        } else {
            console.log('❌ Unexpected response:', getOrdersResponse.data);
        }

        // Test 4: Test POST order creation (if we have a token)
        if (token) {
            console.log('\n4. 🛒 Testing POST /api/website/orders (create order)...');
            
            const testOrder = {
                cartItems: [{
                    productId: "test_product_001",
                    quantity: 1,
                    customization: {
                        text: "Test Order from API",
                        color: "blue",
                        size: "medium"
                    }
                }],
                shippingAddress: {
                    name: "API Test Customer",
                    phone: "+1-555-999-0000",
                    email: "apitest@example.com",
                    addressLine1: "123 API Test Street",
                    city: "Test City",
                    state: "TS",
                    postalCode: "12345",
                    country: "USA"
                },
                paymentMethod: "credit_card",
                notes: "This is a test order from the API test script"
            };

            const createOrderResponse = await makeRequest('POST', '/api/website/orders', testOrder, token);
            
            console.log(`Status: ${createOrderResponse.status}`);
            if (createOrderResponse.status === 201) {
                console.log('✅ Order creation successful!');
                console.log('Order ID:', createOrderResponse.data.data?.orderId);
                console.log('Order Number:', createOrderResponse.data.data?.orderNumber);
                console.log('Total Amount:', createOrderResponse.data.data?.totalAmount);
            } else {
                console.log('❌ Order creation failed');
                console.log('Response:', JSON.stringify(createOrderResponse.data, null, 2));
            }
        }

        // Test 5: Test website products endpoint (to ensure both work)
        console.log('\n5. 🛍️ Testing website products endpoint (should still work)...');
        const productsResponse = await makeRequest('GET', '/api/website/products?page=1&limit=5');
        
        console.log(`Products Status: ${productsResponse.status}`);
        if (productsResponse.status === 200) {
            console.log('✅ Products endpoint still working');
            console.log('Products found:', productsResponse.data.data?.length || 0);
        } else {
            console.log('❌ Products endpoint broken');
        }

    } catch (error) {
        console.error('\n💥 Test failed with error:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Website Orders API Test Complete');
    console.log('='.repeat(60));
}

// Run the test
testWebsiteOrdersAfterFix();