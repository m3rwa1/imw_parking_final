@echo off
REM IMW Parking - Backend Startup Script (Windows)

echo.
echo ========================================
echo IMW PARKING - Backend
echo ========================================
echo.

cd /d "%~dp0"

REM Check if venv exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv and run
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting Flask API Server...
echo.
echo API will be available at:
echo   http://localhost:5000
echo   http://127.0.0.1:5000
echo.
echo Press CTRL+C to stop the server
echo.

python run.py
pause
