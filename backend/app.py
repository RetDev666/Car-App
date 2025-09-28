from flask import Flask, render_template, request, jsonify
import sqlite3
import json
from datetime import datetime, timedelta
import requests
import os

app = Flask(__name__)

# Database configuration
DATABASE = 'car_manager.db'

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DATABASE)
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

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

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
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO vehicles (brand, model, year, plate, mileage)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['brand'], data['model'], data['year'], data['plate'], data['mileage']))
        
        conn.commit()
        vehicle_id = cursor.lastrowid
        conn.close()
        
        return jsonify({'success': True, 'id': vehicle_id}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'error': 'Vehicle with this plate already exists'}), 400

@app.route('/api/vehicles/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    """Update vehicle"""
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE vehicles 
            SET brand = ?, model = ?, year = ?, plate = ?, mileage = ?
            WHERE id = ?
        ''', (data['brand'], data['model'], data['year'], data['plate'], data['mileage'], vehicle_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'error': 'Vehicle with this plate already exists'}), 400

@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    """Delete vehicle"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM vehicles WHERE id = ?', (vehicle_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses"""
    conn = get_db_connection()
    expenses = conn.execute('''
        SELECT e.*, v.brand, v.model, v.plate
        FROM expenses e
        LEFT JOIN vehicles v ON e.vehicle_id = v.id
        ORDER BY e.date DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(expense) for expense in expenses])

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    """Add new expense"""
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO expenses (vehicle_id, date, type, description, amount)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['vehicle_id'], data['date'], data['type'], data['description'], data['amount']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True}), 201

@app.route('/api/fuel-logs', methods=['GET'])
def get_fuel_logs():
    """Get all fuel logs"""
    conn = get_db_connection()
    fuel_logs = conn.execute('''
        SELECT f.*, v.brand, v.model, v.plate
        FROM fuel_logs f
        LEFT JOIN vehicles v ON f.vehicle_id = v.id
        ORDER BY f.date DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(log) for log in fuel_logs])

@app.route('/api/fuel-logs', methods=['POST'])
def add_fuel_log():
    """Add new fuel log"""
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO fuel_logs (vehicle_id, date, amount, price_per_liter, mileage)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['vehicle_id'], data['date'], data['amount'], data['price_per_liter'], data['mileage']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True}), 201

@app.route('/api/maintenance', methods=['GET'])
def get_maintenance():
    """Get all maintenance records"""
    conn = get_db_connection()
    maintenance = conn.execute('''
        SELECT m.*, v.brand, v.model, v.plate
        FROM maintenance_records m
        LEFT JOIN vehicles v ON m.vehicle_id = v.id
        ORDER BY m.date DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(record) for record in maintenance])

@app.route('/api/maintenance', methods=['POST'])
def add_maintenance():
    """Add new maintenance record"""
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO maintenance_records (vehicle_id, date, type, mileage, cost, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['vehicle_id'], data['date'], data['type'], data['mileage'], data['cost'], data['description']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True}), 201

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
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO services (name, address, phone, rating, description)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['name'], data['address'], data['phone'], data['rating'], data['description']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True}), 201

@app.route('/api/trips', methods=['GET'])
def get_trips():
    """Get all trips"""
    conn = get_db_connection()
    trips = conn.execute('''
        SELECT t.*, v.brand, v.model, v.plate
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        ORDER BY t.date DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(trip) for trip in trips])

@app.route('/api/trips', methods=['POST'])
def add_trip():
    """Add new trip"""
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO trips (vehicle_id, date, from_location, to_location, distance, fuel_price)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['vehicle_id'], data['date'], data['from_location'], data['to_location'], data['distance'], data['fuel_price']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True}), 201

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Total mileage
    total_mileage = conn.execute('SELECT SUM(mileage) FROM vehicles').fetchone()[0] or 0
    
    # Monthly expenses
    current_month = datetime.now().strftime('%Y-%m')
    monthly_expenses = conn.execute('''
        SELECT SUM(amount) FROM expenses 
        WHERE strftime('%Y-%m', date) = ?
    ''', (current_month,)).fetchone()[0] or 0
    
    # Average fuel consumption
    fuel_logs = conn.execute('''
        SELECT vehicle_id, amount, mileage, 
               LAG(mileage) OVER (PARTITION BY vehicle_id ORDER BY date) as prev_mileage,
               LAG(amount) OVER (PARTITION BY vehicle_id ORDER BY date) as prev_amount
        FROM fuel_logs
        ORDER BY vehicle_id, date
    ''').fetchall()
    
    total_consumption = 0
    valid_entries = 0
    
    for log in fuel_logs:
        if log['prev_mileage'] and log['prev_amount']:
            distance = log['mileage'] - log['prev_mileage']
            if distance > 0:
                consumption = (log['amount'] / distance) * 100
                total_consumption += consumption
                valid_entries += 1
    
    avg_fuel_consumption = total_consumption / valid_entries if valid_entries > 0 else 0
    
    # Reminders count
    six_months_ago = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
    reminders_count = conn.execute('''
        SELECT COUNT(*) FROM maintenance_records 
        WHERE date <= ?
    ''', (six_months_ago,)).fetchone()[0] or 0
    
    conn.close()
    
    return jsonify({
        'total_mileage': total_mileage,
        'monthly_expenses': monthly_expenses,
        'avg_fuel_consumption': round(avg_fuel_consumption, 1),
        'reminders_count': reminders_count
    })

@app.route('/api/fuel-price', methods=['GET'])
def get_fuel_price():
    """Get current fuel price from API"""
    try:
        # This is a placeholder for a real fuel price API
        # You would need to integrate with an actual fuel price API
        # For now, return a mock price
        return jsonify({
            'price': 50.0,
            'currency': 'UAH',
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
