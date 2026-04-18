-- Run this on your MySQL server to add missing columns
-- These columns are required for the multilingual chat system

ALTER TABLE customer_support_conversations 
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS inquiry_type VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS resolution TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS highlighted VARCHAR(100) DEFAULT NULL;

-- Verify columns were added
DESCRIBE customer_support_conversations;
