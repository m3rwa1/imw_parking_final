import mysql.connector

def migrate():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="imw-parking_database"
        )
        cursor = conn.cursor()
        
        # Create reservations table
        sql = """
        CREATE TABLE IF NOT EXISTS `reservations` (
            `id`             INT NOT NULL AUTO_INCREMENT,
            `user_id`        INT NOT NULL,
            `nom_proche`     VARCHAR(100) NOT NULL,
            `license_plate`  VARCHAR(20) NOT NULL,
            `vehicle_type`   ENUM('Voiture','Moto','Camion') NOT NULL DEFAULT 'Voiture',
            `date_reservation` DATE NOT NULL,
            `statut`         ENUM('PENDING','VALIDATED','CANCELLED') NOT NULL DEFAULT 'PENDING',
            `montant`        DECIMAL(10,2) NOT NULL,
            `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_user` (`user_id`),
            KEY `idx_statut` (`statut`),
            CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        cursor.execute(sql)
        print("Table 'reservations' created successfully.")
        
        # Check if reservation_id exists in payments table
        cursor.execute("SHOW COLUMNS FROM `payments` LIKE 'reservation_id'")
        result = cursor.fetchone()
        if not result:
            cursor.execute("ALTER TABLE `payments` ADD COLUMN `reservation_id` INT DEFAULT NULL AFTER `subscription_id`")
            cursor.execute("ALTER TABLE `payments` ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL")
            print("Added 'reservation_id' column to 'payments' table.")
            
        conn.commit()
        print("Migration completed.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    migrate()
