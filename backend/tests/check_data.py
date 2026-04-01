import sys
import os

# Ajout du chemin du backend for imports
sys.path.append('c:/Nouveau Dossier/htdocs/imw-parking-final/backend')

from app import create_app
from app.database import Database

# Créer l'application Flask
app = create_app('development')

def check_data():
    with app.app_context():
        with Database.get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            
            print("--- RESERVATIONS ---")
            cursor.execute("SELECT COUNT(*) AS cnt FROM reservations")
            print(f"Total: {cursor.fetchone()['cnt']}")
            cursor.execute("SELECT * FROM reservations ORDER BY created_at DESC LIMIT 5")
            for row in cursor.fetchall():
                print(row)
                
            print("\n--- PAYMENTS ---")
            cursor.execute("SELECT COUNT(*) AS cnt FROM payments")
            print(f"Total: {cursor.fetchone()['cnt']}")
            cursor.execute("SELECT * FROM payments ORDER BY created_at DESC LIMIT 5")
            for row in cursor.fetchall():
                print(row)

if __name__ == "__main__":
    check_data()
