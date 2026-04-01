# backend/test_db.py
from app import create_app
from app.database import Database
from flask import current_app

app = create_app()
with app.app_context():
    print("MYSQL_DATABASE config:", current_app.config.get("MYSQL_DATABASE"))
    conn = Database.get_connection()
    if conn:
        cur = conn.cursor()
        cur.execute("SELECT DATABASE()")
        print("Connected to database:", cur.fetchone()[0])
        cur.close()
        conn.close()
    else:
        print("No connection")