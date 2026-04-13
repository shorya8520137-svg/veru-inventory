-- Add is_read column to ticket_followups table for unread message tracking
ALTER TABLE ticket_followups 
ADD COLUMN is_read TINYINT(1) DEFAULT 0 AFTER created_by;

-- Add index for better query performance
CREATE INDEX idx_ticket_followups_unread ON ticket_followups(ticket_id, is_read, created_by);

-- Mark all existing messages as read
UPDATE ticket_followups SET is_read = 1;
