-- Migration: Create permission_dependencies table
-- Task: 1.3
-- Description: Define prerequisite permission relationships

CREATE TABLE IF NOT EXISTS `permission_dependencies` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `permission_id` INT NOT NULL,
  `required_permission_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`required_permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_dependency` (`permission_id`, `required_permission_id`),
  INDEX `idx_permission` (`permission_id`),
  INDEX `idx_required` (`required_permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
