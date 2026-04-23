/**
 * Test Self Transfer API
 * Quick test to verify the API is working correctly
 */

const https = require('https');

const testData = {
    sourceType: 'warehouse',
    sourceId: 'BLR_WH',
    destinationType: 'store', 
    destinationId: 'BLR_BROOKEFIELD',
    items: [
        {
            productId: 'Unknown Product | | 2460-3499',
            transferQty: 1
        }
    ],
    notes: 'API Test Transfer'
};

const postData = JSON.stringify(testData);

const options = {
    hostname: 'api.giftgala.in',
    port: 443,
    path: '/api/self-transfer',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
    }
};

console.log('🧪 Testing Self Transfer API...');
console.log('📤 Sending request to:', `https://${options.hostname}${options.path}`);
console.log('📦 Payload:', testData);

const req = https.request(options, (res) => {
    console.log(`\n📊 Status Code: ${res.statusCode}`);
    console.log('📋 Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n📥 Response:');
        try {
            const response = JSON.parse(data);
            console.log(JSON.stringify(response, null, 2));
            
            if (response.success) {
                console.log('\n✅ Self Transfer API Test PASSED!');
                console.log(`🎯 Transfer ID: ${response.transferId}`);
            } else {
                console.log('\n❌ Self Transfer API Test FAILED!');
                console.log(`💥 Error: ${response.message}`);
            }
        } catch (e) {
            console.log('Raw response:', data);
            console.log('Parse error:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();