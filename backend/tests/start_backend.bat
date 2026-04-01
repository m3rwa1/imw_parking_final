@echo off
REM Script pour démarrer le backend IMW Parking

echo.
echo ========================================
echo IMW Parking - Backend Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Navigate to backend directory
cd backend

REM Check if venv exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo Installing dependencies...
pip install -r requirements.txt

REM Run the Flask app
echo.
echo ========================================
echo Starting Flask API server...
echo ========================================
echo API will be available at: http://localhost:5000
echo.
python run.py

pause
