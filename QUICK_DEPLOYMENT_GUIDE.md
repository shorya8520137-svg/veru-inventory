# Quick Deployment Guide

## 🚨 **Current Issues & Solutions**

### **Issue 1: MySQL Authentication Error**
```
ERROR 1698 (28000): Access denied for user 'root'@'localhost'
```

**Solution**: Use `sudo mysql` instead of `mysql -u root -p`

### **Issue 2: PM2 No Process Found**
```
[PM2][WARN] No process found
```

**Solution**: Start the server fresh with PM2

## 🚀 **Quick Fix Commands**

Run these commands on your server:

```bash
# 1. Make scripts executable
chmod +x complete-server-setup.sh
chmod +x manual-database-setup.sh
chmod +x start-server-simple.sh

# 2. Run the complete setup (recommended)
./complete-server-setup.sh
```

## 🔧 **Manual Step-by-Step**

If the automated script fails, follow these steps:

### **Step 1: Fix Database**
```bash
# Use sudo mysql (no password needed)
sudo mysql inventory_db

# Then run these SQL commands:
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) DEFAULT NULL;

INSERT IGNORE INTO permissions (name, description, category, is_active, created_at) 
VALUES ('TICKETS_MANAGE', 'Manage tickets and ticket system', 'Tickets', 1, NOW());

INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, id, NOW() FROM permissions WHERE name = 'TICKETS_MANAGE';

EXIT;
```

### **Step 2: Create Uploads Directory**
```bash
mkdir -p public/uploads/avatars
chmod 755 public/uploads/avatars
```

### **Step 3: Install & Build**
```bash
npm install
npm run build
```

### **Step 4: Start Server**
```bash
# Stop any existing processes
pm2 stop all
pm2 delete all

# Start fresh
pm2 start server.js --name "inventory-server" --watch
```

### **Step 5: Deploy to Vercel**
```bash
vercel --prod
```

## 🎯 **Expected Results**

After successful deployment:

- ✅ **Profile Page**: Modern design with photo upload
- ✅ **Ticket Management**: Create and manage tickets from profile
- ✅ **Database**: All new fields and permissions added
- ✅ **Server**: Running on PM2 with auto-restart
- ✅ **Vercel**: Frontend deployed to production

## 🔍 **Verification Steps**

1. **Check Server Status**:
   ```bash
   pm2 status
   pm2 logs inventory-server
   ```

2. **Test Database**:
   ```bash
   sudo mysql inventory_db -e "SELECT name FROM permissions WHERE name LIKE 'TICKETS_%';"
   ```

3. **Test Profile Page**:
   - Visit `/profile` on your domain
   - Try uploading a photo
   - Create a test ticket

## 🚨 **Troubleshooting**

### **Database Issues**
- Use `sudo mysql` instead of `mysql -u root -p`
- Check if MySQL is running: `systemctl status mysql`
- Verify database exists: `sudo mysql -e "SHOW DATABASES;"`

### **Server Issues**
- Check port 8443 is free: `sudo lsof -i:8443`
- Verify Node.js version: `node --version`
- Check PM2 installation: `pm2 --version`

### **Build Issues**
- Clear cache: `rm -rf .next node_modules && npm install`
- Check for TypeScript errors: `npm run type-check`
- Verify all files exist: `ls -la src/app/profile/`

## 📞 **Quick Commands Reference**

```bash
# Database
sudo mysql inventory_db

# Server Management
pm2 start server.js --name inventory-server
pm2 restart inventory-server
pm2 logs inventory-server
pm2 stop inventory-server

# Build & Deploy
npm install
npm run build
vercel --prod

# File Permissions
chmod +x *.sh
chmod 755 public/uploads/avatars
```

## 🎉 **Success Indicators**

You'll know everything is working when:

1. **PM2 Status**: Shows "online" status
2. **Database**: Returns ticket permissions when queried
3. **Profile Page**: Loads with modern design
4. **Photo Upload**: Camera icon appears on avatar
5. **Tickets**: Can create tickets from profile tab
6. **Vercel**: Shows successful deployment