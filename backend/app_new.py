from flask import Flask, render_template, request, jsonify
import sqlite3
import os
from datetime import datetime, timedelta
import json

# Resolve project root so Flask can find templates/static located at repo root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(
    __name__,
    template_folder=os.path.join(PROJECT_ROOT, 'templates'),
    static_folder=os.path.join(PROJECT_ROOT, 'static'),
)

# Database configuration (use absolute paths relative to project root)
DATABASE = os.path.join(PROJECT_ROOT, 'car_manager.db')
SCHEMA_FILE = os.path.join(PROJECT_ROOT, 'database', 'schema.sql')

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with schema if it doesn't exist"""
    if not os.path.exists(DATABASE):
        print("Initializing database...")
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Read and execute schema
        if os.path.exists(SCHEMA_FILE):
            with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
                schema_sql = f.read()
            cursor.executescript(schema_sql)
            print("Database schema created successfully")
        else:
            print("Schema file not found, creating basic tables...")
            create_basic_tables(cursor)
        
        conn.commit()
        conn.close()
        print("Database initialized successfully")

def create_basic_tables(cursor):
    """Create basic tables if schema file is not available"""
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
    
    # Maintenance table
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
            rating INTEGER DEFAULT 1,
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

# Initialize database on startup
init_database()

# Routes
@app.route('/')
def index():
    """Main page"""
    return render_template('dashboard.html')

@app.route('/vehicles')
def vehicles():
    """Vehicles page"""
    return render_template('vehicles.html')

@app.route('/fuel-log')
def fuel_log():
    """Fuel log page"""
    return render_template('fuel_log.html')

@app.route('/maintenance')
def maintenance():
    """Maintenance page"""
    return render_template('maintenance.html')

@app.route('/expenses')
def expenses():
    """Expenses page"""
    return render_template('expenses.html')

@app.route('/services')
def services():
    """Services page"""
    return render_template('services.html')

@app.route('/trips')
def trips():
    """Trips page"""
    return render_template('trips.html')

@app.route('/calculator')
def calculator():
    """Calculator page"""
    return render_template('calculator.html')

# API Routes

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Get all vehicles"""
    conn = get_db_connection()
    vehicles = conn.execute('SELECT * FROM vehicles ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(vehicle) for vehicle in vehicles])

@app.route('/api/vehicles', methods=['POST'])
def add_vehicle():
    """Add new vehicle"""
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO vehicles (brand, model, year, plate, mileage)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['brand'], data['model'], data['year'], data['plate'], data['mileage']))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': 'Автомобіль з таким номером вже існує'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/vehicles/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    """Update vehicle"""
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE vehicles 
            SET brand = ?, model = ?, year = ?, plate = ?, mileage = ?
            WHERE id = ?
        ''', (data['brand'], data['model'], data['year'], data['plate'], data['mileage'], vehicle_id))
        conn.commit()
        return jsonify({'success': True})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': 'Автомобіль з таким номером вже існує'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    """Delete vehicle"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM vehicles WHERE id = ?', (vehicle_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses"""
    conn = get_db_connection()
    expenses = conn.execute('SELECT * FROM expenses ORDER BY date DESC').fetchall()
    conn.close()
    return jsonify([dict(expense) for expense in expenses])

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    """Add new expense"""
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO expenses (vehicle_id, date, type, description, amount)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['vehicle_id'], data['date'], data['type'], data['description'], data['amount']))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/fuel-logs', methods=['GET'])
def get_fuel_logs():
    """Get all fuel logs"""
    conn = get_db_connection()
    fuel_logs = conn.execute('SELECT * FROM fuel_logs ORDER BY date DESC').fetchall()
    conn.close()
    return jsonify([dict(log) for log in fuel_logs])

@app.route('/api/fuel-logs', methods=['POST'])
def add_fuel_log():
    """Add new fuel log"""
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO fuel_logs (vehicle_id, date, amount, price_per_liter, mileage)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['vehicle_id'], data['date'], data['amount'], data['price_per_liter'], data['mileage']))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/maintenance', methods=['GET'])
def get_maintenance():
    """Get all maintenance records"""
    conn = get_db_connection()
    maintenance = conn.execute('SELECT * FROM maintenance_records ORDER BY date DESC').fetchall()
    conn.close()
    return jsonify([dict(record) for record in maintenance])

@app.route('/api/maintenance', methods=['POST'])
def add_maintenance():
    """Add new maintenance record"""
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO maintenance_records (vehicle_id, date, type, mileage, cost, description)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['vehicle_id'], data['date'], data['type'], data['mileage'], data['cost'], data.get('description', '')))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/services', methods=['GET'])
def get_services():
    """Get all services"""
    conn = get_db_connection()
    services = conn.execute('SELECT * FROM services ORDER BY rating DESC, name').fetchall()
    conn.close()
    return jsonify([dict(service) for service in services])

@app.route('/api/services', methods=['POST'])
def add_service():
    """Add new service"""
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO services (name, address, phone, rating, description)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['name'], data['address'], data['phone'], data['rating'], data.get('description', '')))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/services/<int:service_id>', methods=['PUT'])
def update_service(service_id):
    """Update service"""
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE services 
            SET name = ?, address = ?, phone = ?, rating = ?, description = ?
            WHERE id = ?
        ''', (data['name'], data['address'], data['phone'], data['rating'], data.get('description', ''), service_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/services/<int:service_id>', methods=['DELETE'])
def delete_service(service_id):
    """Delete service"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM services WHERE id = ?', (service_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/trips', methods=['GET'])
def get_trips():
    """Get all trips"""
    conn = get_db_connection()
    trips = conn.execute('SELECT * FROM trips ORDER BY date DESC').fetchall()
    conn.close()
    return jsonify([dict(trip) for trip in trips])

@app.route('/api/trips', methods=['POST'])
def add_trip():
    """Add new trip"""
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trips (vehicle_id, date, from_location, to_location, distance, fuel_price)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['vehicle_id'], data['date'], data['from_location'], data['to_location'], data['distance'], data['fuel_price']))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get application statistics"""
    conn = get_db_connection()
    
    # Get basic counts
    vehicles_count = conn.execute('SELECT COUNT(*) FROM vehicles').fetchone()[0]
    expenses_count = conn.execute('SELECT COUNT(*) FROM expenses').fetchone()[0]
    fuel_logs_count = conn.execute('SELECT COUNT(*) FROM fuel_logs').fetchone()[0]
    maintenance_count = conn.execute('SELECT COUNT(*) FROM maintenance_records').fetchone()[0]
    
    # Get total expenses
    total_expenses = conn.execute('SELECT SUM(amount) FROM expenses').fetchone()[0] or 0
    
    # Get monthly expenses
    monthly_expenses = conn.execute('''
        SELECT SUM(amount) FROM expenses 
        WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    ''').fetchone()[0] or 0
    
    conn.close()
    
    return jsonify({
        'vehicles_count': vehicles_count,
        'expenses_count': expenses_count,
        'fuel_logs_count': fuel_logs_count,
        'maintenance_count': maintenance_count,
        'total_expenses': total_expenses,
        'monthly_expenses': monthly_expenses
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
