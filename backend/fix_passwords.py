import mysql.connector
import bcrypt

# Generate proper hash for "password"
password = "password"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f"Hash for 'password': {hashed}")

# Connect and update
conn = mysql.connector.connect(host='localhost', user='root', password='', database='IMW-PARKING_DATABASE')
cursor = conn.cursor()

# Update all test users with the proper hash
test_emails = [
    'admin@imw.com',
    'manager@imw.com', 
    'agent1@imw.com',
    'jean@example.com',
    'marie@example.com'
]

update_query = "UPDATE users SET password = %s WHERE email = %s"

for email in test_emails:
    cursor.execute(update_query, (hashed, email))
    print(f"Updated password for {email}")

conn.commit()

# Verify the update
cursor.execute("SELECT email, password FROM users WHERE email IN (%s, %s, %s, %s, %s)", test_emails)
print("\nUsers after update:")
for row in cursor.fetchall():
    print(f"{row[0]}: {row[1][:20]}...")

conn.close()
print("\nPassword reset completed!")
