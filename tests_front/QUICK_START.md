# 🚀 GUIDE DE DÉMARRAGE RAPIDE - IMW Parking

> **Tout est prêt!** Suivez ces étapes simples pour lancer votre système de gestion de parking.

---

## ⚡ 5 Minutes pour Démarrer

### Étape 1: Préparer la Base de Données ⏱️ 1 min

**Option A - Avec XAMPP (Facile) ✓**
1. Ouvrez **XAMPP Control Panel**
2. Cliquez **Start** à côté de **MySQL**
3. Ouvrez http://localhost/phpmyadmin
4. Créez base de données: `imw_parking`
5. Importez le fichier: `backend/database.sql`

**Option B - Par Terminal**
```bash
mysql -u root < backend/database.sql
```

### Étape 2: Démarrer le Backend ⏱️ 2 min

**Windows (Plus facile):**
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
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Linux/Mac
pip install -r requirements.txt
python run.py
```

✓ Vous devriez voir: `Running on http://0.0.0.0:5000`

### Étape 3: Démarrer le Frontend ⏱️ 2 min

```bash
npm install
npm run dev
```

✓ Accédez à: **http://localhost:3000**

---

## 🔐 Se Connecter

Aller à: **http://localhost:3000/login**

Choisissez un utilisateur pour tester:

### Admin Dashboard
```
Email: admin@imw.com
Password: password
```

### Manager Dashboard
```
Email: manager@imw.com
Password: password
```

### Agent Dashboard
```
Email: agent1@imw.com
Password: password
```

### Client
```
Email: jean@example.com
Password: password
```

---

## 📊 Dashboard par Rôle

### 👮 En tant qu'ADMIN
- Voir toutes les réclamations
- Gérer les utilisateurs
- Voir statistiques complètes
- Accès logs système

### 📈 En tant que MANAGER
- Statistiques détaillées
- Gestion abonnements
- Rapports financiers

### 🚗 En tant qu'AGENT
- Enregistrer entrée véhicule
- Enregistrer sortie véhicule
- Voir véhicules actifs
- Scanner tickets

### 👤 En tant que CLIENT
- Voir ses abonnements
- Historique stationnements
- Créer réclamations

---

## 🔄 Flux d'Utilisation Typique

### Pour un AGENT:

1. Se connecter avec `agent1@imw.com`
2. Cliquer sur "AJOUTER VÉHICULE"
3. Entrer:
   - Plaque: `AB-123-CD`
   - Place: `A-12`
   - Type: `Voiture`
4. Cliquer "Ajouter"
5. Le véhicule apparaît dans la liste

### Pour un CLIENT:

1. Créer compte: Cliquer "Créer un compte"
2. Remplir: Nom, Email, Password
3. Souscrire à un abonnement
4. Consulter son dashboard

### Pour un MANAGER:

1. Se connecter
2. Aller à "Statistiques"
3. Voir:
   - Véhicules du jour
   - Revenus du jour
   - Revenus du mois

---

## 🔧 Configuration (Optionnel)

### Modifier le port du Backend

Fichier: `backend/.env`
```env
API_PORT=5000  # Changez le port ici
```

### Modifier la base de données

Fichier: `backend/.env`
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=  # Votre mot de passe MySQL
MYSQL_DATABASE=imw_parking
```

### Clé Secrète (Important pour Production!)

Fichier: `backend/.env`
```env
JWT_SECRET_KEY=your_secret_key_change_in_production_12345678
```

---

## ✅ Checklist de Vérification

- [ ] MySQL démarré (XAMPP)
- [ ] Base de données `imw_parking` créée
- [ ] Backend Python en cours d'exécution (`http://localhost:5000`)
- [ ] Frontend React en cours d'exécution (`http://localhost:3000`)
- [ ] Peut accéder à la page de login
- [ ] Peut se connecter avec les identifiants
- [ ] Dashboard affiche les données

---

## 🆘 Dépannage Rapide

### ❌ "Cannot connect to MySQL"
```bash
# Vérifiez que MySQL est en cours d'exécution
# Windows: Utilisez XAMPP
# Mac/Linux: brew services start mysql
```

### ❌ "Module not found (Python)"
```bash
# Réinstallez les dépendances
cd backend
pip install -r requirements.txt
```

### ❌ "Port 5000 already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### ❌ "Cannot find XAMPP"
- Téléchargez: https://www.apachefriends.org/
- Installez et démarrez MySQL

### ❌ Frontend ne se connecte pas au backend
- Vérifiez que le backend tourne sur http://localhost:5000
- Vérifiez le fichier `src/services/api.ts` - URL correcte?
- Ouvrez console du navigateur (F12) pour voir les erreurs

---

## 📁 Fichiers Importants

| Fichier | Purpose |
|---------|---------|
| `backend/database.sql` | Schéma MySQL complet |
| `backend/.env` | Configuration backend |
| `backend/run.py` | Lancer le serveur Flask |
| `src/services/api.ts` | Appels API au backend |
| `src/pages/Login.tsx` | Page de connexion |
| `src/pages/Dashboard.tsx` | Tableau de bord |

---

## 💡 Conseils Utiles

1. **Toujours activer le venv Python avant de travailler:**
   ```bash
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate      # Windows
   ```

2. **Vérifier les logs:**
   - Backend: Console du terminal Flask
   - Frontend: Console du navigateur (F12)

3. **Réinitialiser la base de données:**
   ```bash
   mysql -u root
   DROP DATABASE imw_parking;
   # Puis exécutez database.sql
   ```

4. **Tester l'API directement:**
   ```bash
   curl -X GET http://localhost:5000/api/health
   ```

---

## 🎯 Prochaines Étapes

Après avoir tout démarré:

1. **Testez les fonctionnalités** avec différents rôles
2. **Créez des données** (véhicules, réclamations)
3. **Explorez le code** dans `src/` et `backend/app/`
4. **Lisez les commentaires** dans les fichiers
5. **Modifiez** selon vos besoins

---

## 📞 Besoin d'Aide?

1. Consultez **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** pour détails techniques
2. Consultez **[README.md](./README.md)** pour vue d'ensemble
3. Vérifiez les logs (Terminal + Console du navigateur)
4. Google les erreurs avec "+ Flask" ou "+ Python"

---

## 🎉 C'est Tout!

Votre système de gestion de parking est **entièrement configuré et prêt à fonctionner**!

Amusez-vous et n'hésitez pas à explorer le code 🚀

---

**Made with ❤️ for IMW Parking**
