# Database Migrations - Permissions Tab Redesign

This directory contains all database migrations for the permissions management system redesign.

## Overview

**Total Migrations**: 10  
**New Tables**: 4  
**Modified Tables**: 2  
**Seed Data**: 7 built-in templates, dependencies, conflicts

## Migration Files

### 1. Schema Creation (001-004)
- `001_create_permission_templates.sql` - Template storage
- `002_create_warehouse_access_levels.sql` - Warehouse access matrix
- `003_create_permission_dependencies.sql` - Permission prerequisites
- `004_create_permission_conflicts.sql` - Conflicting permissions

### 2. Schema Modifications (005-006)
- `005_modify_permissions_table.sql` - Add feature_section, is_dangerous, etc.
- `006_modify_audit_logs_table.sql` - Add before/after states, bulk_operation_id

### 3. Seed Data (007-010)
- `007_seed_permission_templates.sql` - 7 built-in templates
- `008_seed_permission_dependencies.sql` - Permission relationships
- `009_seed_permission_conflicts.sql` - Conflict rules
- `010_update_permissions_feature_sections.sql` - Categorize existing permissions

## Running Migrations

### Option 1: Automated (Recommended)
```bash
cd veru-inventory-main
node run-migrations.js
```

### Option 2: Manual
```bash
# Connect to database
mysql -u inventory_user -p inventory_db

# Run each migration in order
source migrations/001_create_permission_templates.sql;
source migrations/002_create_warehouse_access_levels.sql;
# ... continue for all migrations
```

### Option 3: Remote Server
```bash
# Upload migrations to server
scp -r migrations root@13.212.202.137:/root/

# SSH into server
ssh root@13.212.202.137

# Run migrations
cd /root
node run-migrations.js
```

## Rollback

If you need to undo all changes:

```bash
mysql -u inventory_user -p inventory_db < migrations/rollback.sql
```

**⚠️ WARNING**: Rollback will delete all new tables and remove added columns. Make sure you have a backup!

## Database Changes Summary

### New Tables
1. **permission_templates** - Store reusable permission sets
2. **warehouse_access_levels** - Manage warehouse-specific access
3. **permission_dependencies** - Define prerequisite permissions
4. **permission_conflicts** - Define incompatible permissions

### Modified Tables
1. **permissions** - Added: parent_permission_id, permission_level, is_dangerous, feature_section
2. **audit_logs** - Added: before_state_json, after_state_json, bulk_operation_id

### Built-in Templates
1. Super Admin (all permissions)
2. Warehouse Manager (warehouse + inventory + operations)
3. Inventory Staff (inventory view/edit + transfers)
4. Order Processor (orders + dispatch + tracking)
5. Product Manager (products + categories + bulk import)
6. Billing Specialist (billing + store inventory)
7. Read-Only Auditor (view-only + audit logs)

## Verification

After running migrations, verify with:

```sql
-- Check new tables exist
SHOW TABLES LIKE '%permission%';
SHOW TABLES LIKE '%warehouse_access%';

-- Check new columns
DESCRIBE permissions;
DESCRIBE audit_logs;

-- Check templates
SELECT name, is_builtin FROM permission_templates;

-- Check dependencies
SELECT COUNT(*) FROM permission_dependencies;

-- Check feature sections
SELECT feature_section, COUNT(*) FROM permissions GROUP BY feature_section;
```

## Troubleshooting

### Error: Table already exists
- Safe to ignore if re-running migrations
- Tables use `IF NOT EXISTS` clause

### Error: Column already exists
- Safe to ignore if re-running migrations
- Columns use `IF NOT EXISTS` clause

### Error: Foreign key constraint fails
- Check that referenced tables exist
- Ensure permissions and roles tables have data

### Error: Connection refused
- Check database credentials in `.env.local`
- Ensure MySQL is running
- Verify network access to database server

## Next Steps

After migrations complete:
1. ✅ Verify all tables created
2. ✅ Check seed data loaded
3. ➡️ Implement backend API endpoints
4. ➡️ Build frontend components
5. ➡️ Test complete workflow

## Support

For issues or questions, refer to:
- `.kiro/specs/permissions-tab-redesign/requirements.md`
- `.kiro/specs/permissions-tab-redesign/design.md`
- `.kiro/specs/permissions-tab-redesign/tasks.md`
