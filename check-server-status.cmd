@echo off
echo Checking server status...
echo.

set SSH_KEY=C:\Users\Public\e2c.pem.pem
set SERVER=ubuntu@13.212.52.15

ssh -i "%SSH_KEY%" %SERVER% "cd ~/inventoryfullstack && pwd && echo '' && echo 'Git Status:' && git log --oneline -1 && echo '' && echo 'PM2 Status:' && pm2 list && echo '' && echo 'Node Modules:' && ls -lh node_modules 2>/dev/null | head -5"

pause
