/**
 * Run this on the Ubuntu server to test webhook connectivity:
 * node test-webhook-connectivity.js
 */
const http = require('http');

function testWebhook(message, language) {
    return new Promise((resolve) => {
        const body = JSON.stringify({ message, language, source: 'customer' });
        const options = {
            hostname: '13.215.172.213',
            port: 5678,
            path: '/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030',
            method: 'POST',
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        console.log(`\n🔍 Testing: message="${message}" language="${language}"`);
        console.log(`📡 POST http://${options.hostname}:${options.port}${options.path}`);
        console.log(`📤 Body: ${body}`);

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`✅ Status: ${res.statusCode}`);
                console.log(`📦 Raw response: ${data}`);
                try {
                    const json = JSON.parse(data);
                    console.log(`📋 reply_local: ${json.reply_local}`);
                    console.log(`📋 reply_en: ${json.reply_en}`);
                    resolve({ success: true, data: json });
                } catch(e) {
                    console.log(`⚠️ Parse error: ${e.message}`);
                    resolve({ success: false, raw: data });
                }
            });
        });

        req.on('error', (e) => {
            console.log(`❌ Connection error: ${e.message}`);
            resolve({ success: false, error: e.message });
        });
        req.on('timeout', () => {
            console.log(`⏱️ Timeout after 8s`);
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });

        req.write(body);
        req.end();
    });
}

async function runTests() {
    console.log('=== WEBHOOK CONNECTIVITY TEST (POST JSON) ===\n');
    await testWebhook('Tamil', 'ta');
    await testWebhook('hello', 'ta');
    await testWebhook('வணக்கம்', 'ta');
    await testWebhook('How can I help you?', 'ta');
    console.log('\n=== TEST COMPLETE ===');
}

runTests();
