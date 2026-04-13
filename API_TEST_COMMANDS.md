# 🧪 Customer Support API - Complete Testing Guide

## 📋 TESTING CHECKLIST

- [ ] Test 1: Create Conversation (Public)
- [ ] Test 2: Send Customer Message (Public)
- [ ] Test 3: Get Messages (Public)
- [ ] Test 4: Rate Conversation (Public)
- [ ] Test 5: Get All Conversations (Admin - Requires Auth)
- [ ] Test 6: Update Status (Admin - Requires Auth)

---

## 🌐 API BASE URL

```
https://13.229.107.233:8443
```

---

## ✅ TEST 1: CREATE CONVERSATION (Public - No Auth)

### cURL Command:
```bash
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "+1234567890",
    "subject": "Test Inquiry",
    "initial_message": "Hello, I need help with my order"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "conversation_id": "CONV-1708012345-abc123xyz",
    "bot_response": "Hello! Welcome to our support. How can I help you today?"
  }
}
```

### PowerShell Command:
```powershell
$body = @{
    customer_name = "Test User"
    customer_email = "test@example.com"
    customer_phone = "+1234567890"
    subject = "Test Inquiry"
    initial_message = "Hello, I need help with my order"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://13.229.107.233:8443/api/customer-support/conversations" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### Save the conversation_id from response for next tests!

---

## ✅ TEST 2: SEND CUSTOMER MESSAGE (Public - No Auth)

**Replace `{conversation_id}` with the ID from Test 1**

### cURL Command:
```bash
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations/CONV-1708012345-abc123xyz/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is your return policy?",
    "sender_type": "customer",
    "sender_name": "Test User"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "bot_response": "Our return policy allows returns within 30 days of delivery. Would you like to initiate a return? Please provide your order number."
  }
}
```

### PowerShell Command:
```powershell
$conversationId = "CONV-1708012345-abc123xyz"  # Replace with your ID

$body = @{
    message = "What is your return policy?"
    sender_type = "customer"
    sender_name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://13.229.107.233:8443/api/customer-support/conversations/$conversationId/messages" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

---

## ✅ TEST 3: GET MESSAGES (Public - No Auth)

**Replace `{conversation_id}` with the ID from Test 1**

### cURL Command:
```bash
curl -X GET https://13.229.107.233:8443/api/customer-support/conversations/CONV-1708012345-abc123xyz/messages
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "conversation_id": "CONV-1708012345-abc123xyz",
    "messages": [
      {
        "id": 1,
        "sender_type": "customer",
        "sender_name": "Test User",
        "message": "Hello, I need help with my order",
        "is_read": false,
        "created_at": "2026-02-14T10:30:00Z"
      },
      {
        "id": 2,
        "sender_type": "bot",
        "sender_name": "Support Bot",
        "message": "Hello! Welcome to our support. How can I help you today?",
        "is_read": false,
        "created_at": "2026-02-14T10:30:01Z"
      }
    ]
  }
}
```

### PowerShell Command:
```powershell
$conversationId = "CONV-1708012345-abc123xyz"  # Replace with your ID

Invoke-RestMethod -Uri "https://13.229.107.233:8443/api/customer-support/conversations/$conversationId/messages" `
  -Method Get
```

---

## ✅ TEST 4: RATE CONVERSATION (Public - No Auth)

**Replace `{conversation_id}` with the ID from Test 1**

### cURL Command:
```bash
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations/CONV-1708012345-abc123xyz/rating \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "feedback": "Great support! Very helpful."
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Thank you for your feedback!"
}
```

### PowerShell Command:
```powershell
$conversationId = "CONV-1708012345-abc123xyz"  # Replace with your ID

$body = @{
    rating = 5
    feedback = "Great support! Very helpful."
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://13.229.107.233:8443/api/customer-support/conversations/$conversationId/rating" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

---

## 🔒 TEST 5: GET ALL CONVERSATIONS (Admin - Requires Auth)

**You need to login first and get a JWT token**

### Step 1: Login to get token
```bash
curl -X POST https://13.229.107.233:8443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin-email@example.com",
    "password": "your-password"
  }'
```

### Step 2: Use token to get conversations
```bash
curl -X GET "https://13.229.107.233:8443/api/customer-support/conversations?status=open&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": 1,
        "conversation_id": "CONV-1708012345-abc123xyz",
        "customer_name": "Test User",
        "customer_email": "test@example.com",
        "customer_phone": "+1234567890",
        "subject": "Test Inquiry",
        "status": "open",
        "priority": "medium",
        "created_at": "2026-02-14T10:30:00Z",
        "updated_at": "2026-02-14T10:35:00Z",
        "message_count": 4,
        "last_message": "Great support! Very helpful."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### PowerShell Command:
```powershell
# First login
$loginBody = @{
    email = "your-admin-email@example.com"
    password = "your-password"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "https://13.229.107.233:8443/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $loginBody

$token = $loginResponse.token

# Then get conversations
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "https://13.229.107.233:8443/api/customer-support/conversations?status=open&page=1&limit=20" `
  -Method Get `
  -Headers $headers
```

---

## 🔒 TEST 6: UPDATE STATUS (Admin - Requires Auth)

**Replace `{conversation_id}` with the ID from Test 1**

### cURL Command:
```bash
curl -X PATCH https://13.229.107.233:8443/api/customer-support/conversations/CONV-1708012345-abc123xyz/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Status updated successfully"
}
```

### PowerShell Command:
```powershell
$conversationId = "CONV-1708012345-abc123xyz"  # Replace with your ID
$token = "YOUR_JWT_TOKEN_HERE"  # From login

$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    status = "resolved"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://13.229.107.233:8443/api/customer-support/conversations/$conversationId/status" `
  -Method Patch `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

---

## 🤖 TEST BOT AUTO-RESPONSES

Test different keywords to trigger bot responses:

### Test Greeting:
```bash
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations/CONV-ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "hello",
    "sender_type": "customer",
    "sender_name": "Test User"
  }'
```
**Expected bot response:** "Hello! Welcome to our support. How can I help you today?"

### Test Order Status:
```bash
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations/CONV-ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to check my order status",
    "sender_type": "customer",
    "sender_name": "Test User"
  }'
```
**Expected bot response:** "To check your order status, please provide your order number..."

### Test Return Policy:
```bash
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations/CONV-ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is your return policy?",
    "sender_type": "customer",
    "sender_name": "Test User"
  }'
```
**Expected bot response:** "Our return policy allows returns within 30 days of delivery..."

### Test Payment:
```bash
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations/CONV-ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What payment methods do you accept?",
    "sender_type": "customer",
    "sender_name": "Test User"
  }'
```
**Expected bot response:** "We accept Credit/Debit Cards, UPI, Net Banking, and Cash on Delivery..."

---

## 📊 COMPLETE TEST SCRIPT (PowerShell)

Save this as `test-customer-support-api.ps1`:

```powershell
# Customer Support API Test Script
$API_BASE = "https://13.229.107.233:8443"

Write-Host "🧪 Testing Customer Support API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Create Conversation
Write-Host "Test 1: Creating conversation..." -ForegroundColor Yellow
$body1 = @{
    customer_name = "Test User"
    customer_email = "test@example.com"
    customer_phone = "+1234567890"
    subject = "Test Inquiry"
    initial_message = "Hello, I need help"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$API_BASE/api/customer-support/conversations" `
      -Method Post `
      -ContentType "application/json" `
      -Body $body1
    
    $conversationId = $response1.data.conversation_id
    Write-Host "✅ Conversation created: $conversationId" -ForegroundColor Green
    Write-Host "Bot response: $($response1.data.bot_response)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create conversation: $_" -ForegroundColor Red
    exit
}

# Test 2: Send Message
Write-Host "Test 2: Sending customer message..." -ForegroundColor Yellow
$body2 = @{
    message = "What is your return policy?"
    sender_type = "customer"
    sender_name = "Test User"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$API_BASE/api/customer-support/conversations/$conversationId/messages" `
      -Method Post `
      -ContentType "application/json" `
      -Body $body2
    
    Write-Host "✅ Message sent successfully" -ForegroundColor Green
    Write-Host "Bot response: $($response2.data.bot_response)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to send message: $_" -ForegroundColor Red
}

# Test 3: Get Messages
Write-Host "Test 3: Getting conversation messages..." -ForegroundColor Yellow
try {
    $response3 = Invoke-RestMethod -Uri "$API_BASE/api/customer-support/conversations/$conversationId/messages" `
      -Method Get
    
    Write-Host "✅ Retrieved $($response3.data.messages.Count) messages" -ForegroundColor Green
    foreach ($msg in $response3.data.messages) {
        Write-Host "  [$($msg.sender_type)] $($msg.sender_name): $($msg.message)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get messages: $_" -ForegroundColor Red
}

# Test 4: Rate Conversation
Write-Host "Test 4: Rating conversation..." -ForegroundColor Yellow
$body4 = @{
    rating = 5
    feedback = "Great support!"
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod -Uri "$API_BASE/api/customer-support/conversations/$conversationId/rating" `
      -Method Post `
      -ContentType "application/json" `
      -Body $body4
    
    Write-Host "✅ Rating submitted successfully" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to submit rating: $_" -ForegroundColor Red
}

Write-Host "🎉 All tests completed!" -ForegroundColor Cyan
Write-Host "Conversation ID: $conversationId" -ForegroundColor Yellow
Write-Host "Check admin dashboard: $API_BASE/customer-support" -ForegroundColor Yellow
```

### Run the test script:
```powershell
.\test-customer-support-api.ps1
```

---

## 🌐 BROWSER TEST (JavaScript Console)

Open browser console on any page and run:

```javascript
// Test Customer Support API
const API_BASE = 'https://13.229.107.233:8443/api';

async function testCustomerSupportAPI() {
    console.log('🧪 Testing Customer Support API...');
    
    // Test 1: Create Conversation
    console.log('\n📝 Test 1: Creating conversation...');
    const createResponse = await fetch(`${API_BASE}/customer-support/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customer_name: 'Browser Test User',
            customer_email: 'browser@test.com',
            customer_phone: '+1234567890',
            subject: 'Browser Test',
            initial_message: 'Testing from browser console'
        })
    });
    const createData = await createResponse.json();
    console.log('✅ Conversation created:', createData);
    
    const conversationId = createData.data.conversation_id;
    
    // Test 2: Send Message
    console.log('\n💬 Test 2: Sending message...');
    const messageResponse = await fetch(`${API_BASE}/customer-support/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'What are your business hours?',
            sender_type: 'customer',
            sender_name: 'Browser Test User'
        })
    });
    const messageData = await messageResponse.json();
    console.log('✅ Message sent:', messageData);
    
    // Test 3: Get Messages
    console.log('\n📨 Test 3: Getting messages...');
    const getResponse = await fetch(`${API_BASE}/customer-support/conversations/${conversationId}/messages`);
    const getData = await getResponse.json();
    console.log('✅ Messages retrieved:', getData);
    
    console.log('\n🎉 All tests passed!');
    console.log(`Conversation ID: ${conversationId}`);
}

// Run tests
testCustomerSupportAPI();
```

---

## ✅ SUCCESS CRITERIA

All tests should return:
- ✅ HTTP Status 200 or 201
- ✅ `"success": true` in response
- ✅ Proper data structure
- ✅ Bot auto-responses for keywords
- ✅ Conversations appear in admin dashboard

---

## 🐛 TROUBLESHOOTING

### Error: 401 Unauthorized
- Check if endpoint requires authentication
- Public endpoints: conversations (POST/GET), messages (POST/GET), rating (POST)
- Admin endpoints: conversations (GET with filters), status update (PATCH)

### Error: 404 Not Found
- Verify API endpoint URL is correct
- Check if routes are registered in server.js
- Ensure server is running: `pm2 status`

### Error: 500 Internal Server Error
- Check if database tables exist
- Verify database connection
- Check server logs: `pm2 logs`

### No bot response
- Check if `customer_support_bot_responses` table has data
- Verify keyword matching is working
- Check controller logic

---

## 📞 QUICK TEST COMMANDS

### Quick Test (One-liner):
```bash
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations -H "Content-Type: application/json" -d '{"customer_name":"Quick Test","customer_email":"quick@test.com","initial_message":"test"}'
```

### Check Server Health:
```bash
curl https://13.229.107.233:8443/
```

### Check Database Tables:
```bash
sudo mysql -e "USE inventory_db; SHOW TABLES LIKE 'customer_support%';"
```

---

**All API endpoints are now ready for testing! Run the tests and verify everything works.** 🚀
