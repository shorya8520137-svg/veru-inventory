// Test frontend authentication flow
const https = require('https');

const API_BASE = 'https://54.169.31.95:8443';

// Test login with credentials
async function testLogin() {
    return new Promise((resolve, reject) => {
        const loginData = JSON.stringify({
            username: 'admin', // Replace with actual username
            password: 'admin123' // Replace with actual password
        });

        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Login Status:', res.statusCode);
                console.log('Login Response:', data);
                
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        resolve(response.token);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`Login failed: ${res.statusCode} - ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Login timeout'));
        });
        
        req.write(loginData);
        req.end();
    });
}

// Test API with token
async function testAPIWithToken(token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/products?page=1&limit=5',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('API Status:', res.statusCode);
                console.log('API Response:', data.substring(0, 200) + '...');
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', (e) => reject(e));
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('API timeout'));
        });
        
        req.end();
    });
}

// Run the test
async function runTest() {
    try {
        console.log('🔐 Testing login...');
        const token = await testLogin();
        console.log('✅ Login successful! Token received.');
        
        console.log('\n📡 Testing API with token...');
        const apiResult = await testAPIWithToken(token);
        
        if (apiResult.status === 200) {
            console.log('✅ API call successful!');
            console.log('🎉 Authentication flow is working correctly.');
        } else {
            console.log('❌ API call failed:', apiResult.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Possible solutions:');
        console.log('1. Check if the server is running');
        console.log('2. Verify login credentials');
        console.log('3. Check if the login endpoint exists');
        console.log('4. Ensure the database is connected');
    }
}

runTest();