-- Setup API Keys Database Tables
-- Run this script to create the necessary tables for API key management

USE inventory_db;

-- Create api_keys table
CREATE TABLE IF NOT EXISTS `api_keys` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `name` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `api_key` varchar(255) NOT NULL UNIQUE,
    `rate_limit_per_hour` int(11) DEFAULT 1000,
    `usage_count` int(11) DEFAULT 0,
    `last_used_at` timestamp NULL DEFAULT NULL,
    `is_active` boolean DEFAULT TRUE,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_user_name` (`user_id`, `name`),
    KEY `idx_api_key` (`api_key`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_is_active` (`is_active`),
    CONSTRAINT `fk_api_keys_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create api_usage_logs table for detailed usage tracking (optional)
CREATE TABLE IF NOT EXISTS `api_usage_logs` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `api_key_id` int(11) NOT NULL,
    `endpoint` varchar(255) NOT NULL,
    `method` varchar(10) NOT NULL,
    `ip_address` varchar(45) DEFAULT NULL,
    `user_agent` text DEFAULT NULL,
    `response_status` int(11) DEFAULT NULL,
    `response_time_ms` int(11) DEFAULT NULL,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_api_key_id` (`api_key_id`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_endpoint` (`endpoint`),
    CONSTRAINT `fk_api_usage_logs_api_key_id` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_api_keys_user_active` ON `api_keys` (`user_id`, `is_active`);
CREATE INDEX IF NOT EXISTS `idx_api_keys_last_used` ON `api_keys` (`last_used_at`);

-- Show table structure to confirm creation
DESCRIBE `api_keys`;
DESCRIBE `api_usage_logs`;

SELECT 'API Keys tables created successfully!' as status;