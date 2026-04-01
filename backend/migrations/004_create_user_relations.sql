-- Migration 004: add user_relations table to model "proches" (relationships)
USE `imw-parking_database`;

CREATE TABLE IF NOT EXISTS `user_relations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT 'Owner / client fidèle',
  `proche_user_id` INT NOT NULL COMMENT 'User considered proche/related to the owner',
  `relation_type` VARCHAR(50) DEFAULT 'proche',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_proche` (`proche_user_id`),
  CONSTRAINT `user_relations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_relations_ibfk_2` FOREIGN KEY (`proche_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
