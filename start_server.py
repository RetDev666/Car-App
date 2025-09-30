#!/usr/bin/env python3
"""
Simple server starter for Car Manager App
"""

import os
import sys
import subprocess
import webbrowser
import time
import threading

def check_python():
    """Check if Python is available"""
    try:
        result = subprocess.run([sys.executable, '--version'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Python found: {result.stdout.strip()}")
            return True
        else:
            print("❌ Python not working properly")
            return False
    except Exception as e:
        print(f"❌ Python error: {e}")
        return False

def check_database():
    """Check if database exists"""
    if os.path.exists('car_manager.db'):
        print("✅ Database exists")
        return True
    else:
        print("⚠️  Database not found, creating...")
        try:
            result = subprocess.run([sys.executable, 'database/init_db.py'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Database created successfully")
                return True
            else:
                print(f"❌ Database creation failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Database error: {e}")
            return False

def start_server():
    """Start Flask server"""
    print("🚀 Starting Flask server...")
    try:
        os.chdir('backend')
        subprocess.run([sys.executable, 'app_new.py'])
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

def open_browser():
    """Open browser after delay"""
    time.sleep(3)
    try:
        webbrowser.open('http://localhost:5000')
        print("🌐 Browser opened")
    except Exception as e:
        print(f"⚠️  Could not open browser: {e}")

def main():
    """Main function"""
    print("🚗 Car Manager App Launcher")
    print("=" * 40)
    
    # Check Python
    if not check_python():
        print("\n❌ Python is required but not found")
        print("Please install Python from https://python.org")
        input("Press Enter to exit...")
        return
    
    # Check database
    if not check_database():
        print("\n❌ Database setup failed")
        input("Press Enter to exit...")
        return
    
    # Start browser in background
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Start server
    print("\n📱 Server will be available at: http://localhost:5000")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 40)
    
    start_server()

if __name__ == "__main__":
    main()

