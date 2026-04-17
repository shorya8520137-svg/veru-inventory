# Translation System Bug Report

**Date:** April 17, 2026  
**Project:** Veru Inventory — Customer Support Chat  
**Reporter:** Kiro AI Analysis

---

## Bug 1 — `[EN] Hello` showing in website chat widget

**Severity:** High  
**Status:** Code fixed — needs server deploy

**What happens:**  
Customer sees `[EN] Hello` message in their chat window. This is an admin-only reference message that should never be visible to the customer.

**Root cause:**  
Backend stores two messages per customer message:
- `reply_local` (Tamil) — for customer
- `[EN] reply_en` (English) — for admin reference only

The website chat widget was displaying ALL messages from DB including the `[EN]` one.

**Fix applied (in code):**  
`displayMessages()` in `public/chat-widget.html` now skips any message starting with `[EN]` or from `Support Bot (EN)`.

**Action needed:**  
```bash
git pull origin main
pm2 restart all
```

---

## Bug 2 — Bot response in English after customer selects Tamil

**Severity:** High  
**Status:** Code fixed — depends on server connectivity to n8n

**What happens:**  
Customer types "Tamil" → bot responds "Thank you for contacting us. A support representative will assist you shortly." in English instead of Tamil.

**Root cause (suspected):**  
Backend server (Ubuntu) cannot reach n8n webhook at `13.215.172.213:5678` — so it falls back to the English keyword bot response.

**Test to confirm — run on server:**
```bash
node test-webhook-connectivity.js
```

**Expected output if working:**
```
✅ Status: 200
📋 reply_local: நன்றி, ஒரு ஆதரவு பிரதிநிதி உங்களுக்கு உதவுவார்.
```

**Expected output if broken:**
```
❌ Connection error: connect ECONNREFUSED
```

---

## Bug 3 — Admin reply shows in English to customer

**Severity:** High  
**Status:** Code fixed — depends on server connectivity to n8n

**What happens:**  
Admin types "hello" in admin panel → customer sees "hello" in English, not Tamil.

**Root cause:**  
Same as Bug 2 — translation webhook not reachable from server, so English message stored as-is.

**Fix applied (in code):**  
`sendMessage()` in `controllers/customerSupportController.js` now calls translate webhook before storing support agent messages. If `preferred_language = ta`, the message is translated to Tamil before saving to DB.

---

## Bug 4 — n8n returns English when `message=hello&language=ta`

**Severity:** Medium  
**Status:** n8n workflow issue — needs n8n fix

**Observation from local test:**

Test 1 — English input with Tamil language:
```
Input:   message=hello  language=ta
Output:  reply_local = "Hello! How can I help you today?"   ← English, NOT Tamil
         reply_en    = "Hello! How can I assist you?"
```

Test 2 — Tamil input with Tamil language:
```
Input:   message=வணக்கம்  language=ta
Output:  reply_local = "வணக்கம் (Hello in Tamil)"   ← Tamil but with English suffix
         reply_en    = "Hello"
```

**Root cause:**  
n8n workflow only translates when input is already in Tamil. When English text is sent with `language=ta`, n8n generates a new English response instead of translating the input to Tamil.

**Fix needed in n8n:**  
The workflow should translate the `message` field TO the `language` specified — not generate a new response in the detected language of the input.

Also remove the `(Hello in Tamil)` suffix from `reply_local` responses.

---

## Summary Table

| # | Bug | Location | Fix Location | Status |
|---|-----|----------|-------------|--------|
| 1 | `[EN]` showing in website widget | `chat-widget.html` | Frontend | ✅ Code fixed — needs server deploy |
| 2 | Bot responds in English after Tamil selected | `customerSupportController.js` | Backend + n8n connectivity | ✅ Code fixed — needs server connectivity test |
| 3 | Admin reply not translated to Tamil | `customerSupportController.js` | Backend | ✅ Code fixed — needs server connectivity test |
| 4 | n8n returns English for English input + `language=ta` | n8n workflow | n8n | ❌ Needs n8n workflow fix |

---

## Action Items (in order)

### Step 1 — Deploy latest code on server
```bash
git pull origin main
pm2 restart all
```

### Step 2 — Test webhook connectivity from server
```bash
node test-webhook-connectivity.js
```
Share the output to confirm if server can reach n8n.

### Step 3 — Fix n8n translate workflow
The translate webhook (`6ba285e1-413c-4c00-9a93-d653daaa1030`) needs to:
1. Accept `message` (any language) + `language` (target language code)
2. Translate `message` TO the target language
3. Return `{ "reply_local": "<translated text>", "reply_en": "<english text>" }`
4. Remove `(Hello in Tamil)` style suffixes from output

### Step 4 — Verify 2-way translation
After n8n fix, test:
- Customer sends "வணக்கம்" → admin sees Tamil + `[EN] Hello`
- Admin sends "Hello" → customer sees "வணக்கம்" (Tamil)

---

## Webhook Details

| Webhook | URL | Method | Purpose |
|---------|-----|--------|---------|
| Translate | `http://13.215.172.213:5678/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030` | GET | Translate messages to target language |
| AI Agent | `http://13.215.172.213:5678/webhook/6cc5c704-0ebe-4779-a00d-16c7cee83ac8` | POST | AI agent responses |

**Translate webhook query params:**
```
?message=<text to translate>&language=<target language code>
```

**Language codes:**
- `en` — English
- `hi` — Hindi
- `ta` — Tamil
- `te` — Telugu
