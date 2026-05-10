-- Logistics Engine SQL Schema (MySQL)

-- 1. Wallets
CREATE TABLE IF NOT EXISTS logistics_wallets (
    wallet_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (tenant_id)
);

-- 2. Wallet Transactions (Ledger)
CREATE TABLE IF NOT EXISTS logistics_wallet_transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    wallet_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('RECHARGE', 'DEDUCTION', 'REFUND', 'COD_SETTLEMENT') NOT NULL,
    reference_id VARCHAR(100), -- Order ID or Payment Gateway Ref
    status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES logistics_wallets(wallet_id)
);

-- 3. Shipments
CREATE TABLE IF NOT EXISTS logistics_shipments (
    shipment_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    courier_name VARCHAR(50) NOT NULL, -- e.g., 'SHIPROCKET', 'DELHIVERY'
    awb_number VARCHAR(100),
    courier_shipment_id VARCHAR(100), -- ID from the courier API
    
    -- Customer Info
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    shipping_address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(20),
    
    -- Package Details
    weight DECIMAL(8, 3),
    length DECIMAL(8, 2),
    width DECIMAL(8, 2),
    height DECIMAL(8, 2),
    
    payment_mode ENUM('COD', 'PREPAID') NOT NULL,
    cod_amount DECIMAL(10, 2) DEFAULT 0.00,
    shipping_cost DECIMAL(10, 2) NOT NULL, -- Amount deducted from wallet
    
    status VARCHAR(50) DEFAULT 'CREATED', -- CREATED, SHIPPED, IN_TRANSIT, DELIVERED, RTO, CANCELLED
    label_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (order_id, tenant_id)
);

-- 4. Shipment Tracking Timeline
CREATE TABLE IF NOT EXISTS logistics_shipment_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    remarks TEXT,
    event_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES logistics_shipments(shipment_id)
);

-- 5. Courier Configurations (Optional multi-tenant api key storage)
CREATE TABLE IF NOT EXISTS logistics_courier_configs (
    tenant_id VARCHAR(50) NOT NULL,
    courier_name VARCHAR(50) NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, courier_name)
);
