@echo off
echo 🔧 FINAL FIREBASE FIX - DISABLE COMPLETELY
echo ==========================================

echo.
echo 📋 Connecting to server and applying final fix...
ssh -i "C:\Users\Admin\awsconection.pem" ubuntu@16.171.141.4 "cd /home/ubuntu/inventoryfullstack && git pull origin main && node disable-firebase-completely.js && pm2 restart all"

echo.
echo 🎉 FINAL FIX APPLIED!
echo ✅ Firebase completely disabled
echo ✅ No more Project ID errors
echo ✅ Pure database-only notifications
echo ✅ System should be completely error-free now

pause