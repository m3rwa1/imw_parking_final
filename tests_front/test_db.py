
import mysql.connector
import os

def test():
    config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'imw-parking_database',
    }
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(dictionary=True)
        
        print("--- Columns in parking_entries ---")
        cursor.execute("DESCRIBE parking_entries")
        for row in cursor.fetchall():
            print(row)
            
        print("\n--- Last 5 entries ---")
        cursor.execute("SELECT id, license_plate, status, entry_time, exit_time, expected_end_time FROM parking_entries ORDER BY id DESC LIMIT 5")
        for row in cursor.fetchall():
            print(row)
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test()
