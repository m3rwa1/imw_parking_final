USE `imw-parking_database`;

ALTER TABLE `reservations`
  ADD COLUMN `place_number` VARCHAR(20) DEFAULT NULL AFTER `montant`,
  ADD COLUMN `created_by` INT DEFAULT NULL AFTER `place_number`,
  ADD KEY `idx_place_number` (`place_number`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD CONSTRAINT `reservations_ibfk_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
