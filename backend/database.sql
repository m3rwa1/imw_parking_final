-- ============================================================
-- IMW Parking — Schéma de base de données nettoyé
-- Alignement sur la logique Backend (Mars 2026)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `imw-parking_database`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `imw-parking_database`;

-- 1. Table: users
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
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`),
    KEY `idx_role` (`role`),
    KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: vehicles
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
    KEY `idx_user` (`user_id`),
    CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: parking_entries
CREATE TABLE IF NOT EXISTS `parking_entries` (
    `id`            INT NOT NULL AUTO_INCREMENT,
    `license_plate` VARCHAR(20) NOT NULL,
    `vehicle_id`    INT DEFAULT NULL,
    `agent_id`      INT DEFAULT NULL,
    `entry_time`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expected_end_time` DATETIME NULL DEFAULT NULL,
    `exit_time`     TIMESTAMP NULL DEFAULT NULL,
    `spot_number`   VARCHAR(10) DEFAULT NULL,
    `vehicle_type`  ENUM('Voiture','Moto','Camion') NOT NULL DEFAULT 'Voiture',
    `status`        ENUM('IN','OUT') NOT NULL DEFAULT 'IN',
    `price`         DECIMAL(10,2) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_status` (`status`),
    KEY `idx_spot` (`spot_number`),
    CONSTRAINT `parking_entries_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL,
    CONSTRAINT `parking_entries_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: subscriptions
CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id`            INT NOT NULL AUTO_INCREMENT,
    `user_id`       INT NOT NULL,
    `vehicle_id`    INT DEFAULT NULL,
    `license_plate` VARCHAR(20) NOT NULL,
    `plan_type`     ENUM('HOURLY','DAILY','MONTHLY','ANNUAL') NOT NULL,
    `start_date`    DATE NOT NULL,
    `end_date`      DATE NOT NULL,
    `status`        ENUM('ACTIVE','EXPIRED','CANCELLED','PENDING') NOT NULL DEFAULT 'PENDING',
    `notes`         TEXT,
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_status` (`user_id`,`status`),
    CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: reservations
CREATE TABLE IF NOT EXISTS `reservations` (
    `id`                INT NOT NULL AUTO_INCREMENT,
    `user_id`           INT NOT NULL,
    `nom_proche`        VARCHAR(100) DEFAULT NULL,
    `license_plate`     VARCHAR(20) NOT NULL,
    `vehicle_type`      ENUM('Voiture','Moto','Camion') NOT NULL DEFAULT 'Voiture',
    `start_time`        DATETIME NOT NULL,
    `end_time`          DATETIME NOT NULL,
    `statut`            ENUM('PENDING','VALIDATED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PENDING',
    `montant`           DECIMAL(10,2) NOT NULL,
    `place_number`      VARCHAR(20) DEFAULT NULL,
    `created_by`        INT DEFAULT NULL,
    `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_status` (`statut`),
    KEY `idx_place` (`place_number`),
    CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: payments
CREATE TABLE IF NOT EXISTS `payments` (
    `id`                INT NOT NULL AUTO_INCREMENT,
    `parking_entry_id`  INT DEFAULT NULL,
    `subscription_id`   INT DEFAULT NULL,
    `reservation_id`    INT DEFAULT NULL,
    `amount`            DECIMAL(10,2) NOT NULL,
    `payment_method`    ENUM('CASH','CARD','ONLINE') NOT NULL DEFAULT 'CASH',
    `payment_status`    ENUM('PENDING','PAID','REFUNDED') NOT NULL DEFAULT 'PENDING',
    `reference`         VARCHAR(100) DEFAULT NULL,
    `paid_at`           TIMESTAMP NULL DEFAULT NULL,
    `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`parking_entry_id`) REFERENCES `parking_entries` (`id`) ON DELETE SET NULL,
    CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL,
    CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: pricing_plans
CREATE TABLE IF NOT EXISTS `pricing_plans` (
    `id`         INT NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(100) NOT NULL,
    `label`      VARCHAR(150) NOT NULL,
    `price`      DECIMAL(10,2) NOT NULL,
    `unit`       VARCHAR(100) NOT NULL,
    `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table: reclamations
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
    CONSTRAINT `reclamations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `reclamations_ibfk_2` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table: activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id`          INT NOT NULL AUTO_INCREMENT,
    `user_id`     INT DEFAULT NULL,
    `action`      VARCHAR(100) NOT NULL,
    `description` TEXT,
    `ip_address`  VARCHAR(45) DEFAULT NULL,
    `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Table: refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id`         INT NOT NULL AUTO_INCREMENT,
    `user_id`    INT NOT NULL,
    `token`      VARCHAR(500) NOT NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `revoked`    TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Données Initiales
-- ============================================================

-- Tarifs par défaut
INSERT INTO `pricing_plans` (`name`, `label`, `price`, `unit`) VALUES
('hourly',               'Tarif horaire',               5.00,  'par heure'),
('daily',                'Tarif journée (12h)',         20.00,  'par 12h'),
('night',                'Tarif nuit',                  15.00,  'par nuit'),
('weekend',              'Tarif week-end (72h)',        40.00,  'par 72h'),
('subscription_basic',   'Abonnement mensuel Basic',    150.00, 'par mois'),
('subscription_premium', 'Abonnement mensuel Premium',  220.00, 'par mois'),
('subscription_annual',  'Abonnement annuel',           800.00, 'par an');

-- Comptes employés (MDP: password)
-- Hash bcrypt généré par: .\venv\Scripts\python.exe reset_pwd.py
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Admin IMW',   'admin@imw.com',   '$2b$12$uuH0dj3jEwqhnAS76DDjx.z8R69MqYBleBOjvNd/ULI9MMgg2/sxc6', 'ADMIN'),
('Manager IMW', 'manager@imw.com', '$2b$12$uuH0dj3jEwqhnAS76DDjx.z8R69MqYBleBOjvNd/ULI9MMgg2/sxc6', 'MANAGER'),
('Agent IMW',   'agent@imw.com',   '$2b$12$uuH0dj3jEwqhnAS76DDjx.z8R69MqYBleBOjvNd/ULI9MMgg2/sxc6', 'AGENT');

-- 11. Event: auto_liberer_places
SET GLOBAL event_scheduler = ON;
DROP EVENT IF EXISTS `auto_liberer_places`;
CREATE EVENT `auto_liberer_places`
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    -- Libérer les places dont le temps est écoulé
    UPDATE `parking_entries` 
    SET `status` = 'OUT', `exit_time` = NOW() 
    WHERE `status` = 'IN' AND `expected_end_time` IS NOT NULL AND `expected_end_time` < NOW();

    -- Marquer les réservations comme expirées
    UPDATE `reservations` 
    SET `statut` = 'EXPIRED' 
    WHERE `statut` IN ('PENDING', 'VALIDATED') AND `end_time` < NOW();
END;
