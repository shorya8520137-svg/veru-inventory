-- Migration: Create permission_conflicts table
-- Task: 1.4
-- Description: Define conflicting permission pairs

CREATE TABLE IF NOT EXISTS `permission_conflicts` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `permission_id` INT NOT NULL,
  `conflicting_permission_id` INT NOT NULL,
  `conflict_reason` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`conflicting_permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_conflict` (`permission_id`, `conflicting_permission_id`),
  INDEX `idx_permission` (`permission_id`),
  INDEX `idx_conflicting` (`conflicting_permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
