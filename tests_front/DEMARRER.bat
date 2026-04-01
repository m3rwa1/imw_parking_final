@echo off
REM Démarrer le backend
cd backend
start "IMW Parking - Backend" cmd /k "venv\Scripts\python run.py"
timeout /t 3

REM Démarrer le frontend
cd ..
start "IMW Parking - Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Services lancés:
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3002
echo ========================================
echo.
