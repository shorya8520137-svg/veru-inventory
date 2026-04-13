/**
 * CUSTOMER SUPPORT API TEST SCRIPT
 * Tests all customer support endpoints
 */

const https = require('https');

const API_BASE = 'https://13.229.107.233:8443';
let conversationId = null;

// Disable SSL verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Helper function to make API requests
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
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

// Test functions
async function test1_CreateConversation() {
    console.log('\n🧪 TEST 1: Create Conversation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const response = await makeRequest('POST', '/api/customer-support/conversations', {
            customer_name: 'Test User',
            customer_email: 'test@example.com',
            customer_phone: '+1234567890',
            subject: 'API Test',
            initial_message: 'Hello, this is a test message'
        });

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.data.conversation_id) {
            conversationId = response.data.data.conversation_id;
            console.log(`✅ PASS - Conversation created: ${conversationId}`);
            return true;
        } else {
            console.log('❌ FAIL - Failed to create conversation');
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return false;
    }
}

async function test2_SendCustomerMessage() {
    console.log('\n🧪 TEST 2: Send Customer Message');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!conversationId) {
        console.log('❌ SKIP - No conversation ID from previous test');
        return false;
    }

    try {
        const response = await makeRequest('POST', `/api/customer-support/conversations/${conversationId}/messages`, {
            message: 'What are your order status?',
            sender_type: 'customer',
            sender_name: 'Test User'
        });

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ PASS - Customer message sent');
            if (response.data.data.bot_response) {
                console.log(`🤖 Bot Response: ${response.data.data.bot_response}`);
            }
            return true;
        } else {
            console.log('❌ FAIL - Failed to send message');
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return false;
    }
}

async function test3_SendBotMessage() {
    console.log('\n🧪 TEST 3: Send Bot Message');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!conversationId) {
        console.log('❌ SKIP - No conversation ID from previous test');
        return false;
    }

    try {
        const response = await makeRequest('POST', `/api/customer-support/conversations/${conversationId}/messages`, {
            message: 'Your order is being processed. You can track it using order number ORD-2026-001.',
            sender_type: 'bot',
            sender_name: 'Support Bot'
        });

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ PASS - Bot message sent');
            return true;
        } else {
            console.log('❌ FAIL - Failed to send bot message');
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return false;
    }
}

async function test4_GetMessages() {
    console.log('\n🧪 TEST 4: Get Conversation Messages');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!conversationId) {
        console.log('❌ SKIP - No conversation ID from previous test');
        return false;
    }

    try {
        const response = await makeRequest('GET', `/api/customer-support/conversations/${conversationId}/messages`);

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.data.messages) {
            console.log(`✅ PASS - Retrieved ${response.data.data.messages.length} messages`);
            return true;
        } else {
            console.log('❌ FAIL - Failed to get messages');
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return false;
    }
}

async function test5_RateConversation() {
    console.log('\n🧪 TEST 5: Rate Conversation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!conversationId) {
        console.log('❌ SKIP - No conversation ID from previous test');
        return false;
    }

    try {
        const response = await makeRequest('POST', `/api/customer-support/conversations/${conversationId}/rating`, {
            rating: 5,
            feedback: 'Great support! Very helpful.'
        });

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ PASS - Conversation rated successfully');
            return true;
        } else {
            console.log('❌ FAIL - Failed to rate conversation');
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return false;
    }
}

async function test6_TestBotKeywords() {
    console.log('\n🧪 TEST 6: Test Bot Auto-Response Keywords');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const keywords = [
        { keyword: 'hello', expected: 'greeting' },
        { keyword: 'return', expected: 'return policy' },
        { keyword: 'payment', expected: 'payment methods' },
        { keyword: 'delivery', expected: 'delivery time' }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of keywords) {
        try {
            // Create new conversation for each keyword test
            const convResponse = await makeRequest('POST', '/api/customer-support/conversations', {
                customer_name: 'Keyword Test',
                customer_email: 'keyword@test.com',
                initial_message: test.keyword
            });

            if (convResponse.data.success && convResponse.data.data.bot_response) {
                console.log(`✅ Keyword "${test.keyword}": ${convResponse.data.data.bot_response.substring(0, 50)}...`);
                passed++;
            } else {
                console.log(`❌ Keyword "${test.keyword}": No bot response`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ Keyword "${test.keyword}": ERROR - ${error.message}`);
            failed++;
        }
    }

    console.log(`\nKeyword Tests: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

// Run all tests
async function runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   CUSTOMER SUPPORT API TEST SUITE                     ║');
    console.log('║   Testing: https://13.229.107.233:8443                ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    const results = [];

    results.push(await test1_CreateConversation());
    results.push(await test2_SendCustomerMessage());
    results.push(await test3_SendBotMessage());
    results.push(await test4_GetMessages());
    results.push(await test5_RateConversation());
    results.push(await test6_TestBotKeywords());

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   TEST SUMMARY                                         ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
    const passed = results.filter(r => r === true).length;
    const failed = results.filter(r => r === false).length;
    
    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total:  ${results.length}`);
    
    if (conversationId) {
        console.log(`\n💬 Test Conversation ID: ${conversationId}`);
        console.log(`📍 View in dashboard: https://13.229.107.233:8443/customer-support`);
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
