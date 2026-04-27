/**
 * LOGIN AND GET TOKEN
 * This script logs in and gets a fresh token
 */

const https = require('https');

const credentials = {
    email: 'admin@company.com',
    password: 'Admin@123'
};

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.giftgala.in',
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        body: JSON.parse(responseData)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        body: responseData
                    });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function loginAndGetToken() {
    console.log('🔐 Logging in to get fresh token...\n');
    
    try {
        // Try login endpoint
        console.log('Attempting login...');
        const response = await makeRequest('/api/auth/login', 'POST', credentials);
        
        if (response.statusCode === 200 && response.body.token) {
            console.log('✅ Login successful!\n');
            console.log('🎫 Your fresh token:');
            console.log(response.body.token);
            console.log('\n📋 Now run:');
            console.log(`node test-api-automated.js "${response.body.token}"`);
            return response.body.token;
        } else {
            console.log('❌ Login failed:', response.statusCode);
            console.log(response.body);
            
            // Try alternative login endpoint
            console.log('\nTrying alternative endpoint...');
            const altResponse = await makeRequest('/api/login', 'POST', credentials);
            
            if (altResponse.statusCode === 200 && altResponse.body.token) {
                console.log('✅ Login successful!\n');
                console.log('🎫 Your fresh token:');
                console.log(altResponse.body.token);
                console.log('\n📋 Now run:');
                console.log(`node test-api-automated.js "${altResponse.body.token}"`);
                return altResponse.body.token;
            } else {
                console.log('❌ Alternative login also failed:', altResponse.statusCode);
                console.log(altResponse.body);
                
                console.log('\n⚠️ Please get token manually:');
                console.log('1. Open https://giftgala.in');
                console.log('2. Login with: admin@company.com / Admin@123');
                console.log('3. Press F12 → Console');
                console.log('4. Type: localStorage.getItem("token")');
                console.log('5. Copy the token');
                console.log('6. Run: node test-api-automated.js "YOUR_TOKEN"');
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n⚠️ Please get token manually:');
        console.log('1. Open https://giftgala.in');
        console.log('2. Login with: admin@company.com / Admin@123');
        console.log('3. Press F12 → Console');
        console.log('4. Type: localStorage.getItem("token")');
        console.log('5. Copy the token');
        console.log('6. Run: node test-api-automated.js "YOUR_TOKEN"');
    }
}

loginAndGetToken();
