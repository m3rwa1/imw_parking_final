import sys
import os

# Ajout du chemin du backend for imports
sys.path.append('c:/Nouveau Dossier/htdocs/imw-parking-final/backend')

from app import create_app
from app.database import Database

# Créer l'application Flask
app = create_app('development')

def list_tables():
    with app.app_context():
        with Database.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES")
            rows = cursor.fetchall()
            print("Tables in database:")
            for row in rows:
                print(row[0])

if __name__ == "__main__":
    list_tables()
