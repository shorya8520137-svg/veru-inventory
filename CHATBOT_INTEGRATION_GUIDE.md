# 🤖 Chatbot Integration Guide - Connect External Bot to Inventory Dashboard

## 📋 OVERVIEW

This guide explains how to integrate ANY external chatbot (Dialogflow, Rasa, custom bot, etc.) with your inventory dashboard's customer support system. All conversations from your bot will automatically appear in the admin dashboard.

---

## 🎯 INTEGRATION FLOW

```
Customer Website → Your Chatbot → API Endpoints → Database → Admin Dashboard
```

1. Customer starts chat on your website
2. Your chatbot handles the conversation
3. Chatbot sends data to our API endpoints
4. Data is stored in database
5. Admin sees conversation in dashboard
6. Admin can reply from dashboard

---

## 🔌 API ENDPOINTS FOR BOT INTEGRATION

### Base URL
```
https://13.229.107.233:8443
```

### Authentication
**NO AUTHENTICATION REQUIRED** for customer-facing endpoints (public API)

---

## 📡 STEP-BY-STEP INTEGRATION

### STEP 1: Create Conversation (When Chat Starts)

**Endpoint:** `POST /api/customer-support/conversations`

**When to call:** When a customer starts a new chat session

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "subject": "Product Inquiry",
  "initial_message": "I want to know about your products"
}
```

**Response:**
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

**Important:** Save the `conversation_id` - you'll need it for all future messages in this conversation.

---

### STEP 2: Send Customer Messages

**Endpoint:** `POST /api/customer-support/conversations/{conversation_id}/messages`

**When to call:** Every time the customer sends a message

**Request Body:**
```json
{
  "message": "What are your product prices?",
  "sender_type": "customer",
  "sender_name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "bot_response": "We accept Credit/Debit Cards, UPI, Net Banking, and Cash on Delivery. How can I help you with payment?"
  }
}
```

**Note:** The API automatically generates bot responses based on keywords. You can use this response or ignore it if your bot has its own logic.

---

### STEP 3: Send Bot Responses

**Endpoint:** `POST /api/customer-support/conversations/{conversation_id}/messages`

**When to call:** Every time your bot sends a response

**Request Body:**
```json
{
  "message": "Our products range from $10 to $500. Which category are you interested in?",
  "sender_type": "bot",
  "sender_name": "Support Bot"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "bot_response": null
  }
}
```

---

### STEP 4: Get Conversation History (Optional)

**Endpoint:** `GET /api/customer-support/conversations/{conversation_id}/messages`

**When to call:** When you need to retrieve the full conversation history

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation_id": "CONV-1708012345-abc123xyz",
    "messages": [
      {
        "id": 1,
        "sender_type": "customer",
        "sender_name": "John Doe",
        "message": "I want to know about your products",
        "is_read": true,
        "created_at": "2026-02-14T10:30:00Z"
      },
      {
        "id": 2,
        "sender_type": "bot",
        "sender_name": "Support Bot",
        "message": "Our products range from $10 to $500",
        "is_read": true,
        "created_at": "2026-02-14T10:30:15Z"
      }
    ]
  }
}
```

---

### STEP 5: Rate Conversation (Optional)

**Endpoint:** `POST /api/customer-support/conversations/{conversation_id}/rating`

**When to call:** When customer provides feedback at the end of chat

**Request Body:**
```json
{
  "rating": 5,
  "feedback": "Great support! Very helpful."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback!"
}
```

---

## 💻 CODE EXAMPLES

### Example 1: Python (Flask/Django Bot)

```python
import requests
import json

API_BASE = "https://13.229.107.233:8443"

class ChatbotIntegration:
    def __init__(self):
        self.conversation_id = None
    
    def start_conversation(self, customer_name, customer_email, initial_message):
        """Create a new conversation"""
        url = f"{API_BASE}/api/customer-support/conversations"
        
        payload = {
            "customer_name": customer_name,
            "customer_email": customer_email,
            "customer_phone": "",
            "subject": "General Inquiry",
            "initial_message": initial_message
        }
        
        response = requests.post(url, json=payload)
        data = response.json()
        
        if data['success']:
            self.conversation_id = data['data']['conversation_id']
            return self.conversation_id
        
        return None
    
    def send_customer_message(self, message, customer_name):
        """Send customer message to API"""
        if not self.conversation_id:
            return None
        
        url = f"{API_BASE}/api/customer-support/conversations/{self.conversation_id}/messages"
        
        payload = {
            "message": message,
            "sender_type": "customer",
            "sender_name": customer_name
        }
        
        response = requests.post(url, json=payload)
        return response.json()
    
    def send_bot_response(self, message):
        """Send bot response to API"""
        if not self.conversation_id:
            return None
        
        url = f"{API_BASE}/api/customer-support/conversations/{self.conversation_id}/messages"
        
        payload = {
            "message": message,
            "sender_type": "bot",
            "sender_name": "Support Bot"
        }
        
        response = requests.post(url, json=payload)
        return response.json()

# Usage Example
bot = ChatbotIntegration()

# 1. Start conversation
conv_id = bot.start_conversation(
    customer_name="John Doe",
    customer_email="john@example.com",
    initial_message="Hello, I need help"
)

# 2. Send customer message
bot.send_customer_message("What are your prices?", "John Doe")

# 3. Send bot response
bot.send_bot_response("Our prices range from $10 to $500. What product are you interested in?")
```

---

### Example 2: Node.js (Express Bot)

```javascript
const axios = require('axios');

const API_BASE = 'https://13.229.107.233:8443';

class ChatbotIntegration {
    constructor() {
        this.conversationId = null;
    }

    async startConversation(customerName, customerEmail, initialMessage) {
        try {
            const response = await axios.post(
                `${API_BASE}/api/customer-support/conversations`,
                {
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: '',
                    subject: 'General Inquiry',
                    initial_message: initialMessage
                }
            );

            if (response.data.success) {
                this.conversationId = response.data.data.conversation_id;
                return this.conversationId;
            }

            return null;
        } catch (error) {
            console.error('Error starting conversation:', error);
            return null;
        }
    }

    async sendCustomerMessage(message, customerName) {
        if (!this.conversationId) return null;

        try {
            const response = await axios.post(
                `${API_BASE}/api/customer-support/conversations/${this.conversationId}/messages`,
                {
                    message: message,
                    sender_type: 'customer',
                    sender_name: customerName
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error sending customer message:', error);
            return null;
        }
    }

    async sendBotResponse(message) {
        if (!this.conversationId) return null;

        try {
            const response = await axios.post(
                `${API_BASE}/api/customer-support/conversations/${this.conversationId}/messages`,
                {
                    message: message,
                    sender_type: 'bot',
                    sender_name: 'Support Bot'
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error sending bot response:', error);
            return null;
        }
    }
}

// Usage Example
const bot = new ChatbotIntegration();

// 1. Start conversation
const convId = await bot.startConversation(
    'John Doe',
    'john@example.com',
    'Hello, I need help'
);

// 2. Send customer message
await bot.sendCustomerMessage('What are your prices?', 'John Doe');

// 3. Send bot response
await bot.sendBotResponse('Our prices range from $10 to $500. What product are you interested in?');
```

---

### Example 3: PHP (Laravel/WordPress Bot)

```php
<?php

class ChatbotIntegration {
    private $apiBase = 'https://13.229.107.233:8443';
    private $conversationId = null;

    public function startConversation($customerName, $customerEmail, $initialMessage) {
        $url = $this->apiBase . '/api/customer-support/conversations';
        
        $data = [
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'customer_phone' => '',
            'subject' => 'General Inquiry',
            'initial_message' => $initialMessage
        ];

        $response = $this->makeRequest($url, 'POST', $data);
        
        if ($response && $response['success']) {
            $this->conversationId = $response['data']['conversation_id'];
            return $this->conversationId;
        }
        
        return null;
    }

    public function sendCustomerMessage($message, $customerName) {
        if (!$this->conversationId) return null;
        
        $url = $this->apiBase . '/api/customer-support/conversations/' . $this->conversationId . '/messages';
        
        $data = [
            'message' => $message,
            'sender_type' => 'customer',
            'sender_name' => $customerName
        ];

        return $this->makeRequest($url, 'POST', $data);
    }

    public function sendBotResponse($message) {
        if (!$this->conversationId) return null;
        
        $url = $this->apiBase . '/api/customer-support/conversations/' . $this->conversationId . '/messages';
        
        $data = [
            'message' => $message,
            'sender_type' => 'bot',
            'sender_name' => 'Support Bot'
        ];

        return $this->makeRequest($url, 'POST', $data);
    }

    private function makeRequest($url, $method, $data) {
        $ch = curl_init($url);
        
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}

// Usage Example
$bot = new ChatbotIntegration();

// 1. Start conversation
$convId = $bot->startConversation(
    'John Doe',
    'john@example.com',
    'Hello, I need help'
);

// 2. Send customer message
$bot->sendCustomerMessage('What are your prices?', 'John Doe');

// 3. Send bot response
$bot->sendBotResponse('Our prices range from $10 to $500. What product are you interested in?');
?>
```

---

## 🔄 INTEGRATION WORKFLOW

### Scenario 1: Simple Bot Integration

```
1. Customer opens chat widget on your website
2. Your bot calls: POST /api/customer-support/conversations
3. Save conversation_id in session/cookie
4. For each customer message:
   - Your bot processes the message
   - Call: POST /api/customer-support/conversations/{id}/messages (sender_type: customer)
   - Your bot generates response
   - Call: POST /api/customer-support/conversations/{id}/messages (sender_type: bot)
5. Admin sees all messages in dashboard
6. Admin can reply from dashboard (appears as sender_type: support)
```

### Scenario 2: Dialogflow Integration

```javascript
// Dialogflow Webhook Handler
app.post('/dialogflow-webhook', async (req, res) => {
    const sessionId = req.body.session;
    const userMessage = req.body.queryResult.queryText;
    const botResponse = req.body.queryResult.fulfillmentText;
    
    // Get or create conversation
    let conversationId = await getConversationId(sessionId);
    
    if (!conversationId) {
        // Create new conversation
        const response = await axios.post(
            'https://13.229.107.233:8443/api/customer-support/conversations',
            {
                customer_name: 'Website Visitor',
                customer_email: 'visitor@example.com',
                initial_message: userMessage
            }
        );
        conversationId = response.data.data.conversation_id;
        await saveConversationId(sessionId, conversationId);
    }
    
    // Send customer message
    await axios.post(
        `https://13.229.107.233:8443/api/customer-support/conversations/${conversationId}/messages`,
        {
            message: userMessage,
            sender_type: 'customer',
            sender_name: 'Website Visitor'
        }
    );
    
    // Send bot response
    await axios.post(
        `https://13.229.107.233:8443/api/customer-support/conversations/${conversationId}/messages`,
        {
            message: botResponse,
            sender_type: 'bot',
            sender_name: 'Dialogflow Bot'
        }
    );
    
    res.json({
        fulfillmentText: botResponse
    });
});
```

---

## 📊 VIEWING CONVERSATIONS IN DASHBOARD

### Admin Dashboard Access
```
URL: https://13.229.107.233:8443/customer-support
Login Required: Yes (use your admin credentials)
```

### What Admins Can See:
- ✅ All conversations from your bot
- ✅ Customer details (name, email, phone)
- ✅ Full message history
- ✅ Conversation status (open, in_progress, resolved, closed)
- ✅ Message timestamps
- ✅ Sender type (customer, bot, support)

### What Admins Can Do:
- ✅ View all conversations
- ✅ Reply to customers (messages appear as sender_type: support)
- ✅ Change conversation status
- ✅ Search conversations
- ✅ Filter by status

---

## 🎨 CUSTOMIZATION

### Custom Bot Name
Change `sender_name` in your API calls:
```json
{
  "sender_name": "Your Bot Name"
}
```

### Custom Subject/Category
Set when creating conversation:
```json
{
  "subject": "Product Inquiry"
}
```

### Priority Levels
Set priority when creating conversation:
```json
{
  "priority": "high"  // low, medium, high, urgent
}
```

---

## 🔍 TESTING YOUR INTEGRATION

### Test Endpoint
```bash
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "initial_message": "Test message from bot"
  }'
```

### Expected Response
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

---

## ⚠️ IMPORTANT NOTES

1. **No Authentication Required** - Customer-facing endpoints are public
2. **Save conversation_id** - You need it for all subsequent messages
3. **sender_type Values** - Must be: `customer`, `bot`, or `support`
4. **Message Order** - Send customer message first, then bot response
5. **Real-time Updates** - Dashboard refreshes every 5 seconds
6. **HTTPS Only** - All API calls must use HTTPS

---

## 🐛 TROUBLESHOOTING

### Error: "Conversation not found"
- Make sure you're using the correct conversation_id
- Check if conversation was created successfully

### Error: "Failed to send message"
- Verify API endpoint URL is correct
- Check request body format
- Ensure conversation_id exists

### Messages not appearing in dashboard
- Check if tables were created in database
- Verify server is running: `pm2 status`
- Check logs: `pm2 logs`

---

## 📞 SUPPORT

If you need help integrating your bot:
1. Check the API documentation: `https://13.229.107.233:8443/api`
2. Review server logs: `pm2 logs`
3. Test endpoints using Postman or curl

---

## ✅ INTEGRATION CHECKLIST

- [ ] Database tables created
- [ ] Server running and accessible
- [ ] Test conversation creation endpoint
- [ ] Test send message endpoint
- [ ] Bot sends customer messages to API
- [ ] Bot sends bot responses to API
- [ ] Conversations appear in admin dashboard
- [ ] Admin can reply from dashboard
- [ ] Messages display correctly
- [ ] Timestamps are accurate

---

**Your bot is now fully integrated with the inventory dashboard! All conversations will automatically appear in the Customer Support section.** 🎉
