@echo off
echo ========================================
echo RETURN API TEST RUNNER
echo ========================================
echo.

REM Set environment variables if needed
if not defined API_BASE set API_BASE=http://localhost:3001

echo API Base URL: %API_BASE%
echo.

REM Run the test script
echo Starting Return API Tests...
node test-return-api.js

echo.
echo ========================================
echo Test execution completed!
echo Check return-api-test-report.json for detailed results
echo ========================================

pause