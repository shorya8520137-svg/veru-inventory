-- Self Transfer and Timeline Tables Migration

-- Create inventory_transfers table
CREATE TABLE IF NOT EXISTS inventory_transfers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transferId VARCHAR(50) UNIQUE NOT NULL,
    sourceType ENUM('warehouse', 'store') NOT NULL,
    sourceId INT NOT NULL,
    destinationType ENUM('warehouse', 'store') NOT NULL,
    destinationId INT NOT NULL,
    transferStatus ENUM('DRAFT', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
    requiresShipment BOOLEAN DEFAULT FALSE,
    courierPartner VARCHAR(100),
    trackingId VARCHAR(100),
    estimatedDelivery DATE,
    notes TEXT,
    transferDate DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_source (sourceType, sourceId),
    INDEX idx_destination (destinationType, destinationId),
    INDEX idx_status (transferStatus),
    INDEX idx_created (created_at)
);

-- Create transfer_items table
CREATE TABLE IF NOT EXISTS transfer_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transferId VARCHAR(50) NOT NULL,
    productId INT NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transferId) REFERENCES inventory_transfers(transferId) ON DELETE CASCADE,
    INDEX idx_transfer (transferId),
    INDEX idx_product (productId)
);

-- Create timeline_events table
CREATE TABLE IF NOT EXISTS timeline_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entityType ENUM('warehouse', 'store') NOT NULL,
    entityId INT NOT NULL,
    eventType ENUM('TRANSFER_IN', 'TRANSFER_OUT', 'INITIAL_STOCK', 'IN_TRANSIT', 'RECEIVED', 'DAMAGED', 'ADJUSTMENT') NOT NULL,
    source VARCHAR(100),
    destination VARCHAR(100),
    quantity INT NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    stockBefore INT DEFAULT 0,
    stockAfter INT DEFAULT 0,
    notes TEXT,
    transferId VARCHAR(50),
    isInitialTransfer BOOLEAN DEFAULT FALSE,
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED') DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entityType, entityId),
    INDEX idx_event_type (eventType),
    INDEX idx_transfer (transferId),
    INDEX idx_created (created_at),
    INDEX idx_initial (isInitialTransfer)
);

-- Add indexes for performance
CREATE INDEX idx_timeline_entity_date ON timeline_events(entityType, entityId, created_at DESC);
CREATE INDEX idx_transfer_status_date ON inventory_transfers(transferStatus, created_at DESC);
