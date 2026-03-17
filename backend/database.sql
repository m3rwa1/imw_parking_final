-- ============================================================
-- IMW Parking Management System - Database Schema (v2)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `IMW-PARKING_DATABASE`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `IMW-PARKING_DATABASE`;

-- ============================================================
-- TABLE: users
-- ✅ AMÉLIORÉ: +phone, +is_active (soft delete), +last_login
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(100) UNIQUE NOT NULL,
    password     VARCHAR(255) NOT NULL,
    role         ENUM('ADMIN', 'MANAGER', 'AGENT', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
    phone        VARCHAR(20) DEFAULT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    last_login   TIMESTAMP NULL DEFAULT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_email     (email),
    INDEX idx_role      (role),
    INDEX idx_active    (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: refresh_tokens
-- ✅ NOUVEAU: Support JWT Refresh Token
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    user_id      INT NOT NULL,
    token        VARCHAR(500) NOT NULL,
    expires_at   TIMESTAMP NOT NULL,
    revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token     (token(255)),
    INDEX idx_user      (user_id),
    INDEX idx_expires   (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: vehicles
-- ✅ AMÉLIORÉ: +brand, +color, +is_active (soft delete)
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type  ENUM('Voiture', 'Moto', 'Camion') NOT NULL DEFAULT 'Voiture',
    brand         VARCHAR(50) DEFAULT NULL,
    color         VARCHAR(30) DEFAULT NULL,
    user_id       INT DEFAULT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_plate     (license_plate),
    INDEX idx_user      (user_id),
    INDEX idx_active    (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: parking_spaces
-- ✅ NOUVEAU: Gestion physique des places de parking
-- ============================================================
CREATE TABLE IF NOT EXISTS parking_spaces (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    spot_number  VARCHAR(10) UNIQUE NOT NULL,
    space_type   ENUM('Voiture', 'Moto', 'Camion') NOT NULL DEFAULT 'Voiture',
    floor        INT NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_reserved  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_available (is_available),
    INDEX idx_type      (space_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: parking_entries
-- ✅ AMÉLIORÉ: +vehicle_id (FK), +agent_id, +duration_minutes
--              calcul automatique du prix
-- ============================================================
CREATE TABLE IF NOT EXISTS parking_entries (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    license_plate    VARCHAR(20) NOT NULL,
    vehicle_id       INT DEFAULT NULL,
    agent_id         INT DEFAULT NULL,
    entry_time       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_time        TIMESTAMP NULL DEFAULT NULL,
    spot_number      VARCHAR(10) DEFAULT NULL,
    vehicle_type     ENUM('Voiture', 'Moto', 'Camion') NOT NULL DEFAULT 'Voiture',
    status           ENUM('IN', 'OUT') NOT NULL DEFAULT 'IN',
    duration_minutes INT DEFAULT NULL,
    price            DECIMAL(10, 2) DEFAULT NULL CHECK (price >= 0),
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (agent_id)   REFERENCES users(id)    ON DELETE SET NULL,
    INDEX idx_plate         (license_plate),
    INDEX idx_status        (status),
    INDEX idx_entry_time    (entry_time),
    INDEX idx_exit_time     (exit_time),
    INDEX idx_spot          (spot_number),
    INDEX idx_status_entry  (status, entry_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: pricing_plans
-- ✅ Version alignée avec backend/frontend :
--    id, name, label, price, unit, is_active, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_plans (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,      -- clé technique (hourly, daily, ...)
    label      VARCHAR(150) NOT NULL,      -- libellé affiché dans l’UI
    price      DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    unit       VARCHAR(100) NOT NULL,      -- ex: 'par heure', 'par nuit'
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name   (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: subscriptions
-- ✅ AMÉLIORÉ: +price_paid, +notes, index composites
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    user_id       INT NOT NULL,
    vehicle_id    INT DEFAULT NULL,
    license_plate VARCHAR(20) NOT NULL,
    plan_type     ENUM('HOURLY', 'DAILY', 'MONTHLY', 'ANNUAL') NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    price_paid    DECIMAL(10, 2) DEFAULT NULL CHECK (price_paid >= 0),
    status        ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    notes         TEXT DEFAULT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_user        (user_id),
    INDEX idx_status      (status),
    INDEX idx_plate       (license_plate),
    INDEX idx_user_status (user_id, status),
    INDEX idx_end_date    (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: payments
-- ✅ NOUVEAU: Suivi des paiements (entrée parking + abonnements)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    parking_entry_id  INT DEFAULT NULL,
    subscription_id   INT DEFAULT NULL,
    amount            DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method    ENUM('CASH', 'CARD', 'ONLINE') NOT NULL DEFAULT 'CASH',
    payment_status    ENUM('PENDING', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    reference         VARCHAR(100) DEFAULT NULL COMMENT 'Référence externe ou reçu',
    paid_at           TIMESTAMP NULL DEFAULT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parking_entry_id) REFERENCES parking_entries(id) ON DELETE SET NULL,
    FOREIGN KEY (subscription_id)  REFERENCES subscriptions(id)   ON DELETE SET NULL,
    INDEX idx_entry   (parking_entry_id),
    INDEX idx_sub     (subscription_id),
    INDEX idx_status  (payment_status),
    INDEX idx_paid_at (paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: reclamations
-- ✅ AMÉLIORÉ: +resolved_by, +resolved_at
-- ============================================================
CREATE TABLE IF NOT EXISTS reclamations (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    user_id      INT NOT NULL,
    subject      VARCHAR(200) NOT NULL,
    description  TEXT NOT NULL,
    status       ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    resolved_by  INT DEFAULT NULL,
    resolved_at  TIMESTAMP NULL DEFAULT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user    (user_id),
    INDEX idx_status  (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: activity_logs
-- ✅ AMÉLIORÉ: +ip_address, +user_agent
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT DEFAULT NULL,
    action      VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    ip_address  VARCHAR(45) DEFAULT NULL,
    user_agent  VARCHAR(500) DEFAULT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user    (user_id),
    INDEX idx_action  (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Tarifs par défaut (cohérents avec le frontend)
INSERT INTO pricing_plans (name, label, price, unit) VALUES
('hourly',               'Tarif horaire',                5.00,  'par heure'),
('daily',                'Tarif journée (12h)',         20.00,  'par 12h'),
('night',                'Tarif nuit',                  15.00,  'par nuit'),
('weekend',              'Tarif week-end (72h)',        40.00,  'par 72h'),
('subscription_basic',   'Abonnement mensuel Basic',   150.00,  'par mois'),
('subscription_premium', 'Abonnement mensuel Premium', 220.00,  'par mois'),
('subscription_annual',  'Abonnement annuel',          800.00,  'par an');

-- Places de parking (RDC: A, 1er: B, 2ème: C)
INSERT INTO parking_spaces (spot_number, space_type, floor) VALUES
('A01', 'Voiture', 0), ('A02', 'Voiture', 0), ('A03', 'Voiture', 0),
('A04', 'Voiture', 0), ('A05', 'Voiture', 0), ('A06', 'Moto', 0),
('A07', 'Moto', 0),    ('A08', 'Camion', 0),
('B01', 'Voiture', 1), ('B02', 'Voiture', 1), ('B03', 'Voiture', 1),
('B04', 'Voiture', 1), ('B05', 'Voiture', 1),
('C01', 'Voiture', 2), ('C02', 'Voiture', 2), ('C03', 'Voiture', 2);

-- Utilisateurs par défaut (password = 'Admin1234!')
INSERT INTO users (name, email, password, role) VALUES
('Admin IMW',   'admin@imw.com',    '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'ADMIN'),
('Manager IMW', 'manager@imw.com',  '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'MANAGER'),
('Agent 1',     'agent1@imw.com',   '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'AGENT'),
('Jean Dupont', 'jean@example.com', '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'CLIENT'),
('Marie Curie', 'marie@example.com','$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'CLIENT');

-- Véhicules de test
INSERT INTO vehicles (license_plate, vehicle_type, brand, color, user_id) VALUES
('AB-123-CD', 'Voiture', 'Renault', 'Gris',  4),
('EF-456-GH', 'Moto',    'Honda',   'Rouge', 4),
('IJ-789-KL', 'Voiture', 'Peugeot', 'Blanc', 5);

-- Entrées de test
INSERT INTO parking_entries (license_plate, vehicle_id, spot_number, vehicle_type, status) VALUES
('AB-123-CD', 1, 'A01', 'Voiture', 'IN'),
('IJ-789-KL', 3, 'A02', 'Voiture', 'IN');

-- Abonnements de test
INSERT INTO subscriptions (user_id, vehicle_id, license_plate, plan_type, start_date, end_date, price_paid, status) VALUES
(4, 1, 'AB-123-CD', 'MONTHLY', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 150.00, 'ACTIVE'),
(5, 3, 'IJ-789-KL', 'ANNUAL',  CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR),  800.00, 'ACTIVE');

-- Réclamations de test
INSERT INTO reclamations (user_id, subject, description, status) VALUES
(4, 'Problème de facturation', 'J\'ai été facturé deux fois pour la même entrée.', 'OPEN'),
(5, 'Place indisponible',      'La place réservée A03 était déjà occupée à mon arrivée.', 'IN_PROGRESS');
