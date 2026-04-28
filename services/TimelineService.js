/**
 * TimelineService
 * 
 * Logs inventory movements to store_timeline table
 * Provides timeline query functionality with filtering
 */

const db = require('../db/connection');

class TimelineService {
    /**
     * Log a movement entry to the timeline
     * @param {object} entryData - Timeline entry data
     * @param {object} connection - Database connection (for transaction)
     * @returns {Promise<number>} Entry ID
     */
    async logMovement(entryData, connection = null) {
        const dbConn = connection || db;
        
        const {
            storeCode,
            productBarcode,
            productName,
            movementType,
            direction,
            quantity,
            balanceAfter,
            reference,
            userId
        } = entryData;
        
        const sql = `
            INSERT INTO store_timeline (
                store_code,
                product_barcode,
                product_name,
                movement_type,
                direction,
                quantity,
                balance_after,
                reference,
                user_id,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const values = [
            storeCode,
            productBarcode,
            productName,
            movementType,
            direction,
            quantity,
            balanceAfter,
            reference || null,
            userId || null
        ];
        
        return new Promise((resolve, reject) => {
            dbConn.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Error logging timeline entry:', err);
                    reject(err);
                } else {
                    console.log(`✅ Timeline entry logged: ${storeCode} - ${movementType} ${direction} ${quantity} units of ${productBarcode}`);
                    resolve(result.insertId);
                }
            });
        });
    }

    /**
     * Log transfer movements (both source OUT and destination IN)
     * @param {object} transferData - Transfer data
     * @param {object} connection - Database connection (for transaction)
     * @returns {Promise<{sourceEntryId: number, destinationEntryId: number}>}
     */
    async logTransferMovements(transferData, connection) {
        const {
            sourceStoreCode,
            destinationStoreCode,
            productBarcode,
            productName,
            quantity,
            transferReference,
            userId,
            sourceBalanceAfter,
            destinationBalanceAfter
        } = transferData;
        
        try {
            // Log source OUT entry
            const sourceEntryId = await this.logMovement({
                storeCode: sourceStoreCode,
                productBarcode,
                productName,
                movementType: 'SELF_TRANSFER',
                direction: 'OUT',
                quantity,
                balanceAfter: sourceBalanceAfter,
                reference: transferReference,
                userId
            }, connection);
            
            // Log destination IN entry
            const destinationEntryId = await this.logMovement({
                storeCode: destinationStoreCode,
                productBarcode,
                productName,
                movementType: 'SELF_TRANSFER',
                direction: 'IN',
                quantity,
                balanceAfter: destinationBalanceAfter,
                reference: transferReference,
                userId
            }, connection);
            
            return {
                sourceEntryId,
                destinationEntryId
            };
        } catch (error) {
            console.error('Error logging transfer movements:', error);
            throw error;
        }
    }

    /**
     * Query timeline entries with filters
     * @param {string} storeCode - Store code
     * @param {object} filters - Query filters
     * @returns {Promise<Array>} Timeline entries
     */
    async queryTimeline(storeCode, filters = {}) {
        const {
            dateFrom,
            dateTo,
            productBarcode,
            movementType,
            limit = 50,
            offset = 0
        } = filters;
        
        let sql = `
            SELECT 
                st.id,
                st.store_code,
                st.product_barcode,
                st.product_name,
                st.movement_type,
                st.direction,
                st.quantity,
                st.balance_after,
                st.reference,
                st.user_id,
                st.created_at,
                sft.source_location,
                sft.destination_location,
                sft.transfer_type
            FROM store_timeline st
            LEFT JOIN self_transfer sft ON CONVERT(st.reference USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(sft.transfer_reference USING utf8mb4) COLLATE utf8mb4_unicode_ci
            WHERE st.store_code = ?
        `;
        
        const params = [storeCode];
        
        // Apply filters
        if (dateFrom) {
            sql += ` AND st.created_at >= ?`;
            params.push(dateFrom);
        }
        
        if (dateTo) {
            sql += ` AND st.created_at <= ?`;
            params.push(dateTo);
        }
        
        if (productBarcode) {
            sql += ` AND st.product_barcode = ?`;
            params.push(productBarcode);
        }
        
        if (movementType) {
            sql += ` AND st.movement_type = ?`;
            params.push(movementType);
        }
        
        // Order by most recent first
        sql += ` ORDER BY st.created_at DESC`;
        
        // Apply pagination
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) {
                    console.error('Error querying timeline:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    /**
     * Get total count of timeline entries (for pagination)
     * @param {string} storeCode - Store code
     * @param {object} filters - Query filters
     * @returns {Promise<number>} Total count
     */
    async getTimelineCount(storeCode, filters = {}) {
        const {
            dateFrom,
            dateTo,
            productBarcode,
            movementType
        } = filters;
        
        let sql = `
            SELECT COUNT(*) as total
            FROM store_timeline
            WHERE store_code = ?
        `;
        
        const params = [storeCode];
        
        // Apply same filters as queryTimeline
        if (dateFrom) {
            sql += ` AND created_at >= ?`;
            params.push(dateFrom);
        }
        
        if (dateTo) {
            sql += ` AND created_at <= ?`;
            params.push(dateTo);
        }
        
        if (productBarcode) {
            sql += ` AND product_barcode = ?`;
            params.push(productBarcode);
        }
        
        if (movementType) {
            sql += ` AND movement_type = ?`;
            params.push(movementType);
        }
        
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) {
                    console.error('Error getting timeline count:', err);
                    reject(err);
                } else {
                    resolve(results[0]?.total || 0);
                }
            });
        });
    }

    /**
     * Get current stock balance for a product at a store
     * @param {string} storeCode - Store code
     * @param {string} productBarcode - Product barcode
     * @returns {Promise<number>} Current balance
     */
    async getCurrentBalance(storeCode, productBarcode) {
        const sql = `
            SELECT balance_after
            FROM store_timeline
            WHERE store_code = ? AND product_barcode = ?
            ORDER BY created_at DESC
            LIMIT 1
        `;
        
        return new Promise((resolve, reject) => {
            db.query(sql, [storeCode, productBarcode], (err, results) => {
                if (err) {
                    console.error('Error getting current balance:', err);
                    reject(err);
                } else {
                    resolve(results[0]?.balance_after || 0);
                }
            });
        });
    }

    /**
     * Rebuild timeline from stock_batches (for data recovery)
     * @param {string} storeCode - Store code
     * @returns {Promise<number>} Number of entries rebuilt
     */
    async rebuildTimeline(storeCode) {
        // This is a recovery function - use with caution
        console.warn(`⚠️ Rebuilding timeline for ${storeCode} - this will delete existing timeline entries`);
        
        return new Promise((resolve, reject) => {
            db.beginTransaction((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Delete existing timeline entries for this store
                const deleteSql = `DELETE FROM store_timeline WHERE store_code = ?`;
                
                db.query(deleteSql, [storeCode], (err) => {
                    if (err) {
                        return db.rollback(() => reject(err));
                    }
                    
                    // Rebuild from stock_batches
                    const rebuildSql = `
                        INSERT INTO store_timeline (
                            store_code,
                            product_barcode,
                            product_name,
                            movement_type,
                            direction,
                            quantity,
                            balance_after,
                            reference,
                            created_at
                        )
                        SELECT 
                            warehouse as store_code,
                            prodcode as product_barcode,
                            product_name,
                            source_type as movement_type,
                            'IN' as direction,
                            qty_initial as quantity,
                            qty_initial as balance_after,
                            source_ref_id as reference,
                            created_at
                        FROM stock_batches
                        WHERE warehouse = ?
                        ORDER BY created_at ASC
                    `;
                    
                    db.query(rebuildSql, [storeCode], (err, result) => {
                        if (err) {
                            return db.rollback(() => reject(err));
                        }
                        
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => reject(err));
                            }
                            
                            console.log(`✅ Timeline rebuilt for ${storeCode}: ${result.affectedRows} entries`);
                            resolve(result.affectedRows);
                        });
                    });
                });
            });
        });
    }
}

module.exports = new TimelineService();
