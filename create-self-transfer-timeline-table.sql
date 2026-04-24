-- CREATE DEDICATED SELF TRANSFER TIMELINE TABLE
-- Since self_transfer and self_transfer_items already exist, 
-- we'll create a timeline table specifically for self-transfers

DROP TABLE IF EXISTS self_transfer_timeline;

CREATE TABLE self_transfer_timeline (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    transfer_reference VARCHAR(255) NOT NULL,
    event_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    movement_type VARCHAR(30) NOT NULL DEFAULT 'SELF_TRANSFER',
    barcode VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    location_code VARCHAR(100) NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    direction ENUM('IN', 'OUT') NOT NULL,
    transfer_type VARCHAR(50) NOT NULL,
    source_location VARCHAR(100) NOT NULL,
    destination_location VARCHAR(100) NOT NULL,
    tenant_id INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_transfer_ref (transfer_reference),
    INDEX idx_barcode (barcode),
    INDEX idx_location (location_code),
    INDEX idx_event_time (event_time),
    INDEX idx_movement_type (movement_type),
    
    -- Foreign key constraint
    CONSTRAINT fk_st_transfer_ref 
        FOREIGN KEY (transfer_reference) 
        REFERENCES self_transfer(transfer_reference) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Populate timeline table with existing self-transfer data
INSERT INTO self_transfer_timeline (
    transfer_reference, event_time, barcode, product_name, 
    location_code, qty, direction, transfer_type, 
    source_location, destination_location
)
SELECT 
    st.transfer_reference,
    st.created_at as event_time,
    sti.barcode,
    sti.product_name,
    -- OUT entry for source warehouse
    st.source_location as location_code,
    sti.qty,
    'OUT' as direction,
    st.transfer_type,
    st.source_location,
    st.destination_location
FROM self_transfer st
JOIN self_transfer_items sti ON st.id = sti.transfer_id
WHERE st.transfer_type IN ('W to W', 'W to S') -- Source is warehouse
AND st.created_at >= '2024-01-01'; -- Only recent transfers

-- Insert IN entries for destination warehouses
INSERT INTO self_transfer_timeline (
    transfer_reference, event_time, barcode, product_name, 
    location_code, qty, direction, transfer_type, 
    source_location, destination_location
)
SELECT 
    st.transfer_reference,
    st.created_at as event_time,
    sti.barcode,
    sti.product_name,
    -- IN entry for destination warehouse
    st.destination_location as location_code,
    sti.qty,
    'IN' as direction,
    st.transfer_type,
    st.source_location,
    st.destination_location
FROM self_transfer st
JOIN self_transfer_items sti ON st.id = sti.transfer_id
WHERE st.transfer_type IN ('W to W', 'S to W') -- Destination is warehouse
AND st.created_at >= '2024-01-01'; -- Only recent transfers

-- Show results
SELECT 'SELF TRANSFER TIMELINE ENTRIES CREATED:' as info;
SELECT transfer_type, location_code, direction, COUNT(*) as count
FROM self_transfer_timeline
GROUP BY transfer_type, location_code, direction
ORDER BY transfer_type, location_code, direction;

-- Show sample entries
SELECT 'SAMPLE TIMELINE ENTRIES:' as info;
SELECT event_time, transfer_reference, barcode, product_name, location_code, qty, direction, transfer_type
FROM self_transfer_timeline
ORDER BY event_time DESC
LIMIT 10;