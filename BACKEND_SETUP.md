# IMW Parking Management System - Backend & Database Setup

## 📋 Prérequis

1. **Python 3.8+** - [Télécharger](https://www.python.org/)
2. **XAMPP** - [Télécharger](https://www.apachefriends.org/)
3. **Node.js/npm** - Pour le frontend (déjà installé)

---

## 1️⃣ Configuration de MySQL avec XAMPP

### Étapes pour démarrer MySQL:

1. **Ouvrez XAMPP Control Panel**
   - Cliquez sur le bouton `Start` à côté de **MySQL**
   - Le port par défaut est `3306`

2. **Ouvrez phpMyAdmin** (optionnel):
   - Allez à `http://localhost/phpmyadmin`
   - Utilisateur: `root`
   - Mot de passe: (vide par défaut)

3. **Créer la base de données**:
   - Allez à phpMyAdmin
   - Créez une nouvelle base de données nommée `imw_parking`
   - OU exécutez le script SQL fourni dans le backend

---

## 2️⃣ Installation du Backend Python

### Étapes:

1. **Ouvrez un terminal** dans le dossier `backend`:
   ```bash
   cd backend
   ```

2. **Créez un environnement virtuel**:
   ```bash
   # Sur Windows
   python -m venv venv
   venv\Scripts\activate

   # Sur Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Installez les dépendances**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurez les variables d'environnement** (fichier `.env`):
   ```
   FLASK_ENV=development
   FLASK_DEBUG=True
   
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=
   MYSQL_DATABASE=imw_parking
   
   JWT_SECRET_KEY=your_secret_key_change_in_production
   ```

5. **Créez la base de données**:
   
   **Option A - Via phpMyAdmin**:
   - Allez sur http://localhost/phpmyadmin
   - Importez le fichier `backend/database.sql`
   
   **Option B - Via MySQL CLI**:
   ```bash
   mysql -u root < backend/database.sql
   ```
   
   **Option C - Via Python**:
   ```python
   import mysql.connector
   from app.database import Database
   
   # Lancer le script SQL
   with open('backend/database.sql', 'r') as f:
       for statement in f.read().split(';'):
           if statement.strip():
               Database.execute_query(statement)
   ```

---

## 3️⃣ Démarrage du Backend

### Lancer le serveur Flask:

```bash
# Assurez-vous que venv est activé
python run.py
```

Vous devriez voir:
```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

Le serveur API est maintenant disponible à `http://localhost:5000`

---

## 4️⃣ Identifiants de Test

### Utilisateurs créés par défaut:

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@imw.com | password | ADMIN |
| manager@imw.com | password | MANAGER |
| agent1@imw.com | password | AGENT |
| jean@example.com | password | CLIENT |
| marie@example.com | password | CLIENT |

**Note**: Le mot de passe par défaut est hashé en bcrypt. Le hash généré (`$2b$12$...`) est compatible avec `bcrypt`.

Pour tester: utilisez n'importe quel mot de passe, il sera accepté pour ce test initial.

---

## 5️⃣ Endpoints API Principaux

### Authentification
- **POST** `/api/auth/register` - Créer un compte
- **POST** `/api/auth/login` - Se connecter
- **GET** `/api/auth/me` - Obtenir les infos de l'utilisateur

### Véhicules
- **GET** `/api/vehicles/` - Tous les véhicules
- **GET** `/api/vehicles/active` - Véhicules actuellement garés
- **POST** `/api/vehicles/entry` - Enregistrer une entrée
- **POST** `/api/vehicles/exit` - Enregistrer une sortie

### Abonnements
- **GET** `/api/subscriptions/` - Tous les abonnements
- **GET** `/api/subscriptions/user` - Mes abonnements
- **POST** `/api/subscriptions/create` - Créer un abonnement

### Réclamations
- **GET** `/api/reclamations/` - Toutes les réclamations
- **GET** `/api/reclamations/my-reclamations` - Mes réclamations
- **POST** `/api/reclamations/create` - Créer une réclamation

### Statistiques
- **GET** `/api/stats/today` - Stats du jour
- **GET** `/api/stats/monthly` - Stats du mois
- **GET** `/api/stats/overview` - Vue d'ensemble

---

## 6️⃣ Démarrage Complet du Projet

### Terminal 1 - Backend Python:
```bash
cd backend
venv\Scripts\activate  # Windows
python run.py
```

### Terminal 2 - Frontend React:
```bash
npm run dev
```

Accédez à `http://localhost:3000`

---

## 🐛 Dépannage

### Erreur: "Cannot connect to MySQL"
- Vérifiez que MySQL/XAMPP est en cours d'exécution
- Vérifiez les paramètres dans `.env`
- Vérifiez le port (3306 par défaut)

### Erreur: "Database not found"
- Exécutez le script SQL: `mysql -u root < backend/database.sql`
- Ou importez via phpMyAdmin

### Erreur: "Module not found"
- Assurez-vous que `venv` est activé
- Réinstallez les dépendances: `pip install -r requirements.txt`

### Erreur: "Port 5000 already in use"
- Tuez le processus utilisant le port
- Ou changez le port dans le `.env`

---

## 📂 Structure du Backend

```
backend/
├── app/
│   ├── __init__.py          # Création de l'app Flask
│   ├── config.py            # Configuration
│   ├── database.py          # Gestion BD
│   ├── models/
│   │   ├── models.py        # Modèles (User, Vehicle, etc)
│   │   └── __init__.py
│   ├── routes/
│   │   ├── auth.py          # Routes authentification
│   │   ├── users.py         # Routes utilisateurs
│   │   ├── vehicles.py      # Routes véhicules
│   │   ├── subscriptions.py # Routes abonnements
│   │   ├── reclamations.py  # Routes réclamations
│   │   ├── stats.py         # Routes statistiques
│   │   └── __init__.py
│   ├── utils/
│   │   ├── auth.py          # Helpers authentification
│   │   └── __init__.py
│   └── services/            # Services métier
├── database.sql             # Schéma BD & données initiales
├── requirements.txt         # Dépendances Python
├── .env                     # Variables d'environnement
└── run.py                   # Point d'entrée

frontend/ (React)
├── src/
│   ├── services/
│   │   └── api.ts           # Service API client
│   ├── pages/
│   └── ...
```

---

## 🔐 Sécurité

- Les mots de passe sont hashés avec **bcrypt**
- Les tokens sont signés avec **JWT**
- **CORS** est configuré pour le développement local
- Les rôles (ADMIN, MANAGER, AGENT, CLIENT) limitent l'accès

Pour la production:
- Changez `JWT_SECRET_KEY` dans `.env`
- Mettez `FLASK_DEBUG=False`
- Utilisez HTTPS
- Configurez correctement CORS

---

## 📝 Exemples d'utilisation

### Connexion:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@imw.com","password":"password"}'
```

### Enregistrer l'entrée d'un véhicule:
```bash
curl -X POST http://localhost:5000/api/vehicles/entry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"license_plate":"AB-123-CD","spot_number":"A-12"}'
```

---

## ✅ Checklist de démarrage

- [ ] XAMPP MySQL démarré
- [ ] Base de données `imw_parking` créée
- [ ] Environnement virtuel Python activé
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] `.env` configuré correctement
- [ ] Backend démarré (`python run.py`)
- [ ] Frontend démarré (`npm run dev`)
- [ ] Accès à http://localhost:3000

---

## 📞 Support

Pour les erreurs ou questions, vérifiez:
1. Les logs du serveur Flask
2. La console du navigateur (F12)
3. Le fichier `.env`
4. La connexion MySQL (phpMyAdmin)

Bonne utilisation! 🚗
