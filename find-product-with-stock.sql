-- Find products with stock in warehouses
SELECT 
    barcode,
    product_name,
    warehouse,
    SUM(qty_available) as total_stock
FROM stock_batches 
WHERE status = 'active' AND qty_available > 0
GROUP BY barcode, product_name, warehouse
HAVING total_stock > 5
ORDER BY total_stock DESC
LIMIT 10;
