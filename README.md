# 🚗 IMW Parking Management System

Système complet de gestion de parking avec frontend React/TypeScript, backend Python Flask et base de données MySQL.

## ✅ Ce qui a été créé

### 🔧 Backend Python Flask (NOUVEAU) ✨
- ✅ Architecture Flask complète avec blueprints
- ✅ Authentification JWT + bcrypt sécurisée
- ✅ 6 modules d'API: Auth, Users, Vehicles, Subscriptions, Reclamations, Stats
- ✅ Middleware de protection par rôles (ADMIN, MANAGER, AGENT, CLIENT)
- ✅ Service de base de données avec context managers
- ✅ Gestion d'erreurs complète
- ✅ CORS configuré pour le développement

### 💾 Base de Données MySQL (NOUVEAU) ✨
- ✅ Schéma complet avec 7 tables
- ✅ Relations et contraintes d'intégrité
- ✅ Données de test pré-insérées
- ✅ Index optimisés pour les requêtes
- ✅ Caractères UTF-8 pour le français

### 🖥️ Frontend Intégré ✨
- ✅ Service API complète (`src/services/api.ts`)
- ✅ Contexte d'authentification global
- ✅ Login connecté au backend
- ✅ Dashboard récupère les données réelles
- ✅ Support des 4 rôles utilisateur

### 🎯 Fonctionnalités Actives
- ✅ Enregistrement/login utilisateurs
- ✅ Gestion véhicules (entrée/sortie)
- ✅ Abonnements (Horaire/Mensuel/Annuel)
- ✅ Réclamations/plaintes
- ✅ Statistiques en temps réel
- ✅ Logs d'activité

---

## 🚀 Démarrage Rapide

### 1️⃣ Prérequis
- Python 3.8+
- Node.js + npm
- XAMPP avec MySQL

### 2️⃣ Configuration MySQL

**Ouvrez XAMPP et démarrez MySQL** OU exécutez:
```bash
mysql -u root < backend/database.sql
```

### 3️⃣ Démarrage Backend

**Windows:**
```bash
cd backend
start_backend.bat
```

**Linux/Mac:**
```bash
cd backend
./start_backend.sh
```

**Manuel:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### 4️⃣ Démarrage Frontend
```bash
npm install
npm run dev
```

Accédez à: **http://localhost:3000/login**

---

## 🔑 Identifiants de Test

| Email | Password | Rôle |
|-------|----------|------|
| admin@imw.com | imwemployes | ADMIN |
| manager@imw.com | imwemployes | MANAGER |
| agent1@imw.com | imwemployes | AGENT |
| jean@example.com | imwemployes | CLIENT |

---

## 📦 Fichiers Créés

### Backend
```
backend/
├── app/
│   ├── __init__.py              # App Flask factory
│   ├── config.py                # Configuration
│   ├── database.py              # MySQL manager
│   ├── models/models.py         # User, Vehicle, etc.
│   ├── routes/
│   │   ├── auth.py              # Login/Register
│   │   ├── users.py             # Gestion users
│   │   ├── vehicles.py          # Gestion véhicules
│   │   ├── subscriptions.py     # Abonnements
│   │   ├── reclamations.py      # Réclamations
│   │   └── stats.py             # Statistiques
│   └── utils/auth.py            # JWT + bcrypt
├── database.sql                 # Schéma MySQL
├── requirements.txt             # Dépendances Python
├── .env                         # Config
├── run.py                       # Entry point
├── start_backend.bat            # Windows launcher
└── start_backend.sh             # Linux/Mac launcher
```

### Frontend Modifié
```
src/
├── services/api.ts              # API client complète
├── contexts/AuthContext.tsx     # Auth global
├── pages/Login.tsx              # Connecté au backend
└── pages/Dashboard.tsx          # Affiche données réelles
```

---

## 💻 API Endpoints Disponibles

### Authentification
- `POST /api/auth/register` - Créer compte
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Info utilisateur

### Véhicules
- `GET /api/vehicles/` - Tous
- `GET /api/vehicles/active` - Actuellement garés
- `POST /api/vehicles/entry` - Enregistrer entrée
- `POST /api/vehicles/exit` - Enregistrer sortie

### Abonnements
- `GET /api/subscriptions/` - Tous
- `POST /api/subscriptions/create` - Créer

### Réclamations
- `GET /api/reclamations/` - Toutes
- `POST /api/reclamations/create` - Créer

### Statistiques  
- `GET /api/stats/today` - Stats du jour
- `GET /api/stats/overview` - Vue complète

---

## 📖 Documentation

Voir **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** pour guide détaillé

---

## 🔐 Sécurité

- JWT tokens signés
- Mots de passe avec bcrypt
- Middleware protection par rôle
- CORS configuré
- Validation entrées

---

## 🐛 Aide

```bash
# MySQL not working?
mysql -u root < backend/database.sql

# Python modules missing?
pip install -r requirements.txt

# Port 5000 occupied?
# Windows: lsof -i :5000
# Mac/Linux: ss -tulpn | grep 5000
```

---

## 📚 Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind, Framer Motion
- **Backend:** Python, Flask, MySQL, JWT, bcrypt
- **Database:** MySQL 8.0+

---

**Ready to go! 🚀**
