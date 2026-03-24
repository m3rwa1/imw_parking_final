# IMW Parking

Application de gestion de parking avec:
- Frontend: React + Vite
- Backend: Flask (API REST)
- Base de donnees: MySQL

Ce guide est concu pour fonctionner sur Windows, Linux et macOS.

## Prerequis

- Node.js 20+ (frontend)
- Python 3.11+ (backend)
- MySQL 8+ (ou MariaDB compatible)

## 1) Cloner et installer

### Frontend

Depuis la racine du projet:

```bash
npm install
```

### Backend

```bash
cd backend
python -m venv venv
```

Activation du virtualenv:

- Windows (PowerShell):
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- Windows (cmd):
  ```bat
  .\venv\Scripts\activate.bat
  ```
- Linux/macOS:
  ```bash
  source venv/bin/activate
  ```

Puis:

```bash
pip install -r requirements.txt
```

## 2) Configurer la base MySQL

1. Creer/importer la base depuis `backend/database.sql`.
2. Verifier que la base contient au moins la table `users`.

Dans `backend/.env`, adapter:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=imw-parking_database
```

Important:
- Sur Linux, les noms de base sont souvent sensibles a la casse.
- Utiliser `imw-parking_database` (recommande) pour eviter les erreurs.

## 3) Lancer le backend

Dans `backend` avec le venv actif:

```bash
python run.py
```

API disponible sur `http://localhost:5000`.

## 4) Lancer le frontend

Depuis la racine:

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

## 5) Verification rapide

1. Ouvrir `http://localhost:3000`
2. Tester la connexion admin
3. Verifier que le backend repond sur `GET /api/health`

## Depannage (500 au login)

Si le login retourne 500:

1. Verifier MySQL demarre et accessible sur le port 3306.
2. Verifier `MYSQL_DATABASE` dans `backend/.env`.
3. Relancer le backend et observer les logs.
4. Executer:

```bash
cd backend
python test_db.py
```

Si `test_db.py` ne se connecte pas, le probleme vient de la configuration MySQL.

## Scripts utiles

Depuis la racine:

- `npm run dev` - demarrer le frontend
- `npm run build` - build frontend
- `npm run clean` - supprimer `dist` (compatible Windows/Linux/macOS)

