@echo off
REM Self Transfer Migration Script for Windows
REM Run this command on your server to create the missing tables

echo Running Self Transfer Migration...
echo ==================================

REM Connect to MySQL and run the migration
mysql -h api.giftgala.in -u inventory_user -pStrongPass@123 inventory_db -e "CREATE TABLE IF NOT EXISTS inventory_transfers (id INT PRIMARY KEY AUTO_INCREMENT, transferId VARCHAR(50) UNIQUE NOT NULL, sourceType ENUM('warehouse', 'store') NOT NULL, sourceId INT NOT NULL, destinationType ENUM('warehouse', 'store') NOT NULL, destinationId INT NOT NULL, transferStatus ENUM('DRAFT', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT', requiresShipment BOOLEAN DEFAULT FALSE, courierPartner VARCHAR(100), trackingId VARCHAR(100), estimatedDelivery DATE, notes TEXT, transferDate DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_source (sourceType, sourceId), INDEX idx_destination (destinationType, destinationId), INDEX idx_status (transferStatus), INDEX idx_created (created_at));"

mysql -h api.giftgala.in -u inventory_user -pStrongPass@123 inventory_db -e "CREATE TABLE IF NOT EXISTS transfer_items (id INT PRIMARY KEY AUTO_INCREMENT, transferId VARCHAR(50) NOT NULL, productId INT NOT NULL, quantity INT NOT NULL, unit VARCHAR(20) DEFAULT 'pcs', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (transferId) REFERENCES inventory_transfers(transferId) ON DELETE CASCADE, INDEX idx_transfer (transferId), INDEX idx_product (productId));"

mysql -h api.giftgala.in -u inventory_user -pStrongPass@123 inventory_db -e "CREATE TABLE IF NOT EXISTS timeline_events (id INT PRIMARY KEY AUTO_INCREMENT, entityType ENUM('warehouse', 'store') NOT NULL, entityId INT NOT NULL, eventType ENUM('TRANSFER_IN', 'TRANSFER_OUT', 'INITIAL_STOCK', 'IN_TRANSIT', 'RECEIVED', 'DAMAGED', 'ADJUSTMENT') NOT NULL, source VARCHAR(100), destination VARCHAR(100), quantity INT NOT NULL, unit VARCHAR(20) DEFAULT 'pcs', stockBefore INT DEFAULT 0, stockAfter INT DEFAULT 0, notes TEXT, transferId VARCHAR(50), isInitialTransfer BOOLEAN DEFAULT FALSE, status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED') DEFAULT 'COMPLETED', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_entity (entityType, entityId), INDEX idx_event_type (eventType), INDEX idx_transfer (transferId), INDEX idx_created (created_at), INDEX idx_initial (isInitialTransfer));"

mysql -h api.giftgala.in -u inventory_user -pStrongPass@123 inventory_db -e "SHOW TABLES LIKE 'inventory_%'; SHOW TABLES LIKE 'timeline_%';"

echo ==================================
echo Migration completed!
pause
