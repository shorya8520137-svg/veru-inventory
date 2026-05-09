# Audit System - Quick Reference Card

## 🚀 Quick Start

### Import the Logger
```javascript
const auditLogger = require('../EnhancedAuditLogger');
```

### Log an Event
```javascript
await auditLogger.logEvent('EVENT_TYPE', eventData, req, userId);
```

---

## 📝 Common Patterns

### Pattern 1: Create Operation
```javascript
await auditLogger.logEvent('RESOURCE_CREATE', {
    resourceId: result.insertId,
    name: name,
    // ... other relevant fields
    responseStatus: 201
}, req);
```

### Pattern 2: Update Operation
```javascript
await auditLogger.logEvent('RESOURCE_UPDATE', {
    resourceId: id,
    oldValues: { name: 'Old Name', status: 'active' },
    newValues: { name: 'New Name', status: 'inactive' },
    responseStatus: 200
}, req);
```

### Pattern 3: Delete Operation
```javascript
await auditLogger.logEvent('RESOURCE_DELETE', {
    resourceId: id,
    name: name,
    responseStatus: 200
}, req);
```

### Pattern 4: Failed Operation
```javascript
await auditLogger.logEvent('RESOURCE_CREATE', {
    email: email,
    error: 'Email already exists',
    status: 'FAILURE',
    responseStatus: 400
}, req);
```

---

## 🎯 Event Naming

### Format: `RESOURCE_ACTION`

**Resources**: USER, ROLE, PERMISSION, DISPATCH, INVENTORY, ORDER, PRODUCT, WAREHOUSE, STORE, BILL, SUPPORT, WEBSITE

**Actions**: CREATE, UPDATE, DELETE, VIEW, EXPORT, LOGIN, LOGOUT, ENABLE, DISABLE, ASSIGN, REMOVE

### Examples:
- `USER_CREATE` - User created
- `USER_UPDATE` - User updated
- `USER_DELETE` - User deleted
- `USER_LOGIN_SUCCESS` - Login successful
- `USER_LOGIN_FAILED` - Login failed
- `DISPATCH_CREATE` - Dispatch created
- `INVENTORY_TRANSFER_CREATE` - Transfer created
- `ORDER_STATUS_CHANGE` - Order status changed

---

## 🔧 Admin Controls

### Force Logout User
```javascript
const success = await auditLogger.forceLogoutUser(
    userId,        // User to logout
    req.user.id,   // Admin user ID
    req            // Request object
);
```

### Disable User
```javascript
const success = await auditLogger.disableUser(
    userId,                          // User to disable
    req.user.id,                     // Admin user ID
    'Suspicious activity detected',  // Reason
    req                              // Request object
);
```

### Enable User
```javascript
const success = await auditLogger.enableUser(
    userId,        // User to enable
    req.user.id,   // Admin user ID
    req            // Request object
);
```

---

## 📊 Event Data Fields

### Auto-Populated (Don't Provide)
- `event_type` - Event type
- `action` - Parsed action (CREATE, UPDATE, etc.)
- `resource_type` - Parsed resource (USER, PRODUCT, etc.)
- `user_id` - User who performed action
- `user_name` - User's name
- `user_email` - User's email
- `user_role` - User's role
- `ip_address` - Real IP address
- `user_agent` - Browser/client info
- `location_*` - Geolocation data
- `severity` - Auto-detected severity
- `created_at` - Timestamp

### You Should Provide
- `resourceId` - ID of affected resource
- `oldValues` - Previous values (for updates)
- `newValues` - New values (for updates)
- `responseStatus` - HTTP status code
- `status` - SUCCESS, FAILURE, or PENDING
- `error` - Error message (for failures)
- Any custom fields

---

## ✅ Best Practices

### 1. Always Use Try-Catch
```javascript
try {
    // Your logic
    await auditLogger.logEvent('EVENT', data, req);
    res.json({ success: true });
} catch (error) {
    await auditLogger.logEvent('EVENT', {
        error: error.message,
        status: 'FAILURE'
    }, req);
    res.status(500).json({ success: false });
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
    error: 'Email exists',
    status: 'FAILURE',
    responseStatus: 400
}, req);
```

### 3. Include Old/New Values for Updates
```javascript
await auditLogger.logEvent('USER_UPDATE', {
    resourceId: userId,
    oldValues: { name: 'John', role: 'user' },
    newValues: { name: 'Jane', role: 'admin' },
    responseStatus: 200
}, req);
```

### 4. Don't Log Sensitive Data
```javascript
// ❌ Bad
await auditLogger.logEvent('USER_CREATE', {
    password: 'secret123'  // DON'T
}, req);

// ✅ Good
await auditLogger.logEvent('USER_CREATE', {
    password_set: true  // DO
}, req);
```

---

## 🔍 Testing

### Check Console
Look for:
```
✅ Audit log created: USER_CREATE by user 1
```

### Query Database
```sql
SELECT * FROM audit_logs 
WHERE event_type = 'USER_CREATE' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check UI
Navigate to `/audit-logs` in admin dashboard

---

## 🚨 Common Issues

### Issue: Audit logs not created
**Fix**: Check EnhancedAuditLogger.js exists and database tables are created

### Issue: IP shows as 127.0.0.1
**Fix**: Check Cloudflare/proxy headers are forwarded

### Issue: User ID is null
**Fix**: Ensure authentication middleware runs before audit logging

---

## 📚 Full Documentation

- `AUDIT_SYSTEM_INTEGRATION_GUIDE.md` - Complete integration guide
- `AUDIT_SYSTEM_COMPLETE_SUMMARY.md` - Full system overview
- `COMPLETE_AUDIT_SYSTEM_IMPLEMENTATION.md` - Implementation plan

---

## 🎯 Priority Events to Implement

### High Priority (Security)
1. USER_CREATE, USER_UPDATE, USER_DELETE
2. USER_LOGIN_SUCCESS, USER_LOGIN_FAILED
3. USER_LOGOUT, PASSWORD_CHANGE
4. ROLE_CREATE, ROLE_UPDATE, ROLE_DELETE
5. PERMISSION_ASSIGN, PERMISSION_REMOVE

### Medium Priority (Business)
6. DISPATCH_CREATE, DISPATCH_UPDATE
7. INVENTORY_TRANSFER_CREATE
8. ORDER_CREATE, ORDER_STATUS_CHANGE
9. WAREHOUSE_CREATE, STORE_CREATE
10. PRODUCT_CREATE, PRODUCT_UPDATE

### Low Priority (Operational)
11. BILL_CREATE, INVOICE_GENERATE
12. SUPPORT_TICKET_CREATE
13. WEBSITE_CUSTOMER_CREATE
14. PRODUCT_VIEW, ORDER_VIEW
15. INVENTORY_EXPORT, DISPATCH_EXPORT

---

## 💡 Pro Tips

1. **Use descriptive event names**: `USER_ROLE_CHANGE` not just `UPDATE`
2. **Include context**: Add relevant fields like product_name, customer_name
3. **Log failures**: Failed operations are as important as successful ones
4. **Use responseStatus**: Always include HTTP status code
5. **Test thoroughly**: Check database after each integration

---

**Quick Help**: See `AUDIT_SYSTEM_INTEGRATION_GUIDE.md` for detailed examples

**Status**: Ready for Integration ✅
