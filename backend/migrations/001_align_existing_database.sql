-- =============================================================================
-- Migration : aligner une base MySQL/MariaDB existante sur backend/database.sql
-- Exécuter dans phpMyAdmin sur la base du projet (ex. imw-parking_database).
-- Si une erreur "Duplicate column" apparaît, commentez la ligne correspondante.
-- =============================================================================

USE `imw-parking_database`;

-- ----------------------------------------------------------------------------- users
ALTER TABLE users
  ADD COLUMN phone       VARCHAR(20)  DEFAULT NULL AFTER role,
  ADD COLUMN last_login  TIMESTAMP    NULL DEFAULT NULL AFTER is_active,
  ADD COLUMN updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN deleted_at  TIMESTAMP    NULL DEFAULT NULL AFTER updated_at;

-- ----------------------------------------------------------------------------- vehicles
ALTER TABLE vehicles
  ADD COLUMN brand      VARCHAR(50)  DEFAULT NULL AFTER vehicle_type,
  ADD COLUMN color      VARCHAR(30)  DEFAULT NULL AFTER brand,
  ADD COLUMN updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- ----------------------------------------------------------------------------- parking_entries
ALTER TABLE parking_entries
  ADD COLUMN price DECIMAL(10,2) DEFAULT NULL AFTER status;

-- (optionnel) durée en minutes — utilisée par certains services
-- ALTER TABLE parking_entries ADD COLUMN duration_minutes INT DEFAULT NULL AFTER status;

-- ----------------------------------------------------------------------------- subscriptions
ALTER TABLE subscriptions
  ADD COLUMN price_paid DECIMAL(10,2) DEFAULT NULL AFTER end_date,
  ADD COLUMN notes      TEXT          DEFAULT NULL AFTER status,
  ADD COLUMN updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- ----------------------------------------------------------------------------- reclamations
ALTER TABLE reclamations
  ADD COLUMN resolved_at TIMESTAMP NULL DEFAULT NULL AFTER resolved_by,
  ADD COLUMN updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- ----------------------------------------------------------------------------- pricing_plans (ancien schéma → nouveau)
-- Si ta table utilise encore vehicle_type / price_per_hour, décommente et adapte :
/*
DROP TABLE IF EXISTS pricing_plans;
CREATE TABLE pricing_plans (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    label      VARCHAR(150) NOT NULL,
    price      DECIMAL(10, 2) NOT NULL,
    unit       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name   (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO pricing_plans (name, label, price, unit) VALUES
('hourly',               'Tarif horaire',                5.00,  'par heure'),
('daily',                'Tarif journée (12h)',         20.00,  'par 12h'),
('night',                'Tarif nuit',                  15.00,  'par nuit'),
('weekend',              'Tarif week-end (72h)',        40.00,  'par 72h'),
('subscription_basic',   'Abonnement mensuel Basic',   150.00,  'par mois'),
('subscription_premium', 'Abonnement mensuel Premium', 220.00,  'par mois'),
('subscription_annual',  'Abonnement annuel',          800.00,  'par an');
*/
