-- Check if store_timeline table exists
SHOW TABLES LIKE 'store_timeline';

-- If exists, check structure
DESCRIBE store_timeline;

-- Check if there's any data
SELECT COUNT(*) as total_entries FROM store_timeline;

-- Show sample data if exists
SELECT * FROM store_timeline ORDER BY created_at DESC LIMIT 10;
