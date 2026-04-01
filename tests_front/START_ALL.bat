@echo off
REM IMW Parking - Complete Startup Script (Windows)
REM This script starts Backend, Frontend, and Database

echo.
echo ========================================
echo IMW PARKING MANAGEMENT SYSTEM
echo Complete Startup Script
echo ========================================
echo.

REM Get the script directory
cd /d "%~dp0"

echo [1/3] Checking MySQL Database...
echo.

REM Check if database exists, if not create it
python -c "import mysql.connector; conn = mysql.connector.connect(host='localhost', user='root', password=''); cursor = conn.cursor(); cursor.execute('CREATE DATABASE IF NOT EXISTS `imw-parking_database`'); conn.database = 'imw-parking_database'; print('✓ Database OK')" 2>nul
if errorlevel 1 (
    echo ✗ MySQL not running! Please start XAMPP MySQL first.
    pause
    exit /b 1
)

echo.
echo [2/3] Starting Backend API Server...
echo.
echo Opening Backend Terminal...
start "IMW Parking - Backend API" cmd /k "cd backend && RUN_BACKEND.bat"

timeout /t 3 /nobreak

echo.
echo [3/3] Starting Frontend React App...
echo.
echo Opening Frontend Terminal...
start "IMW Parking - Frontend" cmd /k "RUN_FRONTEND.bat"

echo.
echo ========================================
echo Startup Complete!
echo ========================================
echo.
echo Backend API:  http://localhost:5000
echo Frontend UI:  http://localhost:3000
echo.
echo Both terminals will open in new windows.
echo Close them with CTRL+C or close the window.
echo.

pause
