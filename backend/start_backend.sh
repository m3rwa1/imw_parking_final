#!/bin/bash

# Script pour démarrer le backend IMW Parking

echo ""
echo "========================================"
echo "IMW Parking - Backend Setup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the Flask app
echo ""
echo "========================================"
echo "Starting Flask API server..."
echo "========================================"
echo "API will be available at: http://localhost:5000"
echo ""
python3 run.py
