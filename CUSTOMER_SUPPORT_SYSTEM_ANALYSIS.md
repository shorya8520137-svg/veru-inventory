# Customer Support System - Complete Technical Analysis

## System Overview

The customer support system is a full-stack AI-powered chat platform with multi-language support, SLA monitoring, and disposition tracking.

---

## Architecture

### Frontend Components

1. **Customer Support List Page** (`/customer-support`)
   - Location: `src/app/customer-support/page.jsx`
   - Displays all conversations in a table
   - 4 metric cards: Total Inquiries, Avg Response Time, Sentiment Score, SLA Risk
   - Pagination: 10 conversations per page
   - Columns: Customer, Subject, Type, Priority, Status, Activity, Date

2. **Chat Window** (`/customer-support/[conversationId]`)
   - Location: `src/app/customer-support/[conversationId]/page.jsx`
   - 2-column layout: Chat (left) + AI Insights (right)
   - Real-time message polling (5s interval)
   - SLA monitoring (60s threshold)
   - Language selection buttons (4 languages)
   - AI Agent panel (slide-in overlay)
   - Disposition modal (on End Chat / Mark Resolved)

3. **AI Agent API Route**
   - Location: `src/app/api/ai-agent/route.js`
   - Proxies to n8n webhook
   - 3-phase flow: language selection → invoking → final response

---

## Backend API Endpoints

### Base URL
```
https://api.giftgala.in/api/customer-support
```

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversations` | Create new conversation |
| POST | `/conversations/:id/messages` | Send message |
| GET | `/conversations/:id/messages` | Get messages |
| POST | `/conversations/:id/rating` | Rate conversation |

### Protected Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations` | Get all conversations (admin) |
| PATCH | `/conversations/:id/status` | Update status |

---

## Data Flow

### 1. Conversation Creation

**Customer initiates chat:**
```
POST /api/customer-support/conversations
Body: {
  customer_name: "John Doe",
  customer_email: "john@example.com",
  customer_phone: "+1234567890",
  subject: "Product Inquiry",
  initial_message: "Hello, I need assistance"
}
```

**Backend:**
1. Generates unique `conversation_id` (e.g., `CONV-1234567890-abc123`)
2. Inserts into `customer_support_conversations` table
3. Inserts customer message into `customer_support_messages` table
4. Calls `getBotResponse(message)` to find keyword match
5. Inserts bot auto-response into `customer_support_messages` table
6. Returns `conversation_id` + `bot_response`

**Database Tables:**
- `customer_support_conversations`: id, conversation_id, customer_name, customer_email, customer_phone, subject, status, priority, created_at, updated_at, closed_at
- `customer_support_messages`: id, conversation_id, sender_type, sender_name, message, is_read, created_at
- `customer_support_bot_responses`: id, keyword, response, is_active, usage_count

---

### 2. Message Exchange

**Customer/Agent sends message:**
```
POST /api/customer-support/conversations/CONV-123/messages
Body: {
  message: "What is your return policy?",
  sender_type: "customer",  // or "support" or "bot"
  sender_name: "John Doe"
}
```

**Backend:**
1. Inserts message into `customer_support_messages`
2. Updates `customer_support_conversations.updated_at`
3. If `sender_type === 'customer'`, calls `getBotResponse(message)`
4. If keyword match found, inserts bot response
5. Returns `bot_response` if generated

**Bot Keyword Matching:**
- Queries `customer_support_bot_responses` table
- Orders by keyword length DESC (longest match first)
- Checks if message contains keyword (case-insensitive)
- Returns first matching response
- Updates `usage_count` for analytics

---

### 3. Language Selection & AI Agent

**Frontend Flow:**

1. **Bot message appears** → "Hello! Welcome to our support. How can I help you today?"

2. **Language buttons render** (4 buttons below bot message):
   - 🇬🇧 English (`en`)
   - 🇮🇳 हिंदी (`hi`)
   - 🇮🇳 தமிழ் (`ta`)
   - 🇮🇳 తెలుగు (`te`)

3. **Agent clicks language** → `handleLanguageSelect(lang)` triggers:
   ```javascript
   setAiLanguage(lang);
   setShowAIAgent(true); // opens AI panel
   setAiMessages([{role:'user', content:'Selected: English'}]);
   setAiPhase('language_selected');
   ```

4. **Phase 2 — Invoking:**
   ```
   POST /api/ai-agent
   Body: { phase: 'language_selected', language: 'hi', message: '' }
   ```
   Returns:
   ```json
   {
     "type": "agent_invoking",
     "agent": "hindi_agent",
     "message": "Connecting to support agent...",
     "animation": "code_editor"
   }
   ```
   Shows animated spinner in AI panel for 2 seconds.

5. **Phase 3 — Final (auto-triggered after 2s):**
   ```
   POST /api/ai-agent
   Body: { phase: 'final', language: 'hi', message: 'Hello, I need help', conversationHistory: [...] }
   ```
   
   **n8n Webhook receives:**
   ```json
   {
     "phase": "final",
     "language": "hi",
     "message": "Hello, I need help",
     "conversationHistory": [...]
   }
   ```
   
   **n8n should return:**
   ```json
   {
     "type": "final_response",
     "reply_local": "नमस्ते! मैं आपकी सहायता के लिए यहाँ हूँ।",
     "reply_en": "Hello! I'm here to help you."
   }
   ```

6. **AI response posts to main chat:**
   ```
   POST /api/customer-support/conversations/CONV-123/messages
   Body: {
     message: "🤖 नमस्ते! मैं आपकी सहायता के लिए यहाँ हूँ।",
     sender_type: "support",
     sender_name: "AI Agent"
   }
   ```
   Customer sees this in the chat window.

---

## AI Agent Panel

**Location:** Slide-in overlay from right side (380px width)

**Features:**
- Purple gradient header: "AI Support Agent"
- Message history (AI panel only — separate from main chat)
- Language selection (3 large buttons)
- Agent invoking animation (spinner + agent name)
- AI responses with English translation
- "Send to Chat" button on each response
- Input box (only shows after language selected)

**State Management:**
```javascript
showAIAgent: boolean          // panel visibility
aiPhase: 'init' | 'language_selected' | 'ready'
aiLanguage: 'en' | 'hi' | 'ta' | 'te'
aiMessages: [{role, content, type, data}]
aiInput: string
aiLoading: boolean
```

**Key Functions:**
- `openAIAgent()` — opens panel, calls `/api/ai-agent` with phase='init'
- `handleLanguageSelect(lang)` — sets language, triggers phase 2 & 3
- `sendAIMessage()` — sends user query to n8n, posts response to main chat
- `postToMainChat(text)` — inserts AI message into conversation

---

## SLA Monitoring

**Trigger:** No support reply for 60 seconds

**Visual Indicators:**
1. Red banner at top: "⚠ SLA BREACH — No support reply for X:XX"
2. Status dot turns red
3. "Active Conversation" → "⚠ Response Overdue"
4. Input box border turns red
5. Send button turns red
6. Escalation Risk jumps to 90% (red)

**Timer Logic:**
```javascript
useEffect(() => {
  slaTimerRef.current = setInterval(() => {
    const lastSupport = lastSupportReplyRef.current;
    const now = new Date();
    const elapsed = Math.floor((now - (lastSupport || now)) / 1000);
    setSlaSeconds(elapsed);
    setSlaAlert(elapsed >= 60);
  }, 1000);
  return () => clearInterval(slaTimerRef.current);
}, []);
```

**Reset:** When support agent sends a message, `lastSupportReplyRef.current = new Date()` resets the timer.

---

## Disposition Modal

**Triggers:**
- "End Chat" button (red)
- "Mark Resolved" button (dark blue)

**Fields:**
1. **Inquiry Type** (dropdown):
   - Billing Issue
   - Technical Support
   - Product Inquiry
   - Refund Request
   - Complaint
   - General Inquiry

2. **Description** (textarea): Brief description of the issue

3. **Resolution** (textarea): How was this resolved?

4. **Highlight** (tag buttons):
   - Resolved Successfully
   - Escalated
   - Follow-up Required
   - Customer Satisfied
   - Refund Issued
   - Bug Reported

**Submit Action:**
```
PATCH /api/customer-support/conversations/CONV-123/status
Body: {
  status: "resolved",
  inquiry_type: "product",
  description: "Customer asked about product features",
  resolution: "Provided detailed product information",
  highlighted: "Customer Satisfied"
}
```

Then navigates back to conversation list.

---

## n8n Webhook Integration

### Webhook URL
```
http://13.215.172.213:5678/webhook/6cc5c704-0ebe-4779-a00d-16c7cee83ac8
```

### Request Format

**Phase 1 — Init (handled by frontend, no webhook call)**

**Phase 2 — Language Selected:**
```json
{
  "phase": "language_selected",
  "language": "hi",
  "message": "",
  "conversationHistory": []
}
```

**Phase 3 — Final (actual query):**
```json
{
  "phase": "final",
  "language": "hi",
  "message": "मुझे अपने ऑर्डर के बारे में जानकारी चाहिए",
  "conversationHistory": [
    {"role": "user", "content": "Selected: हिंदी"},
    {"role": "assistant", "content": "नमस्ते! मैं आपकी सहायता के लिए यहाँ हूँ।"},
    {"role": "user", "content": "मुझे अपने ऑर्डर के बारे में जानकारी चाहिए"}
  ]
}
```

### Expected Response Format

```json
{
  "type": "final_response",
  "reply_local": "आपका ऑर्डर #12345 प्रोसेसिंग में है। यह 2-3 दिनों में डिलीवर हो जाएगा।",
  "reply_en": "Your order #12345 is being processed. It will be delivered in 2-3 days."
}
```

### Fallback Handling

If n8n returns:
- Empty string `""` → uses fallback response
- Plain text → wraps in `{type:'final_response', reply_local:text, reply_en:text}`
- `{reply_local, reply_en}` → wraps in `{type:'final_response', ...}`
- `{type, ...}` → returns as-is

---

## Language Support

### Supported Languages

| Code | Language | Display |
|------|----------|---------|
| `en` | English | 🇬🇧 English |
| `hi` | Hindi | 🇮🇳 हिंदी |
| `ta` | Tamil | 🇮🇳 தமிழ் |
| `te` | Telugu | 🇮🇳 తెలుగు |

### Fallback Responses (if n8n fails)

**Hindi:**
```
नमस्ते! आपका संदेश मिल गया: "{message}"। हमारी टीम जल्द ही आपसे संपर्क करेगी।
```

**Tamil:**
```
வணக்கம்! உங்கள் செய்தி பெறப்பட்டது: "{message}"। எங்கள் குழு விரைவில் தொடர்பு கொள்ளும்.
```

**Telugu:**
```
నమస్కారం! మీ సందేశం అందింది: "{message}"। మా బృందం త్వరలో మీతో సంప్రదిస్తుంది.
```

**English:**
```
Hello! We received your message: "{message}". Our team will get back to you shortly.
```

---

## State Management

### Chat Page State

```javascript
// Core
messages: []                    // main chat messages from DB
newMessage: ''                  // agent's input text
loading: boolean
sending: boolean

// SLA
slaAlert: boolean               // true if >60s no reply
slaSeconds: number              // elapsed seconds
lastSupportReplyRef: Date       // timestamp of last support message

// Disposition
showDisposition: boolean

// AI Agent
showAIAgent: boolean            // panel visibility
aiPhase: 'init' | 'language_selected' | 'ready'
aiLanguage: 'en' | 'hi' | 'ta' | 'te'
aiMessages: []                  // AI panel chat history
aiInput: ''                     // AI panel input
aiLoading: boolean
```

---

## Message Types

### 1. Customer Message
```javascript
{
  id: 123,
  conversation_id: "CONV-123",
  sender_type: "customer",
  sender_name: "John Doe",
  message: "Hello, I need assistance",
  is_read: 0,
  created_at: "2026-04-17T12:00:00Z"
}
```

**Render:** Gray bubble, left-aligned, avatar on left

### 2. Bot Message
```javascript
{
  sender_type: "bot",
  sender_name: "Support Bot",
  message: "Hello! Welcome to our support. How can I help you today?"
}
```

**Render:** White bubble with border, right-aligned, blue clock icon, "Support Bot (Auto-ACK)" label

**Special:** Language buttons appear below bot messages

### 3. Support Agent Message
```javascript
{
  sender_type: "support",
  sender_name: "Support Agent",
  message: "I'm looking into this for you"
}
```

**Render:** Blue gradient bubble, right-aligned

### 4. AI Agent Message
```javascript
{
  sender_type: "support",
  sender_name: "AI Agent",
  message: "🤖 नमस्ते! मैं आपकी सहायता के लिए यहाँ हूँ।"
}
```

**Render:** Same as support agent (blue bubble), but with 🤖 prefix

---

## AI Agent Integration Flow

### Step-by-Step

1. **Agent opens chat** → sees bot message with 4 language buttons

2. **Agent clicks "🇮🇳 हिंदी"** →
   - `handleLanguageSelect('hi')` called
   - `aiLanguage` set to `'hi'`
   - AI panel opens automatically
   - Button turns green (selected state)

3. **AI panel shows "Invoking..."** →
   - Calls `/api/ai-agent` with `phase: 'language_selected'`
   - Shows spinner + "hindi_agent" label
   - Waits 2 seconds

4. **Auto-greeting sent** →
   - Calls `/api/ai-agent` with `phase: 'final', language: 'hi', message: 'Hello, I need help'`
   - n8n webhook receives request
   - n8n returns Hindi greeting
   - AI panel shows response
   - Response auto-posts to main chat as "AI Agent"

5. **Agent types in AI panel** →
   - Agent asks: "ऑर्डर स्टेटस कैसे चेक करें?"
   - Calls `/api/ai-agent` with `phase: 'final', language: 'hi', message: '...'`
   - n8n processes in Hindi
   - Response shows in AI panel
   - Response auto-posts to main chat

6. **Customer sees** → All AI responses appear in main chat with 🤖 prefix

7. **Agent can override** → Agent can type manually in main chat input anytime

---

## n8n Workflow Requirements

### Input (from `/api/ai-agent`)

```json
{
  "phase": "final",
  "language": "hi",
  "message": "मुझे अपने ऑर्डर के बारे में जानकारी चाहिए",
  "conversationHistory": [
    {"role": "user", "content": "Selected: हिंदी"},
    {"role": "assistant", "content": "नमस्ते! मैं आपकी सहायता के लिए यहाँ हूँ।"}
  ]
}
```

### Required Output

```json
{
  "type": "final_response",
  "reply_local": "आपका ऑर्डर #12345 प्रोसेसिंग में है।",
  "reply_en": "Your order #12345 is being processed."
}
```

### n8n Workflow Logic

1. **Check `language` field** → route to appropriate LLM/agent
2. **Process `message` in selected language**
3. **Use `conversationHistory` for context**
4. **Return response in both `reply_local` (selected language) and `reply_en` (English)**

### Language Routing

```
if (language === 'hi') → use Hindi LLM/prompt
if (language === 'ta') → use Tamil LLM/prompt
if (language === 'te') → use Telugu LLM/prompt
if (language === 'en') → use English LLM/prompt
```

---

## UI Components

### Language Buttons (Main Chat)

```javascript
{[
  {label:'🇬🇧 English', value:'en'},
  {label:'🇮🇳 हिंदी', value:'hi'},
  {label:'🇮🇳 தமிழ்', value:'ta'},
  {label:'🇮🇳 తెలుగు', value:'te'}
].map(lang => (
  <button 
    onClick={() => handleLanguageSelect(lang.value)}
    style={{
      padding:'8px 16px',
      borderRadius:20,
      border:`1.5px solid ${aiLanguage===lang.value?'#22C55E':'#7C3AED'}`,
      background:aiLanguage===lang.value?'#22C55E':'#fff',
      color:aiLanguage===lang.value?'#fff':'#7C3AED'
    }}
  >
    {lang.label}
  </button>
))}
```

**Behavior:**
- Appear below every bot message
- Selected button turns green
- Clicking opens AI panel + triggers language flow

---

## Right Panel (AI Insights)

### 1. AI Context Card
- Sentiment badge (Positive/Negative)
- Blue tinted description box
- Static content (not dynamic yet)

### 2. Intelligence Indicators
- Churn Probability: 12% (green progress bar)
- Escalation Risk: 65% (amber) → 90% (red) when SLA breach

### 3. Smart Suggestions
- Knowledge Base card
- Use Macro card
- Hover effect (blue tint)

### 4. System Metadata
- ID: First 12 chars of conversation_id
- Category: "Support" (static)
- Priority: "Critical" (red dot)
- Wait Time: Live SLA timer (MM:SS format)

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/customer-support/page.jsx` | Conversation list page |
| `src/app/customer-support/[conversationId]/page.jsx` | Chat window |
| `src/app/api/ai-agent/route.js` | AI agent API proxy |
| `routes/customerSupportRoutes.js` | Backend routes |
| `controllers/customerSupportController.js` | Backend logic |

---

## Database Schema

### customer_support_conversations
```sql
id INT PRIMARY KEY AUTO_INCREMENT
conversation_id VARCHAR(255) UNIQUE
customer_name VARCHAR(255)
customer_email VARCHAR(255)
customer_phone VARCHAR(50)
subject VARCHAR(500)
status ENUM('open','in_progress','resolved','closed')
priority ENUM('low','medium','high','urgent')
inquiry_type VARCHAR(100)        -- from disposition
description TEXT                 -- from disposition
resolution TEXT                  -- from disposition
highlighted VARCHAR(100)         -- from disposition
created_at TIMESTAMP
updated_at TIMESTAMP
closed_at TIMESTAMP
```

### customer_support_messages
```sql
id INT PRIMARY KEY AUTO_INCREMENT
conversation_id VARCHAR(255)
sender_type ENUM('customer','support','bot')
sender_name VARCHAR(255)
message TEXT
is_read TINYINT DEFAULT 0
created_at TIMESTAMP
```

### customer_support_bot_responses
```sql
id INT PRIMARY KEY AUTO_INCREMENT
keyword VARCHAR(255)
response TEXT
is_active BOOLEAN DEFAULT TRUE
usage_count INT DEFAULT 0
created_at TIMESTAMP
```

---

## Testing Checklist

- [ ] Language buttons appear after bot message
- [ ] Clicking language opens AI panel
- [ ] AI panel shows invoking animation
- [ ] n8n webhook receives correct payload
- [ ] AI response appears in AI panel
- [ ] AI response auto-posts to main chat with 🤖 prefix
- [ ] Agent can type manually in main chat
- [ ] SLA alert triggers after 60s
- [ ] SLA resets when agent replies
- [ ] Disposition modal opens on End Chat / Mark Resolved
- [ ] Disposition data saves to conversation
- [ ] Conversation list shows Type column with disposition data

---

## Next Steps for n8n Configuration

1. **Create 4 language-specific agents** in n8n:
   - `english_agent`
   - `hindi_agent`
   - `tamil_agent`
   - `telugu_agent`

2. **Add language router node** that checks `language` field and routes to appropriate agent

3. **Each agent should:**
   - Accept `message` and `conversationHistory`
   - Process in the target language
   - Return `{type:'final_response', reply_local:'...', reply_en:'...'}`

4. **Test with:**
   ```bash
   curl -X POST http://13.215.172.213:5678/webhook/6cc5c704-0ebe-4779-a00d-16c7cee83ac8 \
     -H "Content-Type: application/json" \
     -d '{"phase":"final","language":"hi","message":"मुझे मदद चाहिए","conversationHistory":[]}'
   ```

---

## API Summary

### Frontend → Backend
```
POST /api/customer-support/conversations/:id/messages
Body: { message, sender_type, sender_name }
```

### Frontend → AI Agent API
```
POST /api/ai-agent
Body: { phase, language, message, conversationHistory }
```

### AI Agent API → n8n Webhook
```
POST http://13.215.172.213:5678/webhook/6cc5c704-0ebe-4779-a00d-16c7cee83ac8
Body: { phase:'final', language, message, conversationHistory }
```

### n8n → AI Agent API → Frontend
```json
{ "type": "final_response", "reply_local": "...", "reply_en": "..." }
```

---

## Environment Variables

```env
NEXT_PUBLIC_API_BASE=https://api.giftgala.in
```

No additional env vars needed for AI agent (webhook URL is hardcoded in `/api/ai-agent/route.js`).

---

## Troubleshooting

**Language buttons not showing:**
- Check if bot message contains "welcome" or "help" or "assist"
- Check browser console for errors
- Verify `handleLanguageSelect` function exists

**n8n not responding:**
- Check webhook URL is accessible
- Verify n8n workflow is active
- Check n8n logs for errors
- Fallback responses will show if webhook fails

**AI responses not posting to main chat:**
- Check `postToMainChat` function
- Verify `/api/customer-support/conversations/:id/messages` endpoint works
- Check browser network tab for failed requests

**SLA not triggering:**
- Check if any support messages exist (timer only starts after first support reply)
- Verify `lastSupportReplyRef.current` is being set
- Check `slaTimerRef` interval is running

---

## Summary

The system is fully functional with:
- ✅ 4-language support (English, Hindi, Tamil, Telugu)
- ✅ Language buttons in main chat
- ✅ AI Agent panel with auto-posting to main chat
- ✅ n8n webhook integration ready
- ✅ SLA monitoring (60s threshold)
- ✅ Disposition tracking
- ✅ Real-time message polling

**Next:** Configure n8n workflow to handle the 4 languages and return structured responses.
