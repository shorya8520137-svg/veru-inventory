-- ============================================================
-- CHAT DB ANALYSIS SCRIPT
-- Run on server: mysql -h127.0.0.1 -uinventory_user -p'StrongPass@123' inventory_db < analyze-chat-db.sql
-- ============================================================

-- 1. Table structure
SELECT '=== TABLE: customer_support_conversations ===' AS info;
DESCRIBE customer_support_conversations;

SELECT '=== TABLE: customer_support_messages ===' AS info;
DESCRIBE customer_support_messages;

-- 2. Total counts
SELECT '=== COUNTS ===' AS info;
SELECT
    (SELECT COUNT(*) FROM customer_support_conversations) AS total_conversations,
    (SELECT COUNT(*) FROM customer_support_messages)      AS total_messages;

-- 3. Messages per sender_type
SELECT '=== MESSAGES BY SENDER TYPE ===' AS info;
SELECT sender_type, sender_name, COUNT(*) AS count
FROM customer_support_messages
GROUP BY sender_type, sender_name
ORDER BY count DESC;

-- 4. Conversations with preferred_language
SELECT '=== CONVERSATIONS WITH LANGUAGE ===' AS info;
SELECT conversation_id, customer_name, preferred_language, status, created_at
FROM customer_support_conversations
ORDER BY created_at DESC
LIMIT 20;

-- 5. DUPLICATE CHECK — same conversation_id + same created_at (double inserts)
SELECT '=== DUPLICATE MESSAGE CHECK ===' AS info;
SELECT conversation_id, sender_type, message, COUNT(*) AS duplicates
FROM customer_support_messages
GROUP BY conversation_id, sender_type, message
HAVING COUNT(*) > 1
ORDER BY duplicates DESC
LIMIT 20;

-- 6. Recent messages with all fields — to see message vs message_original
SELECT '=== RECENT MESSAGES (last 30) ===' AS info;
SELECT
    id,
    conversation_id,
    sender_type,
    sender_name,
    LEFT(message, 60)            AS message,
    LEFT(message_original, 60)   AS message_original,
    LEFT(message_translated, 60) AS message_translated,
    created_at
FROM customer_support_messages
ORDER BY created_at DESC
LIMIT 30;

-- 7. Customer messages where message != message_original (translation stored)
SELECT '=== CUSTOMER MSGS: message vs message_original ===' AS info;
SELECT
    id,
    conversation_id,
    LEFT(message, 60)          AS message_english,
    LEFT(message_original, 60) AS message_original_local,
    created_at
FROM customer_support_messages
WHERE sender_type = 'customer'
  AND message != message_original
ORDER BY created_at DESC
LIMIT 20;

-- 8. Check for language_select type messages stored (should be 0)
SELECT '=== LANGUAGE_SELECT MESSAGES IN DB (should be 0) ===' AS info;
SELECT COUNT(*) AS language_select_rows_in_db
FROM customer_support_messages
WHERE sender_type = 'language_select';

-- 9. Bot responses table
SELECT '=== BOT RESPONSES ===' AS info;
SELECT id, keyword, LEFT(response, 80) AS response, is_active, usage_count
FROM customer_support_bot_responses
ORDER BY usage_count DESC;
