const https = require('https');

// Disable SSL certificate verification for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const API_BASE = 'https://54.169.31.95:8443';

// Simulate real frontend order data that would come from a customer
const frontendOrderData = {
    cartItems: [
        {
            productId: "1",
            quantity: 2,
            customization: {
                text: "Happy Anniversary",
                color: "gold",
                size: "large",
                font: "elegant"
            }
        },
        {
            productId: "2", 
            quantity: 1,
            customization: {
                text: "Best Mom Ever",
                color: "pink",
                size: "medium"
            }
        }
    ],
    shippingAddress: {
        name: "Sarah Johnson",
        phone: "+1-555-123-4567",
        email: "sarah.johnson@email.com",
        addressLine1: "1234 Maple Street",
        addressLine2: "Apartment 5B",
        city: "Los Angeles",
        state: "California",
        postalCode: "90210",
        country: "United States"
    },
    billingAddress: {
        name: "Sarah Johnson",
        phone: "+1-555-123-4567", 
        email: "sarah.johnson@email.com",
        addressLine1: "1234 Maple Street",
        addressLine2: "Apartment 5B",
        city: "Los Angeles",
        state: "California",
        postalCode: "90210",
        country: "United States"
    },
    paymentMethod: "credit_card",
    paymentDetails: {
        cardType: "Visa",
        lastFour: "4567"
    },
    notes: "Please deliver between 2-5 PM. Ring doorbell twice. Gift wrapping requested.",
    specialInstructions: "This is a surprise gift - please be discreet",
    deliveryPreference: "standard",
    giftMessage: "Happy Anniversary! Love you always - John"
};

async function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Frontend-Test/1.0',
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
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (e) {
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

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testFrontendOrderSubmission() {
    console.log('🛒 Testing Frontend Order Submission to API...\n');
    console.log('📋 Simulating customer order with the following details:');
    console.log('Customer:', frontendOrderData.shippingAddress.name);
    console.log('Email:', frontendOrderData.shippingAddress.email);
    console.log('Items:', frontendOrderData.cartItems.length);
    console.log('Payment:', frontendOrderData.paymentMethod);
    console.log('Special Notes:', frontendOrderData.notes);
    console.log('\n' + '='.repeat(60) + '\n');

    try {
        // Step 1: Test if we can reach the server
        console.log('1. 🌐 Testing server connectivity...');
        const healthResponse = await makeRequest('GET', '/');
        console.log(`✅ Server Status: ${healthResponse.status}`);
        console.log('Server Response:', JSON.stringify(healthResponse.data, null, 2));

        // Step 2: Try to get a valid token (test multiple credentials)
        console.log('\n2. 🔐 Attempting authentication...');
        
        const testCredentials = [
            { username: 'admin', password: 'admin123' },
            { username: 'testuser', password: 'password123' },
            { username: 'user', password: 'user123' },
            { username: 'demo', password: 'demo123' }
        ];

        let authToken = null;
        
        for (const creds of testCredentials) {
            console.log(`   Trying: ${creds.username}...`);
            const loginResponse = await makeRequest('POST', '/api/auth/login', creds);
            
            if (loginResponse.status === 200 && loginResponse.data.success) {
                authToken = loginResponse.data.token;
                console.log(`   ✅ Authenticated as: ${creds.username}`);
                break;
            } else {
                console.log(`   ❌ Failed: ${loginResponse.data.message || 'Unknown error'}`);
            }
        }

        if (!authToken) {
            console.log('\n❌ Could not authenticate with any test credentials');
            console.log('🔧 Testing order submission without authentication...\n');
        }

        // Step 3: Test order submission endpoint
        console.log('3. 📦 Testing order submission endpoint...');
        console.log('   Endpoint: POST /api/website/orders');
        console.log('   Data size:', JSON.stringify(frontendOrderData).length, 'bytes');
        
        const orderResponse = await makeRequest('POST', '/api/website/orders', frontendOrderData, authToken);
        
        console.log('\n📊 ORDER SUBMISSION RESULTS:');
        console.log('Status Code:', orderResponse.status);
        console.log('Response Headers:', JSON.stringify(orderResponse.headers, null, 2));
        console.log('Response Body:', JSON.stringify(orderResponse.data, null, 2));

        // Analyze the response
        if (orderResponse.status === 201) {
            console.log('\n🎉 SUCCESS! Order was created successfully');
            console.log('✅ Frontend data was properly received and processed');
            
            if (orderResponse.data.data && orderResponse.data.data.orderId) {
                const orderId = orderResponse.data.data.orderId;
                console.log('📋 Order ID:', orderId);
                console.log('💰 Total Amount:', orderResponse.data.data.totalAmount);
                
                // Step 4: Verify order details were saved correctly
                console.log('\n4. 🔍 Verifying saved order details...');
                const getOrderResponse = await makeRequest('GET', `/api/website/orders/${orderId}`, null, authToken);
                
                if (getOrderResponse.status === 200) {
                    console.log('✅ Order details retrieved successfully');
                    const savedOrder = getOrderResponse.data.data;
                    
                    // Check if frontend data was preserved
                    console.log('\n📋 FRONTEND DATA VERIFICATION:');
                    console.log('Customer Name:', savedOrder.shippingAddress?.name || 'NOT SAVED');
                    console.log('Customer Email:', savedOrder.shippingAddress?.email || 'NOT SAVED');
                    console.log('Phone:', savedOrder.shippingAddress?.phone || 'NOT SAVED');
                    console.log('Address:', savedOrder.shippingAddress?.addressLine1 || 'NOT SAVED');
                    console.log('City, State:', `${savedOrder.shippingAddress?.city || 'NOT SAVED'}, ${savedOrder.shippingAddress?.state || 'NOT SAVED'}`);
                    console.log('Payment Method:', savedOrder.paymentMethod || 'NOT SAVED');
                    console.log('Special Notes:', savedOrder.notes || 'NOT SAVED');
                    console.log('Order Items Count:', savedOrder.items?.length || 0);
                    
                    if (savedOrder.items && savedOrder.items.length > 0) {
                        console.log('\n🛍️ ORDER ITEMS:');
                        savedOrder.items.forEach((item, index) => {
                            console.log(`Item ${index + 1}:`);
                            console.log(`  Product: ${item.productName || item.product_name}`);
                            console.log(`  Quantity: ${item.quantity}`);
                            console.log(`  Price: $${item.unitPrice || item.unit_price}`);
                            console.log(`  Customization: ${item.customization ? JSON.stringify(item.customization) : 'None'}`);
                        });
                    }
                } else {
                    console.log('❌ Could not retrieve order details');
                }
            }
            
        } else if (orderResponse.status === 401) {
            console.log('\n🔒 AUTHENTICATION REQUIRED');
            console.log('❌ Order submission requires valid authentication');
            console.log('💡 Frontend needs to ensure user is logged in before placing orders');
            
        } else if (orderResponse.status === 400) {
            console.log('\n📝 VALIDATION ERROR');
            console.log('❌ Frontend data validation failed');
            console.log('💡 Check required fields and data format');
            
        } else if (orderResponse.status === 404) {
            console.log('\n🔍 ENDPOINT NOT FOUND');
            console.log('❌ Order API endpoint is not available');
            console.log('💡 Check if website order routes are properly configured');
            
        } else if (orderResponse.status === 500) {
            console.log('\n💥 SERVER ERROR');
            console.log('❌ Internal server error occurred');
            console.log('💡 Check server logs and database connectivity');
            
        } else {
            console.log('\n❓ UNEXPECTED RESPONSE');
            console.log('❌ Received unexpected status code');
        }

        // Step 5: Test order listing (to see if orders appear in management)
        console.log('\n5. 📋 Testing order listing for management...');
        const listOrdersResponse = await makeRequest('GET', '/api/website/orders?page=1&limit=5', null, authToken);
        
        console.log('List Orders Status:', listOrdersResponse.status);
        if (listOrdersResponse.status === 200 && listOrdersResponse.data.data) {
            console.log('✅ Order listing works');
            console.log('Total Orders Found:', listOrdersResponse.data.data.orders?.length || 0);
        } else {
            console.log('❌ Order listing failed');
        }

    } catch (error) {
        console.error('\n💥 TEST FAILED WITH ERROR:');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Frontend Order Submission Test Complete');
    console.log('='.repeat(60));
}

// Run the comprehensive test
testFrontendOrderSubmission();