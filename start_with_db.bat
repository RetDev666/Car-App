@echo off
echo 🚗 Car Manager App with Database
echo ========================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "backend" (
    echo ❌ Please run this script from the Car-App root directory
    pause
    exit /b 1
)

REM Initialize database if needed
if not exist "car_manager.db" (
    echo 🗄️  Database not found. Initializing...
    python database/init_db.py
    if errorlevel 1 (
        echo ❌ Database initialization failed
        pause
        exit /b 1
    )
    echo ✅ Database initialized successfully
) else (
    echo ✅ Database already exists
)

REM Change to backend directory and run the app
cd backend
echo 🚀 Starting Flask application...
echo 📱 Open your browser and go to: http://localhost:5000
echo ⏹️  Press Ctrl+C to stop the server
echo ----------------------------------------

python app_new.py

pause