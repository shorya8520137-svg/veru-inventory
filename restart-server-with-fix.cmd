@echo off
echo 🔧 Restarting Server with Authentication Fix
echo ==========================================

echo.
echo 📋 Instructions for Server:
echo.
echo 1. SSH to your server:
echo    ssh -i "C:\Users\Admin\e2c.pem" ubuntu@54.169.31.95
echo.
echo 2. Navigate to project directory:
echo    cd inventoryfullstack
echo.
echo 3. Stop current server:
echo    pkill -f "node.*server.js"
echo    pkill -f "npm.*server"
echo.
echo 4. Wait 2 seconds:
echo    sleep 2
echo.
echo 5. Start server with new code:
echo    nohup npm run server ^> server-restart.log 2^>^&1 ^&
echo.
echo 6. Wait for server to start:
echo    sleep 5
echo.
echo 7. Test the fix:
echo    node test-auth-fix.js
echo.
echo 🎯 Expected Result:
echo    - Public endpoints should return 200 OK
echo    - Categories and products should load without auth
echo    - Frontend should work immediately
echo.
echo 🌐 Test Frontend:
echo    https://inventoryfullstack-one.vercel.app/website-products
echo.

pause