/**
 * TEST 2FA DEBUG - Quick server test
 */

const axios = require('axios');

async function test2FADebug() {
    const baseURL = 'https://52.221.231.85:8443';
    
    try {
        console.log('🔐 Testing 2FA Debug...\n');
        
        // 1. Login first
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123'
        }, {
            httpsAgent: new (require('https').Agent)({
                rejectUnauthorized: false
            })
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // 2. Get 2FA status
        console.log('\n2️⃣ Getting 2FA status...');
        const statusResponse = await axios.get(`${baseURL}/api/2fa/status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            httpsAgent: new (require('https').Agent)({
                rejectUnauthorized: false
            })
        });
        
        console.log('2FA Status:', statusResponse.data);
        
        // 3. If not enabled, setup 2FA
        if (!statusResponse.data.data.enabled) {
            console.log('\n3️⃣ Setting up 2FA...');
            const setupResponse = await axios.post(`${baseURL}/api/2fa/setup`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false
                })
            });
            
            console.log('Setup Response:', {
                success: setupResponse.data.success,
                hasSecret: !!setupResponse.data.data?.secret,
                secretLength: setupResponse.data.data?.secret?.length,
                hasQR: !!setupResponse.data.data?.qrCodeUrl,
                backupCodesCount: setupResponse.data.data?.backupCodes?.length
            });
            
            if (setupResponse.data.success) {
                console.log('\n📱 QR Code URL:', setupResponse.data.data.qrCodeUrl);
                console.log('🔑 Manual Entry Key:', setupResponse.data.data.secret);
                console.log('\n⚠️ Please scan the QR code or enter the manual key in your authenticator app');
                console.log('⚠️ Then run this script again with the 6-digit code');
            }
        } else {
            console.log('\n✅ 2FA is already enabled');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.response?.data || error.message);
    }
}

// Run the test
test2FADebug().catch(console.error);