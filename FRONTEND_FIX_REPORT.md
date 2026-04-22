# Frontend Fix Report — ChatWidget.tsx
# File: client/src/components/chat/ChatWidget.tsx
# Date: April 19, 2026

---

## BUGS TO FIX (3 total)

---

## BUG 1 — Duplicate Tamil message bubbles (CRITICAL)

### What user sees:
Same Tamil message appears twice in chat window.

### Why it happens:
When user sends a message, frontend adds an "optimistic" copy locally
(so it appears instantly without waiting for server).
Then polling fetches the real message from server.
The merge function tries to remove the optimistic copy by matching content.
But optimistic has Tamil text, server has English translation in `message` field.
Match fails → both stay → 2 bubbles appear.

### Fix — update mergeMessages() function:

FIND this function (looks something like):
```typescript
function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const incomingIds = new Set(incoming.map(m => m.id));
  const localOnly = existing.filter(m =>
    m.id > 1_000_000_000_000 && !incomingIds.has(m.id)
  );
  return [...incoming, ...localOnly].sort(...);
}
```

CHANGE the localOnly filter to also check message_original:
```typescript
function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const incomingIds = new Set(incoming.map(m => m.id));

  // Also collect all original texts from server messages
  const incomingOriginals = new Set(
    incoming.map(m => m.message_original?.trim()).filter(Boolean)
  );
  const incomingMessages = new Set(
    incoming.map(m => m.message?.trim()).filter(Boolean)
  );

  const localOnly = existing.filter(m => {
    // Not a temp/optimistic message
    if (m.id <= 1_000_000_000_000) return false;
    // Already confirmed by server via ID
    if (incomingIds.has(m.id)) return false;
    // Already confirmed by server via content match (handles translation case)
    if (incomingOriginals.has(m.message?.trim())) return false;
    if (incomingMessages.has(m.message?.trim())) return false;
    return true; // keep only truly unconfirmed optimistic messages
  });

  return [...incoming, ...localOnly].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}
```

---

## BUG 2 — Customer sees English translation of their own message (HIGH)

### What user sees:
User types "என் தொலைபேசி இயங்கவில்லை." (Tamil)
Chat bubble shows "My phone is not working." (English)

### Why it happens:
Backend stores English translation in `message` field.
Original Tamil is in `message_original` field.
Frontend renders `msg.message` for all bubbles — always shows English.

### Fix — update message bubble render:

FIND where messages are rendered (inside messages.map()):
```tsx
<p>{msg.message}</p>
```

REPLACE WITH:
```tsx
<p>
  {msg.sender_type === 'customer' &&
   msg.message_original &&
   msg.message_original.trim() !== msg.message.trim()
    ? msg.message_original   // show Tamil original to customer
    : msg.message            // show as-is for bot/support
  }
</p>
```

Also update the Message interface to include the new fields:
```typescript
interface Message {
  id: number;
  sender_type: "customer" | "bot" | "support";
  sender_name: string;
  message: string;
  message_original?: string;      // ADD THIS
  message_translated?: string;    // ADD THIS
  created_at: string;
}
```

Also update the optimistic message in sendMessage() to include message_original:
```typescript
const optimisticMsg: Message = {
  id: Date.now(),
  sender_type: "customer",
  sender_name: customerName,
  message: text,
  message_original: text,    // ADD THIS — so Tamil shows immediately
  created_at: new Date().toISOString(),
};
```

---

## BUG 3 — "Tamil" / "Hindi" language selection shows as a chat bubble (MEDIUM)

### What user sees:
After clicking Tamil button, a purple bubble with text "Tamil" appears in chat.

### Why it happens:
handleLanguageSelect() calls sendMessage("Tamil").
This adds an optimistic bubble with text "Tamil".
Backend does NOT store it as a message (correct behavior).
But the optimistic bubble stays because polling never returns a matching server message.

### Fix — filter language-name messages in render:

FIND the messages.map() render block and add this filter at the top:
```typescript
const LANG_NAMES = ['Tamil','Hindi','Telugu','English','ta','hi','te','en'];

{messages
  .filter(msg => !LANG_NAMES.includes(msg.message?.trim()))
  .map((msg) => (
    // ... existing bubble render
  ))
}
```

---

## SUMMARY — 3 changes in ChatWidget.tsx

| # | Bug | Fix Location | Lines to change |
|---|-----|-------------|-----------------|
| 1 | Duplicate bubbles | mergeMessages() | Add message_original check in localOnly filter |
| 2 | English shown to customer | messages.map() render | Show message_original for customer bubbles |
| 3 | "Tamil" bubble appears | messages.map() render | Filter out language-name messages |

---

## AFTER ALL 3 FIXES

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Customer sends Tamil | 2 bubbles (Tamil + Tamil) | 1 bubble (Tamil only) |
| Customer bubble text | "My phone is not working." (English) | "என் தொலைபேசி இயங்கவில்லை." (Tamil) |
| Language selection | "Tamil" bubble appears | No bubble, just language saved |
| Admin panel | English shown | English shown (unchanged) |

---

## TEST STEPS AFTER FIX

1. Open https://giftgala.in in incognito window
2. Click chat bubble (bottom right)
3. Enter name + email → Start Chat
4. Click "தமிழ்" button
5. Verify: NO "Tamil" bubble appears
6. Type "என் தொலைபேசி இயங்கவில்லை." → Send
7. Verify: exactly ONE Tamil bubble appears
8. Verify: bubble shows Tamil text, NOT English
9. Open admin panel → verify English translation shown there
