#!/usr/bin/env python3
"""
Run Car Manager App with Database
"""

import os
import sys
import subprocess

def check_database():
    """Check if database exists"""
    return os.path.exists('car_manager.db')

def init_database():
    """Initialize database if it doesn't exist"""
    if not check_database():
        print("🗄️  Database not found. Initializing...")
        try:
            # Run database initialization script
            result = subprocess.run([sys.executable, 'database/init_db.py'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Database initialized successfully")
                return True
            else:
                print(f"❌ Database initialization failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error initializing database: {e}")
            return False
    else:
        print("✅ Database already exists")
        return True

def main():
    """Main function"""
    print("🚗 Car Manager App with Database")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists('backend'):
        print("❌ Please run this script from the Car-App root directory")
        sys.exit(1)
    
    # Initialize database
    if not init_database():
        print("❌ Failed to initialize database")
        sys.exit(1)
    
    # Change to backend directory
    os.chdir('backend')
    
    # Run the Flask app
    print("🚀 Starting Flask application...")
    print("📱 Open your browser and go to: http://localhost:5000")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 40)
    
    try:
        subprocess.run([sys.executable, 'app_new.py'])
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error running server: {e}")

if __name__ == "__main__":
    main()
