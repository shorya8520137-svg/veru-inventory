const fetch = require('node-fetch');

const API_BASE = 'https://54.169.31.95:8443';

async function testApiKeyCreation() {
    try {
        console.log('🔍 Testing API key creation...');
        
        // First, let's test login to get a token
        console.log('1. Testing login...');
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@example.com', // Replace with actual admin email
                password: 'admin123' // Replace with actual password
            })
        });

        if (!loginResponse.ok) {
            console.error('❌ Login failed:', loginResponse.status);
            const errorData = await loginResponse.text();
            console.error('Error:', errorData);
            return;
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        
        if (!loginData.token) {
            console.error('❌ No token received from login');
            return;
        }

        const token = loginData.token;
        console.log('Token received:', token.substring(0, 20) + '...');

        // Test API key creation
        console.log('\n2. Testing API key creation...');
        const createResponse = await fetch(`${API_BASE}/api/api-keys`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test API Key ' + Date.now(),
                description: 'Test API key for debugging'
            })
        });

        console.log('Create response status:', createResponse.status);
        
        if (!createResponse.ok) {
            console.error('❌ API key creation failed:', createResponse.status);
            const errorData = await createResponse.text();
            console.error('Error:', errorData);
            return;
        }

        const createData = await createResponse.json();
        console.log('✅ API key creation response:', createData);

        if (createData.success && createData.data.api_key) {
            console.log('🎉 API key created successfully!');
            console.log('Key:', createData.data.api_key);
            
            // Test fetching API keys
            console.log('\n3. Testing API key listing...');
            const listResponse = await fetch(`${API_BASE}/api/api-keys`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (listResponse.ok) {
                const listData = await listResponse.json();
                console.log('✅ API keys listed:', listData.data?.length || 0, 'keys found');
            } else {
                console.error('❌ Failed to list API keys:', listResponse.status);
            }
        } else {
            console.error('❌ API key creation failed - no key returned');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testApiKeyCreation();