# Proper Roles Setup Guide

## Overview

This document explains the proper role structure based on the Permissions Redesign Specification. Each role has been carefully designed with appropriate permissions according to job functions.

## Role Definitions

### 1. Warehouse Manager
**Purpose**: Full control over warehouse operations, inventory, and operational tasks

**Permissions**:
- **Inventory** (4 permissions):
  - INVENTORY_VIEW
  - INVENTORY_EDIT
  - INVENTORY_TIMELINE
  - EXPORT_INVENTORY

- **Operations** (5 permissions):
  - OPERATIONS_DISPATCH
  - OPERATIONS_SELF_TRANSFER
  - OPERATIONS_DAMAGE_RECOVERY
  - OPERATIONS_RETURNS
  - OPERATIONS_BULK_UPLOAD

- **Warehouse Access** (20 permissions):
  - All 5 warehouses (GGM, BLR, MUM, AMD, HYD)
  - View, Orders View, Inventory Edit, Orders Edit for each warehouse

**Total**: 29 permissions

---

### 2. Inventory Staff
**Purpose**: View and edit inventory, manage transfers

**Permissions**:
- INVENTORY_VIEW
- INVENTORY_EDIT
- INVENTORY_TIMELINE
- OPERATIONS_SELF_TRANSFER

**Total**: 4 permissions

---

### 3. Order Processor
**Purpose**: Process orders, manage dispatch, and track shipments

**Permissions**:
- **Orders** (3 permissions):
  - ORDERS_VIEW
  - ORDERS_EDIT
  - ORDERS_DELETE

- **Operations** (1 permission):
  - OPERATIONS_DISPATCH

- **Website Orders** (6 permissions):
  - WEBSITE_ORDERS_VIEW
  - WEBSITE_ORDERS_EDIT
  - WEBSITE_ORDERS_DELETE
  - WEBSITE_ORDERS_EXPORT
  - WEBSITE_ORDERS_BULK_UPDATE
  - WEBSITE_ORDERS_REFUND

**Total**: 10 permissions

---

### 4. Product Manager
**Purpose**: Manage products, categories, and bulk operations

**Permissions**:
- **Products** (4 permissions):
  - PRODUCTS_VIEW
  - PRODUCTS_CREATE
  - PRODUCTS_EDIT
  - PRODUCTS_DELETE ⚠️ (dangerous)

- **Categories** (4 permissions):
  - PRODUCTS_CATEGORIES_VIEW
  - PRODUCTS_CATEGORIES_CREATE
  - PRODUCTS_CATEGORIES_EDIT
  - PRODUCTS_CATEGORIES_DELETE

- **Operations** (1 permission):
  - OPERATIONS_BULK_UPLOAD

**Total**: 9 permissions

---

### 5. Billing Specialist
**Purpose**: Manage billing and store inventory

**Permissions**:
- INVENTORY_VIEW
- INVENTORY_TIMELINE
- (Additional billing permissions when available)

**Total**: 2+ permissions

---

### 6. Read-Only Auditor
**Purpose**: View-only access to all data and audit logs

**Permissions**:
- PRODUCTS_VIEW
- INVENTORY_VIEW
- ORDERS_VIEW
- PRODUCTS_CATEGORIES_VIEW
- INVENTORY_TIMELINE
- EXPORT_INVENTORY
- All 5 warehouse VIEW permissions
- WEBSITE_ORDERS_VIEW
- TICKETS_VIEW
- TICKETS_EDIT (for adding notes)

**Total**: 14 permissions

---

### 7. Customer Support
**Purpose**: Handle customer tickets and view orders

**Permissions**:
- **Orders** (1 permission):
  - ORDERS_VIEW

- **Website Orders** (3 permissions):
  - WEBSITE_ORDERS_VIEW
  - WEBSITE_ORDERS_EDIT
  - WEBSITE_ORDERS_REFUND

- **Tickets** (4 permissions):
  - TICKETS_VIEW
  - TICKETS_EDIT
  - TICKETS_CREATE
  - TICKETS_DELETE

**Total**: 8 permissions

---

## Permission Feature Sections

Permissions are organized into 9 feature sections:

1. **System** (4 permissions) - System-wide settings ⚠️ All dangerous
2. **Inventory** (4 permissions) - Inventory management
3. **Orders** (3 permissions) - Order processing
4. **Products** (7 permissions) - Product and category management
5. **Operations** (5 permissions) - Operational tasks
6. **Warehouse Access** (20 permissions) - Warehouse-specific access
7. **Website Orders** (6 permissions) - E-commerce order management
8. **Tickets** (4 permissions) - Customer support tickets
9. **Messages** - (if applicable)

## Dangerous Permissions ⚠️

The following permissions are marked as dangerous and require extra confirmation:

- **PRODUCTS_DELETE** - Can delete products permanently
- **All System permissions** (15, 16, 17, 216) - System-wide changes

## Setup Instructions

### Step 1: Run the SQL Script

Connect to your database and run:

```bash
mysql -u inventory_user -p inventory_db < setup-proper-roles.sql
```

Or via EC2 Instance Connect:

```bash
cd ~/inventory-app
mariadb -u inventory_user -pStrongPass@123 inventory_db < setup-proper-roles.sql
```

### Step 2: Verify Roles

Check that roles were created:

```sql
SELECT 
  r.id,
  r.name,
  r.display_name,
  COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.display_name
ORDER BY r.name;
```

### Step 3: Assign Users to Roles

```sql
-- Example: Assign user to Warehouse Manager role
INSERT INTO user_roles (user_id, role_id)
VALUES (
  (SELECT id FROM users WHERE email = 'manager@example.com'),
  (SELECT id FROM roles WHERE name = 'warehouse_manager')
);
```

## Permission Dependencies

Some permissions require other permissions to function properly:

- **INVENTORY_EDIT** requires **INVENTORY_VIEW**
- **ORDERS_EDIT** requires **ORDERS_VIEW**
- **PRODUCTS_EDIT** requires **PRODUCTS_VIEW**
- **Warehouse EDIT** permissions require corresponding **VIEW** permissions

The system will automatically validate these dependencies when assigning permissions.

## Permission Conflicts

Some permissions conflict with each other:

- **PRODUCTS_DELETE** conflicts with **Read-Only** roles
- **System permissions** should not be combined with limited roles

The system will warn you when assigning conflicting permissions.

## Warehouse Access Levels

For warehouse-specific permissions, there are 5 access levels:

1. **None**: No access
2. **View Only**: Can view warehouse data (VIEW permissions)
3. **Limited**: View + create transfer requests (VIEW + ORDERS_VIEW)
4. **Standard**: Limited + update inventory (VIEW + ORDERS_VIEW + INVENTORY_EDIT)
5. **Full Access**: Standard + approve transfers + modify settings (all warehouse permissions)

## Best Practices

1. **Start with least privilege**: Assign minimal permissions first, add more as needed
2. **Use templates**: Apply role templates for common configurations
3. **Review regularly**: Audit role permissions quarterly
4. **Document changes**: Use the audit log to track all permission changes
5. **Test thoroughly**: Test new roles in a non-production environment first
6. **Avoid dangerous permissions**: Only assign dangerous permissions when absolutely necessary
7. **Use bulk operations**: When assigning permissions to multiple roles, use bulk operations for efficiency

## Troubleshooting

### Issue: Role has no permissions after creation

**Solution**: Run the INSERT INTO role_permissions statements for that role

### Issue: User can't access expected features

**Solution**: 
1. Check user_roles table to verify role assignment
2. Check role_permissions table to verify permissions
3. Check for permission dependencies
4. Clear user session and re-login

### Issue: Permission conflicts warning

**Solution**: Review the conflicting permissions and remove one of them

### Issue: Dangerous permission assignment blocked

**Solution**: Confirm the assignment with explicit confirmation dialog

## API Endpoints for Role Management

- `GET /api/roles` - List all roles
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/roles/:id/permissions` - Get role permissions
- `POST /api/roles/:id/permissions` - Assign permission to role
- `DELETE /api/roles/:id/permissions/:permissionId` - Revoke permission from role

## Next Steps

1. ✅ Run `setup-proper-roles.sql` to create roles
2. ✅ Verify roles in the database
3. ⏭️ Assign users to appropriate roles
4. ⏭️ Test each role's access in the application
5. ⏭️ Implement the Permissions Matrix UI (from the redesign spec)
6. ⏭️ Set up audit logging for permission changes
7. ⏭️ Create permission templates for quick role setup

## Support

For questions or issues with role setup, refer to:
- `.kiro/specs/permissions-tab-redesign/requirements.md`
- `.kiro/specs/permissions-tab-redesign/design.md`
- `.kiro/specs/permissions-tab-redesign/tasks.md`
