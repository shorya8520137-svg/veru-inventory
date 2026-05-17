@echo off
echo Getting schema-only dump (no data, fast)...
ssh -i C:\Users\singh\.ssh\insora.pem -o StrictHostKeyChecking=no ubuntu@13.62.99.152 "sudo mysqldump -u root --no-data --routines --triggers inventory_db" > inventory_db_schema.sql
echo Done! Lines:
find /c /v "" inventory_db_schema.sql
echo.
echo Verifying table count in schema file:
findstr /c:"CREATE TABLE" inventory_db_schema.sql | find /c "CREATE TABLE"
echo.
echo File saved as: inventory_db_schema.sql
