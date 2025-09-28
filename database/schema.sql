-- Car Manager Database Schema
-- SQLite Database for Car Management Application

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2024),
    plate VARCHAR(20) NOT NULL UNIQUE,
    mileage INTEGER NOT NULL DEFAULT 0 CHECK (mileage >= 0),
    color VARCHAR(30),
    engine_type VARCHAR(20) DEFAULT 'gasoline',
    fuel_capacity REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fuel logs table
CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date DATE NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    price_per_liter REAL NOT NULL CHECK (price_per_liter > 0),
    total_cost REAL NOT NULL CHECK (total_cost > 0),
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    station_name VARCHAR(100),
    fuel_type VARCHAR(20) DEFAULT 'gasoline',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Maintenance records table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    cost REAL NOT NULL CHECK (cost >= 0),
    description TEXT,
    service_center VARCHAR(100),
    next_maintenance_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('fuel', 'maintenance', 'insurance', 'repair', 'other')),
    description VARCHAR(200) NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    category VARCHAR(50),
    receipt_number VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Services table (auto service centers)
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    website VARCHAR(200),
    rating INTEGER NOT NULL DEFAULT 1 CHECK (rating >= 1 AND rating <= 5),
    description TEXT,
    services_offered TEXT,
    working_hours VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date DATE NOT NULL,
    from_location VARCHAR(100) NOT NULL,
    to_location VARCHAR(100) NOT NULL,
    distance REAL NOT NULL CHECK (distance > 0),
    fuel_price REAL NOT NULL CHECK (fuel_price > 0),
    estimated_cost REAL,
    actual_cost REAL,
    purpose VARCHAR(100),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Insurance records table
CREATE TABLE IF NOT EXISTS insurance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    policy_number VARCHAR(50) NOT NULL,
    insurance_company VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    premium_amount REAL NOT NULL CHECK (premium_amount > 0),
    coverage_type VARCHAR(50),
    agent_name VARCHAR(100),
    agent_phone VARCHAR(20),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Fuel prices table (for tracking fuel price history)
CREATE TABLE IF NOT EXISTS fuel_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fuel_type VARCHAR(20) NOT NULL DEFAULT 'gasoline',
    price REAL NOT NULL CHECK (price > 0),
    station_name VARCHAR(100),
    location VARCHAR(100),
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(date);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_insurance_vehicle_id ON insurance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_id ON reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed);

-- Create triggers for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_vehicles_timestamp 
    AFTER UPDATE ON vehicles
    BEGIN
        UPDATE vehicles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_services_timestamp 
    AFTER UPDATE ON services
    BEGIN
        UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Create view for vehicle statistics
CREATE VIEW IF NOT EXISTS vehicle_stats AS
SELECT 
    v.id,
    v.brand,
    v.model,
    v.year,
    v.plate,
    v.mileage,
    COUNT(fl.id) as fuel_logs_count,
    COALESCE(SUM(fl.amount), 0) as total_fuel_consumed,
    COALESCE(SUM(fl.total_cost), 0) as total_fuel_cost,
    COALESCE(AVG((fl.amount / (fl.mileage - LAG(fl.mileage) OVER (PARTITION BY v.id ORDER BY fl.date)) * 100)), 0) as avg_fuel_consumption,
    COUNT(mr.id) as maintenance_count,
    COALESCE(SUM(mr.cost), 0) as total_maintenance_cost,
    COUNT(e.id) as expenses_count,
    COALESCE(SUM(e.amount), 0) as total_expenses
FROM vehicles v
LEFT JOIN fuel_logs fl ON v.id = fl.vehicle_id
LEFT JOIN maintenance_records mr ON v.id = mr.vehicle_id
LEFT JOIN expenses e ON v.id = e.vehicle_id
GROUP BY v.id, v.brand, v.model, v.year, v.plate, v.mileage;

-- Create view for monthly expenses
CREATE VIEW IF NOT EXISTS monthly_expenses AS
SELECT 
    strftime('%Y-%m', date) as month,
    type,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM expenses
GROUP BY strftime('%Y-%m', date), type
ORDER BY month DESC, type;
