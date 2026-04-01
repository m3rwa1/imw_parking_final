# 🚀 IMW Parking — Guide d'upgrade v2

## 📦 Ce qui a été ajouté

| Amélioration | Fichier(s) concerné(s) |
|---|---|
| ✅ Refresh Token (JWT 2 tokens) | `utils/auth.py`, `routes/auth.py` |
| ✅ Rate Limiting (anti brute-force) | `app/__init__.py`, `routes/auth.py` |
| ✅ Validation Marshmallow | `utils/schemas.py`, toutes les routes |
| ✅ Service métier séparé | `services/parking_service.py` |
| ✅ Calcul automatique du prix | `services/parking_service.py` |
| ✅ Gestion places physiques | `routes/spaces.py`, table `parking_spaces` |
| ✅ Table paiements | `routes/payments.py`, table `payments` |
| ✅ Tarification configurable | table `pricing_plans` |
| ✅ Soft delete users/vehicles | `models/models.py`, colonnes `is_active` |
| ✅ Pagination | Toutes les routes GET |
| ✅ Expiration abonnements auto | `services/subscription_service.py` + scheduler |
| ✅ Export CSV des rapports | `routes/stats.py` → `GET /api/stats/export/csv` |
| ✅ Logging rotatif fichier | `app/__init__.py` → dossier `logs/` |
| ✅ Champs enrichis (phone, brand, color…) | BD + modèles |
| ✅ Index composites BD | `database.sql` |

---

## 1️⃣ Installer les nouvelles dépendances Python

```bash
cd backend
# Activer le venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Installer tout
pip install -r requirements.txt
```

### Nouvelles librairies installées :

| Package | Usage |
|---|---|
| `marshmallow` | Validation et désérialisation des données JSON |
| `Flask-Limiter` | Rate limiting (protection brute-force sur le login) |
| `reportlab` | Export PDF des rapports (optionnel) |
| `APScheduler` | Expiration automatique des abonnements chaque nuit |

---

## 2️⃣ Migrer la base de données

> ⚠️ **Deux options selon votre situation :**

### Option A — Base de données vierge (recommandé)

```bash
# Supprimer l'ancienne BD et recréer
mysql -u root -e "DROP DATABASE IF EXISTS \`IMW-PARKING_DATABASE\`;"
mysql -u root < backend/database.sql
```

### Option B — Migration sans perdre les données existantes

```sql
-- Exécuter dans phpMyAdmin ou mysql CLI

USE `IMW-PARKING_DATABASE`;

-- 1. users : ajout colonnes
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone      VARCHAR(20)  DEFAULT NULL  AFTER role,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN      NOT NULL DEFAULT TRUE AFTER phone,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP    NULL DEFAULT NULL AFTER is_active,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP    NULL DEFAULT NULL AFTER updated_at;

-- 2. vehicles : ajout colonnes
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS brand     VARCHAR(50)  DEFAULT NULL AFTER vehicle_type,
  ADD COLUMN IF NOT EXISTS color     VARCHAR(30)  DEFAULT NULL AFTER brand,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN      NOT NULL DEFAULT TRUE AFTER color;

-- 3. parking_entries : ajout colonnes
ALTER TABLE parking_entries
  ADD COLUMN IF NOT EXISTS vehicle_id       INT DEFAULT NULL AFTER license_plate,
  ADD COLUMN IF NOT EXISTS agent_id         INT DEFAULT NULL AFTER vehicle_id,
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT NULL AFTER exit_time;

-- 4. subscriptions : ajout colonnes
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS price_paid DECIMAL(10,2) DEFAULT NULL AFTER end_date,
  ADD COLUMN IF NOT EXISTS notes      TEXT          DEFAULT NULL AFTER price_paid;

-- 5. reclamations : ajout colonnes
ALTER TABLE reclamations
  ADD COLUMN IF NOT EXISTS resolved_by INT  DEFAULT NULL AFTER status,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP NULL DEFAULT NULL AFTER resolved_by;

-- 6. Nouvelles tables
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token(255)), INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS parking_spaces (
  id INT PRIMARY KEY AUTO_INCREMENT,
  spot_number VARCHAR(10) UNIQUE NOT NULL,
  space_type ENUM('Voiture','Moto','Camion') NOT NULL DEFAULT 'Voiture',
  floor INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_reserved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pricing_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  vehicle_type ENUM('Voiture','Moto','Camion') NOT NULL DEFAULT 'Voiture',
  price_per_hour DECIMAL(10,2) NOT NULL,
  daily_max DECIMAL(10,2) DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parking_entry_id INT DEFAULT NULL,
  subscription_id  INT DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('CASH','CARD','ONLINE') NOT NULL DEFAULT 'CASH',
  payment_status ENUM('PENDING','PAID','REFUNDED') NOT NULL DEFAULT 'PENDING',
  reference VARCHAR(100) DEFAULT NULL,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parking_entry_id) REFERENCES parking_entries(id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id)  REFERENCES subscriptions(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Données initiales nouvelles tables
INSERT IGNORE INTO pricing_plans (name, vehicle_type, price_per_hour, daily_max) VALUES
('Voiture Standard', 'Voiture', 5.00,  50.00),
('Moto Standard',    'Moto',    2.50,  25.00),
('Camion Standard',  'Camion', 10.00, 100.00);

INSERT IGNORE INTO parking_spaces (spot_number, space_type, floor) VALUES
('A01','Voiture',0),('A02','Voiture',0),('A03','Voiture',0),
('A04','Voiture',0),('A05','Voiture',0),('A06','Moto',0),
('A07','Moto',0),('A08','Camion',0),
('B01','Voiture',1),('B02','Voiture',1),('B03','Voiture',1);
```

---

## 3️⃣ Nouveaux endpoints disponibles

```
POST  /api/auth/refresh          → Nouveau access token via refresh token
POST  /api/auth/logout           → Révoque le refresh token

GET   /api/vehicles/capacity     → Places dispo par type
GET   /api/spaces/               → Toutes les places
GET   /api/spaces/available      → Places libres (?type=Voiture)
POST  /api/spaces/create         → Créer une place [ADMIN]
PUT   /api/spaces/<spot>         → Modifier une place [ADMIN/MANAGER]

GET   /api/payments/             → Tous les paiements [ADMIN/MANAGER]
POST  /api/payments/create       → Créer un paiement manuel
GET   /api/payments/summary      → Résumé financier

GET   /api/stats/export/csv      → Export CSV du mois [ADMIN/MANAGER]
POST  /api/subscriptions/expire  → Force expiration [ADMIN]
```

---

## 4️⃣ Changements importants pour le frontend

### Token : access + refresh
```typescript
// Avant
localStorage.setItem('token', data.token)

// Après
localStorage.setItem('access_token',  data.access_token)
localStorage.setItem('refresh_token', data.refresh_token)

// Headers API
headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
```

### Intercepteur de refresh automatique (api.ts)
```typescript
// Si 401 → tenter un refresh automatique
if (response.status === 401) {
  const refresh = localStorage.getItem('refresh_token')
  const r = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refresh })
  })
  if (r.ok) {
    const { access_token } = await r.json()
    localStorage.setItem('access_token', access_token)
    // Rejouer la requête originale
  } else {
    // Déconnecter l'utilisateur
  }
}
```

### Sortie véhicule — plus besoin d'envoyer le prix
```typescript
// Avant
await api.vehicleExit({ license_plate, price: 25.00 })

// Après — le prix est calculé automatiquement
await api.vehicleExit({ license_plate, payment_method: 'CASH' })
// La réponse contient: { price, duration_minutes, payment_id }
```

---

## ✅ Vérification post-installation

```bash
# Santé de l'API
curl http://localhost:5000/api/health

# Login + récupération tokens
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@imw.com","password":"password"}'

# Capacité du parking
curl http://localhost:5000/api/vehicles/capacity \
  -H "Authorization: Bearer <access_token>"

# Vérifier les logs
cat backend/logs/imw_parking.log
```
