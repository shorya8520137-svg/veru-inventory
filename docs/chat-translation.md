# Chat Translation System

## Overview

The customer support chat supports **multilingual conversations** across Indian languages (Tamil, Hindi, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Hinglish).

Translation is performed via **OpenRouter LLM** using the `LanguageRouter` service. The legacy `customerSupportController.js` still uses the n8n webhook for backward compatibility.

---

## Flow (New — Omnichannel)

```
Customer sends message in Tamil
        │
        ▼
POST /api/omnichannel/conversations/:id/messages
        │
        ▼
omnichannelController.sendMessage()
        │
        ├── 1. LanguageRouter.detectLanguage(message)
        │     └── OpenRouter LLM → { language: "ta", confidence: 99, needsTranslation: true }
        │
        ├── 2. LanguageRouter.translateToEnglish(message, "ta")
        │     └── OpenRouter LLM → English translation
        │
        ├── 3. AI processing (department, intent, reply, etc.)
        │
        ├── 4. LanguageRouter.translate(reply, "ta")
        │     └── OpenRouter LLM → Tamil translation
        │
        └── 5. Store in DB
              └── customer_support_messages table
```

---

## Flow (Legacy — Customer Support)

```
Customer sends message in Tamil
        │
        ▼
POST /api/customer-support/conversations/:id/messages
        │
        ▼
customerSupportController.sendMessage()
        │
        ├── Language auto-detect or explicit selection
        │
        ├── n8n webhook translate
        │     └── POST http://13.215.172.213:5678/webhook/xxx
        │
        └── Store in DB
```

---

## Key Files

| File | Purpose | Translation Method |
|---|---|---|
| `services/omnichannel/LanguageRouter.js` | LLM-based language detection & translation | OpenRouter |
| `services/omnichannel/LLMClient.js` | OpenRouter API client | OpenRouter |
| `controllers/omnichannelController.js` | New omnichannel message handler | LanguageRouter (LLM) |
| `controllers/customerSupportController.js` | Legacy customer support handler | n8n webhook |
| `public/chat-widget.html` | Customer-facing chat widget | Any |

---

## LanguageRouter Service

### `LanguageRouter.detectLanguage(text)`

Uses OpenRouter LLM to detect language from text. Returns:

```json
{
  "language": "ta",
  "languageName": "Tamil",
  "confidence": 99,
  "needsTranslation": true
}
```

**Supported languages:** English (en), Hindi (hi), Tamil (ta), Telugu (te), Bengali (bn), Marathi (mr), Gujarati (gu), Kannada (kn), Malayalam (ml), Punjabi (pa), Urdu (ur), Hinglish (hi).

### `LanguageRouter.translateToEnglish(text, sourceLanguage)`

Translates any language to English while preserving named entities (product names, brands, numbers). Used when processing customer messages.

### `LanguageRouter.translate(text, targetLanguage)`

Translates English to a target language. Used when sending AI/agent replies back to the customer.

---

## LLM Translation (OpenRouter)

### API

```
URL:    https://openrouter.ai/api/v1/chat/completions
Model:  openrouter/auto (fallback chain: gemini-2.0-flash-001 → command-r-plus)
Key:    process.env.OPENROUTER_API_KEY
```

### Translation Prompt

```
Translate the following text to {language} ({languageCode}).
Preserve product names, brand names, numbers, and prices.
Keep the tone professional and friendly.
Return ONLY the translated text, no explanations.
```

---

## Database Tables

### `customer_support_conversations`

| Column | Type | Purpose |
|---|---|---|
| `conversation_id` | VARCHAR(64) PK | Unique conversation identifier |
| `customer_name` | VARCHAR(255) | Customer's name |
| `customer_email` | VARCHAR(255) | Customer's email |
| `customer_phone` | VARCHAR(50) | Customer's phone |
| `subject` | VARCHAR(255) | Conversation subject |
| `status` | ENUM('open','in_progress','resolved','closed') | Current status |
| `priority` | ENUM('low','medium','high','urgent') | Priority level |
| `preferred_language` | VARCHAR(10) | Customer's language code |
| `created_at` | TIMESTAMP | When conversation started |
| `updated_at` | TIMESTAMP | Last activity |

### `customer_support_messages`

| Column | Type | Purpose |
|---|---|---|
| `id` | INT PK | Auto-increment ID |
| `conversation_id` | VARCHAR(64) FK | References conversation |
| `sender_type` | ENUM('customer','support','bot') | Who sent the message |
| `sender_name` | VARCHAR(255) | Display name |
| `message` | TEXT | **Display text** (translated for viewer) |
| `message_original` | TEXT | Original untranslated text |
| `message_translated` | TEXT | Translated version |
| `is_read` | TINYINT(1) | Read status |
| `created_at` | TIMESTAMP | When sent |

---

## Translation Logic

### Customer → Support (e.g. Tamil → English)

1. Detect language via OpenRouter LLM
2. Translate to English via OpenRouter LLM
3. Store in DB:
   - `message` = English (what admin sees)
   - `message_original` = Tamil (original)
   - `message_translated` = English (translated)

### Support → Customer (e.g. English → Tamil)

1. Generate AI reply in English
2. Translate to Tamil via OpenRouter LLM
3. Store in DB:
   - `message` = Tamil (what customer sees)
   - `message_original` = English (agent's input)
   - `message_translated` = Tamil (translated)

---

## Language Detection

### 1. LLM-Based (Omnichannel)

Uses OpenRouter to detect language from any text input. More accurate for mixed/Hinglish text.

### 2. Keyword Map (Legacy Customer Support)

```js
{ 'tamil':'ta', 'தமிழ்':'ta', 'ta':'ta',
  'hindi':'hi', 'हिंदी':'hi', 'hi':'hi',
  'telugu':'te', 'తెలుగు':'te', 'te':'te',
  'english':'en', 'en':'en' }
```

### 3. Explicit Selection (via Chat Widget)

Customer selects language from dropdown. Sent as `{ type: "language_select", language: "ta" }`.

---

## Error Handling (LLM Translation)

- **LLM unavailable**: Falls back to `requestLLM` with model fallback chain (3 models)
- **Parse failure**: Returns original untranslated text
- **Timeout**: 15s timeout with AbortController

---

## Backend Server

- **Host**: EC2 `13.62.99.152`
- **Process**: PM2 `veru-inventory` (id 8)
- **Path**: `/home/ubuntu/veru-inventory/`
- **Framework**: Express.js on port 5000
- **Database**: MySQL on `127.0.0.1:3306`, user `inventory_user`
- **LLM**: OpenRouter API at `openrouter.ai/api/v1`

---

## Resources

| Resource | Location |
|---|---|
| Language detection/translation | `services/omnichannel/LanguageRouter.js` |
| OpenRouter LLM client | `services/omnichannel/LLMClient.js` |
| Omnichannel controller | `controllers/omnichannelController.js` |
| Legacy support controller | `controllers/customerSupportController.js` |
| n8n webhook (legacy) | `http://13.215.172.213:5678/webhook/6ba285e1...` |
| Chat widget | `public/chat-widget.html` |
