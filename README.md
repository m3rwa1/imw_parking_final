# IMW Parking

Application de gestion de parking :

- **Frontend** : React + Vite  
- **Backend** : Flask (API REST)  
- **Base** : MySQL  

Le depot est prevu pour **Windows, Linux et macOS**. Deux facons de travailler :

1. **Docker (recommande en equipe)** — memes versions pour tout le monde, voir [Travail en equipe avec Docker et GitHub](#travail-en-equipe-avec-docker-et-github).  
2. **Sans Docker** — Node, Python et MySQL installes localement, voir [Installation locale](#installation-locale-sans-docker).

---

## Installer Docker depuis zero (Windows)

Suivre cet ordre **avant** de lancer le projet avec Docker.

### 1. Preparer Windows

- Windows 10 64 bits (build 19041 minimum) ou **Windows 11**.
- Dans le BIOS / UEFI : activer la **virtualisation** (Intel VT-x / AMD-V) si ce n’est pas déjà fait (nécessaire pour les conteneurs).

### 2. Installer WSL 2 (recommandé pour Docker Desktop)

Ouvrir **PowerShell en administrateur** et exécuter :

```powershell
wsl --install
```

Redémarrer le PC si Windows le demande. Au premier lancement d’une distribution Linux (ex. Ubuntu), créer un utilisateur si on vous le demande.

Si WSL est déjà installé, mettre WSL 2 par défaut :

```powershell
wsl --set-default-version 2
```

### 3. Installer Docker Desktop

1. Télécharger **Docker Desktop for Windows** : [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Lancer l’installateur, laisser l’option **« Use WSL 2 based engine »** cochée si elle est proposée.
3. Redémarrer si l’installateur le demande.
4. Ouvrir **Docker Desktop** et attendre que l’icône indique que Docker est **« running »** (en cours d’exécution).

### 4. Verifier l’installation

Ouvrir **PowerShell** ou **cmd** (pas besoin d’admin) :

```powershell
docker --version
docker compose version
```

Vous devez voir des numéros de version sans erreur « commande introuvable ».

### 5. Ensuite : projet IMW Parking

Reprendre la section **[Travail en equipe avec Docker et GitHub](#travail-en-equipe-avec-docker-et-github)** : cloner le depot, puis `npm run docker:dev`.

### Si Docker ne demarre pas

- Ouvrir Docker Desktop → **Settings** → **Troubleshoot** : parfois un **Restart** ou une mise a jour suffit.
- Verifier que la virtualisation est bien active (Gestionnaire des taches → Performance → CPU → « Virtualisation : Active »).
- Sur certaines machines, il faut desactiver temporairement **Hyper-V** en conflit — la doc Docker Desktop indique les cas limite.

### Vous ne voulez pas installer Docker

Utilisez uniquement **[Installation locale (sans Docker)](#installation-locale-sans-docker)** : Node.js, Python, MySQL (ou XAMPP) sur votre PC.

---

## Installer Docker (Linux — developpeur)

Sur Ubuntu / Debian (adaptable a Fedora, Arch, etc.), suivre par exemple la [documentation officielle Docker Engine](https://docs.docker.com/engine/install/).

Resume typique (Ubuntu) :

```bash
sudo apt update
sudo apt install -y ca-certificates curl
# Puis ajouter le depot Docker selon la doc, puis :
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

**Deconnecter / reconnecter** la session (ou redemarrer) pour que le groupe `docker` soit pris en compte — sinon il faudra `sudo docker compose ...`.

Verifier :

```bash
docker --version
docker compose version
```

Ensuite : meme workflow que ci-dessous (**Travail en equipe avec Docker et GitHub**).

**Option confort (Linux natif)** : dans `docker.env`, tu peux mettre `CHOKIDAR_USEPOLLING=false` pour moins charger le CPU (le suivi des fichiers fonctionne souvent bien sans polling sur Linux).

---

## Travail en equipe avec Docker et GitHub

### Etapes pour chaque developpeur (apres Docker installe)

1. **Verifier Docker** : `docker compose version` (voir section precedente si ce n’est pas encore fait).
2. **Cloner le depot** :
   ```bash
   git clone <URL_DU_REPO_GITHUB>
   cd imw-parking-final
   ```
3. **Variables locales (optionnel)** : pour personnaliser mot de passe MySQL / JWT / Gemini :
   ```bash
   cp docker.env.example docker.env
   ```
   Puis editer `docker.env`. Ne **jamais** committer `docker.env` (deja ignore par Git).
4. **Lancer la stack de developpement** :
   ```bash
   npm run docker:dev
   ```
   Sans fichier `docker.env` : les valeurs par defaut du `docker-compose.yml` suffisent pour demarrer.
5. Ouvrir **http://localhost:3000** (app) et verifier **http://localhost:5000/api/health** (API).

### Modifier le code et pousser sur GitHub

1. Creer une branche :
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```
2. Modifier les fichiers **sur votre machine** (les dossiers sont montes dans Docker — les changements sont visibles apres sauvegarde, avec rechargement Flask / Vite).
3. Verifier que tout fonctionne localement (`npm run docker:dev`).
4. Commiter et pousser :
   ```bash
   git add .
   git status
   git commit -m "Description claire des changements"
   git push -u origin feature/ma-fonctionnalite
   ```
5. Sur GitHub : ouvrir une **Pull Request** vers la branche principale (`main` ou `master`, selon le projet). Faire relire / merger selon les regles de l'equipe.

### Regles importantes pour l'equipe

| A faire | A eviter |
|--------|----------|
| Versionner `docker-compose.yml`, `Dockerfile`, `docker.env.example`, `README.md` | Committer `docker.env`, `.env`, `backend/.env` (secrets / machine locale) |
| S'appuyer sur `backend/database.sql` pour le schema commun | Laisser des noms de base MySQL differents sans raison (utiliser `imw-parking_database`) |
| Si conflit sur le port **3306** (XAMPP, autre MySQL) : mettre `MYSQL_PUBLISH_PORT=3307` dans `docker.env` | Push direct sur `main` sans PR si l'equipe exige une revue |

### Commandes Docker utiles

| Commande | Role |
|----------|------|
| `npm run docker:dev` | Demarre db + api + web avec rebuild si besoin |
| `npm run docker:dev:detach` | Pareil en arriere-plan |
| `npm run docker:down` | Arrete les conteneurs |
| `docker compose --env-file docker.env up --build` | Lance avec ton fichier `docker.env` |
| `docker compose down -v` | Arrete **et** supprime le volume MySQL (base repart a zero au prochain `up`) |

---

## Installation locale (sans Docker)

### Prerequis

- Node.js 20+
- Python 3.11+
- MySQL 8+ (ou MariaDB compatible)

### 1) Cloner et fichiers d'environnement

```bash
git clone <URL_DU_REPO_GITHUB>
cd imw-parking-final
cp .env.example .env
cp backend/.env.example backend/.env
```

Adapter `backend/.env` (MySQL, JWT). Importer `backend/database.sql` dans MySQL.

### 2) Frontend (racine)

```bash
npm install
```

### 3) Backend

```bash
cd backend
python -m venv venv
```

Activation du venv :

- **Windows (PowerShell)** : `.\venv\Scripts\Activate.ps1`
- **Windows (cmd)** : `.\venv\Scripts\activate.bat`
- **Linux/macOS** : `source venv/bin/activate`

```bash
pip install -r requirements.txt
python run.py
```

API : **http://localhost:5000**

### 4) Frontend

A la racine :

```bash
npm run dev
```

App : **http://localhost:3000**

---

## Verification rapide

1. **http://localhost:3000**
2. Login / parcours habituel
3. **GET** `http://localhost:5000/api/health` → `{"status":"ok",...}`

---

## Depannage : `did not find executable at '/usr/bin...'` (Windows)

Le dossier `backend/venv` a ete cree avec **WSL / Linux**, pas avec le Python **Windows**. Le fichier `venv/pyvenv.cfg` contient alors des chemins du type `/usr/bin/python`.

**Correction :**

1. Fermer les terminaux WSL qui utilisent ce projet, desactiver le venv (`deactivate`).
2. Supprimer le dossier `backend/venv` depuis l’Explorateur Windows, ou en PowerShell apres fermeture de Cursor/WSL sur ce dossier.
3. Rouvrir **PowerShell** (Windows), aller dans `backend`, puis recreer le venv **avec le Python Windows** :
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python run.py
   ```

Ne melange pas : **un venv par environnement** — Linux (`source venv/bin/activate`) ou Windows (`.\venv\Scripts\Activate.ps1`). Le dossier `venv/` est ignore par Git (voir `.gitignore`).

---

## Depannage (500 au login, hors Docker)

1. MySQL demarre, port 3306 accessible.
2. `MYSQL_DATABASE=imw-parking_database` dans `backend/.env` (aligne avec `database.sql`).
3. Relancer le backend, regarder les logs.
4. `cd backend && python test_db.py` si le script existe.

---

## Scripts npm (racine)

- `npm run docker:dev` — stack Docker developpement
- `npm run docker:dev:detach` / `npm run docker:down`
- `npm run dev` — frontend seul (sans Docker)
- `npm run build` — build production frontend
- `npm run clean` — supprime `dist`
- `npm run lint` — verification TypeScript
