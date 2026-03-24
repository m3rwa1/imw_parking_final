-- =============================================================================
-- Base : imw-parking_database (XAMPP / phpMyAdmin — export mars 2026)
-- Schéma de référence : backend/database.sql (sans phone, sans brand/color).
-- Ce script ajoute des colonnes OPTIONNELLES si tu veux les utiliser côté API / UI.
-- Déjà OK sur une base alignée : parking_entries.price, pricing_plans (label/price/unit),
-- subscriptions (price_paid, notes), reclamations (resolved_at, updated_at),
-- users (last_login, updated_at, deleted_at), vehicles.updated_at.
-- =============================================================================

USE `imw-parking_database`;

-- Modèles User (phone) et Vehicle (brand, color) — utilisés dans app/models/models.py
ALTER TABLE `users`
  ADD COLUMN `phone` VARCHAR(20) DEFAULT NULL AFTER `role`;

ALTER TABLE `vehicles`
  ADD COLUMN `brand` VARCHAR(50) DEFAULT NULL AFTER `vehicle_type`,
  ADD COLUMN `color` VARCHAR(30) DEFAULT NULL AFTER `brand`;

-- -------------------------------------------------------------------------
-- OPTIONNEL : refresh_tokens.expires_at
-- Sur ton dump, expires_at a "ON UPDATE CURRENT_TIMESTAMP" ce qui peut
-- décaler la date d’expiration à chaque mise à jour de ligne.
-- Décommente seulement si tu constates des problèmes de session / refresh :
-- ALTER TABLE `refresh_tokens`
--   MODIFY `expires_at` TIMESTAMP NOT NULL;
