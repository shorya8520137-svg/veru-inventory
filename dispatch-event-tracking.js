/**
 * DISPATCH EVENT TRACKING
 * Add this to your dispatch controller success callbacks
 */

// In your dispatch controller, after successful dispatch creation:

// FIXED: Log DISPATCH event with proper user_id and IP
if (req.user) {
    await PermissionsController.createAuditLog(
        req.user.id,  // FIXED: Use req.user.id, not req.user.userId
        'CREATE',
        'DISPATCH',
        dispatchId,
        {
            user_name: req.user.name,
            user_email: req.user.email,
            user_role: req.user.role_name,
            dispatch_id: dispatchId,
            order_ref: order_ref,
            customer: customer,
            product_name: product_name,
            quantity: quantity,
            warehouse: warehouse,
            awb_number: awb,
            logistics: logistics,
            dispatch_time: new Date().toISOString(),
            ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                       req.headers['x-real-ip'] ||
                       req.connection.remoteAddress ||
                       '127.0.0.1',
            user_agent: req.get('User-Agent')
        }
    );
}