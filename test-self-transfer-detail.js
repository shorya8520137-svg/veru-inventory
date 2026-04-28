const https = require('https');

function httpsPost(path, body) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const req = https.request({
            hostname: 'api.giftgala.in', port: 443, path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(postData); req.end();
    });
}

function httpsGet(url, token) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        }).on('error', reject);
    });
}

async function main() {
    const loginRes = await httpsPost('/api/auth/login', { email: 'admin@company.com', password: 'Admin@123' });
    const token = loginRes.data.token;

    // Test self-transfer detail API with the reference from store timeline
    const ref = 'TRF_1777320586284';
    console.log('🔍 Fetching self-transfer details for:', ref);
    
    const res = await httpsGet(`https://api.giftgala.in/api/self-transfer/${ref}`, token);
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
}

main().catch(console.error);
