@echo off
echo 🚗 Car Manager App - Система управління автомобілем
echo ==================================================

REM Перевірка наявності Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не знайдено. Будь ласка, встановіть Python 3.7+
    pause
    exit /b 1
)

echo ✅ Python знайдено
echo.

REM Встановлення залежностей
echo 📦 Встановлення залежностей...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Помилка встановлення залежностей
    pause
    exit /b 1
)

echo ✅ Залежності встановлено
echo.

REM Запуск додатку
echo 🚀 Запуск Car Manager App...
echo 📍 Додаток буде доступний за адресою: http://localhost:5000
echo 🛑 Для зупинки натисніть Ctrl+C
echo --------------------------------------------------

cd backend
python app.py

pause
