// Test Profile API
// Run this to check if the API is returning correct data

const https = require('https');

// Get token from command line argument
const token = process.argv[2];

if (!token) {
    console.log('Usage: node test-profile-api.js YOUR_JWT_TOKEN');
    console.log('\nTo get your token:');
    console.log('1. Login to https://api.giftgala.in');
    console.log('2. Open browser console (F12)');
    console.log('3. Type: localStorage.getItem("token")');
    console.log('4. Copy the token and run: node test-profile-api.js "YOUR_TOKEN"');
    process.exit(1);
}

const options = {
    hostname: 'api.giftgala.in',
    port: 443,
    path: '/api/users/profile',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

console.log('Testing Profile API...');
console.log('URL: https://api.giftgala.in/api/users/profile');
console.log('Token:', token.substring(0, 20) + '...');
console.log('');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        console.log('');
        console.log('Response Body:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
            
            console.log('');
            console.log('=== ANALYSIS ===');
            if (json.success) {
                console.log('✓ API call successful');
                
                const user = json.user || json.data;
                if (user) {
                    console.log('✓ User data found');
                    console.log('  - Name:', user.name || 'MISSING');
                    console.log('  - Email:', user.email || 'MISSING');
                    console.log('  - Phone:', user.phone || 'MISSING');
                    console.log('  - Address:', user.address || 'MISSING');
                    console.log('  - Profile Image:', user.profile_image || user.avatar || 'MISSING');
                    console.log('  - Role:', user.role_name || user.role_display_name || 'MISSING');
                } else {
                    console.log('✗ User data NOT found in response');
                    console.log('  Response structure:', Object.keys(json));
                }
            } else {
                console.log('✗ API call failed');
                console.log('  Message:', json.message || 'No error message');
            }
        } catch (e) {
            console.log('Raw response:', data);
            console.log('Parse error:', e.message);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error.message);
});

req.end();
