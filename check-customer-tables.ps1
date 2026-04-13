# Check customer tables
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.51.226"

Write-Host "Tables with 'customer' or 'user':" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SHOW TABLES LIKE \"%customer%\";'"
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SHOW TABLES LIKE \"%user%\";'"

Write-Host "`nChecking website_orders.user_id:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT id, user_id, order_number FROM website_orders LIMIT 5;'"

Write-Host "`nChecking users table:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT id, name, email, role FROM users WHERE id IN (SELECT DISTINCT user_id FROM website_orders) LIMIT 10;'"

Write-Host "`nChecking if website_customers exists:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT COUNT(*) as total FROM website_customers;'"
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT * FROM website_customers LIMIT 5;'"
