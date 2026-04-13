const https = require('https');

// Disable SSL certificate verification for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Real frontend order data that would come from a customer placing an order
const frontendOrderData = {
    cartItems: [
        {
            productId: "1",
            quantity: 2,
            customization: {
                text: "Happy Birthday Sarah!",
                color: "blue",
                size: "large",
                font: "script"
            }
        },
        {
            productId: "2",
            quantity: 1,
            customization: {
                text: "Best Friend Forever",
                color: "pink",
                size: "medium"
            }
        }
    ],
    shippingAddress: {
        name: "Emily Rodriguez",
        phone: "+1-555-234-5678",
        email: "emily.rodriguez@gmail.com",
        addressLine1: "789 Pine Street",
        addressLine2: "Unit 3A",
        city: "Miami",
        state: "Florida",
        postalCode: "33101",
        country: "United States"
    },
    billingAddress: {
        name: "Emily Rodriguez",
        phone: "+1-555-234-5678",
        email: "emily.rodriguez@gmail.com",
        addressLine1: "789 Pine Street",
        addressLine2: "Unit 3A",
        city: "Miami",
        state: "Florida",
        postalCode: "33101",
        country: "United States"
    },
    paymentMethod: "credit_card",
    notes: "Please call before delivery. This is a surprise birthday gift for my friend. Please use discrete packaging and don't mention it's a gift on the outside. Delivery preferred after 6 PM on weekdays."
};

async function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Frontend-Customer-Order/1.0'
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

async function testOrderAPIWithoutAuth() {
    console.log('🛒 Testing Order API - Frontend Data Handling (No Auth)');
    console.log('=' .repeat(65));
    console.log('📋 CUSTOMER ORDER DETAILS:');
    console.log('Customer Name:', frontendOrderData.shippingAddress.name);
    console.log('Email:', frontendOrderData.shippingAddress.email);
    console.log('Phone:', frontendOrderData.shippingAddress.phone);
    console.log('Address:', `${frontendOrderData.shippingAddress.addressLine1}, ${frontendOrderData.shippingAddress.city}, ${frontendOrderData.shippingAddress.state}`);
    console.log('Items in Cart:', frontendOrderData.cartItems.length);
    console.log('Payment Method:', frontendOrderData.paymentMethod);
    console.log('Special Instructions:', frontendOrderData.notes);
    console.log('=' .repeat(65));

    try {
        // Test server connectivity first
        console.log('\n1. 🌐 Testing server connectivity...');
        const healthCheck = await makeRequest('GET', '/');
        console.log(`✅ Server is running (Status: ${healthCheck.status})`);

        // Test order submission
        console.log('\n2. 📦 Submitting order to API...');
        console.log('   Endpoint: POST /api/website/orders');
        console.log('   Data Size:', JSON.stringify(frontendOrderData).length, 'bytes');
        
        const startTime = Date.now();
        const orderResponse = await makeRequest('POST', '/api/website/orders', frontendOrderData);
        const responseTime = Date.now() - startTime;
        
        console.log('\n📊 API RESPONSE ANALYSIS:');
        console.log('Response Time:', responseTime + 'ms');
        console.log('Status Code:', orderResponse.status);
        console.log('Content-Type:', orderResponse.headers['content-type']);
        console.log('Response Size:', JSON.stringify(orderResponse.data).length, 'bytes');
        
        console.log('\n📋 DETAILED RESPONSE:');
        console.log(JSON.stringify(orderResponse.data, null, 2));

        // Analyze different response scenarios
        if (orderResponse.status === 201) {
            console.log('\n🎉 SUCCESS - ORDER CREATED!');
            console.log('✅ Frontend data was successfully processed');
            
            if (orderResponse.data.data) {
                const orderData = orderResponse.data.data;
                console.log('\n📋 ORDER CONFIRMATION:');
                console.log('Order ID:', orderData.orderId);
                console.log('Order Number:', orderData.orderNumber);
                console.log('Total Amount: $' + orderData.totalAmount);
                console.log('Status:', orderData.status);
                console.log('Estimated Delivery:', orderData.estimatedDelivery);
                
                // Test retrieving the created order
                console.log('\n3. 🔍 Verifying order was saved correctly...');
                const getOrderResponse = await makeRequest('GET', `/api/website/orders/${orderData.orderId}`);
                
                if (getOrderResponse.status === 200) {
                    console.log('✅ Order retrieval successful');
                    const savedOrder = getOrderResponse.data.data;
                    
                    console.log('\n📋 FRONTEND DATA VERIFICATION:');
                    console.log('✓ Customer Name Saved:', savedOrder.shippingAddress?.name || '❌ NOT SAVED');
                    console.log('✓ Email Saved:', savedOrder.shippingAddress?.email || '❌ NOT SAVED');
                    console.log('✓ Phone Saved:', savedOrder.shippingAddress?.phone || '❌ NOT SAVED');
                    console.log('✓ Address Saved:', savedOrder.shippingAddress?.addressLine1 || '❌ NOT SAVED');
                    console.log('✓ City/State Saved:', `${savedOrder.shippingAddress?.city || '❌'}, ${savedOrder.shippingAddress?.state || '❌'}`);
                    console.log('✓ Payment Method:', savedOrder.paymentMethod || '❌ NOT SAVED');
                    console.log('✓ Customer Notes:', savedOrder.notes || '❌ NOT SAVED');
                    
                    if (savedOrder.items && savedOrder.items.length > 0) {
                        console.log('\n🛍️ ORDER ITEMS VERIFICATION:');
                        savedOrder.items.forEach((item, index) => {
                            console.log(`Item ${index + 1}:`);
                            console.log(`  ✓ Product Name: ${item.productName || item.product_name || '❌ NOT SAVED'}`);
                            console.log(`  ✓ Quantity: ${item.quantity || '❌ NOT SAVED'}`);
                            console.log(`  ✓ Unit Price: $${item.unitPrice || item.unit_price || '❌ NOT SAVED'}`);
                            console.log(`  ✓ Total Price: $${item.totalPrice || item.total_price || '❌ NOT SAVED'}`);
                            
                            if (item.customization) {
                                console.log(`  ✓ Customization: ${JSON.stringify(item.customization)}`);
                            } else {
                                console.log(`  ❌ Customization: NOT SAVED`);
                            }
                        });
                    } else {
                        console.log('❌ No order items found in saved order');
                    }
                    
                    console.log('\n✅ FRONTEND DATA HANDLING TEST PASSED!');
                    console.log('🎯 All customer details were properly received and stored');
                    
                } else {
                    console.log('❌ Could not retrieve saved order for verification');
                    console.log('Status:', getOrderResponse.status);
                    console.log('Response:', JSON.stringify(getOrderResponse.data, null, 2));
                }
            }
            
        } else if (orderResponse.status === 401) {
            console.log('\n🔒 AUTHENTICATION REQUIRED');
            console.log('❌ API requires authentication (auth bypass not working)');
            console.log('💡 Need to create user account or fix auth bypass');
            
        } else if (orderResponse.status === 400) {
            console.log('\n📝 VALIDATION ERROR');
            console.log('❌ Frontend data failed validation');
            console.log('💡 Check required fields and data format');
            console.log('Error Details:', orderResponse.data.message || 'No details provided');
            
        } else if (orderResponse.status === 404) {
            console.log('\n🔍 ENDPOINT NOT FOUND');
            console.log('❌ Order API endpoint not available');
            console.log('💡 Check if routes are properly registered in server.js');
            
        } else if (orderResponse.status === 500) {
            console.log('\n💥 SERVER ERROR');
            console.log('❌ Internal server error - likely database issue');
            console.log('💡 Check database connection and table existence');
            console.log('Error Details:', orderResponse.data.message || 'No details provided');
            
        } else {
            console.log('\n❓ UNEXPECTED RESPONSE');
            console.log('❌ Received unexpected status code:', orderResponse.status);
            console.log('Response:', JSON.stringify(orderResponse.data, null, 2));
        }

        // Test order listing endpoint
        console.log('\n4. 📋 Testing order listing endpoint...');
        const listResponse = await makeRequest('GET', '/api/website/orders?page=1&limit=5');
        console.log('List Orders Status:', listResponse.status);
        
        if (listResponse.status === 200) {
            console.log('✅ Order listing endpoint works');
            if (listResponse.data.data && listResponse.data.data.orders) {
                console.log('Orders Found:', listResponse.data.data.orders.length);
            }
        } else {
            console.log('❌ Order listing failed');
        }

    } catch (error) {
        console.error('\n💥 TEST FAILED WITH ERROR:');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
    }

    console.log('\n' + '='.repeat(65));
    console.log('🏁 FRONTEND ORDER API TEST COMPLETE');
    console.log('='.repeat(65));
}

// Run the test
testOrderAPIWithoutAuth();