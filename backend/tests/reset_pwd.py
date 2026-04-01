"""
Script pour générer et mettre à jour les mots de passe des employés.
Exécuter avec: python reset_pwd.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bcrypt
import mysql.connector

# --- Générer le hash de 'password' ---
pwd = b"password"
hashed = bcrypt.hashpw(pwd, bcrypt.gensalt(12)).decode()
print(f"Hash généré: {hashed}")

# --- Connexion MySQL ---
try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="",
        database="imw-parking_database"
    )
    cursor = conn.cursor()
    
    emails = ['admin@imw.com', 'manager@imw.com', 'agent@imw.com']
    for email in emails:
        cursor.execute("UPDATE users SET password = %s WHERE email = %s", (hashed, email))
        print(f"✅ Mot de passe mis à jour pour {email}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("\n✅ Tous les mots de passe ont été mis à jour avec succès.")
    print("   Connectez-vous avec: admin@imw.com / password")

except mysql.connector.Error as e:
    print(f"❌ Erreur MySQL: {e}")
    print("   Assurez-vous que XAMPP MySQL est en cours d'exécution.")
