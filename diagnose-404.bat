@echo off
echo ========================================
echo Diagnosing 404 Error
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SSH_HOST=ubuntu@13.62.99.152

echo [CHECK 1] Does usersRoutes.js exist on server?
ssh -i "%SSH_KEY%" %SSH_HOST% "test -f ~/veru-inventory/routes/usersRoutes.js && echo 'YES - File exists' || echo 'NO - File missing!'"

echo.
echo [CHECK 2] Is route registered in server.js?
ssh -i "%SSH_KEY%" %SSH_HOST% "grep -A2 -B2 \"app.use('/api/users'\" ~/veru-inventory/server.js"

echo.
echo [CHECK 3] What routes are actually registered?
ssh -i "%SSH_KEY%" %SSH_HOST% "grep \"app.use('/api\" ~/veru-inventory/server.js | head -20"

echo.
echo [CHECK 4] Check PM2 status
ssh -i "%SSH_KEY%" %SSH_HOST% "pm2 list"

echo.
echo [CHECK 5] Check for errors in PM2 logs
ssh -i "%SSH_KEY%" %SSH_HOST% "pm2 logs --lines 30 --nostream | grep -i error"

echo.
echo [CHECK 6] Test if server is responding
ssh -i "%SSH_KEY%" %SSH_HOST% "curl -s http://localhost:3000/api/users/profile -H 'Authorization: Bearer test' -w '\nHTTP Status: %%{http_code}\n'"

echo.
echo ========================================
echo Diagnosis Complete
echo ========================================
pause
