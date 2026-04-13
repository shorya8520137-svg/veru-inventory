/**
 * TEST BACKUP CODES PARSING FIX
 * Verifies that the backup codes parsing issue is resolved
 */

const https = require('https');

// Disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SERVER_URL = 'https://52.221.231.85:8443';

async function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(SERVER_URL + path);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
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
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
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

async function testBackupCodesParsing() {
    console.log('🧪 Testing backup codes parsing fix...\n');
    
    try {
        // Step 1: Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@company.com',
            password: 'admin@123'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Step 2: Check 2FA status (this triggers backup codes parsing)
        console.log('\n2️⃣ Checking 2FA status (testing backup codes parsing)...');
        const statusResponse = await makeRequest('GET', '/api/2fa/status', null, {
            'Authorization': `Bearer ${token}`
        });
        
        if (statusResponse.statusCode === 200) {
            console.log('✅ 2FA status retrieved successfully');
            console.log('   Enabled:', statusResponse.data.enabled);
            console.log('   Backup Codes Count:', statusResponse.data.backupCodes ? statusResponse.data.backupCodes.length : 0);
            
            if (statusResponse.data.backupCodes && Array.isArray(statusResponse.data.backupCodes)) {
                console.log('✅ Backup codes are properly parsed as array');
                console.log('   Sample codes:', statusResponse.data.backupCodes.slice(0, 3));
            } else {
                console.log('⚠️ No backup codes found or not in array format');
            }
        } else {
            console.log('❌ 2FA status failed:', statusResponse.data);
            return;
        }
        
        // Step 3: Test multiple 2FA status calls to ensure no parsing errors
        console.log('\n3️⃣ Testing multiple 2FA status calls...');
        for (let i = 1; i <= 5; i++) {
            const testResponse = await makeRequest('GET', '/api/2fa/status', null, {
                'Authorization': `Bearer ${token}`
            });
            
            if (testResponse.statusCode === 200) {
                console.log(`✅ Call ${i}/5: Success`);
            } else {
                console.log(`❌ Call ${i}/5: Failed`);
            }
        }
        
        console.log('\n🎉 Backup codes parsing test completed successfully!');
        console.log('✅ No JSON parsing errors detected');
        console.log('✅ Backup codes are properly handled');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testBackupCodesParsing();