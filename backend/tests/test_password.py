import mysql.connector
import bcrypt

conn = mysql.connector.connect(host='localhost', user='root', password='', database='IMW-PARKING_DATABASE')
cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT email, password FROM users WHERE email=%s", ('admin@imw.com',))
row = cursor.fetchone()
print('Email:', row['email'])
print('Password hash from DB:', repr(row['password']))
print()

# Try to verify
password = 'password'
try:
    result = bcrypt.checkpw(password.encode('utf-8'), row['password'].encode('utf-8'))
    print(f'Verification result: {result}')
except Exception as e:
    print(f'Error verifying: {e}')
    
conn.close()
