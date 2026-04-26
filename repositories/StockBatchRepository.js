/**
 * StockBatchRepository
 * 
 * Handles all CRUD operations on stock_batches table
 * Provides FIFO batch selection for stock reduction
 */

const db = require('../src/lib/db');

class StockBatchRepository {
    /**
     * Get active batches for a product at a location (store or warehouse)
     * @param {string} locationCode - Store code or warehouse code
     * @param {string} productBarcode - Product barcode
     * @returns {Promise<Array>} Active batches
     */
    async getActiveBatches(locationCode, productBarcode) {
        const sql = `
            SELECT * FROM stock_batches
            WHERE warehouse = ?
            AND prodcode = ?
            AND status = 'active'
            AND qty_available > 0
            ORDER BY created_at ASC
        `;
        
        return new Promise((resolve, reject) => {
            db.query(sql, [locationCode, productBarcode], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    /**
     * Get total available stock for a product at a location
     * @param {string} locationCode - Store code or warehouse code
     * @param {string} productBarcode - Product barcode
     * @returns {Promise<number>} Total available quantity
     */
    async getTotalStock(locationCode, productBarcode) {
        const sql = `
            SELECT COALESCE(SUM(qty_available), 0) as total
            FROM stock_batches
            WHERE warehouse = ?
            AND prodcode = ?
            AND status = 'active'
        `;
        
        return new Promise((resolve, reject) => {
            db.query(sql, [locationCode, productBarcode], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]?.total || 0);
            });
        });
    }

    /**
     * Get FIFO batches to fulfill a quantity requirement
     * @param {string} locationCode - Store code or warehouse code
     * @param {string} productBarcode - Product barcode
     * @param {number} requiredQty - Quantity needed
     * @returns {Promise<Array>} Batches to use (FIFO order)
     */
    async getFIFOBatches(locationCode, productBarcode, requiredQty) {
        const batches = await this.getActiveBatches(locationCode, productBarcode);
        
        const selectedBatches = [];
        let remainingQty = requiredQty;
        
        for (const batch of batches) {
            if (remainingQty <= 0) break;
            
            const qtyToTake = Math.min(batch.qty_available, remainingQty);
            selectedBatches.push({
                ...batch,
                qtyToTake
            });
            remainingQty -= qtyToTake;
        }
        
        return selectedBatches;
    }

    /**
     * Exhaust quantity from a batch
     * @param {number} batchId - Batch ID
     * @param {number} quantity - Quantity to exhaust
     * @param {object} connection - Database connection (for transaction)
     * @returns {Promise<object>} Updated batch
     */
    async exhaustBatch(batchId, quantity, connection = null) {
        const dbConn = connection || db;
        
        const sql = `
            UPDATE stock_batches
            SET qty_available = qty_available - ?,
                status = CASE 
                    WHEN qty_available - ? <= 0 THEN 'exhausted'
                    ELSE 'active'
                END,
                exhausted_at = CASE
                    WHEN qty_available - ? <= 0 THEN NOW()
                    ELSE exhausted_at
                END
            WHERE id = ?
            AND qty_available >= ?
        `;
        
        return new Promise((resolve, reject) => {
            dbConn.query(sql, [quantity, quantity, quantity, batchId, quantity], (err, result) => {
                if (err) reject(err);
                else if (result.affectedRows === 0) {
                    reject(new Error(`Insufficient quantity in batch ${batchId}`));
                } else {
                    resolve({ batchId, quantityExhausted: quantity });
                }
            });
        });
    }

    /**
     * Create a new batch
     * @param {object} batchData - Batch data
     * @param {object} connection - Database connection (for transaction)
     * @returns {Promise<number>} New batch ID
     */
    async createBatch(batchData, connection = null) {
        const dbConn = connection || db;
        
        const sql = `
            INSERT INTO stock_batches (
                product_name,
                prodcode,
                variant,
                warehouse,
                source_type,
                source_ref_id,
                parent_batch_id,
                qty_initial,
                qty_available,
                unit_cost,
                status,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
        `;
        
        const values = [
            batchData.product_name,
            batchData.prodcode,
            batchData.variant || '',
            batchData.warehouse,
            batchData.source_type,
            batchData.source_ref_id || null,
            batchData.parent_batch_id || null,
            batchData.qty_initial,
            batchData.qty_available,
            batchData.unit_cost || 0.00
        ];
        
        return new Promise((resolve, reject) => {
            dbConn.query(sql, values, (err, result) => {
                if (err) reject(err);
                else resolve(result.insertId);
            });
        });
    }

    /**
     * Get batch by ID
     * @param {number} batchId - Batch ID
     * @returns {Promise<object>} Batch data
     */
    async getBatchById(batchId) {
        const sql = `SELECT * FROM stock_batches WHERE id = ?`;
        
        return new Promise((resolve, reject) => {
            db.query(sql, [batchId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0] || null);
            });
        });
    }

    /**
     * Begin a database transaction
     * @returns {Promise<object>} Connection object
     */
    async beginTransaction() {
        return new Promise((resolve, reject) => {
            db.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                connection.beginTransaction((err) => {
                    if (err) {
                        connection.release();
                        reject(err);
                        return;
                    }
                    resolve(connection);
                });
            });
        });
    }

    /**
     * Commit a transaction
     * @param {object} connection - Connection object
     * @returns {Promise<void>}
     */
    async commitTransaction(connection) {
        return new Promise((resolve, reject) => {
            connection.commit((err) => {
                if (err) {
                    connection.rollback(() => {
                        connection.release();
                        reject(err);
                    });
                    return;
                }
                connection.release();
                resolve();
            });
        });
    }

    /**
     * Rollback a transaction
     * @param {object} connection - Connection object
     * @returns {Promise<void>}
     */
    async rollbackTransaction(connection) {
        return new Promise((resolve) => {
            connection.rollback(() => {
                connection.release();
                resolve();
            });
        });
    }
}

module.exports = new StockBatchRepository();
