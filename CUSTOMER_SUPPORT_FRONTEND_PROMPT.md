# Customer Support Chat Frontend - Complete Implementation Prompt

## 🎯 PROJECT OVERVIEW

Create a complete customer support chat system frontend for the inventory management system. This includes:
1. **Admin Dashboard** - View and manage all customer conversations
2. **Chat Interface** - Real-time chat UI for support staff to respond to customers
3. **Bot Management** - Manage bot auto-response keywords and responses
4. **Analytics Dashboard** - View support metrics and performance

## 📁 PROJECT STRUCTURE

The project uses Next.js 14 with App Router. Follow this exact structure:

```
src/app/
├── customer-support/
│   ├── page.jsx                    # Main dashboard (conversation list)
│   ├── customerSupport.module.css  # Dashboard styles
│   ├── [conversationId]/
│   │   ├── page.jsx                # Individual chat interface
│   │   └── chat.module.css         # Chat interface styles
│   ├── bot-responses/
│   │   ├── page.jsx                # Bot response management
│   │   └── botResponses.module.css # Bot management styles
│   └── analytics/
│       ├── page.jsx                # Analytics dashboard
│       └── analytics.module.css    # Analytics styles
```

## 🎨 DESIGN SYSTEM

### Color Palette
- **Primary**: Blue (#3B82F6, #2563EB, #1D4ED8)
- **Success**: Green (#10B981, #059669)
- **Warning**: Yellow (#F59E0B, #D97706)
- **Danger**: Red (#EF4444, #DC2626)
- **Neutral**: Slate (#64748B, #475569, #334155)
- **Background**: Gradient from slate-50 to slate-100

### Typography
- **Font**: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- **Sizes**: 
  - Headings: 24px (h1), 18px (h2), 16px (h3)
  - Body: 14px
  - Small: 12px, 11px

### Components Style
- **Cards**: White background, rounded-xl (12px), shadow-sm, border slate-200
- **Buttons**: Rounded-lg (8px), padding 10px 16px, font-medium
- **Inputs**: Rounded-lg (8px), border slate-300, focus ring-2 ring-blue-500
- **Badges**: Rounded-full, padding 2.5px 10px, text-xs, font-medium
- **Hover Effects**: scale-[1.02], transition-all duration-200

## 🔧 TECHNICAL REQUIREMENTS

### Authentication
```javascript
const token = localStorage.getItem('token');
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://13.229.107.233:8443';

// All API calls must include:
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
}
```

### API Endpoints

#### 1. Get All Conversations (Admin)
```javascript
GET ${API_BASE}/api/customer-support/conversations?status=open&page=1&limit=20
Response: {
    success: true,
    data: {
        conversations: [{
            id: 1,
            conversation_id: "CONV-1234567890-abc123",
            customer_name: "John Doe",
            customer_email: "john@example.com",
            customer_phone: "+1234567890",
            subject: "Order Issue",
            status: "open", // open, in_progress, resolved, closed
            priority: "medium", // low, medium, high, urgent
            created_at: "2026-02-13T10:30:00Z",
            updated_at: "2026-02-13T11:45:00Z",
            message_count: 5,
            last_message: "Thank you for your help!"
        }],
        pagination: {
            page: 1,
            limit: 20,
            total: 45,
            pages: 3
        }
    }
}
```

#### 2. Get Conversation Messages
```javascript
GET ${API_BASE}/api/customer-support/conversations/${conversation_id}/messages
Response: {
    success: true,
    data: {
        conversation_id: "CONV-1234567890-abc123",
        messages: [{
            id: 1,
            sender_type: "customer", // customer, support, bot
            sender_name: "John Doe",
            message: "I need help with my order",
            is_read: true,
            created_at: "2026-02-13T10:30:00Z"
        }]
    }
}
```

#### 3. Send Message (Support Reply)
```javascript
POST ${API_BASE}/api/customer-support/conversations/${conversation_id}/messages
Body: {
    message: "I can help you with that. What's your order number?",
    sender_type: "support",
    sender_name: "Support Agent"
}
Response: {
    success: true,
    message: "Message sent successfully",
    data: {
        bot_response: null // Only if customer message triggers bot
    }
}
```

#### 4. Update Conversation Status
```javascript
PATCH ${API_BASE}/api/customer-support/conversations/${conversation_id}/status
Body: {
    status: "resolved" // open, in_progress, resolved, closed
}
Response: {
    success: true,
    message: "Status updated successfully"
}
```

#### 5. Create Conversation (Customer - Public)
```javascript
POST ${API_BASE}/api/customer-support/conversations
Body: {
    customer_name: "John Doe",
    customer_email: "john@example.com",
    customer_phone: "+1234567890",
    subject: "Order Issue",
    initial_message: "I need help with my order"
}
Response: {
    success: true,
    message: "Conversation created successfully",
    data: {
        conversation_id: "CONV-1234567890-abc123",
        bot_response: "Thank you for contacting us. A support representative will assist you shortly."
    }
}
```

#### 6. Rate Conversation (Customer - Public)
```javascript
POST ${API_BASE}/api/customer-support/conversations/${conversation_id}/rating
Body: {
    rating: 5, // 1-5
    feedback: "Great support!"
}
Response: {
    success: true,
    message: "Thank you for your feedback!"
}
```

## 📄 PAGE 1: MAIN DASHBOARD (src/app/customer-support/page.jsx)

### Features Required:
1. **Statistics Cards** (4 cards in grid)
   - Total Conversations (with Users icon)
   - Open Conversations (with Clock icon)
   - In Progress (with RefreshCw icon)
   - Resolved Today (with CheckCircle icon)

2. **Filters Section**
   - Search input (by customer name, email, conversation ID)
   - Status filter dropdown (All, Open, In Progress, Resolved, Closed)
   - Priority filter dropdown (All, Low, Medium, High, Urgent)
   - Date range picker (optional)

3. **Conversations Table**
   - Columns: ID, Customer, Subject, Status, Priority, Messages, Last Updated, Actions
   - Each row shows:
     - Conversation ID (clickable to open chat)
     - Customer name + email
     - Subject
     - Status badge (colored)
     - Priority badge (colored)
     - Message count
     - Last updated time (relative: "2 hours ago")
     - Actions: View Chat, Change Status, Close
   - Pagination (Previous/Next buttons)
   - Empty state with icon when no conversations

4. **Status Colors**
   - Open: Orange (#FF6B35)
   - In Progress: Blue (#4ECDC4)
   - Resolved: Green (#38B000)
   - Closed: Gray (#6C757D)

5. **Priority Colors**
   - Low: Gray (#6C757D)
   - Medium: Blue (#3B82F6)
   - High: Orange (#F59E0B)
   - Urgent: Red (#EF4444)

### Component Structure:
```jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Users, Clock, RefreshCw, CheckCircle, 
    Search, MessageSquare, AlertCircle 
} from 'lucide-react';
import styles from './customerSupport.module.css';

export default function CustomerSupportPage() {
    const [conversations, setConversations] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        in_progress: 0,
        resolved_today: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const router = useRouter();

    // Implement all functions here
    // fetchConversations(), fetchStats(), updateStatus(), etc.

    return (
        <div className={styles.container}>
            {/* Stats Cards */}
            {/* Filters */}
            {/* Conversations Table */}
            {/* Pagination */}
        </div>
    );
}
```

### CSS Module (customerSupport.module.css):
```css
.container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 24px;
}

.statsGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

.statCard {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s;
}

.statCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Add all other styles following the existing pattern */
```

## 📄 PAGE 2: CHAT INTERFACE (src/app/customer-support/[conversationId]/page.jsx)

### Features Required:
1. **Header Section**
   - Customer name and email
   - Conversation ID
   - Status badge
   - Priority badge
   - Back button to dashboard
   - Status change dropdown
   - Close conversation button

2. **Messages Area**
   - Scrollable message list
   - Customer messages (left side, blue background)
   - Support messages (right side, green background)
   - Bot messages (left side, gray background with bot icon)
   - Timestamp for each message
   - Sender name
   - Auto-scroll to bottom on new message
   - Loading state while fetching

3. **Message Input**
   - Text area for typing message
   - Send button
   - Character count (optional)
   - Emoji picker (optional)
   - File attachment button (optional)

4. **Sidebar (Optional)**
   - Customer information
   - Conversation details
   - Quick actions
   - Suggested responses

### Component Structure:
```jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, Send, User, Bot, 
    Clock, CheckCircle, AlertCircle 
} from 'lucide-react';
import styles from './chat.module.css';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const messagesEndRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const conversationId = params.conversationId;

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Implement functions: fetchMessages(), sendMessage(), updateStatus()

    return (
        <div className={styles.container}>
            <div className={styles.chatWrapper}>
                {/* Header */}
                <div className={styles.header}>
                    {/* Customer info, status, actions */}
                </div>

                {/* Messages Area */}
                <div className={styles.messagesArea}>
                    {messages.map(message => (
                        <div 
                            key={message.id}
                            className={`${styles.message} ${
                                message.sender_type === 'customer' 
                                    ? styles.customerMessage 
                                    : message.sender_type === 'bot'
                                    ? styles.botMessage
                                    : styles.supportMessage
                            }`}
                        >
                            {/* Message content */}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={styles.inputArea}>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className={styles.textarea}
                        rows={3}
                    />
                    <button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className={styles.sendButton}
                    >
                        <Send size={18} />
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}
```

### CSS Module (chat.module.css):
```css
.container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 24px;
}

.chatWrapper {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    height: calc(100vh - 48px);
}

.header {
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.messagesArea {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.message {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 12px;
    word-wrap: break-word;
}

.customerMessage {
    align-self: flex-start;
    background: #EFF6FF;
    border: 1px solid #DBEAFE;
}

.supportMessage {
    align-self: flex-end;
    background: #D1FAE5;
    border: 1px solid #A7F3D0;
}

.botMessage {
    align-self: flex-start;
    background: #F1F5F9;
    border: 1px solid #E2E8F0;
}

.inputArea {
    padding: 20px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 12px;
    align-items: flex-end;
}

.textarea {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    resize: none;
    font-family: inherit;
}

.textarea:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sendButton {
    background: #3B82F6;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}

.sendButton:hover:not(:disabled) {
    background: #2563EB;
    transform: translateY(-1px);
}

.sendButton:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

## 📄 PAGE 3: BOT RESPONSES MANAGEMENT (src/app/customer-support/bot-responses/page.jsx)

### Features Required:
1. **Header with Add Button**
   - Title: "Bot Auto-Responses"
   - Description
   - "Add New Response" button

2. **Responses Table**
   - Columns: Keyword, Response, Category, Usage Count, Status, Actions
   - Each row shows:
     - Keyword (editable inline)
     - Response text (truncated with "Show More")
     - Category badge
     - Usage count
     - Active/Inactive toggle
     - Edit and Delete buttons
   - Search filter
   - Category filter

3. **Add/Edit Modal**
   - Keyword input
   - Response textarea
   - Category dropdown
   - Active/Inactive toggle
   - Save and Cancel buttons

4. **Categories**
   - Greeting
   - Orders
   - Returns
   - Refunds
   - Payment
   - Delivery
   - Contact
   - Closing

### Component Structure:
```jsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Bot } from 'lucide-react';
import styles from './botResponses.module.css';

export default function BotResponsesPage() {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingResponse, setEditingResponse] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Implement functions: fetchResponses(), addResponse(), updateResponse(), deleteResponse()

    return (
        <div className={styles.container}>
            {/* Header with Add Button */}
            {/* Search and Filters */}
            {/* Responses Table */}
            {/* Add/Edit Modal */}
        </div>
    );
}
```

## 📄 PAGE 4: ANALYTICS DASHBOARD (src/app/customer-support/analytics/page.jsx)

### Features Required:
1. **Key Metrics Cards**
   - Total Conversations
   - Average Response Time
   - Customer Satisfaction (average rating)
   - Resolution Rate

2. **Charts** (Use recharts library)
   - Conversations Over Time (Line chart)
   - Status Distribution (Pie chart)
   - Bot Response Usage (Bar chart)
   - Customer Ratings Distribution (Bar chart)

3. **Recent Activity**
   - Latest conversations
   - Recent ratings
   - Top bot responses

4. **Filters**
   - Date range selector
   - Export data button

## 🔗 NAVIGATION INTEGRATION

### Update Sidebar (src/components/ui/sidebar.jsx)

Add this menu item in the InventoryMenu component after the "Website Customers" section:

```jsx
{/* CUSTOMER SUPPORT */}
{hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
    <MenuItemWithSub
        icon={MessageSquare}
        label="Customer Support"
        isActive={pathname.startsWith('/customer-support')}
        isOpen={supportOpen}
        onToggle={() => setSupportOpen(!supportOpen)}
        basePath="/customer-support"
    >
        <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
            <Link 
                href="/customer-support"
                className={cn(
                    "block rounded-md px-2.5 py-1.5 text-xs transition-all duration-200",
                    pathname === "/customer-support" 
                        ? "text-slate-900 font-medium bg-slate-50" 
                        : "text-slate-500 hover:text-slate-900"
                )}
            >
                💬 Conversations
            </Link>
        </motion.div>
        <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
            <Link 
                href="/customer-support/bot-responses"
                className={cn(
                    "block rounded-md px-2.5 py-1.5 text-xs transition-all duration-200",
                    pathname === "/customer-support/bot-responses" 
                        ? "text-slate-900 font-medium bg-slate-50" 
                        : "text-slate-500 hover:text-slate-900"
                )}
            >
                🤖 Bot Responses
            </Link>
        </motion.div>
        <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
            <Link 
                href="/customer-support/analytics"
                className={cn(
                    "block rounded-md px-2.5 py-1.5 text-xs transition-all duration-200",
                    pathname === "/customer-support/analytics" 
                        ? "text-slate-900 font-medium bg-slate-50" 
                        : "text-slate-500 hover:text-slate-900"
                )}
            >
                📊 Analytics
            </Link>
        </motion.div>
    </MenuItemWithSub>
)}
```

Don't forget to:
1. Import MessageSquare from lucide-react
2. Add supportOpen state: `const [supportOpen, setSupportOpen] = React.useState(false);`

## 🎨 ICONS TO USE (from lucide-react)

```javascript
import {
    MessageSquare,  // Main customer support icon
    Users,          // Total conversations
    Clock,          // Open/pending
    RefreshCw,      // In progress
    CheckCircle,    // Resolved
    XCircle,        // Closed
    AlertCircle,    // Urgent priority
    Search,         // Search functionality
    Send,           // Send message
    Bot,            // Bot messages
    User,           // Customer messages
    ArrowLeft,      // Back button
    Plus,           // Add new
    Edit,           // Edit action
    Trash2,         // Delete action
    Filter,         // Filter options
    TrendingUp,     // Analytics
    Star,           // Ratings
    BarChart,       // Charts
    PieChart        // Charts
} from 'lucide-react';
```

## ⚡ REAL-TIME UPDATES (Optional Enhancement)

For real-time chat updates, implement polling:

```javascript
useEffect(() => {
    const interval = setInterval(() => {
        fetchMessages(); // Refresh messages every 5 seconds
    }, 5000);

    return () => clearInterval(interval);
}, [conversationId]);
```

Or use WebSocket for true real-time (advanced):
```javascript
// Future enhancement - WebSocket connection
const ws = new WebSocket('wss://13.229.107.233:8443/ws/support');
```

## 📱 RESPONSIVE DESIGN

All pages must be responsive:
- Desktop: Full layout with sidebar
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation, stacked layout

Use these breakpoints:
```css
@media (max-width: 768px) {
    /* Mobile styles */
}

@media (min-width: 769px) and (max-width: 1024px) {
    /* Tablet styles */
}

@media (min-width: 1025px) {
    /* Desktop styles */
}
```

## ✅ TESTING CHECKLIST

Before considering complete, test:
- [ ] All API endpoints work correctly
- [ ] Authentication is properly handled
- [ ] Loading states are shown
- [ ] Error messages are displayed
- [ ] Empty states are handled
- [ ] Pagination works
- [ ] Search and filters work
- [ ] Status updates work
- [ ] Messages send successfully
- [ ] Auto-scroll works in chat
- [ ] Responsive on all screen sizes
- [ ] Icons render correctly
- [ ] Colors match design system
- [ ] Hover effects work
- [ ] Transitions are smooth

## 🚀 DEPLOYMENT NOTES

1. Environment variable must be set:
   ```
   NEXT_PUBLIC_API_BASE=https://13.229.107.233:8443
   ```

2. Build command:
   ```bash
   npm run build
   ```

3. Test locally:
   ```bash
   npm run dev
   ```

## 📝 ADDITIONAL FEATURES (Future Enhancements)

1. **File Attachments** - Allow customers to upload images
2. **Canned Responses** - Quick reply templates for support staff
3. **Typing Indicators** - Show when someone is typing
4. **Read Receipts** - Show when messages are read
5. **Email Notifications** - Notify customers of new messages
6. **Export Conversations** - Download chat history as PDF
7. **Customer Portal** - Separate interface for customers to view their tickets
8. **Multi-language Support** - Translate bot responses
9. **AI-Powered Suggestions** - Suggest responses based on context
10. **Voice Messages** - Allow voice recordings

## 🎯 SUCCESS CRITERIA

The frontend is complete when:
1. ✅ All 4 pages are fully functional
2. ✅ Design matches existing pages (website-customers, website-orders)
3. ✅ All API endpoints are integrated
4. ✅ Navigation is added to sidebar
5. ✅ Responsive on all devices
6. ✅ No console errors
7. ✅ Loading and error states handled
8. ✅ Code is clean and well-commented
9. ✅ CSS modules follow naming conventions
10. ✅ Icons and colors match design system

---

## 🔥 QUICK START COMMAND

```bash
# Create all directories
mkdir -p src/app/customer-support/[conversationId]
mkdir -p src/app/customer-support/bot-responses
mkdir -p src/app/customer-support/analytics

# Create all files
touch src/app/customer-support/page.jsx
touch src/app/customer-support/customerSupport.module.css
touch src/app/customer-support/[conversationId]/page.jsx
touch src/app/customer-support/[conversationId]/chat.module.css
touch src/app/customer-support/bot-responses/page.jsx
touch src/app/customer-support/bot-responses/botResponses.module.css
touch src/app/customer-support/analytics/page.jsx
touch src/app/customer-support/analytics/analytics.module.css
```

Now start implementing each page following the specifications above! 🚀
