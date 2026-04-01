import mysql.connector

conn = mysql.connector.connect(host='localhost', user='root', password='', database='imw-parking_database')
cursor = conn.cursor(dictionary=True)

cursor.execute("SELECT * FROM users")
print("Users:", cursor.fetchall())

cursor.execute("SELECT * FROM parking_entries")
print("Entries:", cursor.fetchall())

cursor.execute("SELECT * FROM vehicles")
print("Vehicles:", cursor.fetchall())

cursor.close()
conn.close()
