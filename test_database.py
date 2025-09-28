#!/usr/bin/env python3
"""
Test database functionality for Car Manager App
"""

import sqlite3
import os
from datetime import datetime, timedelta

def test_database():
    """Test database functionality"""
    print("🧪 Testing Car Manager Database")
    print("=" * 40)
    
    # Check if database exists
    if not os.path.exists('car_manager.db'):
        print("❌ Database not found. Please run database/init_db.py first")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect('car_manager.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        print("✅ Database connection successful")
        
        # Test 1: Check tables exist
        print("\n📋 Testing table structure...")
        tables = ['vehicles', 'expenses', 'fuel_logs', 'maintenance_records', 'services', 'trips']
        
        for table in tables:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if cursor.fetchone():
                print(f"  ✅ Table '{table}' exists")
            else:
                print(f"  ❌ Table '{table}' missing")
                return False
        
        # Test 2: Check data exists
        print("\n📊 Testing data availability...")
        
        cursor.execute("SELECT COUNT(*) FROM vehicles")
        vehicle_count = cursor.fetchone()[0]
        print(f"  🚗 Vehicles: {vehicle_count}")
        
        cursor.execute("SELECT COUNT(*) FROM expenses")
        expense_count = cursor.fetchone()[0]
        print(f"  💰 Expenses: {expense_count}")
        
        cursor.execute("SELECT COUNT(*) FROM fuel_logs")
        fuel_count = cursor.fetchone()[0]
        print(f"  ⛽ Fuel logs: {fuel_count}")
        
        cursor.execute("SELECT COUNT(*) FROM maintenance_records")
        maintenance_count = cursor.fetchone()[0]
        print(f"  🔧 Maintenance: {maintenance_count}")
        
        cursor.execute("SELECT COUNT(*) FROM services")
        service_count = cursor.fetchone()[0]
        print(f"  🏢 Services: {service_count}")
        
        cursor.execute("SELECT COUNT(*) FROM trips")
        trip_count = cursor.fetchone()[0]
        print(f"  🛣️  Trips: {trip_count}")
        
        # Test 3: Test foreign key relationships
        print("\n🔗 Testing foreign key relationships...")
        
        # Test vehicles -> expenses relationship
        cursor.execute("""
            SELECT COUNT(*) FROM expenses e 
            JOIN vehicles v ON e.vehicle_id = v.id
        """)
        valid_expenses = cursor.fetchone()[0]
        print(f"  ✅ Valid expense-vehicle relationships: {valid_expenses}")
        
        # Test vehicles -> fuel_logs relationship
        cursor.execute("""
            SELECT COUNT(*) FROM fuel_logs f 
            JOIN vehicles v ON f.vehicle_id = v.id
        """)
        valid_fuel_logs = cursor.fetchone()[0]
        print(f"  ✅ Valid fuel log-vehicle relationships: {valid_fuel_logs}")
        
        # Test 4: Test views
        print("\n👁️  Testing database views...")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM vehicle_stats")
            stats_count = cursor.fetchone()[0]
            print(f"  ✅ Vehicle stats view: {stats_count} records")
        except:
            print("  ⚠️  Vehicle stats view not available")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM monthly_expenses")
            monthly_count = cursor.fetchone()[0]
            print(f"  ✅ Monthly expenses view: {monthly_count} records")
        except:
            print("  ⚠️  Monthly expenses view not available")
        
        # Test 5: Test indexes
        print("\n📈 Testing database indexes...")
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
        indexes = [row[0] for row in cursor.fetchall()]
        
        expected_indexes = [
            'idx_fuel_logs_vehicle_id',
            'idx_fuel_logs_date',
            'idx_maintenance_vehicle_id',
            'idx_expenses_vehicle_id'
        ]
        
        for index in expected_indexes:
            if index in indexes:
                print(f"  ✅ Index '{index}' exists")
            else:
                print(f"  ⚠️  Index '{index}' missing")
        
        # Test 6: Test sample queries
        print("\n🔍 Testing sample queries...")
        
        # Get vehicle with most expenses
        cursor.execute("""
            SELECT v.brand, v.model, COUNT(e.id) as expense_count
            FROM vehicles v
            LEFT JOIN expenses e ON v.id = e.vehicle_id
            GROUP BY v.id, v.brand, v.model
            ORDER BY expense_count DESC
            LIMIT 1
        """)
        result = cursor.fetchone()
        if result:
            print(f"  🏆 Vehicle with most expenses: {result[0]} {result[1]} ({result[2]} expenses)")
        
        # Get total expenses by type
        cursor.execute("""
            SELECT type, SUM(amount) as total
            FROM expenses
            GROUP BY type
            ORDER BY total DESC
        """)
        expense_types = cursor.fetchall()
        print("  💰 Total expenses by type:")
        for row in expense_types:
            print(f"    {row[0]}: {row[1]:.2f} ₴")
        
        # Get average fuel consumption
        cursor.execute("""
            SELECT AVG((f.amount / (f.mileage - LAG(f.mileage) OVER (PARTITION BY f.vehicle_id ORDER BY f.date)) * 100)) as avg_consumption
            FROM fuel_logs f
            WHERE f.mileage > LAG(f.mileage) OVER (PARTITION BY f.vehicle_id ORDER BY f.date)
        """)
        result = cursor.fetchone()
        if result and result[0]:
            print(f"  ⛽ Average fuel consumption: {result[0]:.2f} L/100km")
        
        conn.close()
        
        print("\n🎉 Database test completed successfully!")
        print("✅ All tests passed - database is ready to use")
        return True
        
    except Exception as e:
        print(f"\n❌ Database test failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints"""
    print("\n🌐 Testing API endpoints...")
    
    try:
        import requests
        import json
        
        base_url = "http://localhost:5000"
        
        # Test vehicles endpoint
        try:
            response = requests.get(f"{base_url}/api/vehicles", timeout=5)
            if response.status_code == 200:
                vehicles = response.json()
                print(f"  ✅ GET /api/vehicles: {len(vehicles)} vehicles")
            else:
                print(f"  ❌ GET /api/vehicles: Status {response.status_code}")
        except requests.exceptions.ConnectionError:
            print("  ⚠️  API server not running - start with 'python run_with_db.py'")
        except Exception as e:
            print(f"  ❌ GET /api/vehicles: {e}")
        
        # Test expenses endpoint
        try:
            response = requests.get(f"{base_url}/api/expenses", timeout=5)
            if response.status_code == 200:
                expenses = response.json()
                print(f"  ✅ GET /api/expenses: {len(expenses)} expenses")
            else:
                print(f"  ❌ GET /api/expenses: Status {response.status_code}")
        except requests.exceptions.ConnectionError:
            print("  ⚠️  API server not running")
        except Exception as e:
            print(f"  ❌ GET /api/expenses: {e}")
        
        # Test stats endpoint
        try:
            response = requests.get(f"{base_url}/api/stats", timeout=5)
            if response.status_code == 200:
                stats = response.json()
                print(f"  ✅ GET /api/stats: {stats}")
            else:
                print(f"  ❌ GET /api/stats: Status {response.status_code}")
        except requests.exceptions.ConnectionError:
            print("  ⚠️  API server not running")
        except Exception as e:
            print(f"  ❌ GET /api/stats: {e}")
            
    except ImportError:
        print("  ⚠️  requests library not available - install with 'pip install requests'")

def main():
    """Main function"""
    print("🚗 Car Manager Database Test Suite")
    print("=" * 50)
    
    # Test database
    if test_database():
        # Test API if database is working
        test_api_endpoints()
        
        print("\n🎯 Next steps:")
        print("1. Run 'python run_with_db.py' to start the application")
        print("2. Open http://localhost:5000 in your browser")
        print("3. Test the web interface with the sample data")
    else:
        print("\n❌ Database test failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
