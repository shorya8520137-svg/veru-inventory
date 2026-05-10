CREATE TABLE IF NOT EXISTS api_usage_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    api_key_id INT(11) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(16) NOT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent TEXT NULL,
    status_code INT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_api_usage_key_created (api_key_id, created_at),
    KEY idx_api_usage_endpoint (endpoint(191)),
    KEY idx_api_usage_created (created_at),
    CONSTRAINT fk_api_usage_logs_api_key
        FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
        ON DELETE CASCADE
);
