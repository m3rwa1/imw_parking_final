# Base de données IMW Parking — schéma réel (XAMPP)

Ce document décrit **la structure telle qu’elle existe dans la base phpMyAdmin** (export type mars 2026, nom courant **`imw-parking_database`**).  
Le fichier **`backend/database.sql`** est la référence : même tables et colonnes (création + données de démo).

L’API Flask (`backend/app`) est alignée sur ce schéma pour les requêtes courantes.

## Fichier de référence

| Fichier | Rôle |
|--------|------|
| **`backend/docs/MCD.md`** | **MCD (Merise)** : entités, associations, cardinalités, diagramme Mermaid |
| **`backend/database.sql`** | `CREATE DATABASE`, toutes les tables, index, clés étrangères, jeux de données de test |
| **`backend/migrations/001_align_existing_database.sql`** | Ancienne base très minimaliste : ajoute des colonnes manquantes (adapter / commenter les lignes si déjà présentes) |
| **`backend/migrations/002_xampp_imw_parking_only_missing.sql`** | **Optionnel** : ajoute `users.phone`, `vehicles.brand`, `vehicles.color` si tu veux ces champs en plus du schéma de base |

Sous Windows/XAMPP, le nom de la base est souvent en minuscules : `imw-parking_database`. Adapte le `USE` dans les scripts si besoin.

**Connexion Flask** : dans `.env` ou les variables d’environnement, mets par ex.  
`MYSQL_DATABASE=imw-parking_database` (doit correspondre au nom exact dans phpMyAdmin).

## Tables présentes dans la base

| Table | Rôle |
|-------|------|
| **`users`** | Comptes, rôles (`ADMIN`, `MANAGER`, `AGENT`, `CLIENT`), `is_active`, soft delete (`deleted_at`) |
| **`refresh_tokens`** | Jetons de rafraîchissement JWT (`token`, `expires_at`, `revoked`) |
| **`vehicles`** | Plaque, type (`Voiture` / `Moto` / `Camion`), lien `user_id` |
| **`parking_entries`** | Sessions : entrée/sortie, place (`spot_number`), type, statut `IN`/`OUT`, `price` |
| **`pricing_plans`** | Tarifs : `name`, `label`, `price`, `unit`, `is_active` — routes `/api/pricing/` |
| **`subscriptions`** | Abonnements (`plan_type`, dates, `price_paid`, `status`) |
| **`payments`** | Paiements liés à une entrée et/ou un abonnement |
| **`reclamations`** | Réclamations et résolution (`resolved_by`, `resolved_at`) |
| **`activity_logs`** | Journal des actions (`ip_address`, `user_agent`) — `/api/logs/` |

## Colonnes par table (résumé)

### `users`
`id`, `name`, `email`, `password`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`, `deleted_at`  
→ Pas de colonne **`phone`** dans le schéma de référence (migration **002** si tu l’ajoutes).

### `vehicles`
`id`, `license_plate`, `vehicle_type`, `user_id`, `is_active`, `created_at`, `updated_at`  
→ Pas de **`brand`** / **`color`** dans le schéma de référence (migration **002** si besoin).

### `parking_entries`
`id`, `license_plate`, `vehicle_id`, `agent_id`, `entry_time`, `exit_time`, `spot_number`, `vehicle_type`, `status`, `price`, `created_at`  
→ Pas de **`duration_minutes`** stockée (la durée peut être calculée en application à partir des horodatages).

### `pricing_plans`
`id`, `name`, `label`, `price`, `unit`, `is_active`, `created_at`, `updated_at`

### `subscriptions`, `payments`, `reclamations`, `activity_logs`, `refresh_tokens`
Voir les `CREATE TABLE` dans **`database.sql`**.

## Ce qui n’est pas dans la base XAMPP de référence

- **`parking_spaces`** : table d’inventaire de places. Elle **n’est pas** dans `database.sql`. Les routes **`/api/vehicles/*`** fonctionnent avec `parking_entries` et une place saisie (`spot_number`). En revanche, le blueprint **`/api/spaces/*`** et le service `ParkingService` (places libres / occupation) attendent cette table : ne les utiliser qu’après avoir créé `parking_spaces` en base (ou désactiver ces routes).
- **`refresh_tokens.expires_at`** : si ton export MySQL avait `ON UPDATE CURRENT_TIMESTAMP` sur cette colonne, cela peut modifier la date à chaque update de ligne. En cas de souci de session, voir le commentaire dans **`002_xampp_imw_parking_only_missing.sql`**.

## API (aperçu)

- `GET/PUT /api/pricing/` — tarifs  
- `GET /api/payments/*` — paiements  
- `GET /api/vehicles/*`, `POST /api/vehicles/entry`, `POST /api/vehicles/exit` — entrées / sorties  
- `GET /api/logs/` — logs (selon rôles)  
- Autres blueprints : voir `backend/app/__init__.py`
