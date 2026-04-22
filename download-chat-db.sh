#!/bin/bash
# ============================================================
# DOWNLOAD CHAT DB DATA FROM SERVER TO LOCAL
# Usage: bash download-chat-db.sh <server_ip> <ssh_key_path>
# Example: bash download-chat-db.sh 13.215.172.213 ~/.ssh/your-key.pem
# ============================================================

SERVER_IP="${1:-13.215.172.213}"
SSH_KEY="${2:-~/.ssh/id_rsa}"
SSH_USER="ubuntu"
DB_USER="inventory_user"
DB_PASS="StrongPass@123"
DB_NAME="inventory_db"
LOCAL_DIR="./db-export"

mkdir -p "$LOCAL_DIR"

echo "🔗 Connecting to $SSH_USER@$SERVER_IP ..."

# Step 1: Run analysis SQL on server and save output
echo "📊 Running analysis query on server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "mysql -h127.0.0.1 -u$DB_USER -p'$DB_PASS' $DB_NAME" \
    < analyze-chat-db.sql \
    > "$LOCAL_DIR/analysis-result.txt" 2>&1

echo "✅ Analysis saved to $LOCAL_DIR/analysis-result.txt"

# Step 2: Export customer_support_messages as CSV
echo "📥 Exporting customer_support_messages..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "mysql -h127.0.0.1 -u$DB_USER -p'$DB_PASS' $DB_NAME -e \"
SELECT id, conversation_id, sender_type, sender_name,
       message, message_original, message_translated,
       is_read, created_at
FROM customer_support_messages
ORDER BY created_at DESC
LIMIT 200\" 2>/dev/null | sed 's/\t/,/g'" \
    > "$LOCAL_DIR/messages.csv"

echo "✅ Messages saved to $LOCAL_DIR/messages.csv"

# Step 3: Export customer_support_conversations as CSV
echo "📥 Exporting customer_support_conversations..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "mysql -h127.0.0.1 -u$DB_USER -p'$DB_NAME' $DB_NAME -e \"
SELECT conversation_id, customer_name, customer_email,
       preferred_language, status, created_at, updated_at
FROM customer_support_conversations
ORDER BY created_at DESC
LIMIT 50\" 2>/dev/null | sed 's/\t/,/g'" \
    > "$LOCAL_DIR/conversations.csv"

echo "✅ Conversations saved to $LOCAL_DIR/conversations.csv"

# Step 4: Full mysqldump of chat tables only
echo "📦 Dumping chat tables (full SQL dump)..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "mysqldump -h127.0.0.1 -u$DB_USER -p'$DB_PASS' $DB_NAME \
     customer_support_conversations \
     customer_support_messages \
     customer_support_bot_responses \
     2>/dev/null" \
    > "$LOCAL_DIR/chat-tables-dump.sql"

echo "✅ Full dump saved to $LOCAL_DIR/chat-tables-dump.sql"

echo ""
echo "============================================"
echo "✅ All done! Files in: $LOCAL_DIR/"
ls -lh "$LOCAL_DIR/"
echo "============================================"
