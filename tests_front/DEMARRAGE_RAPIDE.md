# 🚗 IMW Parking - Démarrage Rapide (5 minutes)

## ✅ Prérequis

- **XAMPP** installé avec MySQL démarré
- **Node.js** installé
- **Python 3.8+** installé

## 🚀 Démarrage Ultra-Rapide

### Sur Windows:
```
Double-cliquez sur:  START_ALL.bat
```

### Sur macOS/Linux:
```bash
chmod +x START_ALL.sh
./START_ALL.sh
```

**C'est tout!** Les deux serveurs démarrent.

---

## 📋 Vérification

Une fois démarrés, ouvrez votre navigateur:

### Frontend (React App):
```
http://localhost:3000
```

### Backend API:
```
http://localhost:5000/api/health
```

Vous devez voir: `{"status": "ok"}`

---

## 👤 Identifiants de Test

Utilisateurs de test disponibles:

| Email | Rôle | Mot de passe |
|-------|------|-------------|
| admin@imw.com | ADMIN | password |
| manager@imw.com | MANAGER | password |
| agent1@imw.com | AGENT | password |
| jean@example.com | CLIENT | password |

---

## 📝 Étapes Détaillées (si besoin)

### 1️⃣ Démarrer XAMPP
- Ouvrez XAMPP Control Panel
- Cliquez sur "Start" pour MySQL

### 2️⃣ Démarrer le Backend
```bash
cd backend
python run.py
```
Vous verrez: `Running on http://0.0.0.0:5000`

### 3️⃣ Démarrer le Frontend (nouveau terminal)
```bash
npm run dev
```
Vous verrez: `➜  Local:   http://localhost:3000/`

### 4️⃣ Ouvrir l'Application
Visitez: `http://localhost:3000`

---

## ⚠️ Problèmes Courants

### ❌ "Port 5000 déjà utilisé"
```bash
# Windows:
taskkill /F /IM python.exe

# macOS/Linux:
kill $(lsof -t -i:5000)
```

### ❌ "MySQL Connection refused"
- Vérifiez que XAMPP MySQL est démarré
- Vérifiez que vous êtes sur localhost

### ❌ "npm: command not found"
- Installez Node.js depuis nodejs.org

### ❌ Les données ne se chargent pas
- Vérifiez que le backend est en cours d'exécution
- Ouvrez F12 (Console) dans le navigateur pour voir les erreurs

---

## 📚 Guides Détaillés

- **BACKEND_SETUP.md** - Installation complète et dépannage
- **STRUCTURE.md** - Architecture et endpoints API
- **README.md** - Vue d'ensemble du projet

---

## 🛑 Arrêt

Pour arrêter:
- Fermez les 2 fenêtres terminales
- Arrêtez MySQL depuis XAMPP
