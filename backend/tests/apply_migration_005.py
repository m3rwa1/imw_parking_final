import mysql.connector

sql = '''ALTER TABLE `reservations`
  ADD COLUMN `place_number` VARCHAR(20) DEFAULT NULL AFTER `montant`,
  ADD COLUMN `created_by` INT DEFAULT NULL AFTER `place_number`,
  ADD KEY `idx_place_number` (`place_number`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD CONSTRAINT `reservations_ibfk_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;'''

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='imw-parking_database'
)
cur = conn.cursor()
try:
    cur.execute(sql)
    conn.commit()
    print('Migration 005 applied successfully.')
except Exception as e:
    print('Error applying migration:', e)
finally:
    cur.close()
    conn.close()
