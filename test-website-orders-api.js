const https = require('https');

// Disable SSL certificate verification for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const API_BASE = 'https://54.169.31.95:8443';

// Test data
const testOrder = {
    cartItems: [
        {
            productId: "1",
            quantity: 2,
            customization: {
                text: "Happy Birthday",
                color: "blue",
                size: "medium"
            }
        }
    ],
    shippingAddress: {
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        addressLine1: "123 Main St",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "USA"
    },
    billingAddress: {
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        addressLine1: "123 Main St",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "USA"
    },
    paymentMethod: "credit_card",
    notes: "Please handle with care"
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

async function testWebsiteOrdersAPI() {
    console.log('🧪 Testing Website Orders API...\n');

    try {
        // Step 1: Login to get token
        console.log('1. 🔐 Logging in...');
        const loginResponse = await makeRequest('POST', '/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        if (loginResponse.status !== 200 || !loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Step 2: Test GET orders (should work even if no orders exist)
        console.log('\n2. 📋 Testing GET /api/website/orders...');
        const getOrdersResponse = await makeRequest('GET', '/api/website/orders?page=1&limit=10', null, token);
        
        console.log(`Status: ${getOrdersResponse.status}`);
        console.log('Response:', JSON.stringify(getOrdersResponse.data, null, 2));

        if (getOrdersResponse.status === 200) {
            console.log('✅ GET orders endpoint working');
        } else {
            console.log('❌ GET orders endpoint failed');
        }

        // Step 3: Test POST order creation
        console.log('\n3. 🛒 Testing POST /api/website/orders...');
        const createOrderResponse = await makeRequest('POST', '/api/website/orders', testOrder, token);
        
        console.log(`Status: ${createOrderResponse.status}`);
        console.log('Response:', JSON.stringify(createOrderResponse.data, null, 2));

        if (createOrderResponse.status === 201) {
            console.log('✅ POST order creation working');
            
            // Step 4: Test GET specific order
            const orderId = createOrderResponse.data.data.orderId;
            console.log(`\n4. 🔍 Testing GET /api/website/orders/${orderId}...`);
            const getOrderResponse = await makeRequest('GET', `/api/website/orders/${orderId}`, null, token);
            
            console.log(`Status: ${getOrderResponse.status}`);
            console.log('Response:', JSON.stringify(getOrderResponse.data, null, 2));

            if (getOrderResponse.status === 200) {
                console.log('✅ GET specific order working');
            } else {
                console.log('❌ GET specific order failed');
            }
        } else {
            console.log('❌ POST order creation failed');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
testWebsiteOrdersAPI();