#!/usr/bin/env node

const https = require('https');

function testConnection() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: '/api/auth/login',
            method: 'POST',
            rejectUnauthorized: false,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`✅ Server is running! Status: ${res.statusCode}`);
                console.log('Response:', data);
                resolve({ statusCode: res.statusCode, data });
            });
        });

        req.on('error', (err) => {
            console.log(`❌ Server connection failed: ${err.message}`);
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log('❌ Connection timeout');
            reject(new Error('Timeout'));
        });

        // Send test login data
        req.write(JSON.stringify({
            username: 'test',
            password: 'test'
        }));
        req.end();
    });
}

console.log('🔍 Testing server connection...');
testConnection().catch(console.error);