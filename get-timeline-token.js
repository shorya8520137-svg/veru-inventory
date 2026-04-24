const axios = require('axios');

// Helper script to get authentication token for timeline API testing
async function getAuthToken() {
    console.log('🔐 Getting Authentication Token for Timeline API...\n');
    
    const API_BASE = 'https://api.giftgala.in';
    
    // You need to provide valid login credentials
    const credentials = {
        email: 'your-email@example.com',    // Replace with your email
        password: 'your-password'           // Replace with your password
    };
    
    if (credentials.email === 'your-email@example.com') {
        console.log('❌ Please update the credentials in this script');
        console.log('💡 Update the email and password variables with your actual login credentials\n');
        return;
    }
    
    try {
        console.log('📡 Attempting login...');
        console.log(`🔗 POST ${API_BASE}/api/auth/login`);
        
        const response = await axios.post(`${API_BASE}/api/auth/login`, credentials, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success && response.data.token) {
            console.log('✅ Login successful!');
            console.log('🎫 Token obtained:');
            console.log(`${response.data.token}\n`);
            
            console.log('📋 Copy this token and use it in your timeline API tests:');
            console.log(`const TOKEN = '${response.data.token}';`);
            console.log('');
            
            // Test the token immediately
            await testTokenValidity(response.data.token);
            
            return response.data.token;
            
        } else {
            console.log('❌ Login failed - Invalid response format');
            console.log('📋 Response:', JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Login Error:');
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📋 Response:', error.response.data);
            
            if (error.response.status === 401) {
                console.error('\n💡 Authentication failed - Check your credentials:');
                console.error('   - Email might be incorrect');
                console.error('   - Password might be incorrect');
                console.error('   - Account might be disabled');
            }
            
        } else if (error.request) {
            console.error('📡 Network Error:', error.message);
            console.error('💡 Check if API server is running and accessible');
        } else {
            console.error('⚙️ Setup Error:', error.message);
        }
    }
}

// Test if the token is valid
async function testTokenValidity(token) {
    console.log('🧪 Testing token validity...');
    
    try {
        const response = await axios.get('https://api.giftgala.in/api/timeline/2005-999', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Token is valid! Timeline API accessible');
        console.log(`📊 Sample response: ${response.data.data?.timeline?.length || 0} timeline entries found`);
        
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('❌ Token is invalid or expired');
        } else if (error.response?.status === 403) {
            console.log('⚠️ Token is valid but user lacks timeline permissions');
        } else {
            console.log(`⚠️ Token test inconclusive: ${error.response?.status || 'Network Error'}`);
        }
    }
}

// Alternative: Manual token input
function manualTokenInput() {
    console.log('📝 Manual Token Input Guide:\n');
    
    console.log('1. Open your browser and go to: https://api.giftgala.in');
    console.log('2. Login to your account');
    console.log('3. Open browser Developer Tools (F12)');
    console.log('4. Go to Console tab');
    console.log('5. Type: localStorage.getItem("token")');
    console.log('6. Copy the token value (without quotes)');
    console.log('7. Use it in your timeline API tests\n');
    
    console.log('📋 Example usage:');
    console.log('const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";');
    console.log('');
    
    console.log('🧪 Test the token with:');
    console.log('curl -X GET "https://api.giftgala.in/api/timeline/2005-999" \\');
    console.log('  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\');
    console.log('  -H "Content-Type: application/json"');
}

// Generate ready-to-use timeline API test with token
function generateTimelineTest(token) {
    if (!token) {
        console.log('❌ No token provided');
        return;
    }
    
    console.log('📋 Ready-to-use Timeline API Test:\n');
    
    const testScript = `
const axios = require('axios');

async function testTimeline() {
    const TOKEN = '${token}';
    const API_BASE = 'https://api.giftgala.in';
    const BARCODE = '2005-999';
    
    try {
        const response = await axios.get(\`\${API_BASE}/api/timeline/\${BARCODE}\`, {
            headers: {
                'Authorization': \`Bearer \${TOKEN}\`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Timeline API Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testTimeline();
`;
    
    console.log(testScript);
}

// Run the token getter
if (require.main === module) {
    console.log('🚀 Token Acquisition Options:');
    console.log('1. Automatic login (update credentials first)');
    console.log('2. Manual token input guide\n');
    
    // Uncomment the method you want to use:
    getAuthToken();
    // manualTokenInput();
}

module.exports = {
    getAuthToken,
    testTokenValidity,
    manualTokenInput,
    generateTimelineTest
};