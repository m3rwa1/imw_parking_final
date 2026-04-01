import mysql.connector

try:
    conn = mysql.connector.connect(host='localhost', user='root', password='', database='imw-parking_database')
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name, email, role FROM users")
    users = cursor.fetchall()
    
    print("--- UTILISATEURS EN BD ---")
    for u in users:
        print(f"ID: {u['id']}, Name: {u['name']}, Email: {u['email']}, Role: {u['role']}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(e)
