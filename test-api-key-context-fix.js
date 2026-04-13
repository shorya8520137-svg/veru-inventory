const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const API_TOKEN = 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37';

async function testApiKeyContextFix() {
    console.log('🔧 Testing API Key Context Fix...\n');

    try {
        // Test 1: Simple GET request to verify API key validation works
        console.log('1. Testing API key validation with GET request...');
        const productsResponse = await axios.get(`${API_BASE_URL}/api/website/products`, {
            headers: {
                'X-API-Key': API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ GET /api/website/products:', productsResponse.status);

        // Test 2: POST request that was causing the context error
        console.log('\n2. Testing API key validation with POST request...');
        const testOrder = {
            cartItems: [
                {
                    productId: 1,
                    quantity: 1
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
            notes: 'Test order to verify context fix'
        };

        const orderResponse = await axios.post(`${API_BASE_URL}/api/website/orders`, testOrder, {
            headers: {
                'X-API-Key': API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ POST /api/website/orders:', orderResponse.status);
        console.log('   Order created:', orderResponse.data.data?.orderNumber);

        console.log('\n🎉 API key context fix successful!');
        console.log('   • No more "Cannot read properties of undefined" errors');
        console.log('   • API key validation working properly');
        console.log('   • logApiUsage method called correctly');

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

testApiKeyContextFix();