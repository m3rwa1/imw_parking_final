import bcrypt
import mysql.connector

pwd = "imwemployes"
hashpwd = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="IMW-PARKING_DATABASE"
)
cur = conn.cursor()
for email in ["admin@imw.com", "manager@imw.com", "agent1@imw.com"]:
    cur.execute("UPDATE users SET password = %s WHERE email = %s", (hashpwd, email))
conn.commit()
cur.close()
conn.close()

print("Mot de passe réinitialisé à imwemployes pour admin/manager/agent1")