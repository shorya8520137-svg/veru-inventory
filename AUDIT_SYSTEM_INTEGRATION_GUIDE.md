# Audit System Integration Guide

## Overview
This guide explains how to integrate the Enhanced Audit Logger into your controllers to track all system activities.

---

## Quick Start

### 1. Import the Audit Logger
```javascript
const auditLogger = require('../EnhancedAuditLogger');
```

### 2. Log Events
```javascript
await auditLogger.logEvent(EVENT_TYPE, eventData, req, userId);
```

---

## Event Naming Convention

### Format: `RESOURCE_ACTION`
- **RESOURCE**: USER, ROLE, PERMISSION, DISPATCH, INVENTORY, ORDER, PRODUCT, etc.
- **ACTION**: CREATE, UPDATE, DELETE, VIEW, EXPORT, LOGIN, LOGOUT, etc.

### Examples:
- `USER_CREATE` - User account created
- `USER_UPDATE` - User details modified
- `USER_DELETE` - User account deleted
- `USER_LOGIN_SUCCESS` - Successful login
- `USER_LOGIN_FAILED` - Failed login attempt
- `USER_FORCE_LOGOUT` - Admin forced logout
- `USER_DISABLE` - User account disabled
- `DISPATCH_CREATE` - Dispatch created
- `INVENTORY_TRANSFER_CREATE` - Inventory transfer initiated
- `ORDER_STATUS_CHANGE` - Order status updated
- `PRODUCT_BULK_IMPORT` - Bulk product import

---

## Integration Examples

### Example 1: Authentication (Login)
```javascript
// In authController.js - login method

// SUCCESS case
await auditLogger.logEvent('USER_LOGIN_SUCCESS', {
    resourceId: user.id,
    responseStatus: 200,
    loginMethod: '2FA' // or 'PASSWORD'
}, req, user.id);

// FAILURE case
await auditLogger.logEvent('USER_LOGIN_FAILED', {
    email: email,
    responseStatus: 401,
    reason: 'Invalid credentials',
    status: 'FAILURE'
}, req, null);
```

### Example 2: User Management (Create User)
```javascript
// In permissionsController.js - createUser method

await auditLogger.logEvent('USER_CREATE', {
    resourceId: result.insertId,
    name: name,
    email: email,
    role_id: role_id,
    is_active: is_active,
    responseStatus: 201
}, req);
```

### Example 3: Dispatch Operations (Create Dispatch)
```javascript
// In dispatchController.js - createDispatch method

await auditLogger.logEvent('DISPATCH_CREATE', {
    resourceId: dispatchId,
    customer: dispatch.customer,
    product_name: dispatch.product_name,
    quantity: dispatch.quantity,
    warehouse: dispatch.warehouse,
    awb_number: dispatch.awb_number,
    responseStatus: 201
}, req);
```

### Example 4: Inventory Transfer
```javascript
// In inventoryController.js - createTransfer method

await auditLogger.logEvent('INVENTORY_TRANSFER_CREATE', {
    resourceId: transferId,
    product_name: product_name,
    quantity: quantity,
    from_warehouse: from_warehouse,
    to_warehouse: to_warehouse,
    responseStatus: 201
}, req);
```

### Example 5: Order Status Change
```javascript
// In ordersController.js - updateOrderStatus method

await auditLogger.logEvent('ORDER_STATUS_CHANGE', {
    resourceId: orderId,
    oldValues: { status: oldStatus },
    newValues: { status: newStatus },
    reason: reason,
    responseStatus: 200
}, req);
```

### Example 6: Product Bulk Import
```javascript
// In productsController.js - bulkImport method

await auditLogger.logEvent('PRODUCT_BULK_IMPORT', {
    total_products: products.length,
    success_count: successCount,
    failure_count: failureCount,
    file_name: req.file.originalname,
    responseStatus: 200
}, req);
```

### Example 7: Admin Force Logout
```javascript
// In adminController.js - forceLogout method

const success = await auditLogger.forceLogoutUser(
    targetUserId,
    req.user.id,  // Admin user ID
    req
);
```

### Example 8: Admin Disable User
```javascript
// In adminController.js - disableUser method

const success = await auditLogger.disableUser(
    targetUserId,
    req.user.id,  // Admin user ID
    'Suspicious activity detected',  // Reason
    req
);
```

---

## Event Data Structure

### Required Fields (handled automatically)
- `event_type` - Event type (e.g., USER_CREATE)
- `action` - Parsed action (CREATE, UPDATE, DELETE, etc.)
- `resource_type` - Parsed resource (USER, PRODUCT, etc.)
- `user_id` - User who performed the action
- `ip_address` - Real IP address (Cloudflare-aware)
- `user_agent` - Browser/client information
- `location_*` - Geolocation data
- `severity` - Auto-detected severity level
- `created_at` - Timestamp

### Optional Fields (you provide)
- `resourceId` - ID of the affected resource
- `oldValues` - Previous values (for UPDATE operations)
- `newValues` - New values (for UPDATE operations)
- `responseStatus` - HTTP response status code
- `status` - SUCCESS, FAILURE, or PENDING
- `error` - Error message (for failures)
- Any custom fields relevant to the event

---

## Controller Integration Checklist

### Authentication Controller (authController.js)
- [ ] USER_LOGIN_SUCCESS
- [ ] USER_LOGIN_FAILED
- [ ] USER_LOGOUT
- [ ] PASSWORD_CHANGE
- [ ] PASSWORD_RESET_REQUEST
- [ ] PASSWORD_RESET_COMPLETE
- [ ] 2FA_SETUP
- [ ] 2FA_DISABLE
- [ ] 2FA_VERIFY_SUCCESS
- [ ] 2FA_VERIFY_FAILED

### Permissions Controller (permissionsController.js)
- [ ] USER_CREATE
- [ ] USER_UPDATE
- [ ] USER_DELETE
- [ ] USER_ACTIVATE
- [ ] USER_DEACTIVATE
- [ ] ROLE_CREATE
- [ ] ROLE_UPDATE
- [ ] ROLE_DELETE
- [ ] PERMISSION_ASSIGN
- [ ] PERMISSION_REMOVE

### Dispatch Controller (dispatchController.js)
- [ ] DISPATCH_CREATE
- [ ] DISPATCH_UPDATE
- [ ] DISPATCH_STATUS_CHANGE
- [ ] DISPATCH_CANCEL
- [ ] DISPATCH_DELETE
- [ ] DAMAGE_REPORT_CREATE
- [ ] DAMAGE_REPORT_UPDATE
- [ ] RECOVERY_CREATE
- [ ] RECOVERY_UPDATE
- [ ] RECOVERY_COMPLETE

### Inventory Controller (inventoryController.js)
- [ ] INVENTORY_VIEW
- [ ] INVENTORY_EXPORT
- [ ] STOCK_ADD
- [ ] STOCK_UPDATE
- [ ] STOCK_REDUCE
- [ ] INVENTORY_TRANSFER_CREATE
- [ ] INVENTORY_TRANSFER_COMPLETE
- [ ] INVENTORY_TRANSFER_CANCEL
- [ ] BULK_UPLOAD_START
- [ ] BULK_UPLOAD_COMPLETE

### Orders Controller (ordersController.js)
- [ ] ORDER_CREATE
- [ ] ORDER_UPDATE
- [ ] ORDER_STATUS_CHANGE
- [ ] ORDER_CANCEL
- [ ] ORDER_DELETE
- [ ] ORDER_INVOICE_GENERATE
- [ ] ORDER_PAYMENT_UPDATE
- [ ] ORDER_REFUND_PROCESS

### Products Controller (productsController.js)
- [ ] PRODUCT_CREATE
- [ ] PRODUCT_UPDATE
- [ ] PRODUCT_DELETE
- [ ] PRODUCT_BULK_IMPORT
- [ ] PRODUCT_BULK_IMPORT_COMPLETE
- [ ] PRODUCT_CATEGORY_CREATE
- [ ] PRODUCT_CATEGORY_UPDATE
- [ ] PRODUCT_IMAGE_UPLOAD

### Warehouse Controller (warehouseController.js)
- [ ] WAREHOUSE_CREATE
- [ ] WAREHOUSE_UPDATE
- [ ] WAREHOUSE_DELETE
- [ ] STORE_CREATE
- [ ] STORE_UPDATE
- [ ] STORE_DELETE
- [ ] WAREHOUSE_STAFF_ASSIGN
- [ ] WAREHOUSE_PERMISSION_GRANT

### Billing Controller (billingController.js)
- [ ] BILL_CREATE
- [ ] BILL_UPDATE
- [ ] BILL_DELETE
- [ ] INVOICE_GENERATE
- [ ] INVOICE_SEND
- [ ] PAYMENT_RECORD
- [ ] PAYMENT_UPDATE

### Customer Support Controller (customerSupportController.js)
- [ ] SUPPORT_TICKET_CREATE
- [ ] SUPPORT_TICKET_UPDATE
- [ ] SUPPORT_TICKET_CLOSE
- [ ] SUPPORT_MESSAGE_SEND
- [ ] SUPPORT_CONVERSATION_CREATE

### Website Controller (websiteController.js)
- [ ] WEBSITE_CUSTOMER_CREATE
- [ ] WEBSITE_CUSTOMER_UPDATE
- [ ] WEBSITE_ORDER_CREATE
- [ ] WEBSITE_ORDER_UPDATE
- [ ] WEBSITE_AUTH_SIGNUP
- [ ] WEBSITE_AUTH_LOGIN

---

## Best Practices

### 1. Always Use Try-Catch
```javascript
try {
    // Your business logic
    
    await auditLogger.logEvent('EVENT_TYPE', eventData, req);
    
    res.json({ success: true });
} catch (error) {
    console.error('Error:', error);
    
    // Log the error
    await auditLogger.logEvent('EVENT_TYPE', {
        error: error.message,
        status: 'FAILURE'
    }, req);
    
    res.status(500).json({ success: false, message: error.message });
}
```

### 2. Log Both Success and Failure
```javascript
// Success
await auditLogger.logEvent('USER_CREATE', {
    resourceId: userId,
    responseStatus: 201
}, req);

// Failure
await auditLogger.logEvent('USER_CREATE', {
    email: email,
    error: 'Email already exists',
    status: 'FAILURE',
    responseStatus: 400
}, req);
```

### 3. Include Old and New Values for Updates
```javascript
await auditLogger.logEvent('USER_UPDATE', {
    resourceId: userId,
    oldValues: { name: 'John Doe', role_id: 2 },
    newValues: { name: 'Jane Doe', role_id: 3 },
    responseStatus: 200
}, req);
```

### 4. Use Descriptive Event Names
```javascript
// ❌ Bad
await auditLogger.logEvent('UPDATE', { ... }, req);

// ✅ Good
await auditLogger.logEvent('USER_ROLE_CHANGE', { ... }, req);
```

### 5. Don't Log Sensitive Data
```javascript
// ❌ Bad - Don't log passwords
await auditLogger.logEvent('USER_CREATE', {
    password: 'secret123'  // DON'T DO THIS
}, req);

// ✅ Good - Log that password was set
await auditLogger.logEvent('USER_CREATE', {
    password_set: true
}, req);
```

---

## Testing Your Integration

### 1. Check Console Logs
Look for:
```
✅ Audit log created: USER_CREATE by user 1
```

### 2. Query Database
```sql
SELECT * FROM audit_logs 
WHERE event_type = 'USER_CREATE' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Check Audit Logs UI
Navigate to `/audit-logs` in the admin dashboard to see real-time logs.

---

## Troubleshooting

### Issue: Audit logs not being created
**Solution**: Check that:
1. EnhancedAuditLogger.js is in the correct location
2. Database tables exist (run migration SQL)
3. No errors in console logs
4. `req` object is being passed correctly

### Issue: IP address showing as 127.0.0.1
**Solution**: Check that:
1. Cloudflare headers are being forwarded
2. Nginx/proxy is configured correctly
3. `x-forwarded-for` header is present

### Issue: User ID is null
**Solution**: Check that:
1. Authentication middleware is running before audit logging
2. `req.user` is populated
3. JWT token is valid

---

## Next Steps

1. **Run Database Migration**
   ```bash
   mysql -u root -p your_database < database-migrations/001-enhanced-audit-system.sql
   ```

2. **Add Admin Control Routes to Server**
   ```javascript
   // In server.js
   const adminControlRoutes = require('./routes/adminControlRoutes');
   app.use('/api/admin', adminControlRoutes);
   ```

3. **Start Integrating Controllers**
   - Begin with high-priority controllers (auth, permissions)
   - Test each integration thoroughly
   - Move to business-critical controllers (dispatch, inventory, orders)
   - Complete with operational controllers (products, billing, support)

4. **Test Admin Controls**
   - Test force logout functionality
   - Test disable/enable user functionality
   - Verify audit logs are being created
   - Check alert system is working

5. **Configure Alerts**
   - Set up email notifications
   - Configure Slack integration
   - Test alert triggers

---

## Support

For questions or issues, refer to:
- `COMPLETE_AUDIT_SYSTEM_IMPLEMENTATION.md` - Full implementation plan
- `AUDIT_SYSTEM_SUMMARY.md` - System overview
- `EnhancedAuditLogger.js` - Source code with comments

---

**Status**: Ready for Integration
**Priority**: HIGH - Security & Compliance Critical
**Estimated Time**: 2-3 weeks for complete integration
