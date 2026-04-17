# Customer Support Chat System — Complete Technical Report

**Date:** April 17, 2026  
**Project:** Veru Inventory — Gift Gala Customer Support

---

## 1. System Overview

Two separate chat interfaces connected via a shared backend API:

| Interface | Who Uses It | URL |
|-----------|-------------|-----|
| Website Chat Widget | Customer (public) | `public/chat-widget.html` |
| Admin Chat Panel | Support Agent | `/customer-support/[conversationId]` |

Both read/write from the same database tables via the same backend API.

---

## 2. Architecture Diagram

```
CUSTOMER (Website Widget)
        |
        | POST /api/customer-support/conversations/:id/messages
        |
        v
BACKEND (Node.js / Express)
controllers/customerSupportController.js
        |
        |-- if language_select → store in DB only (no chat message)
        |-- if customer message → call n8n translate → store EN for admin
        |-- if admin message → call n8n translate → store local lang for customer
        |
        v
n8n TRANSLATE WEBHOOK
http://13.215.172.213:5678/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030
POST { type, message, language, source }
        |
        v
DATABASE (MySQL)
customer_support_conversations
customer_support_messages
        |
        v
ADMIN PANEL (Next.js)
src/app/customer-support/[conversationId]/page.jsx
```

---

## 3. Database Schema

### Table: `customer_support_conversations`

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto increment |
| conversation_id | VARCHAR(255) UNIQUE | e.g. `CONV-1713345600-abc123` |
| customer_name | VARCHAR(255) | Customer's name |
| customer_email | VARCHAR(255) | Customer's email |
| customer_phone | VARCHAR(50) | Customer's phone |
| subject | VARCHAR(500) | Chat subject |
| status | ENUM | `open`, `in_progress`, `resolved`, `closed` |
| priority | ENUM | `low`, `medium`, `high`, `urgent` |
| **preferred_language** | VARCHAR(10) | `en`, `hi`, `ta`, `te` — set when customer selects language |
| inquiry_type | VARCHAR(100) | Set from disposition form |
| description | TEXT | Set from disposition form |
| resolution | TEXT | Set from disposition form |
| highlighted | VARCHAR(100) | Set from disposition form |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| closed_at | TIMESTAMP | |

### Table: `customer_support_messages`

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto increment |
| conversation_id | VARCHAR(255) | FK to conversations |
| sender_type | VARCHAR(50) | `customer`, `support`, `bot`, `language_select` |
| sender_name | VARCHAR(255) | Name of sender |
| message | TEXT | Message content |
| is_read | TINYINT | 0 = unread |
| created_at | TIMESTAMP | |

### Table: `customer_support_bot_responses`

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | |
| keyword | VARCHAR(255) | Trigger keyword |
| response | TEXT | English bot response |
| is_active | BOOLEAN | |
| usage_count | INT | |

### Table: `customer_support_ratings`

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | |
| conversation_id | VARCHAR(255) | |
| rating | INT | 1-5 |
| feedback | TEXT | |

---

## 4. Backend API Endpoints

**Base URL:** `https://api.giftgala.in/api/customer-support`

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversations` | Create new conversation |
| POST | `/conversations/:id/messages` | Send message / select language |
| GET | `/conversations/:id/messages` | Get all messages |
| POST | `/conversations/:id/rating` | Rate conversation |

### Protected Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations` | Get all conversations (admin) |
| PATCH | `/conversations/:id/status` | Update status |

---

## 5. Complete Data Flow

### 5.1 — Customer Starts Chat

```
Customer fills form (name, email, message)
        |
        v
POST /api/customer-support/conversations
Body: {
  customer_name: "Priya",
  customer_email: "priya@test.com",
  subject: "General Inquiry",
  initial_message: "Hello, I need help"
}
        |
        v
Backend:
1. Generate conversation_id = "CONV-1713345600-abc123"
2. INSERT into customer_support_conversations
3. INSERT customer message into customer_support_messages
4. Get bot keyword response (English)
5. INSERT bot response into customer_support_messages
        |
        v
Response: { conversation_id, bot_response }
        |
        v
Widget shows conversation_id, starts polling messages every 5s
```

### 5.2 — Customer Selects Language

```
Customer clicks "தமிழ்" button in widget
        |
        v
POST /api/customer-support/conversations/:id/messages
Body: {
  message: "ta",
  sender_type: "language_select",
  sender_name: "Priya",
  language: "ta"
}
        |
        v
Backend:
1. Detects sender_type === "language_select"
2. UPDATE customer_support_conversations SET preferred_language = "ta"
3. NO message stored in chat
4. Returns { success: true, language: "ta" }
        |
        v
Widget: stores language in localStorage, hides language selector bar
```

**IMPORTANT:** Language selection does NOT create a chat message. It only updates `preferred_language` in the conversations table.

### 5.3 — Customer Sends Message (Tamil selected)

```
Customer types "வணக்கம்" and sends
        |
        v
POST /api/customer-support/conversations/:id/messages
Body: {
  message: "வணக்கம்",
  sender_type: "customer",
  sender_name: "Priya",
  language: "ta"
}
        |
        v
Backend:
1. Get preferred_language = "ta" from DB
2. INSERT original message for customer: "வணக்கம்"
3. Call n8n translate webhook:
   POST http://13.215.172.213:5678/webhook/6ba285e1...
   Body: { type:"message", message:"வணக்கம்", language:"ta", source:"customer" }
   Response: { reply_local:"வணக்கம்", reply_en:"Hello" }
4. INSERT "[EN] Hello" for admin reference (sender: "Support Bot (EN)")
5. Get bot keyword response (English): "Thank you for contacting us..."
6. Call n8n translate webhook:
   Body: { type:"message", message:"Thank you...", language:"ta", source:"admin" }
   Response: { reply_local:"நன்றி...", reply_en:"Thank you..." }
7. INSERT Tamil bot response for customer: "நன்றி..."
        |
        v
Database now has:
- "வணக்கம்" (customer, Tamil) — shown in BOTH widget and admin
- "[EN] Hello" (Support Bot EN) — shown ONLY in admin panel
- "நன்றி..." (Support Bot, Tamil) — shown in BOTH widget and admin
```

### 5.4 — Admin Sends Message

```
Admin types "Hello, how can I help?" in admin panel
        |
        v
POST /api/customer-support/conversations/:id/messages
Body: {
  message: "Hello, how can I help?",
  sender_type: "support",
  sender_name: "Support Agent"
}
        |
        v
Backend:
1. Get preferred_language = "ta" from DB
2. Call n8n translate webhook:
   Body: { type:"message", message:"Hello, how can I help?", language:"ta", source:"admin" }
   Response: { reply_local:"வணக்கம், நான் எப்படி உதவலாம்?", reply_en:"Hello, how can I help?" }
3. INSERT Tamil translation: "வணக்கம், நான் எப்படி உதவலாம்?"
        |
        v
Customer sees: "வணக்கம், நான் எப்படி உதவலாம்?" (Tamil)
Admin sees: "வணக்கம், நான் எப்படி உதவலாம்?" (same stored message)
```

---

## 6. n8n Webhook Details

### Translate Webhook

**URL:** `http://13.215.172.213:5678/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030`  
**Method:** POST  
**Content-Type:** application/json

**Request format:**
```json
{
  "type": "message",
  "message": "Hello, how can I help?",
  "language": "ta",
  "source": "admin"
}
```

**Response format:**
```json
{
  "reply_local": "வணக்கம், நான் எப்படி உதவலாம்?",
  "reply_en": "Hello, how can I help?"
}
```

**Translation direction:**
- `source: "customer"` → translate TO English (`reply_en` used for admin)
- `source: "admin"` → translate TO customer's language (`reply_local` used for customer)

### Language Selection (no webhook call)

When `sender_type === "language_select"`:
- Backend stores language in DB directly
- No n8n call needed
- No chat message created

### AI Agent Webhook

**URL:** `http://13.215.172.213:5678/webhook/6cc5c704-0ebe-4779-a00d-16c7cee83ac8`  
**Method:** POST  
**Used by:** AI Agent panel (purple panel in admin)

---

## 7. Language Codes

| Code | Language | Button Label |
|------|----------|-------------|
| `en` | English | 🇬🇧 English |
| `hi` | Hindi | 🇮🇳 हिंदी |
| `ta` | Tamil | 🇮🇳 தமிழ் |
| `te` | Telugu | 🇮🇳 తెలుగు |

---

## 8. Message Filtering Rules

### Website Chat Widget shows:
- ✅ `sender_type = customer` messages
- ✅ `sender_type = bot` messages (translated to customer's language)
- ✅ `sender_type = support` messages (translated to customer's language)
- ❌ Messages starting with `[EN]` — filtered out
- ❌ Messages from `sender_name = "Support Bot (EN)"` — filtered out

### Admin Panel shows:
- ✅ All messages including `[EN]` translations
- ✅ Original customer messages
- ✅ Bot responses

---

## 9. Frontend Files

| File | Purpose |
|------|---------|
| `public/chat-widget.html` | Customer-facing chat widget |
| `src/app/customer-support/page.jsx` | Admin conversation list |
| `src/app/customer-support/[conversationId]/page.jsx` | Admin chat window |
| `src/app/api/ai-agent/route.js` | AI agent API proxy to n8n |

---

## 10. Backend Files

| File | Purpose |
|------|---------|
| `controllers/customerSupportController.js` | All chat logic + translation |
| `routes/customerSupportRoutes.js` | API route definitions |
| `server.js` | Express app, mounts routes at `/api/customer-support` |

---

## 11. Key Rules (STRICT)

1. **NEVER** detect language automatically — always trust `preferred_language` from DB
2. **NEVER** send `message: "Tamil"` to n8n — language selection is stored in DB only
3. **ALWAYS** use POST with JSON body for n8n webhook
4. **ALWAYS** include `source: "customer"` or `source: "admin"` in webhook payload
5. Language stays fixed for entire conversation — never changes after selection
6. `[EN]` messages are admin-only — never shown to customer

---

## 12. Current Status

| Feature | Status |
|---------|--------|
| Conversation creation | ✅ Working |
| Language selection (no chat message) | ✅ Fixed |
| Customer message → English for admin | ✅ Code ready |
| Admin message → Tamil for customer | ✅ Code ready |
| `[EN]` filtered from widget | ✅ Fixed |
| n8n webhook connectivity from server | ⚠️ Needs verification |
| Bot response in Tamil | ⚠️ Depends on n8n connectivity |

**To verify n8n connectivity from server:**
```bash
git pull origin main
node test-webhook-connectivity.js
```
