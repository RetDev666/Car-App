#!/usr/bin/env python3
"""
Car Manager App Startup Script
Запуск веб-додатку для управління автомобілем
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Перевірка версії Python"""
    if sys.version_info < (3, 7):
        print("❌ Потрібна версія Python 3.7 або новіша")
        print(f"Поточна версія: {sys.version}")
        return False
    print(f"✅ Python версія: {sys.version.split()[0]}")
    return True

def install_requirements():
    """Встановлення залежностей"""
    requirements_file = Path("requirements.txt")
    if not requirements_file.exists():
        print("❌ Файл requirements.txt не знайдено")
        return False
    
    print("📦 Встановлення залежностей...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Залежності встановлено успішно")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Помилка встановлення залежностей: {e}")
        return False

def create_directories():
    """Створення необхідних директорій"""
    directories = ["static/css", "static/js", "templates", "backend"]
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    print("✅ Директорії створено")

def start_app():
    """Запуск додатку"""
    print("🚀 Запуск Car Manager App...")
    print("📍 Додаток буде доступний за адресою: http://localhost:5000")
    print("🛑 Для зупинки натисніть Ctrl+C")
    print("-" * 50)
    
    try:
        # Змінюємо робочу директорію на backend
        os.chdir("backend")
        subprocess.run([sys.executable, "app.py"])
    except KeyboardInterrupt:
        print("\n🛑 Додаток зупинено")
    except Exception as e:
        print(f"❌ Помилка запуску: {e}")

def main():
    """Головна функція"""
    print("🚗 Car Manager App - Система управління автомобілем")
    print("=" * 50)
    
    # Перевірка версії Python
    if not check_python_version():
        sys.exit(1)
    
    # Створення директорій
    create_directories()
    
    # Встановлення залежностей
    if not install_requirements():
        sys.exit(1)
    
    # Запуск додатку
    start_app()

if __name__ == "__main__":
    main()
