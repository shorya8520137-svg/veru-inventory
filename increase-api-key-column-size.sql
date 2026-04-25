-- Increase api_key column size to support JWT tokens
-- JWT tokens are typically 300-500 characters long
-- API keys are 64-128 characters

ALTER TABLE api_keys 
MODIFY COLUMN api_key VARCHAR(1000) NOT NULL;

-- Verify the change
DESCRIBE api_keys;
