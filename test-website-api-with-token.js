#!/usr/bin/env node

const https = require('https');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsIm5hbWUiOiJTeXN0ZW0gQWRtaW5pc3RyYXRvciIsInJvbGVfaWQiOjEsInJvbGVfbmFtZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzY5OTQ2MzMxLCJleHAiOjE3NzAwMzI3MzEsImF1ZCI6ImludmVudG9yeS11c2VycyIsImlzcyI6ImludmVudG9yeS1zeXN0ZW0ifQ.Ztm6oO9koaSn2uSaKS2mmdjcn7lMcO60j3JNj0JvxJ8';

function testAPI(path, method = 'GET', data = null, useAuth = false) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (useAuth) {
            headers['Authorization'] = `Bearer ${TOKEN}`;
        }

        if (data) {
            headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
        }

        const options = {
            hostname: '54.169.31.95',
            port: 8443,
            path: path,
            method: method,
            rejectUnauthorized: false,
            timeout: 10000,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                console.log(`${method} ${path} -> Status: ${res.statusCode}`);
                try {
                    const parsed = JSON.parse(responseData);
                    console.log('Response:', JSON.stringify(parsed, null, 2));
                } catch (e) {
                    console.log('Raw response:', responseData);
                }
                console.log('---');
                resolve({ statusCode: res.statusCode, data: responseData });
            });
        });

        req.on('error', (err) => {
            console.log(`${method} ${path} -> Error: ${err.message}`);
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`${method} ${path} -> Timeout`);
            reject(new Error('Timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing Website Products API');
    console.log('================================');

    try {
        // Test 1: Get categories (should be public)
        console.log('1️⃣ Testing GET /api/website/categories (public)');
        await testAPI('/api/website/categories');

        // Test 2: Get products (should be public)
        console.log('2️⃣ Testing GET /api/website/products (public)');
        await testAPI('/api/website/products');

        // Test 3: Create category (protected)
        console.log('3️⃣ Testing POST /api/website/categories (protected)');
        await testAPI('/api/website/categories', 'POST', {
            name: 'Test Category',
            description: 'Test category for API testing'
        }, true);

        // Test 4: Create product (protected)
        console.log('4️⃣ Testing POST /api/website/products (protected)');
        await testAPI('/api/website/products', 'POST', {
            product_name: 'Test Product',
            description: 'Test product for API testing',
            price: 29.99,
            category_id: 1
        }, true);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

runTests();