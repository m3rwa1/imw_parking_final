import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='imw-parking_database'
)
cur = conn.cursor()
cur.execute("SHOW COLUMNS FROM `reservations`")
cols = cur.fetchall()
print('Columns in reservations:')
for c in cols:
    print(c[0], c[1])
cur.close()
conn.close()
