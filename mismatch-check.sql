SELECT 
    dp.product_name AS catalog_name,
    dp.barcode AS catalog_barcode,
    sb.barcode AS stock_barcode,
    CASE 
        WHEN sb.barcode IS NULL THEN 'NOT_IN_STOCK'
        WHEN dp.barcode != sb.barcode THEN 'BARCODE_MISMATCH'
        ELSE 'OK'
    END AS status
FROM dispatch_product dp
LEFT JOIN (
    SELECT DISTINCT product_name, barcode 
    FROM stock_batches 
    WHERE status = 'active'
) sb ON dp.product_name = sb.product_name
WHERE dp.is_active = 1
  AND (dp.barcode != sb.barcode OR sb.barcode IS NULL)
ORDER BY status, dp.product_name
LIMIT 200;
