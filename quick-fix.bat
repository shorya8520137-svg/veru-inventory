@echo off
echo Creating missing user_profiles entries...
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152 "sudo mysql inventory_db -e 'INSERT INTO user_profiles (user_id) SELECT u.id FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE up.id IS NULL; SELECT COUNT(*) as total_profiles FROM user_profiles;'"
echo.
echo Restarting server...
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152 "cd ~/veru-inventory && pm2 restart all"
echo.
echo DONE! Test at https://insora.in
pause
