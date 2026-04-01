import sys
import os
from datetime import datetime, timedelta
import random

# Ajout du chemin du backend pour les imports
sys.path.append('c:/Nouveau Dossier/htdocs/imw-parking-final/backend')

from app import create_app
from app.database import Database

# Créer l'application Flask
app = create_app('development')

def seed_data():
    with app.app_context():
        print("Début du seeding des statistiques...")
        
        vehicle_types = ['Voiture', 'Moto', 'Camion']
        plates = ['AA-123-BB', 'CC-456-DD', 'EE-789-FF', 'GG-012-HH', 'II-345-JJ']
        
        with Database.get_db() as conn:
            if conn is None:
                print("Erreur de connexion !")
                return
            
            cursor = conn.cursor(dictionary=True)
            
            # Pour chaque jour sur 7 jours
            for i in range(7):
                target_date = datetime.now() - timedelta(days=i)
                # 5 à 10 entrées par jour
                num_entries = random.randint(5, 10)
                
                for _ in range(num_entries):
                    plate = random.choice(plates)
                    v_type = random.choice(vehicle_types)
                    amount = random.randint(15, 60)
                    
                    # Heures aléatoires
                    h_in = random.randint(0, 18)
                    h_out = h_in + random.randint(1, 4)
                    
                    entry_time = target_date.replace(hour=h_in, minute=0, second=0)
                    exit_time = target_date.replace(hour=h_out, minute=0, second=0)
                    
                    # Ajustement pour ne pas être dans le futur
                    if entry_time > datetime.now():
                        entry_time = datetime.now() - timedelta(minutes=10)
                    if exit_time > datetime.now():
                        exit_time = datetime.now()
                    
                    try:
                        # Insérer l'entrée
                        cursor.execute(
                            """INSERT INTO parking_entries (license_plate, vehicle_type, entry_time, exit_time, status, spot_number) 
                               VALUES (%s, %s, %s, %s, 'OUT', %s)""",
                            (plate, v_type, entry_time, exit_time, f"T-{random.randint(1, 160)}")
                        )
                        entry_id = cursor.lastrowid
                        
                        # Insérer le paiement
                        cursor.execute(
                            """INSERT INTO payments (parking_entry_id, amount, payment_method, payment_status, paid_at, reference) 
                               VALUES (%s, %s, 'CASH', 'PAID', %s, 'SEED_TEST')""",
                            (entry_id, amount, exit_time)
                        )
                    except Exception as e:
                        print(f"Erreur lors de l'insertion : {e}")
            
            conn.commit()
            cursor.close()
            
        print("Seeding terminé avec succès !")

if __name__ == "__main__":
    seed_data()
