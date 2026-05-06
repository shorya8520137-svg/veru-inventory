@echo off
echo ========================================
echo   DEPLOY TO SERVER
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SERVER=ubuntu@13.62.99.152

echo Step 1: Uploading deployment scripts...
scp -i "%SSH_KEY%" find-repo.sh pull-and-deploy.sh %SERVER%:~/
if %errorlevel% neq 0 (
    echo ERROR: Failed to upload scripts
    pause
    exit /b 1
)
echo SUCCESS: Scripts uploaded
echo.

echo Step 2: Making scripts executable...
ssh -i "%SSH_KEY%" %SERVER% "chmod +x ~/find-repo.sh ~/pull-and-deploy.sh"
echo.

echo Step 3: Finding git repository...
ssh -i "%SSH_KEY%" %SERVER% "~/find-repo.sh"
echo.

echo ========================================
echo   NEXT STEPS
echo ========================================
echo.
echo The script found your git repositories above.
echo.
echo To deploy, SSH to server and run:
echo   ssh -i "%SSH_KEY%" %SERVER%
echo   cd /path/to/your/repo
echo   git pull origin main
echo   npm run build
echo   pm2 restart all
echo.
echo OR run the automated script:
echo   ssh -i "%SSH_KEY%" %SERVER%
echo   ~/pull-and-deploy.sh
echo.
pause
