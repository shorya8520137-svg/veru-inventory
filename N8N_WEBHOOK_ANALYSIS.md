# n8n Webhook Analysis Report — Live Test Results

**Date:** April 17, 2026  
**Tested from:** Local machine (Windows)  
**Webhook URL:** http://13.215.172.213:5678/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030

---

## Test Results

### TEST 1 — Language Selection (POST)

```
Request:
  Method: POST
  URL: http://13.215.172.213:5678/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030
  Body: {"type":"language_select","language":"ta"}

Response:
  Status: 200
  Body: (empty)
```

**Observation:** n8n accepts language_select but returns empty body. This is correct — no translation needed for language selection.

---

### TEST 2 — Admin message → translate to Tamil (POST)

```
Request:
  Method: POST
  URL: http://13.215.172.213:5678/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030
  Body: {"type":"message","message":"hello","language":"ta","source":"admin"}

Response:
  Status: 200
  Body: வணக்கம்
```

**Observation:** ✅ WORKING — n8n correctly translates "hello" to Tamil "வணக்கம்"  
**CRITICAL:** Response is PLAIN TEXT, NOT JSON. Backend must handle plain text response.

---

### TEST 3 — Customer message → translate to English (POST)

```
Request:
  Method: POST
  URL: http://13.215.172.213:5678/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030
  Body: {"type":"message","message":"vanakkam","language":"ta","source":"customer"}

Response:
  Status: 200
  Body: vanakkam
```

**Observation:** ⚠️ n8n returned same text "vanakkam" — no translation happened.  
Possible reason: "vanakkam" is romanized Tamil, not actual Tamil script. n8n may not recognize it.  
Need to test with actual Tamil script: "வணக்கம்"

---

### TEST 4 — GET request with body

```
Request:
  Method: GET
  Body: {"type":"message","message":"hello","language":"ta","source":"admin"}

Response:
  ERROR: Cannot send a content-body with this verb-type (ProtocolViolationException)
```

**Observation:** ❌ GET does NOT support body. Must use POST only.

---

## Summary of Findings

| # | Finding | Impact |
|---|---------|--------|
| 1 | Webhook accepts POST JSON ✅ | Correct method confirmed |
| 2 | GET with body fails ❌ | Must use POST only |
| 3 | Admin→Tamil translation works ✅ | "hello" → "வணக்கம்" |
| 4 | **Response is PLAIN TEXT not JSON** ⚠️ | Backend must handle plain text |
| 5 | language_select returns empty body | Backend should not try to parse |
| 6 | Customer→English translation unclear | Need test with Tamil script |

---

## Critical Fix Required in Backend

**Current backend code (WRONG):**
```javascript
const json = JSON.parse(data);  // FAILS — data is plain text "வணக்கம்"
resolve(json);
```

**Correct backend code:**
```javascript
// n8n returns plain text, not JSON
const translated = data.trim();
if (translated && translated !== '' && translated !== '""') {
    resolve({ reply_local: translated, reply_en: translated });
} else {
    resolve(null);
}
```

---

## Correct n8n Request Format

### For language selection (no translation needed):
```
Method: POST
Content-Type: application/json
Body: {
  "type": "language_select",
  "language": "ta"
}
Response: (empty — ignore)
```

### For admin message → translate to customer's language:
```
Method: POST
Content-Type: application/json
Body: {
  "type": "message",
  "message": "Hello, how can I help you?",
  "language": "ta",
  "source": "admin"
}
Response: வணக்கம், நான் எப்படி உதவலாம்?  (plain text Tamil)
```

### For customer message → translate to English:
```
Method: POST
Content-Type: application/json
Body: {
  "type": "message",
  "message": "வணக்கம்",
  "language": "ta",
  "source": "customer"
}
Response: Hello  (plain text English)
```

---

## n8n Workflow Structure (from screenshot)

```
Translate_Webhook (GET trigger)
        |
        v
lang1 (POST: ws.detectlanguage.com)
        |
        v
Code in JavaScript1
        |
        v
Switch3 (mode: Rules)
    |           |           |
Tamil_Agent  Hindi_Agent  English_Agent
    |           |           |
OpenRouter_Tamil1  OpenRouter_Hindi1  OpenRouter_English1
    |           |           |
    +-----+-----+
          |
          v
    Respond to Webhook1
```

**Note:** The n8n workflow trigger is configured as GET but our tests show POST works too. The workflow uses language detection + OpenRouter AI to generate responses.

---

## Action Items

1. **Fix backend** — handle plain text response from n8n (not JSON)
2. **Test with Tamil script** — send "வணக்கம்" as customer message to verify English translation
3. **Verify server connectivity** — run `node test-webhook-connectivity.js` on Ubuntu server
4. **n8n workflow** — ensure `source: "admin"` routes to translation (not generation)

---

## Backend Fix (apply immediately)

In `controllers/customerSupportController.js`, update `callWebhook`:

```javascript
function callWebhook(payload) {
    return new Promise((resolve) => {
        const body = JSON.stringify(payload);
        const options = { /* ... */ };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const text = data.trim();
                if (!text || text === '' || text === '""') return resolve(null);
                
                // Try JSON first, fall back to plain text
                try {
                    const json = JSON.parse(text);
                    resolve(json);
                } catch {
                    // n8n returned plain text (e.g. "வணக்கம்")
                    resolve({ reply_local: text, reply_en: text });
                }
            });
        });
    });
}
```

Then in sendMessage, use `result?.reply_local || result` for the translated text.
