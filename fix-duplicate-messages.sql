-- ============================================================
-- FIX: Delete duplicate messages — keep only the latest row
-- Run: mysql -h127.0.0.1 -uinventory_user -p'StrongPass@123' inventory_db < fix-duplicate-messages.sql
-- ============================================================

-- 1. Preview duplicates before deleting
SELECT '=== DUPLICATES TO BE REMOVED ===' AS info;
SELECT id, conversation_id, sender_type, LEFT(message,60) AS message, created_at
FROM customer_support_messages
WHERE id NOT IN (
    SELECT max_id FROM (
        SELECT MAX(id) AS max_id
        FROM customer_support_messages
        GROUP BY conversation_id, sender_type, message
    ) AS t
)
ORDER BY conversation_id, created_at;

-- 2. Delete older duplicate rows — keep only MAX(id) per group
DELETE FROM customer_support_messages
WHERE id NOT IN (
    SELECT max_id FROM (
        SELECT MAX(id) AS max_id
        FROM customer_support_messages
        GROUP BY conversation_id, sender_type, message
    ) AS t
);

SELECT ROW_COUNT() AS duplicate_rows_deleted;

-- 3. Remove ONLY language_select type rows (old bug — these were stored before fix)
--    NOTE: We do NOT delete messages containing "Tamil" text — those are real user messages
--    We only delete rows where sender_type = 'language_select' (old buggy inserts)
SELECT '=== LANGUAGE_SELECT ROWS (old bug) ===' AS info;
SELECT id, conversation_id, sender_type, message, created_at
FROM customer_support_messages
WHERE sender_type = 'language_select';

DELETE FROM customer_support_messages
WHERE sender_type = 'language_select';

SELECT ROW_COUNT() AS language_select_rows_deleted;

SELECT '=== DONE ===' AS info;
