# 🚨 URGENT: Fix API Keys Database Table

The API keys functionality is failing because the `api_keys` table doesn't exist in your database.

## Quick Fix - Run on Your Server:

### Option 1: Direct MySQL Command
```bash
# Connect to your server and run:
mysql -u root -p inventory_db

# Then paste this SQL:
CREATE TABLE IF NOT EXISTS `api_keys` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `name` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `api_key` varchar(255) NOT NULL UNIQUE,
    `rate_limit_per_hour` int(11) DEFAULT 1000,
    `usage_count` int(11) DEFAULT 0,
    `last_used_at` timestamp NULL DEFAULT NULL,
    `is_active` boolean DEFAULT TRUE,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_api_key` (`api_key`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Option 2: Using SQL File
```bash
# On your server, run:
mysql -u root -p inventory_db < create-api-keys-table.sql
```

### Option 3: Through phpMyAdmin or Database GUI
1. Open your database management tool
2. Select the `inventory_db` database
3. Run the SQL from Option 1 above

## After Creating the Table:
```bash
# Restart your Node.js server
pm2 restart all
# or
sudo systemctl restart your-app-service
```

## Verify It Works:
- Go to your website `/api` page
- Try generating an API token
- Should work without the "Table doesn't exist" error

## Files Created:
- `create-api-keys-table.sql` - Simple table creation script
- `setup-api-keys-database.sql` - Full setup with indexes
- `setup-api-keys-database.js` - Node.js setup script

Choose the method that works best for your server setup!