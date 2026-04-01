import sys
import os

# Ajout du chemin du backend for imports
sys.path.append('c:/Nouveau Dossier/htdocs/imw-parking-final/backend')

from app import create_app
from app.database import Database

# Créer l'application Flask
app = create_app('development')

def check_all_payments():
    with app.app_context():
        with Database.get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM payments")
            rows = cursor.fetchall()
            print(f"Total payments: {len(rows)}")
            for row in rows:
                print(row)

if __name__ == "__main__":
    check_all_payments()
