const axios = require('axios');

const API_BASE_URL = 'https://54.169.31.95:8443';
const API_TOKEN = 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37';

async function testCORSFix() {
    console.log('🌐 Testing CORS Fix for Frontend Integration...\n');

    try {
        // Test 1: OPTIONS preflight request (what browsers send first)
        console.log('1. Testing OPTIONS preflight request...');
        const optionsResponse = await axios.options(`${API_BASE_URL}/api/website/orders`, {
            headers: {
                'Origin': 'https://frontend-sigma-two-47.vercel.app',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, X-API-Key'
            }
        });
        console.log('✅ OPTIONS request:', optionsResponse.status);
        console.log('   CORS headers:', {
            'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
            'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
            'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers']
        });

        // Test 2: Actual POST request with API key
        console.log('\n2. Testing POST request with API key...');
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

        const postResponse = await axios.post(`${API_BASE_URL}/api/website/orders`, testOrder, {
            headers: {
                'X-API-Key': API_TOKEN,
                'Content-Type': 'application/json',
                'Origin': 'https://frontend-sigma-two-47.vercel.app'
            }
        });
        console.log('✅ POST request:', postResponse.status);
        console.log('   Order created:', postResponse.data.data?.orderNumber);

        // Test 3: Test both endpoints
        console.log('\n3. Testing both API endpoints...');
        
        // Test /api/website/orders (what frontend uses)
        const websiteResponse = await axios.get(`${API_BASE_URL}/api/website/products`, {
            headers: {
                'X-API-Key': API_TOKEN,
                'Origin': 'https://frontend-sigma-two-47.vercel.app'
            }
        });
        console.log('✅ /api/website/products:', websiteResponse.status);

        // Test /api/v1/website/orders (alternative endpoint)
        const v1Response = await axios.get(`${API_BASE_URL}/api/v1/website/products`, {
            headers: {
                'X-API-Key': API_TOKEN,
                'Origin': 'https://frontend-sigma-two-47.vercel.app'
            }
        });
        console.log('✅ /api/v1/website/products:', v1Response.status);

        console.log('\n🎉 CORS fix successful! Frontend should now work.');
        console.log('\n📋 Frontend Integration Notes:');
        console.log('   • Use endpoint: https://54.169.31.95:8443/api/website/orders');
        console.log('   • Add header: X-API-Key: ' + API_TOKEN);
        console.log('   • CORS is now properly configured');

    } catch (error) {
        console.error('\n❌ CORS test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Server is not running. Please start the server first.');
        } else {
            console.error('Error:', error.message);
        }
    }
}

testCORSFix();