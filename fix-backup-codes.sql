-- FIX 2FA BACKUP CODES IN DATABASE
-- Run this on your server to fix the JSON parsing issue

-- First, let's see what we have
SELECT 
    id, 
    name, 
    email,
    two_factor_enabled,
    two_factor_backup_codes
FROM users 
WHERE two_factor_backup_codes IS NOT NULL 
AND two_factor_backup_codes != '';

-- Fix the backup codes format for user ID 1 (the one that had the issue)
-- Convert comma-separated string to proper JSON array
UPDATE users 
SET two_factor_backup_codes = '["CA1EAEE4","F1228D17","D619399F","2FC39886","D37E6C7A","A9B78C38","3D2575E6","B8862F4D","8D9C2BFD","6E383380"]'
WHERE id = 1 
AND two_factor_backup_codes = 'CA1EAEE4,F1228D17,D619399F,2FC39886,D37E6C7A,A9B78C38,3D2575E6,B8862F4D,8D9C2BFD,6E383380';

-- Verify the fix
SELECT 
    id, 
    name,
    two_factor_enabled,
    two_factor_backup_codes,
    JSON_VALID(two_factor_backup_codes) as is_valid_json
FROM users 
WHERE two_factor_backup_codes IS NOT NULL 
AND two_factor_backup_codes != '';

-- Alternative: If you want to clear all 2FA data and start fresh
-- UPDATE users SET 
--     two_factor_enabled = 0,
--     two_factor_secret = NULL,
--     two_factor_backup_codes = NULL,
--     two_factor_setup_at = NULL
-- WHERE id = 1;