-- =============================================================================
-- Migration 003: Create RESERVATIONS table for handling client parking reservations
-- =============================================================================

USE `imw-parking_database`;

-- Create reservations table if it doesn't exist
CREATE TABLE IF NOT EXISTS `reservations` (
    `id`                INT NOT NULL AUTO_INCREMENT,
    `user_id`           INT NOT NULL,
    `nom_proche`        VARCHAR(100) DEFAULT NULL COMMENT 'Name of the person making reservation',
    `license_plate`     VARCHAR(20) NOT NULL,
    `vehicle_type`      ENUM('Voiture','Moto','Camion') NOT NULL DEFAULT 'Voiture',
    `date_reservation`  DATE NOT NULL,
    `montant`           DECIMAL(10,2) NOT NULL,
    `statut`            ENUM('PENDING','VALIDATED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_status` (`statut`),
    KEY `idx_plate` (`license_plate`),
    KEY `idx_date` (`date_reservation`),
    KEY `idx_created` (`created_at`),
    CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add parking_entry_id column to payments table to link reservations to parking entries
ALTER TABLE `payments` 
ADD COLUMN `parking_entry_id` INT DEFAULT NULL AFTER `subscription_id`,
ADD KEY `idx_parking_entry` (`parking_entry_id`),
ADD CONSTRAINT `payments_ibfk_parking_entry` FOREIGN KEY (`parking_entry_id`) REFERENCES `parking_entries` (`id`) ON DELETE SET NULL;
