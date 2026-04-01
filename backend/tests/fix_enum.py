import mysql.connector

conn = mysql.connector.connect(host='localhost', user='root', password='', database='imw-parking_database')
cursor = conn.cursor()
cursor.execute("ALTER TABLE subscriptions MODIFY COLUMN status ENUM('ACTIVE','EXPIRED','CANCELLED','PENDING') NOT NULL DEFAULT 'ACTIVE'")
conn.commit()
cursor.close()
conn.close()
print("OK - ENUM PENDING ajoute")
