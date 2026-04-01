import mysql.connector

try:
    conn = mysql.connector.connect(host='localhost', user='root', password='', database='imw-parking_database')
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = 'ADMIN' WHERE email = 'admin@imw.com'")
    conn.commit()
    print("ROLE ADMIN RESTAURE POUR admin@imw.com")
    cursor.close()
    conn.close()
except Exception as e:
    print(e)
