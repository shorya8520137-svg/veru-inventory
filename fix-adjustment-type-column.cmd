@echo off
echo ========================================
echo   FIXING ADJUSTMENT_TYPE COLUMN SCHEMA
echo ========================================
echo.
echo This will expand the adjustment_type column to support manual stock update types
echo.

echo Running schema fix...
node fix-adjustment-type-column.js

echo.
echo ✅ Schema fix completed!
echo You can now test the manual stock update feature.
echo.
pause