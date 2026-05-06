# Server Setup Guide - Insora Ubuntu Server

## Server Details
- **IP**: 13.51.162.72
- **OS**: Ubuntu
- **Key**: insora.pem (located at C:\insora.pem)
- **User**: ubuntu
- **Database**: inventory_db
- **DB User**: inventory_user
- **DB Password**: StrongPass@123

## Quick Start

### Option 1: Complete Server Setup (Fresh Server)
If MySQL is NOT installed yet:
```powershell
cd veru-inventory-main
.\setup-new-server.ps1
```

This will:
1. Install MySQL, Node.js, npm
2. Configure MySQL database
3. Import 77MB database backup
4. Run all migrations
5. Verify setup

**Time**: ~10-15 minutes

### Option 2: Deploy Migrations Only (MySQL Already Installed)
If MySQL is already set up:
```powershell
cd veru-inventory-main
.\deploy-migrations-insora.ps1
```

This will:
1. Upload migration files
2. Install dependencies
3. Run migrations
4. Verify setup

**Time**: ~2-3 minutes

## Manual Setup Steps

### 1. Connect to Server
```powershell
ssh -i C:\insora.pem ubuntu@13.51.162.72
```

### 2. Check MySQL Status
```bash
sudo systemctl status mysql
```

### 3. Test Database Connection
```bash
mysql -u inventory_user -pStrongPass@123 inventory_db -e "SHOW TABLES;"
```

### 4. Run Migrations Manually
```bash
cd /home/ubuntu/inventory-migrations
node run-migrations.js
```

### 5. Verify Migrations
```bash
mysql -u inventory_user -pStrongPass@123 inventory_db << EOF
-- Check new tables
SHOW TABLES LIKE '%permission%';

-- Check templates
SELECT name, is_builtin FROM permission_templates;

-- Check feature sections
SELECT feature_section, COUNT(*) FROM permissions GROUP BY feature_section;

-- Check new columns
DESCRIBE permissions;
DESCRIBE audit_logs;
EOF
```

## Troubleshooting

### SSH Connection Issues
```powershell
# Check key permissions (should be read-only for owner)
icacls C:\insora.pem

# Fix permissions if needed
icacls C:\insora.pem /inheritance:r
icacls C:\insora.pem /grant:r "$($env:USERNAME):(R)"
```

### MySQL Not Installed
```bash
sudo apt-get update
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Database Connection Failed
```bash
# Check MySQL is running
sudo systemctl status mysql

# Reset password if needed
sudo mysql
ALTER USER 'inventory_user'@'localhost' IDENTIFIED BY 'StrongPass@123';
FLUSH PRIVILEGES;
EXIT;
```

### Migration Errors
```bash
# Check error logs
cd /home/ubuntu/inventory-migrations
cat migration-errors.log

# Rollback if needed
mysql -u inventory_user -pStrongPass@123 inventory_db < migrations/rollback.sql

# Re-run migrations
node run-migrations.js
```

## File Locations on Server

```
/home/ubuntu/
├── inventory-migrations/          # Migration files
│   ├── migrations/               # SQL migration files
│   ├── run-migrations.js         # Migration runner
│   ├── .env.local               # Database config
│   └── package.json             # Dependencies
│
└── inventory-app/                # Main application (future)
    ├── backend/                  # Express API
    ├── uploads/                  # User uploads
    └── logs/                     # Application logs
```

## Database Schema After Migrations

### New Tables (4)
1. **permission_templates** - Reusable permission sets
2. **warehouse_access_levels** - Warehouse-specific access
3. **permission_dependencies** - Permission prerequisites
4. **permission_conflicts** - Incompatible permissions

### Modified Tables (2)
1. **permissions** - Added: feature_section, is_dangerous, permission_level, parent_permission_id
2. **audit_logs** - Added: before_state_json, after_state_json, bulk_operation_id

### Seed Data
- 7 built-in permission templates
- 40+ permission dependencies
- Permission conflicts (placeholder)
- Feature sections for all 58 permissions

## Next Steps After Migration

1. ✅ Verify database schema
2. ➡️ Deploy backend API to server
3. ➡️ Configure PM2 for process management
4. ➡️ Set up Nginx reverse proxy
5. ➡️ Deploy frontend to Vercel
6. ➡️ Update frontend API endpoints
7. ➡️ Test complete workflow

## Useful Commands

### Check Server Resources
```bash
# Disk space
df -h

# Memory usage
free -h

# CPU usage
top

# MySQL status
sudo systemctl status mysql
```

### Database Queries
```bash
# Count tables
mysql -u inventory_user -pStrongPass@123 inventory_db -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='inventory_db';"

# List all permissions
mysql -u inventory_user -pStrongPass@123 inventory_db -e "SELECT id, name, feature_section, is_dangerous FROM permissions ORDER BY feature_section, id;"

# Check templates
mysql -u inventory_user -pStrongPass@123 inventory_db -e "SELECT * FROM permission_templates;"
```

### Backup Database
```bash
mysqldump -u inventory_user -pStrongPass@123 inventory_db > backup_$(date +%Y%m%d).sql
```

## Support

For issues:
1. Check this guide first
2. Review migration logs
3. Check MySQL error logs: `sudo tail -f /var/log/mysql/error.log`
4. Verify network connectivity
5. Check disk space: `df -h`
