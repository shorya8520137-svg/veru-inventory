-- Customer Support Chat System Database Tables
-- This creates tables for customer queries and support responses

USE inventory_db;

-- Table for customer support conversations
CREATE TABLE IF NOT EXISTS customer_support_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    subject VARCHAR(255),
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_customer_email (customer_email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for individual messages in conversations
CREATE TABLE IF NOT EXISTS customer_support_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL,
    sender_type ENUM('customer', 'support', 'bot') NOT NULL,
    sender_id INT,
    sender_name VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_type (sender_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (conversation_id) REFERENCES customer_support_conversations(conversation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for bot auto-responses and FAQs
CREATE TABLE IF NOT EXISTS customer_support_bot_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    response TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_keyword (keyword),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default bot responses
INSERT INTO customer_support_bot_responses (keyword, response, category) VALUES
('hello', 'Hello! Welcome to our support. How can I help you today?', 'greeting'),
('hi', 'Hi there! How can I assist you today?', 'greeting'),
('order status', 'To check your order status, please provide your order number (e.g., ORD-2026-001) and I''ll look it up for you.', 'orders'),
('track order', 'I can help you track your order. Please share your order number or tracking number.', 'orders'),
('return', 'Our return policy allows returns within 30 days of delivery. Would you like to initiate a return? Please provide your order number.', 'returns'),
('refund', 'Refunds are processed within 5-7 business days after we receive the returned item. Do you have a specific order you''d like to inquire about?', 'refunds'),
('payment', 'We accept Credit/Debit Cards, UPI, Net Banking, and Cash on Delivery. How can I help you with payment?', 'payment'),
('delivery', 'Standard delivery takes 3-5 business days. Express delivery is available for 1-2 days. What would you like to know?', 'delivery'),
('cancel order', 'You can cancel your order before it''s shipped. Please provide your order number and I''ll help you cancel it.', 'orders'),
('contact', 'You can reach us at support@example.com or call us at +91-1800-123-4567. Our support hours are 9 AM - 6 PM IST.', 'contact'),
('thank', 'You''re welcome! Is there anything else I can help you with?', 'closing'),
('thanks', 'Happy to help! Feel free to reach out if you need anything else.', 'closing');

-- Table for customer support ratings
CREATE TABLE IF NOT EXISTS customer_support_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_rating (rating),
    FOREIGN KEY (conversation_id) REFERENCES customer_support_conversations(conversation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Show created tables
SELECT 'Customer Support Tables Created Successfully' as status;
SELECT TABLE_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'inventory_db' 
AND TABLE_NAME LIKE 'customer_support%';
