-- Clear all damage and recovery data from database
-- This will remove all entries from damage_recovery_log table

-- Show current count before deletion
SELECT 'BEFORE DELETION:' as '';
SELECT COUNT(*) as total_damage_recovery_entries FROM damage_recovery_log;

-- Delete all damage/recovery entries
DELETE FROM damage_recovery_log;

-- Show count after deletion
SELECT '' as '';
SELECT 'AFTER DELETION:' as '';
SELECT COUNT(*) as total_damage_recovery_entries FROM damage_recovery_log;

-- Also remove related timeline entries
SELECT '' as '';
SELECT 'CLEANING TIMELINE ENTRIES:' as '';
DELETE FROM inventory_ledger_base WHERE movement_type IN ('DAMAGE', 'RECOVER');

-- Show final status
SELECT '' as '';
SELECT 'CLEANUP COMPLETE!' as '';
SELECT 
    (SELECT COUNT(*) FROM damage_recovery_log) as damage_recovery_entries,
    (SELECT COUNT(*) FROM inventory_ledger_base WHERE movement_type IN ('DAMAGE', 'RECOVER')) as timeline_entries;
