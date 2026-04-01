#!/bin/bash
# IMW Parking - Complete Startup Script (macOS/Linux)
# This script starts Backend, Frontend, and Database

echo ""
echo "========================================"
echo "IMW PARKING MANAGEMENT SYSTEM"
echo "Complete Startup Script"
echo "========================================"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "[1/3] Checking MySQL Database..."
echo ""

# Check if database exists, if not create it
python3 -c "import mysql.connector; conn = mysql.connector.connect(host='localhost', user='root', password=''); cursor = conn.cursor(); cursor.execute('CREATE DATABASE IF NOT EXISTS imw_parking'); conn.database = 'imw_parking'; print('✓ Database OK')" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "✗ MySQL not running! Please ensure MySQL is started."
    exit 1
fi

echo ""
echo "[2/3] Starting Backend API Server..."
echo ""

# Start backend in new terminal (for macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a Terminal "cd \"$SCRIPT_DIR/backend\" && ./RUN_BACKEND.sh"
else
    # For Linux
    gnome-terminal -- bash -c "cd \"$SCRIPT_DIR/backend\" && ./RUN_BACKEND.sh; read -p 'Press enter to close...'"
fi

sleep 3

echo ""
echo "[3/3] Starting Frontend React App..."
echo ""

# Start frontend in new terminal (for macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a Terminal "cd \"$SCRIPT_DIR\" && ./RUN_FRONTEND.sh"
else
    # For Linux
    gnome-terminal -- bash -c "cd \"$SCRIPT_DIR\" && ./RUN_FRONTEND.sh; read -p 'Press enter to close...'"
fi

echo ""
echo "========================================"
echo "Startup Complete!"
echo "========================================"
echo ""
echo "Backend API:  http://localhost:5000"
echo "Frontend UI:  http://localhost:3000"
echo ""
echo "Both will open in new terminal windows."
echo ""
