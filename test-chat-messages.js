/**
 * Test Customer Support Chat Messages
 * Tests sending and receiving messages between admin and customer
 */

const https = require('https');

// Disable SSL verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_BASE = 'https://13.212.51.226:8443/api';

// Test conversation ID (you'll need to replace this with an actual conversation ID)
let conversationId = null;

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (error) {
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

/**
 * Test 1: Create a new conversation
 */
async function testCreateConversation() {
    console.log('\n📝 TEST 1: Create New Conversation');
    console.log('='.repeat(50));

    try {
        const response = await makeRequest('POST', '/customer-support/conversations', {
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            customer_phone: '1234567890',
            subject: 'Test Inquiry',
            initial_message: 'Hello, I need help with my order'
        });

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            conversationId = response.data.data.conversation_id;
            console.log('✅ Conversation created:', conversationId);
            return true;
        } else {
            console.log('❌ Failed to create conversation');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

/**
 * Test 2: Send customer message
 */
async function testSendCustomerMessage() {
    console.log('\n📤 TEST 2: Send Customer Message');
    console.log('='.repeat(50));

    if (!conversationId) {
        console.log('❌ No conversation ID available');
        return false;
    }

    try {
        const response = await makeRequest(
            'POST', 
            `/customer-support/conversations/${conversationId}/messages`,
            {
                message: 'Can you help me track my order?',
                sender_type: 'customer',
                sender_name: 'Test Customer'
            }
        );

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ Customer message sent successfully');
            return true;
        } else {
            console.log('❌ Failed to send customer message');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

/**
 * Test 3: Send admin/support message
 */
async function testSendAdminMessage() {
    console.log('\n👨‍💼 TEST 3: Send Admin/Support Message');
    console.log('='.repeat(50));

    if (!conversationId) {
        console.log('❌ No conversation ID available');
        return false;
    }

    try {
        const response = await makeRequest(
            'POST', 
            `/customer-support/conversations/${conversationId}/messages`,
            {
                message: 'Sure! I can help you with that. What is your order number?',
                sender_type: 'support',
                sender_name: 'Support Agent'
            }
        );

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ Admin message sent successfully');
            return true;
        } else {
            console.log('❌ Failed to send admin message');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

/**
 * Test 4: Fetch all messages
 */
async function testFetchMessages() {
    console.log('\n📨 TEST 4: Fetch All Messages');
    console.log('='.repeat(50));

    if (!conversationId) {
        console.log('❌ No conversation ID available');
        return false;
    }

    try {
        const response = await makeRequest(
            'GET', 
            `/customer-support/conversations/${conversationId}/messages`
        );

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            const messages = response.data.data.messages;
            console.log(`✅ Fetched ${messages.length} messages`);
            
            console.log('\n📋 Message Summary:');
            messages.forEach((msg, index) => {
                console.log(`  ${index + 1}. [${msg.sender_type}] ${msg.sender_name}: ${msg.message.substring(0, 50)}...`);
            });
            
            return true;
        } else {
            console.log('❌ Failed to fetch messages');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

/**
 * Test 5: Test with existing conversation ID
 */
async function testExistingConversation(existingId) {
    console.log('\n🔄 TEST 5: Test Existing Conversation');
    console.log('='.repeat(50));
    
    conversationId = existingId;
    console.log('Using conversation ID:', conversationId);
    
    // Send admin message
    await testSendAdminMessage();
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fetch messages
    await testFetchMessages();
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('\n🚀 CUSTOMER SUPPORT CHAT API TESTS');
    console.log('='.repeat(50));
    console.log('API Base:', API_BASE);
    console.log('Time:', new Date().toISOString());

    // Check if conversation ID is provided as argument
    const existingConversationId = process.argv[2];
    
    if (existingConversationId) {
        console.log('\n📌 Testing with existing conversation ID:', existingConversationId);
        await testExistingConversation(existingConversationId);
    } else {
        console.log('\n📌 Creating new conversation for testing');
        
        // Test 1: Create conversation
        const created = await testCreateConversation();
        if (!created) {
            console.log('\n❌ Cannot continue tests without conversation');
            return;
        }

        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Send customer message
        await testSendCustomerMessage();

        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 3: Send admin message
        await testSendAdminMessage();

        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 4: Fetch all messages
        await testFetchMessages();
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('='.repeat(50));
    
    if (conversationId) {
        console.log('\n💡 To test this conversation again, run:');
        console.log(`   node test-chat-messages.js ${conversationId}`);
    }
}

// Run tests
runTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
});
