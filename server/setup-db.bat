@echo off
echo ====================================
echo SmartQ Database Setup
echo ====================================
echo.

:: Check if MySQL is available
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] MySQL not found in PATH
    echo.
    echo Please:
    echo 1. Install MySQL or XAMPP
    echo 2. Start MySQL service
    echo 3. Add MySQL to your PATH or run this from MySQL bin directory
    echo.
    pause
    exit /b 1
)

echo [1/3] Creating database...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS smartq_db;"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create database
    pause
    exit /b 1
)
echo Database created successfully!
echo.

echo [2/3] Importing schema...
mysql -u root -p smartq_db < database\schema.sql
if %errorlevel% neq 0 (
    echo [ERROR] Failed to import schema
    pause
    exit /b 1
)
echo Schema imported successfully!
echo.

echo [3/3] Importing test data...
mysql -u root -p smartq_db < database\seed.sql
if %errorlevel% neq 0 (
    echo [ERROR] Failed to import test data
    pause
    exit /b 1
)
echo Test data imported successfully!
echo.

echo ====================================
echo Database setup complete!
echo ====================================
echo.
echo Test Accounts:
echo - alellhy.derueda@cvsu.edu.ph / Test@123
echo - juan.delacruz@cvsu.edu.ph / Test@123
echo - maria.santos@cvsu.edu.ph / Test@123
echo.
echo Next steps:
echo 1. Update server/.env with your database credentials
echo 2. Run: npm start
echo.
pause
