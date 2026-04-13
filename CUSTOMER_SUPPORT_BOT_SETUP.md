# Customer Support Bot - Setup Instructions

## ✅ What's Been Completed

### 1. Database Schema
- Created `create_customer_support_tables.sql` with 4 tables:
  - `customer_support_conversations` - Stores chat conversations
  - `customer_support_messages` - Individual messages in conversations
  - `customer_support_bot_responses` - Bot auto-response keywords (12 default responses)
  - `customer_support_ratings` - Customer feedback ratings

### 2. Backend Controller
- Created `controllers/customerSupportController.js` with methods:
  - `createConversation` - Start new chat
  - `sendMessage` - Send message and get bot response
  - `getMessages` - Retrieve conversation history
  - `getAllConversations` - Admin view of all chats
  - `updateStatus` - Change conversation status
  - `rateConversation` - Customer feedback
  - `getBotResponse` - AI keyword matching for auto-responses

### 3. API Routes
- Created `routes/customerSupportRoutes.js`
- Registered in `server.js` at `/api/customer-support`
- Public endpoints (no auth): create conversation, send message, get messages, rate
- Protected endpoints (auth required): get all conversations, update status

### 4. API Documentation
- Updated `src/app/api/page.jsx` with complete documentation
- Added Customer Support Chat API section
- Added Bot Auto-Response Keywords section
- Added usage examples with curl commands

## 🚀 Server Setup Commands

### Step 1: Pull Latest Code
```bash
cd ~/inventoryfullstack
git pull origin stocksphere-phase-1-complete
```

### Step 2: Create Database Tables
```bash
sudo mysql inventory_db < create_customer_support_tables.sql
```

### Step 3: Verify Tables Created
```bash
sudo mysql -e "USE inventory_db; SHOW TABLES LIKE 'customer_support%';"
```

### Step 4: Restart Server
```bash
pm2 restart all
# OR if not using pm2:
# node server.js
```

## 📡 API Endpoints

### Public Endpoints (No Authentication)

**Create Conversation**
```
POST https://13.229.107.233:8443/api/customer-support/conversations
Body: {
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "subject": "Order Issue",
  "initial_message": "I need help with my order"
}
```

**Send Message**
```
POST https://13.229.107.233:8443/api/customer-support/conversations/{conversation_id}/messages
Body: {
  "message": "What is your return policy?",
  "sender_type": "customer",
  "sender_name": "John Doe"
}
```

**Get Messages**
```
GET https://13.229.107.233:8443/api/customer-support/conversations/{conversation_id}/messages
```

**Rate Conversation**
```
POST https://13.229.107.233:8443/api/customer-support/conversations/{conversation_id}/rating
Body: {
  "rating": 5,
  "feedback": "Great support!"
}
```

### Protected Endpoints (Require JWT Token)

**Get All Conversations (Admin)**
```
GET https://13.229.107.233:8443/api/customer-support/conversations?status=open&page=1&limit=20
Headers: Authorization: Bearer YOUR_TOKEN
```

**Update Status (Admin)**
```
PATCH https://13.229.107.233:8443/api/customer-support/conversations/{conversation_id}/status
Headers: Authorization: Bearer YOUR_TOKEN
Body: {
  "status": "resolved"
}
```

## 🤖 Bot Auto-Response Keywords

The bot automatically responds to these keywords:
- **Greetings**: hello, hi
- **Orders**: order status, track order, cancel order
- **Returns & Refunds**: return, refund
- **Payment**: payment
- **Delivery**: delivery
- **Contact**: contact
- **Closing**: thank, thanks

## 🧪 Testing the API

### Test 1: Create Conversation
```bash
curl -H "Content-Type: application/json" -X POST \
  -d '{"customer_name":"Test User","customer_email":"test@example.com","initial_message":"hello"}' \
  https://13.229.107.233:8443/api/customer-support/conversations
```

Expected Response:
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "conversation_id": "CONV-1234567890-abc123",
    "bot_response": "Hello! Welcome to our support. How can I help you today?"
  }
}
```

### Test 2: Send Message
```bash
curl -H "Content-Type: application/json" -X POST \
  -d '{"message":"I want to return my order"}' \
  https://13.229.107.233:8443/api/customer-support/conversations/CONV-1234567890-abc123/messages
```

Expected Response:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "bot_response": "Our return policy allows returns within 30 days of delivery. Would you like to initiate a return? Please provide your order number."
  }
}
```

## 📊 Database Structure

### customer_support_conversations
- Stores conversation metadata
- Status: open, in_progress, resolved, closed
- Priority: low, medium, high, urgent

### customer_support_messages
- Stores individual messages
- Sender types: customer, support, bot
- Tracks read status

### customer_support_bot_responses
- Keyword-based auto-responses
- 12 default responses included
- Tracks usage count

### customer_support_ratings
- Customer feedback (1-5 stars)
- Optional text feedback

## 🎯 Next Steps (Optional)

1. **Frontend Chat Widget**: Create a chat widget for your website
2. **Admin Dashboard**: Build admin panel to manage conversations
3. **Email Notifications**: Send email alerts for new conversations
4. **Advanced Bot**: Integrate with AI services for smarter responses
5. **File Attachments**: Allow customers to upload images/documents

## 📝 Notes

- All customer-facing endpoints are public (no authentication required)
- Admin endpoints require JWT token from login
- Bot responses are keyword-based (case-insensitive matching)
- Conversations are automatically timestamped
- Database uses UTF-8 for international character support
