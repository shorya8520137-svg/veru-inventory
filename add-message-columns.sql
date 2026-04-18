-- Add message_original and message_translated columns
ALTER TABLE customer_support_messages
  ADD COLUMN message_original TEXT DEFAULT NULL AFTER message,
  ADD COLUMN message_translated TEXT DEFAULT NULL AFTER message_original;

-- Verify
DESCRIBE customer_support_messages;
