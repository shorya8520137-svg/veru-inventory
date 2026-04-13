const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const API_TOKEN = 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37';

async function testServerAndAPI() {
    console.log('🚀 Testing Server Fix and API Token...\n');

    try {
        // Test 1: Server Health Check
        console.log('1. Testing server health...');
        const healthResponse = await axios.get(`${API_BASE_URL}/api/health`, {
            timeout: 5000
        });
        console.log('✅ Server is running:', healthResponse.status);

        // Test 2: Products API with token
        console.log('\n2. Testing Products API with token...');
        const productsResponse = await axios.get(`${API_BASE_URL}/api/v1/website/products`, {
            headers: {
                'X-API-Key': API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Products API:', productsResponse.status, `(${productsResponse.data.data?.length || 0} products)`);

        // Test 3: Categories API with token
        console.log('\n3. Testing Categories API with token...');
        const categoriesResponse = await axios.get(`${API_BASE_URL}/api/v1/website/categories`, {
            headers: {
                'X-API-Key': API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Categories API:', categoriesResponse.status, `(${categoriesResponse.data.data?.length || 0} categories)`);

        // Test 4: Orders API with token (this was failing before)
        console.log('\n4. Testing Orders API with token...');
        const testOrder = {
            cartItems: [
                {
                    productId: 1,
                    quantity: 1,
                    customization: { color: 'red', size: 'M' }
                }
            ],
            shippingAddress: {
                name: 'Test Customer',
                phone: '+1234567890',
                addressLine1: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                zipCode: '12345',
                country: 'USA'
            },
            paymentMethod: 'credit_card',
            notes: 'Test order via API'
        };

        const orderResponse = await axios.post(`${API_BASE_URL}/api/v1/website/orders`, testOrder, {
            headers: {
                'X-API-Key': API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Orders API:', orderResponse.status, 'Order created:', orderResponse.data.data?.orderNumber);

        console.log('\n🎉 All API tests passed! The server fix worked.');

    } catch (error) {
        console.error('\n❌ Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Server is not running. Please start the server first.');
        } else {
            console.error('Error:', error.message);
        }
    }
}

testServerAndAPI();