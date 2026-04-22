# ChatWidget.tsx Fix Guide
# File: client/src/components/chat/ChatWidget.tsx

## THE BUG
Customer types in Tamil → sees English translation in their own chat bubble.
Root cause: ChatWidget.tsx only reads `message` field from API.
But API returns `message_original` which has the actual Tamil text.

## API RESPONSE STRUCTURE
```json
{
  "id": 541,
  "sender_type": "customer",
  "message": "My phone is not working.",        ← English (for admin)
  "message_original": "என் தொலைபேசி இயங்கவில்லை.", ← Tamil (for customer)
  "message_translated": "My phone is not working."
}
```

## STEP 1 — Update the Message interface

FIND this in ChatWidget.tsx:
```typescript
interface Message {
  id: number;
  sender_type: "customer" | "bot" | "support";
  sender_name: string;
  message: string;
  created_at: string;
}
```

REPLACE WITH:
```typescript
interface Message {
  id: number;
  sender_type: "customer" | "bot" | "support";
  sender_name: string;
  message: string;
  message_original?: string;       // ← ADD THIS
  message_translated?: string;     // ← ADD THIS
  created_at: string;
}
```

---

## STEP 2 — Fix the message bubble rendering

FIND where messages are rendered (look for `.map()` on messages array).
It will look something like this:
```tsx
{messages.map((msg) => (
  <div key={msg.id} className={...}>
    <p>{msg.message}</p>   ← THIS IS THE BUG
  </div>
))}
```

REPLACE `{msg.message}` with this helper:
```tsx
{msg.sender_type === 'customer' && msg.message_original && msg.message_original !== msg.message
  ? msg.message_original   // show Tamil (original) to customer
  : msg.message            // show as-is for bot/support messages
}
```

So it becomes:
```tsx
{messages.map((msg) => (
  <div key={msg.id} className={...}>
    <p>
      {msg.sender_type === 'customer' && msg.message_original && msg.message_original !== msg.message
        ? msg.message_original
        : msg.message}
    </p>
  </div>
))}
```

---

## STEP 3 — Fix the optimistic message (sendMessage function)

FIND the sendMessage function. It creates an optimistic message like:
```typescript
const optimisticMsg: Message = {
  id: Date.now(),
  sender_type: "customer",
  sender_name: customerName,
  message: text,           ← user typed Tamil here
  created_at: new Date().toISOString(),
};
```

ADD `message_original` to it:
```typescript
const optimisticMsg: Message = {
  id: Date.now(),
  sender_type: "customer",
  sender_name: customerName,
  message: text,
  message_original: text,   // ← ADD THIS so Tamil shows immediately
  created_at: new Date().toISOString(),
};
```

---

## STEP 4 — Fix language selection bubble (if showing)

If "Tamil" bubble is showing in chat after language selection,
find `handleLanguageSelect` function:

```typescript
const handleLanguageSelect = (opt: LanguageOption) => {
  setShowLangButtons(false);
  setLanguageSelected(true);
  sendMessage(opt.value);   // ← this sends "Tamil" as a message
};
```

The backend already handles this correctly (does NOT store it as a chat message).
But if the optimistic message shows "Tamil" bubble — add this check in the render:

```tsx
// Skip language name messages in render
if (['Tamil','Hindi','Telugu','English','ta','hi','te','en']
    .includes(msg.message?.trim())) return null;
```

---

## SUMMARY OF CHANGES

| File | Change |
|------|--------|
| ChatWidget.tsx | Add `message_original?` to Message interface |
| ChatWidget.tsx | Show `message_original` for customer bubbles |
| ChatWidget.tsx | Add `message_original: text` to optimistic message |
| ChatWidget.tsx | Skip language-name messages in render (optional) |

## AFTER THE FIX

Customer types: "என் தொலைபேசி இயங்கவில்லை."
Customer sees: "என் தொலைபேசி இயங்கவில்லை." ✅ (Tamil)
Admin sees:    "My phone is not working."      ✅ (English)
