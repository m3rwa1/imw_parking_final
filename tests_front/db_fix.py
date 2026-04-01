
import mysql.connector

def fix():
    config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'imw-parking_database',
    }
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        # 1. Update Enum
        print("Updating reservations statut enum...")
        cursor.execute("ALTER TABLE reservations MODIFY COLUMN statut ENUM('PENDING','VALIDATED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PENDING'")
        
        # 2. Add Event (if missing or update it)
        print("Re-creating auto_liberer_places event...")
        cursor.execute("DROP EVENT IF EXISTS auto_liberer_places")
        event_sql = """
        CREATE EVENT auto_liberer_places
        ON SCHEDULE EVERY 1 MINUTE
        DO
        BEGIN
            -- Libérer les places dont le temps est écoulé
            UPDATE parking_entries 
            SET status = 'OUT', exit_time = NOW() 
            WHERE status = 'IN' AND expected_end_time IS NOT NULL AND expected_end_time < NOW();

            -- Marquer les réservations comme expirées
            UPDATE reservations 
            SET statut = 'EXPIRED' 
            WHERE statut IN ('PENDING', 'VALIDATED') AND end_time < NOW();
        END
        """
        cursor.execute(event_sql)
        
        conn.commit()
        print("Database schema fixed successfully.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    fix()
