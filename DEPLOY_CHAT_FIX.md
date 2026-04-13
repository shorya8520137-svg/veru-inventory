# Deploy Customer Support Chat Fix

## Issue
Admin replies from the dashboard were not appearing in the customer chat widget.

## Root Cause
The admin chat page was using JWT authentication headers when sending/fetching messages, but the customer support endpoints should be public (no auth required) for both customers and support agents.

## Changes Made

### 1. Admin Chat Page (`src/app/customer-support/[conversationId]/page.jsx`)
- ✅ Removed JWT authentication from `sendMessage()` function
- ✅ Removed JWT authentication from `fetchMessages()` function
- ✅ Added console logging for debugging
- ✅ Both functions now use public endpoints (no auth headers)

### 2. Chat Widget (`public/chat-widget.html`)
- ✅ Added detailed console logging for debugging
- ✅ Logs show when messages are sent/received
- ✅ Better error handling with user-friendly messages

### 3. Server Authentication (`server.js`)
- ✅ Improved authentication bypass logic for customer support endpoints
- ✅ All POST and GET requests to `/api/customer-support/conversations/*` are now public

## Deployment Steps

### Step 1: Pull Latest Code on Server
```bash
cd /home/ubuntu/inventoryfullstack
git pull origin stocksphere-phase-1-complete
```

### Step 2: Restart Backend Server
```bash
pm2 restart all
pm2 logs --lines 50
```

### Step 3: Rebuild Frontend
```bash
npm run build
pm2 restart nextjs
```

### Step 4: Test the API
Run the test script from your local machine:
```bash
node test-chat-messages.js
```

This will:
1. Create a new conversation
2. Send a customer message
3. Send an admin/support message
4. Fetch all messages to verify they're saved correctly

### Step 5: Test in Browser

#### A. Open Chat Widget
1. Open `https://13.229.107.233:8443/chat-widget.html` in a browser
2. Fill in the form and start a chat
3. Send a message as customer
4. Note the conversation ID from browser console (F12)

#### B. Open Admin Dashboard
1. Login to admin dashboard: `https://13.229.107.233:8443/customer-support`
2. Find the conversation you just created
3. Click "View Chat"
4. Send a reply as support agent
5. Check browser console for logs:
   - Should see: `📤 Send message response: {success: true}`
   - Should see: `✅ Message sent successfully`

#### C. Check Widget
1. Go back to the chat widget tab
2. Wait 5 seconds (auto-refresh)
3. Admin reply should appear
4. Check browser console for logs:
   - Should see: `🔄 Fetching messages for: CONV-...`
   - Should see: `✅ Received X messages`

## Debugging

### Check Server Logs
```bash
pm2 logs --lines 100
```

Look for:
- `✅ Skipping auth for customer support public endpoints`
- Any error messages related to customer support

### Check Database
```bash
sudo mysql inventory_db
```

```sql
-- Check conversations
SELECT * FROM customer_support_conversations ORDER BY created_at DESC LIMIT 5;

-- Check messages for a specific conversation
SELECT * FROM customer_support_messages 
WHERE conversation_id = 'CONV-XXXXX' 
ORDER BY created_at ASC;
```

### Test API Directly
```bash
# Create conversation
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "subject": "Test",
    "initial_message": "Hello"
  }' -k

# Send message (replace CONV-XXXXX with actual conversation ID)
curl -X POST https://13.229.107.233:8443/api/customer-support/conversations/CONV-XXXXX/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Admin reply test",
    "sender_type": "support",
    "sender_name": "Support Agent"
  }' -k

# Get messages
curl https://13.229.107.233:8443/api/customer-support/conversations/CONV-XXXXX/messages -k
```

## Expected Behavior

### Before Fix
- ❌ Admin sends message from dashboard
- ❌ Message doesn't appear in customer widget
- ❌ Widget shows old messages only

### After Fix
- ✅ Admin sends message from dashboard
- ✅ Message is saved to database with `sender_type: 'support'`
- ✅ Widget polls every 5 seconds and fetches new messages
- ✅ Admin reply appears in widget with proper styling
- ✅ Console logs show successful send/fetch operations

## Troubleshooting

### Issue: Messages still not appearing
1. Check browser console for errors
2. Verify conversation ID matches in both admin and widget
3. Check server logs for authentication errors
4. Verify database has the messages with correct `sender_type`

### Issue: 401 Unauthorized errors
1. Clear browser cache
2. Verify server.js authentication bypass is deployed
3. Restart PM2 processes
4. Check server logs for authentication middleware messages

### Issue: Widget not polling
1. Check browser console for JavaScript errors
2. Verify widget is using correct API base URL
3. Check network tab in browser dev tools
4. Verify conversation ID is stored in localStorage

## Files Changed
- `src/app/customer-support/[conversationId]/page.jsx` - Admin chat page
- `public/chat-widget.html` - Customer chat widget
- `server.js` - Authentication bypass logic
- `test-chat-messages.js` - New test script (NEW)
- `DEPLOY_CHAT_FIX.md` - This deployment guide (NEW)

## Git Commit
```
Fix customer support chat - remove auth from admin messages and add debug logging
```

## Next Steps
1. Deploy to server using steps above
2. Test thoroughly with real conversations
3. Monitor server logs for any issues
4. Consider adding admin authentication back (but keep message endpoints public)
