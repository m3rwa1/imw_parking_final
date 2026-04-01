
import mysql.connector
import os
import json

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
        
        results = {}

        # 1. Check Events
        cursor.execute("SHOW EVENTS")
        results['events'] = cursor.fetchall()
        
        # 2. Check Event Scheduler status
        cursor.execute("SHOW VARIABLES LIKE 'event_scheduler'")
        results['event_scheduler'] = cursor.fetchone()

        # 3. Check Table Structures
        tables = ['users', 'vehicles', 'parking_entries', 'reservations', 'payments']
        results['columns'] = {}
        for table in tables:
            cursor.execute(f"DESCRIBE {table}")
            results['columns'][table] = cursor.fetchall()

        # 4. Check for logic inconsistencies
        # - Entries with status IN but having exit_time
        cursor.execute("SELECT id, license_plate FROM parking_entries WHERE status = 'IN' AND exit_time IS NOT NULL")
        results['in_with_exit_time'] = cursor.fetchall()

        # - Reservations with invalid status (if any)
        cursor.execute("SELECT statut, COUNT(*) as count FROM reservations GROUP BY statut")
        results['reservation_status_counts'] = cursor.fetchall()

        print(json.dumps(results, indent=2, default=str))
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test()
