# IMW Parking

Application de gestion de parking complète.

- **Frontend** : React + Vite  
- **Backend** : Flask (API REST)  
- **Base de données** : MySQL / MariaDB

---

## Installation Locale

### Prérequis

- **Node.js** v20 ou supérieur
- **Python** v3.11 ou supérieur
- **MySQL** v8 ou supérieur (ou XAMPP / MariaDB)

### 1. Configuration de l'environnement

Clonez le dépôt et préparez les fichiers de configuration :

```bash
# Copie des exemples d'environnement
cp .env.example .env
cp backend/.env.example backend/.env
```

> [!IMPORTANT]
> Modifiez `backend/.env` avec vos accès MySQL locaux et votre clé secrète JWT.
> Importez le fichier `backend/database.sql` dans votre instance MySQL.

### 2. Installation du Frontend (Racine)

```bash
npm install
```

### 3. Installation du Backend

```bash
cd backend
python -m venv venv
```

**Activation de l'environnement virtuel :**
- **Windows (PowerShell)** : `.\venv\Scripts\Activate.ps1`
- **Windows (cmd)** : `.\venv\Scripts\activate.bat`
- **Linux/macOS** : `source venv/bin/activate`

**Installation des dépendances :**
```bash
pip install -r requirements.txt
python run.py
```
L'API sera disponible sur : **http://localhost:5000**

### 4. Lancement du Frontend

Ouvrez un nouveau terminal à la racine du projet :
```bash
npm run dev
```
L'application sera disponible sur : **http://localhost:3000**

---

## Scripts Utiles

- **`npm run dev`** : Lance le serveur de développement React (Vite).
- **`npm run build`** : Prépare la version de production dans le dossier `dist`.
- **`npm run lint`** : Vérifie la syntaxe et les types TypeScript.
- **`START_ALL.bat`** : (Windows uniquement) Script pour tout lancer d'un coup.

---

## Dépannage

- **Erreur de connexion DB** : Vérifiez que MySQL tourne sur le port 3306 et que les identifiants dans `backend/.env` sont corrects.
- **Venv non fonctionnel** : Si vous avez des erreurs d'exécutable, supprimez le dossier `backend/venv` et recréez-le manuellement.
- **Santé de l'API** : Consultez `http://localhost:5000/api/health` pour vérifier que le backend répond.

---

*Projet finalisé et optimisé pour une exécution locale stable.*

