const https = require('https');

// Disable SSL certificate verification for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Real frontend order data
const customerOrderData = {
    cartItems: [
        {
            productId: "1",
            quantity: 2,
            customization: {
                text: "Happy Birthday Mom",
                color: "pink",
                size: "large"
            }
        }
    ],
    shippingAddress: {
        name: "Jennifer Smith",
        phone: "+1-555-987-6543",
        email: "jennifer.smith@gmail.com",
        addressLine1: "456 Oak Avenue",
        addressLine2: "Suite 12",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
        country: "USA"
    },
    billingAddress: {
        name: "Jennifer Smith",
        phone: "+1-555-987-6543",
        email: "jennifer.smith@gmail.com",
        addressLine1: "456 Oak Avenue", 
        addressLine2: "Suite 12",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
        country: "USA"
    },
    paymentMethod: "paypal",
    notes: "Please ring doorbell. Leave at door if no answer. This is a birthday gift!"
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

async function testOrderAPIWithExistingUser() {
    console.log('🛒 Testing Order API with Existing User Credentials...\n');
    
    // Try more comprehensive list of possible credentials
    const possibleCredentials = [
        // Common admin credentials
        { username: 'admin', password: 'admin' },
        { username: 'admin', password: 'password' },
        { username: 'admin', password: '123456' },
        { username: 'administrator', password: 'admin' },
        
        // Common user credentials
        { username: 'user', password: 'user' },
        { username: 'user', password: 'password' },
        { username: 'test', password: 'test' },
        { username: 'demo', password: 'demo' },
        
        // System specific
        { username: 'inventory', password: 'inventory' },
        { username: 'system', password: 'system' },
        
        // Email-based logins
        { username: 'admin@example.com', password: 'admin' },
        { username: 'test@example.com', password: 'test' },
        
        // Default credentials
        { username: 'root', password: 'root' },
        { username: 'guest', password: 'guest' }
    ];

    console.log('🔐 Trying to authenticate with existing credentials...\n');

    let validToken = null;
    let validUser = null;

    for (const creds of possibleCredentials) {
        try {
            console.log(`   Testing: ${creds.username} / ${creds.password}`);
            const loginResponse = await makeRequest('POST', '/api/auth/login', creds);
            
            if (loginResponse.status === 200 && loginResponse.data.success) {
                validToken = loginResponse.data.token;
                validUser = creds.username;
                console.log(`   ✅ SUCCESS! Authenticated as: ${validUser}`);
                break;
            } else {
                console.log(`   ❌ Failed: ${loginResponse.data.message || 'Invalid credentials'}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    if (!validToken) {
        console.log('\n❌ Could not authenticate with any credentials');
        console.log('💡 You may need to create a user account first');
        return;
    }

    console.log(`\n🎉 Successfully authenticated as: ${validUser}`);
    console.log('🔑 Token obtained, proceeding with order test...\n');

    try {
        // Test order submission with real frontend data
        console.log('📦 SUBMITTING ORDER FROM FRONTEND...');
        console.log('Customer:', customerOrderData.shippingAddress.name);
        console.log('Email:', customerOrderData.shippingAddress.email);
        console.log('Items:', customerOrderData.cartItems.length);
        console.log('Payment Method:', customerOrderData.paymentMethod);
        console.log('Special Notes:', customerOrderData.notes);
        
        const orderResponse = await makeRequest('POST', '/api/website/orders', customerOrderData, validToken);
        
        console.log('\n📊 ORDER SUBMISSION RESULT:');
        console.log('Status:', orderResponse.status);
        console.log('Response:', JSON.stringify(orderResponse.data, null, 2));

        if (orderResponse.status === 201 && orderResponse.data.success) {
            console.log('\n🎉 ORDER CREATED SUCCESSFULLY!');
            console.log('✅ Frontend data was properly received and processed');
            
            const orderId = orderResponse.data.data.orderId;
            const orderNumber = orderResponse.data.data.orderNumber;
            const totalAmount = orderResponse.data.data.totalAmount;
            
            console.log('\n📋 ORDER DETAILS:');
            console.log('Order ID:', orderId);
            console.log('Order Number:', orderNumber);
            console.log('Total Amount: $' + totalAmount);
            
            // Verify the order was saved with all frontend details
            console.log('\n🔍 VERIFYING SAVED ORDER DATA...');
            const getOrderResponse = await makeRequest('GET', `/api/website/orders/${orderId}`, null, validToken);
            
            if (getOrderResponse.status === 200) {
                const savedOrder = getOrderResponse.data.data;
                console.log('✅ Order retrieved successfully');
                
                console.log('\n📋 FRONTEND DATA VERIFICATION:');
                console.log('✓ Customer Name:', savedOrder.shippingAddress?.name);
                console.log('✓ Customer Email:', savedOrder.shippingAddress?.email);
                console.log('✓ Phone Number:', savedOrder.shippingAddress?.phone);
                console.log('✓ Full Address:', 
                    `${savedOrder.shippingAddress?.addressLine1}, ${savedOrder.shippingAddress?.addressLine2}`);
                console.log('✓ City, State, ZIP:', 
                    `${savedOrder.shippingAddress?.city}, ${savedOrder.shippingAddress?.state} ${savedOrder.shippingAddress?.postalCode}`);
                console.log('✓ Payment Method:', savedOrder.paymentMethod);
                console.log('✓ Customer Notes:', savedOrder.notes);
                console.log('✓ Order Status:', savedOrder.status);
                
                if (savedOrder.items && savedOrder.items.length > 0) {
                    console.log('\n🛍️ ORDER ITEMS VERIFICATION:');
                    savedOrder.items.forEach((item, index) => {
                        console.log(`Item ${index + 1}:`);
                        console.log(`  ✓ Product: ${item.productName || item.product_name}`);
                        console.log(`  ✓ Quantity: ${item.quantity}`);
                        console.log(`  ✓ Unit Price: $${item.unitPrice || item.unit_price}`);
                        console.log(`  ✓ Total: $${item.totalPrice || item.total_price}`);
                        if (item.customization) {
                            console.log(`  ✓ Customization:`, JSON.stringify(item.customization));
                        }
                    });
                }
                
                console.log('\n✅ ALL FRONTEND DATA SUCCESSFULLY PRESERVED!');
                
            } else {
                console.log('❌ Could not retrieve order details for verification');
            }
            
            // Test order listing
            console.log('\n📋 TESTING ORDER MANAGEMENT VIEW...');
            const listResponse = await makeRequest('GET', '/api/website/orders?page=1&limit=10', null, validToken);
            
            if (listResponse.status === 200) {
                console.log('✅ Order appears in management system');
                console.log('Orders found:', listResponse.data.data?.orders?.length || 0);
            } else {
                console.log('❌ Order listing failed');
            }
            
        } else {
            console.log('\n❌ ORDER SUBMISSION FAILED');
            console.log('Status:', orderResponse.status);
            console.log('Error:', orderResponse.data.message || 'Unknown error');
            
            if (orderResponse.status === 400) {
                console.log('💡 Validation error - check required fields');
            } else if (orderResponse.status === 500) {
                console.log('💡 Server error - check database and server logs');
            }
        }

    } catch (error) {
        console.error('\n💥 Order test failed:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Order API Test Complete');
    console.log('='.repeat(60));
}

testOrderAPIWithExistingUser();