-- Migration: Create warehouse_access_levels table
-- Task: 1.2
-- Description: Manage warehouse-specific access levels for roles

CREATE TABLE IF NOT EXISTS `warehouse_access_levels` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `role_id` INT NOT NULL,
  `warehouse_code` VARCHAR(20) NOT NULL,
  `access_level` ENUM('none', 'view_only', 'limited', 'standard', 'full_access') DEFAULT 'none',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_role_warehouse` (`role_id`, `warehouse_code`),
  INDEX `idx_warehouse` (`warehouse_code`),
  INDEX `idx_access_level` (`access_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
