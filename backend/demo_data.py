#!/usr/bin/env python3
"""
Demo Data Script for Car Manager App
Скрипт для створення демонстраційних даних
"""

import sqlite3
from datetime import datetime, timedelta
import random

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect('car_manager.db')
    cursor = conn.cursor()
    
    # Vehicles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            plate TEXT UNIQUE NOT NULL,
            mileage INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Expenses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER,
            date DATE NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            amount DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        )
    ''')
    
    # Fuel logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fuel_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER,
            date DATE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            price_per_liter DECIMAL(10,2) NOT NULL,
            mileage INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        )
    ''')
    
    # Maintenance records table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS maintenance_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER,
            date DATE NOT NULL,
            type TEXT NOT NULL,
            mileage INTEGER NOT NULL,
            cost DECIMAL(10,2) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        )
    ''')
    
    # Services table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            phone TEXT NOT NULL,
            rating INTEGER CHECK(rating >= 1 AND rating <= 5),
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Trips table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER,
            date DATE NOT NULL,
            from_location TEXT NOT NULL,
            to_location TEXT NOT NULL,
            distance DECIMAL(10,2) NOT NULL,
            fuel_price DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def clear_data():
    """Clear existing data"""
    conn = sqlite3.connect('car_manager.db')
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM trips')
    cursor.execute('DELETE FROM maintenance_records')
    cursor.execute('DELETE FROM fuel_logs')
    cursor.execute('DELETE FROM expenses')
    cursor.execute('DELETE FROM services')
    cursor.execute('DELETE FROM vehicles')
    
    conn.commit()
    conn.close()
    print("🗑️ Існуючі дані очищено")

def insert_demo_data():
    """Insert demo data"""
    conn = sqlite3.connect('car_manager.db')
    cursor = conn.cursor()
    
    # Vehicles
    vehicles = [
        ('Toyota', 'Camry', 2020, 'AA1234BB', 45000),
        ('Honda', 'Civic', 2019, 'CC5678DD', 38000),
        ('BMW', 'X5', 2021, 'EE9012FF', 25000),
        ('Audi', 'A4', 2020, 'GG3456HH', 32000),
        ('Volkswagen', 'Golf', 2018, 'II7890JJ', 55000)
    ]
    
    vehicle_ids = []
    for vehicle in vehicles:
        cursor.execute('''
            INSERT INTO vehicles (brand, model, year, plate, mileage)
            VALUES (?, ?, ?, ?, ?)
        ''', vehicle)
        vehicle_ids.append(cursor.lastrowid)
    
    print(f"✅ Додано {len(vehicles)} автомобілів")
    
    # Services
    services = [
        ('Автосервіс "Швидкий ремонт"', 'вул. Хрещатик, 1', '+380501234567', 4, 'Повний спектр послуг з ремонту автомобілів'),
        ('СТО "Майстер"', 'пр. Перемоги, 15', '+380509876543', 5, 'Спеціалізується на німецьких автомобілях'),
        ('Автоцентр "Еліт"', 'вул. Шевченка, 25', '+380501112233', 3, 'Обслуговування преміум автомобілів'),
        ('СТО "Універсал"', 'вул. Леніна, 8', '+380504445566', 4, 'Швидкий сервіс та діагностика'),
        ('Автосервіс "Надійний"', 'пр. Гагаріна, 42', '+380507778899', 5, 'Ремонт двигунів та трансмісій')
    ]
    
    for service in services:
        cursor.execute('''
            INSERT INTO services (name, address, phone, rating, description)
            VALUES (?, ?, ?, ?, ?)
        ''', service)
    
    print(f"✅ Додано {len(services)} автосервісів")
    
    # Generate expenses for the last 6 months
    expense_types = ['fuel', 'maintenance', 'insurance', 'repair', 'other']
    expense_descriptions = {
        'fuel': ['Заправка на АЗС', 'Заправка бензином', 'Дизельне паливо'],
        'maintenance': ['Заміна масла', 'Заміна фільтрів', 'Технічне обслуговування'],
        'insurance': ['Страховий поліс', 'ОСАГО', 'КАСКО'],
        'repair': ['Ремонт гальм', 'Ремонт двигуна', 'Заміна акумулятора'],
        'other': ['Мийка', 'Паркування', 'Штраф']
    }
    
    expenses_count = 0
    for i in range(180):  # Last 6 months
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        vehicle_id = random.choice(vehicle_ids)
        expense_type = random.choice(expense_types)
        description = random.choice(expense_descriptions[expense_type])
        
        if expense_type == 'fuel':
            amount = round(random.uniform(500, 2000), 2)
        elif expense_type == 'maintenance':
            amount = round(random.uniform(1000, 5000), 2)
        elif expense_type == 'insurance':
            amount = round(random.uniform(3000, 8000), 2)
        elif expense_type == 'repair':
            amount = round(random.uniform(2000, 10000), 2)
        else:
            amount = round(random.uniform(100, 1000), 2)
        
        cursor.execute('''
            INSERT INTO expenses (vehicle_id, date, type, description, amount)
            VALUES (?, ?, ?, ?, ?)
        ''', (vehicle_id, date, expense_type, description, amount))
        expenses_count += 1
    
    print(f"✅ Додано {expenses_count} витрат")
    
    # Generate fuel logs
    fuel_logs_count = 0
    for vehicle_id in vehicle_ids:
        current_mileage = 30000 + random.randint(0, 50000)
        for i in range(20):  # 20 fuel logs per vehicle
            date = (datetime.now() - timedelta(days=i*7)).strftime('%Y-%m-%d')
            amount = round(random.uniform(30, 60), 2)
            price_per_liter = round(random.uniform(45, 55), 2)
            current_mileage += random.randint(200, 800)
            
            cursor.execute('''
                INSERT INTO fuel_logs (vehicle_id, date, amount, price_per_liter, mileage)
                VALUES (?, ?, ?, ?, ?)
            ''', (vehicle_id, date, amount, price_per_liter, current_mileage))
            fuel_logs_count += 1
    
    print(f"✅ Додано {fuel_logs_count} заправок")
    
    # Generate maintenance records
    maintenance_types = ['oil_change', 'filter_change', 'brake_service', 'engine_service', 'other']
    maintenance_descriptions = {
        'oil_change': 'Заміна моторного масла та фільтра',
        'filter_change': 'Заміна повітряного та паливного фільтрів',
        'brake_service': 'Обслуговування гальмової системи',
        'engine_service': 'Діагностика та обслуговування двигуна',
        'other': 'Інші роботи з технічного обслуговування'
    }
    
    maintenance_count = 0
    for vehicle_id in vehicle_ids:
        for i in range(5):  # 5 maintenance records per vehicle
            date = (datetime.now() - timedelta(days=i*90)).strftime('%Y-%m-%d')
            maintenance_type = random.choice(maintenance_types)
            description = maintenance_descriptions[maintenance_type]
            mileage = 20000 + i * 10000 + random.randint(0, 5000)
            cost = round(random.uniform(500, 3000), 2)
            
            cursor.execute('''
                INSERT INTO maintenance_records (vehicle_id, date, type, mileage, cost, description)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (vehicle_id, date, maintenance_type, mileage, cost, description))
            maintenance_count += 1
    
    print(f"✅ Додано {maintenance_count} записів ТО")
    
    # Generate trips
    cities = ['Київ', 'Харків', 'Одеса', 'Дніпро', 'Запоріжжя', 'Львів', 'Кривий Ріг', 'Миколаїв']
    trips_count = 0
    for i in range(50):  # 50 trips
        date = (datetime.now() - timedelta(days=random.randint(0, 90))).strftime('%Y-%m-%d')
        vehicle_id = random.choice(vehicle_ids)
        from_city = random.choice(cities)
        to_city = random.choice([city for city in cities if city != from_city])
        distance = round(random.uniform(50, 500), 1)
        fuel_price = round(random.uniform(45, 55), 2)
        
        cursor.execute('''
            INSERT INTO trips (vehicle_id, date, from_location, to_location, distance, fuel_price)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (vehicle_id, date, from_city, to_city, distance, fuel_price))
        trips_count += 1
    
    print(f"✅ Додано {trips_count} поїздок")
    
    conn.commit()
    conn.close()
    print("\n🎉 Демонстраційні дані успішно створено!")

def main():
    """Main function"""
    print("🚗 Car Manager App - Створення демонстраційних даних")
    print("=" * 55)
    
    # Initialize database
    init_db()
    print("✅ База даних ініціалізована")
    
    # Clear existing data
    clear_data()
    
    # Insert demo data
    insert_demo_data()
    
    print("\n📊 Статистика створених даних:")
    print("   • 5 автомобілів")
    print("   • 5 автосервісів")
    print("   • 180 витрат за 6 місяців")
    print("   • 100 заправок")
    print("   • 25 записів ТО")
    print("   • 50 поїздок")
    print("\n🚀 Тепер можна запускати додаток!")

if __name__ == "__main__":
    main()
