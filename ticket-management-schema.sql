-- Ticket Management System Database Schema

-- Main tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Open', 'In Progress', 'Pending', 'Resolved', 'Closed') DEFAULT 'Open',
    category VARCHAR(100),
    assigned_to VARCHAR(100),
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_by (created_by),
    INDEX idx_assigned_to (assigned_to)
);

-- Ticket follow-ups/comments table
CREATE TABLE IF NOT EXISTS ticket_followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    comment TEXT NOT NULL,
    comment_type ENUM('Comment', 'Status Update', 'Assignment', 'Resolution') DEFAULT 'Comment',
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_created_by (created_by)
);

-- Ticket attachments table (optional for future use)
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id)
);

-- Insert sample data
INSERT INTO tickets (ticket_number, title, description, priority, status, category, assigned_to, created_by) VALUES
('TKT-001', 'Login Issue - Cannot access dashboard', 'User reports unable to login to the system after password reset', 'High', 'Open', 'Authentication', 'admin@company.com', 'user1@company.com'),
('TKT-002', 'Inventory count mismatch', 'Stock levels showing incorrect values in warehouse AMD_WH', 'Medium', 'In Progress', 'Inventory', 'admin@company.com', 'warehouse@company.com'),
('TKT-003', 'PDF generation failing', 'Shipping manifest PDF not generating for large orders', 'Critical', 'Open', 'System', 'admin@company.com', 'dispatch@company.com'),
('TKT-004', 'Feature Request - Export to Excel', 'Need ability to export movement records to Excel format', 'Low', 'Pending', 'Enhancement', NULL, 'manager@company.com'),
('TKT-005', 'Barcode scanner not working', 'Barcode scanner integration failing on mobile devices', 'High', 'Resolved', 'Hardware', 'admin@company.com', 'warehouse@company.com');

-- Insert sample follow-ups
INSERT INTO ticket_followups (ticket_id, comment, comment_type, created_by) VALUES
(1, 'Ticket created - investigating login issue', 'Status Update', 'admin@company.com'),
(1, 'Password reset functionality checked - working fine. Investigating browser cache issues.', 'Comment', 'admin@company.com'),
(2, 'Started investigation of inventory discrepancies in AMD warehouse', 'Status Update', 'admin@company.com'),
(2, 'Found issue with stock calculation logic. Working on fix.', 'Comment', 'admin@company.com'),
(3, 'Critical issue identified - PDF generation timeout for orders > 50 items', 'Comment', 'admin@company.com'),
(4, 'Feature request logged for development team review', 'Status Update', 'admin@company.com'),
(5, 'Issue resolved - updated barcode scanner library to latest version', 'Resolution', 'admin@company.com');

-- Update resolved ticket
UPDATE tickets SET status = 'Resolved', resolved_at = NOW() WHERE id = 5;