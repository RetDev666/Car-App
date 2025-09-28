#!/usr/bin/env python3
"""
Simple test to check if Python and database work
"""

import sqlite3
import os

def test_simple():
    print("Testing Python and SQLite...")
    
    # Test 1: Create a simple database
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    # Create a simple table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS test (
            id INTEGER PRIMARY KEY,
            name TEXT
        )
    ''')
    
    # Insert test data
    cursor.execute("INSERT INTO test (name) VALUES (?)", ("Test",))
    conn.commit()
    
    # Read test data
    cursor.execute("SELECT * FROM test")
    result = cursor.fetchone()
    
    if result:
        print(f"✅ Database test successful: {result}")
    else:
        print("❌ Database test failed")
    
    conn.close()
    
    # Clean up
    if os.path.exists('test.db'):
        os.remove('test.db')
        print("✅ Cleanup successful")

if __name__ == "__main__":
    test_simple()
