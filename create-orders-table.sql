-- ============================================================
-- Orders Table — stores all orders created via Create Order page
-- Run: mysql -h127.0.0.1 -uinventory_user -p'StrongPass@123' inventory_db < create-orders-table.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    order_id            VARCHAR(100) UNIQUE NOT NULL,          -- internal order ID
    shiprocket_order_id VARCHAR(100) DEFAULT NULL,             -- shiprocket returned order_id
    shiprocket_shipment_id VARCHAR(100) DEFAULT NULL,          -- shiprocket shipment_id
    channel_order_id    VARCHAR(100) DEFAULT NULL,

    -- Customer
    customer_name       VARCHAR(255) NOT NULL,
    customer_phone      VARCHAR(20)  NOT NULL,
    customer_email      VARCHAR(255) DEFAULT NULL,
    customer_address    TEXT         NOT NULL,
    customer_city       VARCHAR(100) NOT NULL,
    customer_state      VARCHAR(100) NOT NULL,
    customer_pincode    VARCHAR(10)  NOT NULL,
    customer_landmark   VARCHAR(255) DEFAULT NULL,

    -- Product
    product_name        VARCHAR(255) NOT NULL,
    unit_price          DECIMAL(10,2) DEFAULT 0,
    quantity            INT          DEFAULT 1,
    discount            DECIMAL(5,2) DEFAULT 0,
    tax                 DECIMAL(5,2) DEFAULT 18,
    hsn_code            VARCHAR(50)  DEFAULT NULL,

    -- Package
    dead_weight         DECIMAL(8,3) DEFAULT 0.5,
    package_type        VARCHAR(100) DEFAULT 'Standard Corrugated Box',
    length_cm           DECIMAL(8,2) DEFAULT 10,
    breadth_cm          DECIMAL(8,2) DEFAULT 10,
    height_cm           DECIMAL(8,2) DEFAULT 10,
    volumetric_weight   DECIMAL(8,3) DEFAULT NULL,

    -- Payment & Order
    payment_method      ENUM('COD','Prepaid') DEFAULT 'Prepaid',
    order_type          ENUM('domestic','international') DEFAULT 'domestic',
    order_value         DECIMAL(10,2) DEFAULT 0,
    cod_amount          DECIMAL(10,2) DEFAULT 0,

    -- Status
    status              VARCHAR(50)  DEFAULT 'Pending',
    courier_name        VARCHAR(100) DEFAULT NULL,
    awb_code            VARCHAR(100) DEFAULT NULL,
    tracking_url        TEXT         DEFAULT NULL,

    -- Shiprocket raw response
    shiprocket_response JSON         DEFAULT NULL,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone     ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON orders(created_at);

SELECT 'orders table created successfully' AS result;
