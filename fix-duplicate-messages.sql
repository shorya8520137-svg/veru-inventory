-- ============================================================
-- FIX: Delete duplicate messages — keep only the latest row
-- Run: mysql -h127.0.0.1 -uinventory_user -p'StrongPass@123' inventory_db < fix-duplicate-messages.sql
-- ============================================================

-- Preview duplicates before deleting
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

-- Delete older duplicate rows — keep only MAX(id) per group
DELETE FROM customer_support_messages
WHERE id NOT IN (
    SELECT max_id FROM (
        SELECT MAX(id) AS max_id
        FROM customer_support_messages
        GROUP BY conversation_id, sender_type, message
    ) AS t
);

SELECT ROW_COUNT() AS rows_deleted;
SELECT '=== DONE: Duplicates removed ===' AS info;
