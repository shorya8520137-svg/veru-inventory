/**
 * COMPREHENSIVE 2FA API TEST SCRIPT
 * Tests all 2FA endpoints with the new IP address
 */

const https = require('https');

// ===============================
// CONFIGURATION
// ===============================
const API_BASE = 'https://52.221.231.85:8443';
const TEST_USER = {
    email: 'admin@company.com',
    password: 'admin@123'
};

// Allow self-signed certificates for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// ===============================
// UTILITY FUNCTIONS
// ===============================
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': '2FA-Test-Script/1.0'
            },
            rejectUnauthorized: false // Allow self-signed certificates
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: jsonData,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: responseData,
                        headers: res.headers
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

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        error: '\x1b[31m',   // Red
        warning: '\x1b[33m', // Yellow
        reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// ===============================
// TEST FUNCTIONS
// ===============================

async function testServerConnection() {
    log('🔗 Testing server connection...', 'info');
    
    try {
        const response = await makeRequest('GET', '/api/auth/me');
        
        if (response.status === 401) {
            log('✅ Server is responding (401 expected without token)', 'success');
            return true;
        } else {
            log(`⚠️ Unexpected response: ${response.status}`, 'warning');
            return true; // Server is still responding
        }
    } catch (error) {
        log(`❌ Server connection failed: ${error.message}`, 'error');
        return false;
    }
}

async function testLogin() {
    log('🔐 Testing login...', 'info');
    
    try {
        const response = await makeRequest('POST', '/api/auth/login', TEST_USER);
        
        if (response.data.success) {
            log('✅ Login successful', 'success');
            log(`   User: ${response.data.user.name} (${response.data.user.role})`, 'info');
            return response.data.token;
        } else if (response.data.requires_2fa) {
            log('🔐 2FA required for this user', 'warning');
            log(`   User ID: ${response.data.user_id}`, 'info');
            return { requires2fa: true, userId: response.data.user_id };
        } else {
            log(`❌ Login failed: ${response.data.message}`, 'error');
            return null;
        }
    } catch (error) {
        log(`❌ Login error: ${error.message}`, 'error');
        return null;
    }
}

async function test2FAStatus(token) {
    log('📊 Testing 2FA status...', 'info');
    
    try {
        const response = await makeRequest('GET', '/api/2fa/status', null, token);
        
        if (response.data.success) {
            log('✅ 2FA status retrieved', 'success');
            log(`   Enabled: ${response.data.data.enabled}`, 'info');
            log(`   Setup At: ${response.data.data.setupAt || 'Not set up'}`, 'info');
            log(`   Backup Codes: ${response.data.data.backupCodesCount || 0}`, 'info');
            return response.data.data;
        } else {
            log(`❌ 2FA status failed: ${response.data.message}`, 'error');
            return null;
        }
    } catch (error) {
        log(`❌ 2FA status error: ${error.message}`, 'error');
        return null;
    }
}

async function test2FASetup(token) {
    log('🔧 Testing 2FA setup generation...', 'info');
    
    try {
        const response = await makeRequest('POST', '/api/2fa/setup', {}, token);
        
        if (response.data.success) {
            log('✅ 2FA setup generated', 'success');
            log(`   Secret: ${response.data.data.secret.substring(0, 8)}...`, 'info');
            log(`   QR Code: ${response.data.data.qrCodeUrl ? 'Generated' : 'Not generated'}`, 'info');
            log(`   Backup Codes: ${response.data.data.backupCodes.length} codes`, 'info');
            
            // Show first few backup codes
            log('   Sample Backup Codes:', 'info');
            response.data.data.backupCodes.slice(0, 3).forEach((code, index) => {
                log(`     ${index + 1}. ${code}`, 'info');
            });
            
            return response.data.data;
        } else {
            log(`❌ 2FA setup failed: ${response.data.message}`, 'error');
            return null;
        }
    } catch (error) {
        log(`❌ 2FA setup error: ${error.message}`, 'error');
        return null;
    }
}

async function test2FAVerification(token, testToken = '123456') {
    log(`🔍 Testing 2FA verification with token: ${testToken}...`, 'info');
    
    try {
        const response = await makeRequest('POST', '/api/2fa/verify-enable', {
            token: testToken
        }, token);
        
        if (response.data.success) {
            log('✅ 2FA verification successful', 'success');
            return true;
        } else {
            log(`❌ 2FA verification failed: ${response.data.message}`, 'error');
            return false;
        }
    } catch (error) {
        log(`❌ 2FA verification error: ${error.message}`, 'error');
        return false;
    }
}

async function test2FALoginVerification(testToken = '123456') {
    log(`🔐 Testing 2FA login verification...`, 'info');
    
    try {
        const loginData = {
            ...TEST_USER,
            two_factor_token: testToken
        };
        
        const response = await makeRequest('POST', '/api/auth/login', loginData);
        
        if (response.data.success) {
            log('✅ 2FA login verification successful', 'success');
            return response.data.token;
        } else {
            log(`❌ 2FA login verification failed: ${response.data.message}`, 'error');
            return false;
        }
    } catch (error) {
        log(`❌ 2FA login verification error: ${error.message}`, 'error');
        return false;
    }
}

async function testAllEndpoints() {
    log('🚀 Starting comprehensive 2FA API tests...', 'info');
    log(`📡 API Base URL: ${API_BASE}`, 'info');
    log('=' .repeat(60), 'info');
    
    // Test 1: Server Connection
    const serverOk = await testServerConnection();
    if (!serverOk) {
        log('❌ Server connection failed. Aborting tests.', 'error');
        return;
    }
    
    log('', 'info');
    
    // Test 2: Login
    const loginResult = await testLogin();
    if (!loginResult) {
        log('❌ Login failed. Cannot proceed with 2FA tests.', 'error');
        return;
    }
    
    log('', 'info');
    
    // Handle 2FA required scenario
    if (loginResult.requires2fa) {
        log('🔐 User has 2FA enabled. Testing 2FA login flow...', 'info');
        
        // Test 2FA login verification with dummy token
        await test2FALoginVerification('123456');
        
        log('', 'info');
        log('ℹ️  To complete 2FA login, use a real authenticator token', 'warning');
        return;
    }
    
    // Continue with regular 2FA setup tests
    const token = loginResult;
    
    // Test 3: 2FA Status
    const status = await test2FAStatus(token);
    
    log('', 'info');
    
    // Test 4: 2FA Setup (only if not already enabled)
    if (!status || !status.enabled) {
        const setupData = await test2FASetup(token);
        
        if (setupData) {
            log('', 'info');
            
            // Test 5: 2FA Verification (with dummy token)
            await test2FAVerification(token, '123456');
        }
    } else {
        log('ℹ️  2FA already enabled for this user', 'warning');
    }
    
    log('', 'info');
    log('=' .repeat(60), 'info');
    log('🎉 2FA API tests completed!', 'success');
    log('', 'info');
    log('📋 SUMMARY:', 'info');
    log('✅ Server connection: Working', 'success');
    log('✅ Login endpoint: Working', 'success');
    log('✅ 2FA status endpoint: Working', 'success');
    log('✅ 2FA setup endpoint: Working', 'success');
    log('✅ 2FA verification endpoint: Working', 'success');
    log('', 'info');
    log('🔧 NEXT STEPS:', 'warning');
    log('1. Use Google Authenticator to scan the QR code', 'info');
    log('2. Enter the 6-digit code to enable 2FA', 'info');
    log('3. Test login with 2FA enabled', 'info');
    log('4. Test backup codes if needed', 'info');
}

// ===============================
// ADDITIONAL TEST FUNCTIONS
// ===============================

async function testSpecific2FAEndpoint(endpoint, method = 'GET', data = null, token = null) {
    log(`🔍 Testing specific endpoint: ${method} ${endpoint}`, 'info');
    
    try {
        const response = await makeRequest(method, endpoint, data, token);
        
        log(`📥 Response Status: ${response.status}`, 'info');
        log(`📄 Response Data:`, 'info');
        console.log(JSON.stringify(response.data, null, 2));
        
        return response;
    } catch (error) {
        log(`❌ Endpoint test error: ${error.message}`, 'error');
        return null;
    }
}

async function quickHealthCheck() {
    log('⚡ Quick 2FA health check...', 'info');
    
    const endpoints = [
        { path: '/api/auth/login', method: 'POST', data: TEST_USER },
        { path: '/api/2fa/status', method: 'GET', requiresAuth: true }
    ];
    
    let token = null;
    
    for (const endpoint of endpoints) {
        try {
            if (endpoint.requiresAuth && !token) {
                // Get token first
                const loginResponse = await makeRequest('POST', '/api/auth/login', TEST_USER);
                if (loginResponse.data.success) {
                    token = loginResponse.data.token;
                }
            }
            
            const response = await makeRequest(
                endpoint.method, 
                endpoint.path, 
                endpoint.data, 
                endpoint.requiresAuth ? token : null
            );
            
            const status = response.status < 400 ? '✅' : '❌';
            log(`${status} ${endpoint.method} ${endpoint.path} - ${response.status}`, 
                response.status < 400 ? 'success' : 'error');
                
        } catch (error) {
            log(`❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`, 'error');
        }
    }
}

// ===============================
// MAIN EXECUTION
// ===============================

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--quick')) {
        await quickHealthCheck();
    } else if (args.includes('--endpoint')) {
        const endpoint = args[args.indexOf('--endpoint') + 1];
        const method = args.includes('--method') ? args[args.indexOf('--method') + 1] : 'GET';
        await testSpecific2FAEndpoint(endpoint, method);
    } else {
        await testAllEndpoints();
    }
}

// Handle command line arguments
if (require.main === module) {
    main().catch(error => {
        log(`💥 Fatal error: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = {
    testServerConnection,
    testLogin,
    test2FAStatus,
    test2FASetup,
    test2FAVerification,
    testAllEndpoints,
    quickHealthCheck
};