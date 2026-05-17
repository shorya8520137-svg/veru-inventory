# InventoryGPT API Documentation - Complete Implementation

## Overview

A complete, production-ready API documentation system for InventoryGPT data feeds has been implemented across the GiftGala platform. The documentation uses the primary domain **https://api.giftgala.in** for all API endpoints.

## What Was Created

### 1. **API Documentation Pages**

#### Main API Docs Hub (`/api-docs`)
- **Path**: `src/app/api-docs/page.jsx`
- **Features**:
  - Landing page for all API documentation
  - Overview of InventoryGPT API
  - Quick navigation to different API sections
  - Links to support and contact information
  - Domain: https://api.giftgala.in

#### InventoryGPT API Documentation (`/api-docs/inventorygpt`)
- **Path**: `src/app/api-docs/inventorygpt/page.jsx`
- **Path**: `src/app/api-docs/inventorygpt/inventorygpt-docs.module.css`
- **Domain**: https://api.giftgala.in
- **Features**:
  - Complete API reference with 12 endpoints
  - Hero section with quick start guide
  - Authentication section with Bearer token details
  - Rate limiting information
  - Comprehensive endpoint documentation
  - Error handling guide

### 2. **API Documentation Layout**
- **Path**: `src/app/api-docs/layout.jsx`
- **Features**:
  - Navigation bar with API documentation links
  - InventoryGPT API tab indicator
  - Consistent styling across docs pages
  - Responsive design

### 3. **Profile Integration**
- **Path**: `src/app/profile/page.jsx`
- **Updates**:
  - New "InventoryGPT API" tab in profile sidebar
  - Tab icon: Brain (🧠)
  - Full token management interface
  - Metrics display (total tokens, active tokens, total calls, last API call)
  - Token creation form with customizable parameters
  - Active credentials list with copy/revoke buttons
  - Complete API documentation display

### 4. **Sidebar Navigation**
- **Path**: `src/components/ui/sidebar.jsx`
- **Updates**:
  - Added "API Documentation" menu item
  - Icon: BookOpen
  - Accessible from main navigation
  - Links to `/api-docs`

## API Endpoints Documented

### Authentication & Tokens (4 endpoints)
1. **GET /api/inventorygpt** - Health check
2. **GET /api/inventorygpt/tokens** - List tokens
3. **POST /api/inventorygpt/tokens** - Create token
4. **DELETE /api/inventorygpt/tokens/{tokenId}** - Revoke token

### Data Feed (3 endpoints)
1. **GET /api/inventorygpt/inventory-state** - Real-time inventory state
   - Query params: warehouse_id, category, sku, min_stock

2. **GET /api/inventorygpt/warehouse-metrics** - Warehouse KPIs
   - Query params: warehouse_id, region

3. **GET /api/inventorygpt/regional-demand** - Regional demand analytics
   - Query params: region, sku, days, group_by

### Recommendations (4 endpoints)
1. **GET /api/inventorygpt/recommendations** - Fetch recommendations
   - Query params: status, agent, limit

2. **POST /api/inventorygpt/recommendations** - Submit recommendation
   - Body: agent_name, recommendation_type, sku, quantity, reason, confidence_score, estimated_savings

3. **PUT /api/inventorygpt/recommendations/{id}/approve** - Approve recommendation

4. **PUT /api/inventorygpt/recommendations/{id}/reject** - Reject recommendation
   - Body: reason (optional)

## Domain Configuration

All API endpoints use:
```
Base URL: https://api.giftgala.in
```

Configuration is set in:
- `src/app/profile/page.jsx` (line 39): `const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in'`
- `src/app/api-docs/inventorygpt/page.jsx` (line 9): `const API_BASE = 'https://api.giftgala.in'`

## User Access Points

### 1. **Profile Section** (User Panel)
- URL: `/profile`
- Tab: "InventoryGPT API"
- Features:
  - Token metrics dashboard
  - Create new tokens
  - Manage active tokens
  - View full API documentation

### 2. **Sidebar Navigation** (Main App)
- Menu Item: "API Documentation"
- URL: `/api-docs`
- Features:
  - All API documentation hub
  - InventoryGPT API reference
  - Future API sections (Storefront API coming soon)

### 3. **Direct URL Access**
- `/api-docs` - Main documentation hub
- `/api-docs/inventorygpt` - InventoryGPT API reference

## Features

### Token Management
- ✅ Generate new tokens with custom parameters
- ✅ Set rate limits (100-10,000 per hour)
- ✅ Configure expiration (7-365 days)
- ✅ Copy token to clipboard
- ✅ Revoke/deactivate tokens
- ✅ View token usage statistics
- ✅ Track last API call timestamp

### Documentation Features
- ✅ Expandable/collapsible endpoint cards
- ✅ Method-specific color coding (GET, POST, PUT, DELETE)
- ✅ Parameter documentation with descriptions
- ✅ Authentication requirements
- ✅ Copy-to-clipboard for code examples
- ✅ Formatted JSON response examples
- ✅ HTTP status codes
- ✅ Rate limiting information
- ✅ Error handling guide

### Responsive Design
- ✅ Mobile-friendly layouts
- ✅ Collapsible sections on small screens
- ✅ Touch-friendly buttons and links
- ✅ Adaptive grid layouts

## Styling

### Color Scheme
- **Primary**: Blue (#60a5fa)
- **Secondary**: Purple (#a78bfa)
- **Background**: Dark slate gradient (#0f172a to #1e293b)
- **Text**: Light gray (#e2e8f0 to #f1f5f9)
- **Accents**: Status-specific colors (Green for success, Red for errors)

### CSS Modules
- `src/app/api-docs/inventorygpt/inventorygpt-docs.module.css` (900+ lines)
- Complete styling for all documentation components
- Dark theme with gradient backgrounds
- Smooth transitions and hover effects

## Integration Points

### 1. **With Existing Profile Page**
- Uses same authentication context
- Shares API_BASE configuration
- Uses same copy-to-clipboard utility
- Integrated token management functions

### 2. **With Sidebar Navigation**
- BookOpen icon from lucide-react
- Consistent styling with other menu items
- Permission-based visibility
- Active state highlighting

### 3. **With InventoryGPT Chat Interface**
- Same token system
- Linked from chat page
- Provides documentation context

## Database Integration

### Required Tables
- `inventorygpt_api_tokens` - Stores generated tokens
- `warehouse_performance_metrics` - Warehouse KPI data
- `regional_sales_analytics` - Regional demand data
- `ai_inventory_recommendations` - AI recommendations storage

## Security

### Authentication Methods
1. **Staff JWT Token** - For token management endpoints
   - Used with `Bearer YOUR_JWT_TOKEN`
   - Required for: Creating/revoking tokens, approving/rejecting recommendations

2. **InventoryGPT Token** - For data feed endpoints
   - Token format: `igpt_<random_string>`
   - Used with `Authorization: Bearer igpt_token_here`
   - Rate limited per token configuration

### Rate Limiting
- Configurable per token (100-10,000 requests/hour)
- Response headers indicate remaining quota:
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 987`
  - `X-RateLimit-Reset: 1685362800`

## File Structure

```
src/
├── app/
│   ├── api-docs/
│   │   ├── layout.jsx (navigation layout)
│   │   ├── page.jsx (main hub)
│   │   └── inventorygpt/
│   │       ├── page.jsx (documentation)
│   │       └── inventorygpt-docs.module.css (styling)
│   ├── profile/
│   │   └── page.jsx (updated with InventoryGPT API tab)
│   └── inventorygpt/
│       ├── page.jsx (chat interface)
│       ├── layout.jsx (navigation)
│       └── tokens/
│           ├── page.jsx (token management)
│           └── inventoryGptTokens.module.css
└── components/
    └── ui/
        └── sidebar.jsx (updated with API Documentation link)
```

## Next Steps

1. **Deploy & Test**
   - Verify all API endpoints are responding
   - Test token generation and validation
   - Confirm rate limiting works

2. **Monitor**
   - Track API usage via response headers
   - Monitor token creation patterns
   - Review recommendation approval rates

3. **Extend**
   - Add Storefront API documentation
   - Create API SDKs for popular languages
   - Build client libraries

4. **Documentation**
   - Add webhook documentation
   - Create integration guides
   - Build sample applications

## Contact & Support

- **Email**: support@giftgala.in
- **API Base**: https://api.giftgala.in
- **Documentation**: https://giftgala.in/api-docs

---

**Implementation Date**: May 15, 2026  
**Domain**: giftgala.in (api.giftgala.in)  
**Status**: ✅ Complete and Ready for Testing
