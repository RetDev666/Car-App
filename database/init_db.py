#!/usr/bin/env python3
"""
Database initialization script for Car Manager App
Creates SQLite database with all necessary tables and sample data
"""

import sqlite3
import os
from datetime import datetime, timedelta
import random

# Database configuration
DATABASE_PATH = 'car_manager.db'
SCHEMA_FILE = 'database/schema.sql'

def init_database():
    """Initialize the database with schema and sample data"""
    
    # Create database directory if it doesn't exist
    os.makedirs('database', exist_ok=True)
    
    # Connect to database
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Read and execute schema
        with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        cursor.executescript(schema_sql)
        print("✅ Database schema created successfully")
        
        # Insert sample data
        insert_sample_data(cursor)
        
        conn.commit()
        print("✅ Sample data inserted successfully")
        print(f"✅ Database initialized: {DATABASE_PATH}")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def insert_sample_data(cursor):
    """Insert sample data into the database"""
    
    # Sample vehicles
    vehicles_data = [
        ('Toyota', 'Camry', 2020, 'AA1234BB', 45000, 'Сірий', 'gasoline', 60.0),
        ('Honda', 'Civic', 2019, 'BB5678CC', 38000, 'Червоний', 'gasoline', 50.0),
        ('BMW', 'X5', 2021, 'CC9012DD', 25000, 'Чорний', 'gasoline', 80.0),
        ('Volkswagen', 'Golf', 2018, 'DD3456EE', 65000, 'Білий', 'gasoline', 55.0),
        ('Audi', 'A4', 2022, 'EE7890FF', 15000, 'Синій', 'gasoline', 65.0)
    ]
    
    cursor.executemany("""
        INSERT INTO vehicles (brand, model, year, plate, mileage, color, engine_type, fuel_capacity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, vehicles_data)
    
    # Get vehicle IDs
    cursor.execute("SELECT id FROM vehicles")
    vehicle_ids = [row[0] for row in cursor.fetchall()]
    
    # Sample fuel logs
    fuel_logs_data = []
    for vehicle_id in vehicle_ids:
        for i in range(10):  # 10 fuel logs per vehicle
            date = datetime.now() - timedelta(days=i*15)
            amount = round(random.uniform(30, 60), 2)
            price = round(random.uniform(45, 55), 2)
            total_cost = round(amount * price, 2)
            mileage = 40000 + (i * 500) + random.randint(0, 200)
            
            fuel_logs_data.append((
                vehicle_id, date.strftime('%Y-%m-%d'), amount, price, total_cost, mileage,
                f'АЗС {random.choice(["WOG", "OKKO", "Shell", "Ukrnafta"])}',
                'gasoline', f'Заправка #{i+1}'
            ))
    
    cursor.executemany("""
        INSERT INTO fuel_logs (vehicle_id, date, amount, price_per_liter, total_cost, mileage, station_name, fuel_type, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, fuel_logs_data)
    
    # Sample maintenance records
    maintenance_data = []
    maintenance_types = ['oil_change', 'filter_change', 'brake_service', 'engine_service', 'other']
    
    for vehicle_id in vehicle_ids:
        for i in range(5):  # 5 maintenance records per vehicle
            date = datetime.now() - timedelta(days=i*60)
            maintenance_type = random.choice(maintenance_types)
            mileage = 35000 + (i * 800) + random.randint(0, 500)
            cost = round(random.uniform(500, 3000), 2)
            
            maintenance_data.append((
                vehicle_id, date.strftime('%Y-%m-%d'), maintenance_type, mileage, cost,
                f'Технічне обслуговування {maintenance_type}', 'Автосервіс "Механік"',
                (date + timedelta(days=180)).strftime('%Y-%m-%d')
            ))
    
    cursor.executemany("""
        INSERT INTO maintenance_records (vehicle_id, date, type, mileage, cost, description, service_center, next_maintenance_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, maintenance_data)
    
    # Sample expenses
    expenses_data = []
    expense_types = ['fuel', 'maintenance', 'insurance', 'repair', 'other']
    
    for vehicle_id in vehicle_ids:
        for i in range(20):  # 20 expenses per vehicle
            date = datetime.now() - timedelta(days=i*10)
            expense_type = random.choice(expense_types)
            amount = round(random.uniform(100, 5000), 2)
            
            descriptions = {
                'fuel': ['Заправка палива', 'Паливо на АЗС', 'Заправка бензину'],
                'maintenance': ['Заміна масла', 'Технічне обслуговування', 'Заміна фільтрів'],
                'insurance': ['Страховий поліс', 'ОСАГО', 'КАСКО'],
                'repair': ['Ремонт двигуна', 'Заміна гальм', 'Ремонт підвіски'],
                'other': ['Мийка', 'Паркування', 'Штраф']
            }
            
            description = random.choice(descriptions[expense_type])
            
            expenses_data.append((
                vehicle_id, date.strftime('%Y-%m-%d'), expense_type, description,
                f'Категорія {expense_type}', f'Чек #{random.randint(1000, 9999)}'
            ))
    
    cursor.executemany("""
        INSERT INTO expenses (vehicle_id, date, type, description, category, receipt_number)
        VALUES (?, ?, ?, ?, ?, ?)
    """, expenses_data)
    
    # Sample services
    services_data = [
        ('Автосервіс "Механік"', 'вул. Хрещатик, 1', '+380501234567', 'mehanik@email.com', 'mehanik.com', 5, 'Повний спектр автосервісних послуг', 'Діагностика, ремонт, ТО', 'Пн-Пт: 8:00-18:00'),
        ('СТО "Швидкий ремонт"', 'пр. Перемоги, 25', '+380509876543', 'sto@email.com', 'sto.com', 4, 'Швидкий ремонт автомобілів', 'Ремонт, діагностика', 'Пн-Сб: 9:00-19:00'),
        ('Автоцентр "Люкс"', 'вул. Шевченка, 10', '+380501112233', 'lux@email.com', 'lux.com', 5, 'Преміум автосервіс', 'ТО, ремонт, тюнінг', 'Пн-Пт: 7:00-20:00'),
        ('Гараж "Дружба"', 'вул. Франка, 5', '+380504445566', 'garage@email.com', None, 3, 'Простий гаражний ремонт', 'Базовий ремонт', 'Пн-Сб: 10:00-17:00'),
        ('СТО "Експрес"', 'вул. Леніна, 15', '+380507778899', 'express@email.com', 'express.com', 4, 'Експрес ремонт', 'Швидкий ремонт', 'Цілодобово')
    ]
    
    cursor.executemany("""
        INSERT INTO services (name, address, phone, email, website, rating, description, services_offered, working_hours)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, services_data)
    
    # Sample trips
    trips_data = []
    routes = [
        ('Київ', 'Львів'), ('Львів', 'Одеса'), ('Одеса', 'Харків'), ('Харків', 'Дніпро'),
        ('Дніпро', 'Київ'), ('Київ', 'Чернівці'), ('Чернівці', 'Івано-Франківськ'),
        ('Івано-Франківськ', 'Тернопіль'), ('Тернопіль', 'Рівне'), ('Рівне', 'Житомир')
    ]
    
    for vehicle_id in vehicle_ids:
        for i in range(8):  # 8 trips per vehicle
            date = datetime.now() - timedelta(days=i*20)
            route = random.choice(routes)
            distance = round(random.uniform(100, 500), 1)
            fuel_price = round(random.uniform(45, 55), 2)
            estimated_cost = round(distance * fuel_price * 0.08, 2)  # 8L/100km average
            
            trips_data.append((
                vehicle_id, date.strftime('%Y-%m-%d'), route[0], route[1], distance, fuel_price,
                estimated_cost, None, 'Робоча поїздка', f'Поїздка {route[0]} - {route[1]}'
            ))
    
    cursor.executemany("""
        INSERT INTO trips (vehicle_id, date, from_location, to_location, distance, fuel_price, estimated_cost, actual_cost, purpose, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, trips_data)
    
    # Sample insurance records
    insurance_data = []
    companies = ['Універсальна', 'Альфа Страхування', 'ТАС', 'Альянс', 'Провідна']
    
    for vehicle_id in vehicle_ids:
        start_date = datetime.now() - timedelta(days=random.randint(30, 365))
        end_date = start_date + timedelta(days=365)
        premium = round(random.uniform(3000, 8000), 2)
        
        insurance_data.append((
            vehicle_id, f'POL{random.randint(100000, 999999)}', random.choice(companies),
            start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'), premium,
            'ОСАГО', f'Агент {random.choice(["Іван", "Петро", "Олексій"])}',
            f'+38050{random.randint(1000000, 9999999)}', 'Стандартне страхування'
        ))
    
    cursor.executemany("""
        INSERT INTO insurance_records (vehicle_id, policy_number, insurance_company, start_date, end_date, premium_amount, coverage_type, agent_name, agent_phone, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, insurance_data)
    
    # Sample reminders
    reminders_data = []
    reminder_types = ['maintenance', 'insurance', 'inspection', 'oil_change', 'tire_change']
    
    for vehicle_id in vehicle_ids:
        for i in range(3):  # 3 reminders per vehicle
            due_date = datetime.now() + timedelta(days=random.randint(1, 90))
            reminder_type = random.choice(reminder_types)
            priority = random.choice(['low', 'medium', 'high', 'urgent'])
            
            titles = {
                'maintenance': 'Технічне обслуговування',
                'insurance': 'Оновлення страховки',
                'inspection': 'Технічний огляд',
                'oil_change': 'Заміна мастила',
                'tire_change': 'Заміна шин'
            }
            
            descriptions = {
                'maintenance': 'Потрібно провести планове ТО',
                'insurance': 'Страховий поліс закінчується',
                'inspection': 'Потрібен технічний огляд',
                'oil_change': 'Час заміни мастила',
                'tire_change': 'Потрібна заміна шин'
            }
            
            reminders_data.append((
                vehicle_id, reminder_type, titles[reminder_type], descriptions[reminder_type],
                due_date.strftime('%Y-%m-%d'), 0, priority, None
            ))
    
    cursor.executemany("""
        INSERT INTO reminders (vehicle_id, type, title, description, due_date, is_completed, priority, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, reminders_data)
    
    # Sample fuel prices
    fuel_prices_data = []
    stations = ['WOG', 'OKKO', 'Shell', 'Ukrnafta', 'АЗС']
    
    for i in range(30):  # 30 days of fuel prices
        date = datetime.now() - timedelta(days=i)
        for station in stations:
            price = round(random.uniform(45, 55), 2)
            fuel_prices_data.append((
                'gasoline', price, station, f'Київ, вул. {random.choice(["Хрещатик", "Шевченка", "Леніна"])}',
                date.strftime('%Y-%m-%d')
            ))
    
    cursor.executemany("""
        INSERT INTO fuel_prices (fuel_type, price, station_name, location, date)
        VALUES (?, ?, ?, ?, ?)
    """, fuel_prices_data)

def check_database():
    """Check if database exists and has data"""
    if not os.path.exists(DATABASE_PATH):
        return False
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT COUNT(*) FROM vehicles")
        vehicle_count = cursor.fetchone()[0]
        return vehicle_count > 0
    except:
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚗 Car Manager Database Initialization")
    print("=" * 40)
    
    if check_database():
        print("⚠️  Database already exists with data")
        response = input("Do you want to recreate it? (y/N): ")
        if response.lower() != 'y':
            print("❌ Database initialization cancelled")
            exit(0)
        else:
            os.remove(DATABASE_PATH)
            print("🗑️  Old database removed")
    
    try:
        init_database()
        print("\n🎉 Database initialization completed successfully!")
        print(f"📊 Database file: {os.path.abspath(DATABASE_PATH)}")
        print("📈 Sample data includes:")
        print("   - 5 vehicles")
        print("   - 50 fuel logs")
        print("   - 25 maintenance records")
        print("   - 100 expenses")
        print("   - 5 service centers")
        print("   - 40 trips")
        print("   - 5 insurance records")
        print("   - 15 reminders")
        print("   - 150 fuel price records")
    except Exception as e:
        print(f"\n❌ Database initialization failed: {e}")
        exit(1)
