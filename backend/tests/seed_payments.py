import sys
import os
from datetime import datetime, timedelta
import random

# Ajout du chemin du backend for imports
sys.path.append('c:/Nouveau Dossier/htdocs/imw-parking-final/backend')

from app import create_app
from app.database import Database

# Créer l'application Flask
app = create_app('development')

def seed_payments():
    with app.app_context():
        with Database.get_db() as conn:
            cursor = conn.cursor()
            
            print("Seeding sample payments for the last 10 days...")
            for i in range(10):
                date_val = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d %H:%M:%S')
                amount = random.randint(20, 100)
                cursor.execute(
                    "INSERT INTO payments (amount, payment_method, payment_status, paid_at, created_at) VALUES (%s, %s, %s, %s, %s)",
                    (amount, 'CASH', 'PAID', date_val, date_val)
                )
            conn.commit()
            print("Done.")

if __name__ == "__main__":
    seed_payments()
