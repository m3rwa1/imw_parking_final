# backend/check_password.py
import bcrypt
import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="IMW-PARKING_DATABASE"
)
cur = conn.cursor(dictionary=True)
cur.execute("SELECT id,email,role,password FROM users WHERE email IN ('admin@imw.com','manager@imw.com','agent1@imw.com')")
rows = cur.fetchall()
for u in rows:
    ok = bcrypt.checkpw(b"imwemployes", u["password"].encode())
    print(u["email"], "role=", u["role"], "hash=", u["password"][:30]+"...", "match?", ok)
cur.close()
conn.close()