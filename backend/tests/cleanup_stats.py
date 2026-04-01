import sys
import os

# Ajout du chemin du backend for imports
sys.path.append('c:/Nouveau Dossier/htdocs/imw-parking-final/backend')

from app import create_app
from app.database import Database

# Créer l'application Flask
app = create_app('development')

def cleanup_data():
    with app.app_context():
        print("Début du nettoyage des données de test...")
        
        with Database.get_db() as conn:
            if conn is None:
                print("Erreur de connexion !")
                return
            
            cursor = conn.cursor(dictionary=True)
            
            try:
                # Récupérer les parking_entry_id liés aux paiements SEED_TEST
                cursor.execute("SELECT parking_entry_id FROM payments WHERE reference = 'SEED_TEST'")
                entry_ids = [row['parking_entry_id'] for row in cursor.fetchall()]
                
                if entry_ids:
                    # Supprimer les paiements
                    cursor.execute("DELETE FROM payments WHERE reference = 'SEED_TEST'")
                    print(f"Supprimé {cursor.rowcount} paiements.")
                    
                    # Supprimer les entrées correspondantes
                    format_strings = ','.join(['%s'] * len(entry_ids))
                    cursor.execute(f"DELETE FROM parking_entries WHERE id IN ({format_strings})", tuple(entry_ids))
                    print(f"Supprimé {cursor.rowcount} entrées de parking.")
                else:
                    print("Aucune donnée de test trouvée.")
                
                conn.commit()
            except Exception as e:
                print(f"Erreur lors du nettoyage : {e}")
            finally:
                cursor.close()
            
        print("Nettoyage terminé.")

if __name__ == "__main__":
    cleanup_data()
