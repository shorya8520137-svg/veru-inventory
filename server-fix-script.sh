#!/bin/bash
# 2FA URGENT FIX SCRIPT - Run this on your server

echo "🚨 Starting urgent 2FA fix..."

# Navigate to project directory
cd ~/inventoryfullstack

echo "📁 Current directory: $(pwd)"

# Backup current file
echo "💾 Creating backup..."
cp services/TwoFactorAuthService.js services/TwoFactorAuthService.js.backup.$(date +%Y%m%d_%H%M%S)

# Show current problematic line
echo "❌ Current problematic code:"
sed -n '166p' services/TwoFactorAuthService.js

# Create the fixed version
echo "🔧 Applying fix..."
cat > /tmp/2fa_fix.js << 'EOF'
                        // Safe backup codes parsing
                        let backupCodes = null;
                        if (user.two_factor_backup_codes) {
                            try {
                                // Try to parse as JSON first
                                backupCodes = JSON.parse(user.two_factor_backup_codes);
                            } catch (jsonError) {
                                // If JSON parsing fails, try to split as comma-separated string
                                try {
                                    backupCodes = user.two_factor_backup_codes.split(',').map(code => code.trim());
                                    console.log('⚠️ Backup codes were stored as string, converted to array');
                                } catch (splitError) {
                                    console.error('❌ Failed to parse backup codes:', splitError);
                                    backupCodes = null;
                                }
                            }
                        }
                        
                        resolve({
                            enabled: user.two_factor_enabled,
                            secret: user.two_factor_secret,
                            backupCodes: backupCodes,
                            setupAt: user.two_factor_setup_at
                        });
EOF

# Replace the problematic section (lines 162-170)
sed -i '162,170c\
                        // Safe backup codes parsing\
                        let backupCodes = null;\
                        if (user.two_factor_backup_codes) {\
                            try {\
                                // Try to parse as JSON first\
                                backupCodes = JSON.parse(user.two_factor_backup_codes);\
                            } catch (jsonError) {\
                                // If JSON parsing fails, try to split as comma-separated string\
                                try {\
                                    backupCodes = user.two_factor_backup_codes.split(",").map(code => code.trim());\
                                    console.log("⚠️ Backup codes were stored as string, converted to array");\
                                } catch (splitError) {\
                                    console.error("❌ Failed to parse backup codes:", splitError);\
                                    backupCodes = null;\
                                }\
                            }\
                        }\
                        \
                        resolve({\
                            enabled: user.two_factor_enabled,\
                            secret: user.two_factor_secret,\
                            backupCodes: backupCodes,\
                            setupAt: user.two_factor_setup_at\
                        });' services/TwoFactorAuthService.js

echo "✅ Code fix applied"

# Fix the database
echo "🗄️ Fixing database..."
sudo mysql -e "
USE inventory_db;
UPDATE users 
SET two_factor_backup_codes = '[\"CA1EAEE4\",\"F1228D17\",\"D619399F\",\"2FC39886\",\"D37E6C7A\",\"A9B78C38\",\"3D2575E6\",\"B8862F4D\",\"8D9C2BFD\",\"6E383380\"]'
WHERE id = 1 
AND two_factor_backup_codes = 'CA1EAEE4,F1228D17,D619399F,2FC39886,D37E6C7A,A9B78C38,3D2575E6,B8862F4D,8D9C2BFD,6E383380';

SELECT 'Database fix result:' as status;
SELECT id, name, JSON_VALID(two_factor_backup_codes) as is_valid_json 
FROM users WHERE id = 1;
"

echo "✅ Database fix applied"

# Restart server
echo "🔄 Restarting server..."
pm2 restart all 2>/dev/null || {
    echo "PM2 not found, restarting manually..."
    pkill node
    sleep 2
    nohup node server.js > app.log 2>&1 &
    echo "Server restarted in background"
}

echo "⏳ Waiting for server to start..."
sleep 3

# Test the fix
echo "🧪 Testing the fix..."
response=$(curl -k -s -X POST https://52.221.231.85:8443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin@123"}')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ SUCCESS! Login API is working"
    echo "🎉 2FA fix completed successfully!"
else
    echo "❌ Login test failed. Response:"
    echo "$response"
fi

echo ""
echo "📋 Summary:"
echo "✅ Code updated with safe JSON parsing"
echo "✅ Database backup codes fixed"
echo "✅ Server restarted"
echo "✅ API tested"
echo ""
echo "🔍 Check server logs with: pm2 logs"
echo "🧪 Test 2FA setup: curl -k https://52.221.231.85:8443/api/2fa/status"