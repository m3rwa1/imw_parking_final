-- ============================================================
-- IMW Parking — schéma aligné sur la base XAMPP / phpMyAdmin
-- Nom typique : `imw-parking_database` (Windows/XAMPP)
-- Export de référence : mars 2026
-- ============================================================
-- Tables présentes : users, refresh_tokens, vehicles, parking_entries,
--   pricing_plans, subscriptions, payments, reclamations, activity_logs
-- Non inclus dans cette base : parking_spaces, users.phone,
--   vehicles.brand/color, parking_entries.duration_minutes
-- (voir backend/migrations/ pour extensions optionnelles)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `imw-parking_database`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `imw-parking_database`;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id`           INT NOT NULL AUTO_INCREMENT,
    `name`         VARCHAR(100) NOT NULL,
    `email`        VARCHAR(100) NOT NULL,
    `password`     VARCHAR(255) NOT NULL,
    `role`         ENUM('ADMIN','MANAGER','AGENT','CLIENT') NOT NULL DEFAULT 'CLIENT',
    `is_active`    TINYINT(1) NOT NULL DEFAULT 1,
    `last_login`   TIMESTAMP NULL DEFAULT NULL,
    `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`   TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`),
    KEY `idx_email` (`email`),
    KEY `idx_role` (`role`),
    KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: refresh_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id`         INT NOT NULL AUTO_INCREMENT,
    `user_id`    INT NOT NULL,
    `token`      VARCHAR(500) NOT NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `revoked`    TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_token` (`token`(255)),
    KEY `idx_user` (`user_id`),
    KEY `idx_expires` (`expires_at`),
    CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: vehicles
-- ============================================================
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id`            INT NOT NULL AUTO_INCREMENT,
    `license_plate` VARCHAR(20) NOT NULL,
    `vehicle_type`  ENUM('Voiture','Moto','Camion') NOT NULL DEFAULT 'Voiture',
    `user_id`       INT DEFAULT NULL,
    `is_active`     TINYINT(1) NOT NULL DEFAULT 1,
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `license_plate` (`license_plate`),
    KEY `idx_plate` (`license_plate`),
    KEY `idx_user` (`user_id`),
    KEY `idx_active` (`is_active`),
    CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: parking_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS `parking_entries` (
    `id`            INT NOT NULL AUTO_INCREMENT,
    `license_plate` VARCHAR(20) NOT NULL,
    `vehicle_id`    INT DEFAULT NULL,
    `agent_id`      INT DEFAULT NULL,
    `entry_time`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `exit_time`     TIMESTAMP NULL DEFAULT NULL,
    `spot_number`   VARCHAR(10) DEFAULT NULL,
    `vehicle_type`  ENUM('Voiture','Moto','Camion') NOT NULL DEFAULT 'Voiture',
    `status`        ENUM('IN','OUT') NOT NULL DEFAULT 'IN',
    `price`         DECIMAL(10,2) DEFAULT NULL,
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_plate` (`license_plate`),
    KEY `idx_status` (`status`),
    KEY `idx_entry_time` (`entry_time`),
    KEY `idx_exit_time` (`exit_time`),
    KEY `idx_spot` (`spot_number`),
    KEY `idx_status_entry` (`status`,`entry_time`),
    KEY `vehicle_id` (`vehicle_id`),
    KEY `agent_id` (`agent_id`),
    CONSTRAINT `parking_entries_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL,
    CONSTRAINT `parking_entries_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: pricing_plans  (API /api/pricing/)
-- ============================================================
CREATE TABLE IF NOT EXISTS `pricing_plans` (
    `id`         INT NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(100) NOT NULL,
    `label`      VARCHAR(150) NOT NULL,
    `price`      DECIMAL(10,2) NOT NULL,
    `unit`       VARCHAR(100) NOT NULL,
    `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_name` (`name`),
    KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id`            INT NOT NULL AUTO_INCREMENT,
    `user_id`       INT NOT NULL,
    `vehicle_id`    INT DEFAULT NULL,
    `license_plate` VARCHAR(20) NOT NULL,
    `plan_type`     ENUM('HOURLY','DAILY','MONTHLY','ANNUAL') NOT NULL,
    `start_date`    DATE NOT NULL,
    `end_date`      DATE NOT NULL,
    `price_paid`    DECIMAL(10,2) DEFAULT NULL,
    `status`        ENUM('ACTIVE','EXPIRED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `notes`         TEXT,
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_plate` (`license_plate`),
    KEY `idx_user_status` (`user_id`,`status`),
    KEY `idx_end_date` (`end_date`),
    KEY `vehicle_id` (`vehicle_id`),
    CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS `payments` (
    `id`                INT NOT NULL AUTO_INCREMENT,
    `parking_entry_id`  INT DEFAULT NULL,
    `subscription_id`   INT DEFAULT NULL,
    `amount`            DECIMAL(10,2) NOT NULL,
    `payment_method`    ENUM('CASH','CARD','ONLINE') NOT NULL DEFAULT 'CASH',
    `payment_status`    ENUM('PENDING','PAID','REFUNDED') NOT NULL DEFAULT 'PENDING',
    `reference`         VARCHAR(100) DEFAULT NULL COMMENT 'Référence externe ou reçu',
    `paid_at`           TIMESTAMP NULL DEFAULT NULL,
    `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_entry` (`parking_entry_id`),
    KEY `idx_sub` (`subscription_id`),
    KEY `idx_status` (`payment_status`),
    KEY `idx_paid_at` (`paid_at`),
    CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`parking_entry_id`) REFERENCES `parking_entries` (`id`) ON DELETE SET NULL,
    CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: reclamations
-- ============================================================
CREATE TABLE IF NOT EXISTS `reclamations` (
    `id`           INT NOT NULL AUTO_INCREMENT,
    `user_id`      INT NOT NULL,
    `subject`      VARCHAR(200) NOT NULL,
    `description`  TEXT NOT NULL,
    `status`       ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
    `resolved_by`  INT DEFAULT NULL,
    `resolved_at`  TIMESTAMP NULL DEFAULT NULL,
    `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_created` (`created_at`),
    KEY `resolved_by` (`resolved_by`),
    CONSTRAINT `reclamations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `reclamations_ibfk_2` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: activity_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id`          INT NOT NULL AUTO_INCREMENT,
    `user_id`     INT DEFAULT NULL,
    `action`      VARCHAR(100) NOT NULL,
    `description` TEXT,
    `ip_address`  VARCHAR(45) DEFAULT NULL,
    `user_agent`  VARCHAR(500) DEFAULT NULL,
    `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_action` (`action`),
    KEY `idx_created` (`created_at`),
    CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DONNÉES INITIALES (démo)
-- ============================================================

INSERT INTO `pricing_plans` (`name`, `label`, `price`, `unit`) VALUES
('hourly',               'Tarif horaire',                5.00,  'par heure'),
('daily',                'Tarif journée (12h)',         20.00,  'par 12h'),
('night',                'Tarif nuit',                  15.00,  'par nuit'),
('weekend',              'Tarif week-end (72h)',        40.00,  'par 72h'),
('subscription_basic',   'Abonnement mensuel Basic',   150.00,  'par mois'),
('subscription_premium', 'Abonnement mensuel Premium', 220.00,  'par mois'),
('subscription_annual',  'Abonnement annuel',          800.00,  'par an');

-- Mot de passe hashé = 'Admin1234!' (bcrypt)
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Admin IMW',   'admin@imw.com',    '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'ADMIN'),
('Manager IMW', 'manager@imw.com',  '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'MANAGER'),
('Agent 1',     'agent1@imw.com',   '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'AGENT'),
('Jean Dupont', 'jean@example.com', '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'CLIENT'),
('Marie Curie', 'marie@example.com','$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'CLIENT');

INSERT INTO `vehicles` (`license_plate`, `vehicle_type`, `user_id`) VALUES
('AB-123-CD', 'Voiture', 4),
('EF-456-GH', 'Moto',    4),
('IJ-789-KL', 'Voiture', 5);

INSERT INTO `parking_entries` (`license_plate`, `vehicle_id`, `spot_number`, `vehicle_type`, `status`) VALUES
('AB-123-CD', 1, 'A01', 'Voiture', 'IN'),
('IJ-789-KL', 3, 'A02', 'Voiture', 'IN');

INSERT INTO `subscriptions` (`user_id`, `vehicle_id`, `license_plate`, `plan_type`, `start_date`, `end_date`, `price_paid`, `status`) VALUES
(4, 1, 'AB-123-CD', 'MONTHLY', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 150.00, 'ACTIVE'),
(5, 3, 'IJ-789-KL', 'ANNUAL',  CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR),  800.00, 'ACTIVE');

INSERT INTO `reclamations` (`user_id`, `subject`, `description`, `status`) VALUES
(4, 'Problème de facturation', 'J''ai été facturé deux fois pour la même entrée.', 'OPEN'),
(5, 'Place indisponible',      'La place réservée A03 était déjà occupée à mon arrivée.', 'IN_PROGRESS');
