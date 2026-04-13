#!/usr/bin/env node

const https = require('https');

function testAuth() {
    return new Promise((resolve, reject) => {
        const loginData = JSON.stringify({
            email: 'admin@company.com',
            password: 'Admin@123'
        });

        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/auth/login',
            method: 'POST',
            rejectUnauthorized: false,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                try {
                    const parsed = JSON.parse(data);
                    console.log('Response:', JSON.stringify(parsed, null, 2));
                    if (parsed.token) {
                        console.log('✅ Authentication successful!');
                        console.log('Token:', parsed.token.substring(0, 20) + '...');
                        resolve(parsed.token);
                    } else {
                        console.log('❌ No token received');
                        resolve(null);
                    }
                } catch (e) {
                    console.log('Raw response:', data);
                    resolve(null);
                }
            });
        });

        req.on('error', (err) => {
            console.log(`❌ Request failed: ${err.message}`);
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log('❌ Request timeout');
            reject(new Error('Timeout'));
        });

        req.write(loginData);
        req.end();
    });
}

console.log('🔐 Testing authentication with admin@company.com / Admin@123...');
testAuth().catch(console.error);