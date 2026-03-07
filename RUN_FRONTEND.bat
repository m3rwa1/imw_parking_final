@echo off
REM IMW Parking - Frontend Startup Script (Windows)

echo.
echo ========================================
echo IMW PARKING - Frontend
echo ========================================
echo.

cd /d "%~dp0"

echo Installing dependencies (first time only)...
call npm install

echo.
echo Starting Vite Development Server...
echo.
echo React Frontend will be available at:
echo   http://localhost:3000
echo   http://127.0.0.1:3000
echo.
echo Press CTRL+C to stop the server
echo.

call npm run dev
pause
