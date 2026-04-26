/**
 * BillingIntegrationService
 * 
 * Orchestrates billing entry creation and stock reduction in a single transaction
 * This is the core of the Billing-Triggers-Stock synchronous integration architecture
 */

const StockBatchRepository = require('../repositories/StockBatchRepository');
const StockReductionService = require('./StockReductionService');
const TimelineService = require('./TimelineService');
const db = require('../db/connection');

class BillingIntegrationService {
    /**
     * Create a store-to-store transfer with billing entry and stock reduction
     * @param {object} transferData - Transfer data
     * @returns {Promise<object>} Transfer result with billing reference
     */
    async createTransferWithBilling(transferData) {
        const {
            sourceStoreCode,
            destinationStoreCode,
            productBarcode,
            productName,
            quantity,
            userId,
            transferReference
        } = transferData;
        
        let connection = null;
        
        try {
            // Begin transaction
            connection = await StockBatchRepository.beginTransaction();
            console.log(`🔄 Starting billing-triggered transfer: ${sourceStoreCode} → ${destinationStoreCode}`);
            
            // Step 1: Validate source stock
            const validation = await StockReductionService.validateStock(sourceStoreCode, productBarcode, quantity);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            
            // Step 2: Create billing entry (INTERNAL_TRANSFER type)
            const billingEntryId = await this.createBillingEntry({
                transferReference,
                sourceStoreCode,
                destinationStoreCode,
                productBarcode,
                productName,
                quantity,
                userId
            }, connection);
            
            console.log(`✅ Billing entry created: ${transferReference} (ID: ${billingEntryId})`);
            
            // Step 3: Execute stock transfer (reduce source + increase destination)
            const stockTransferResult = await StockReductionService.executeStockTransfer({
                sourceLocationCode: sourceStoreCode,
                destinationLocationCode: destinationStoreCode,
                productBarcode,
                productName,
                quantity,
                sourceType: 'SELF_TRANSFER',
                sourceRefId: billingEntryId
            }, connection);
            
            console.log(`✅ Stock transfer completed: ${stockTransferResult.sourceReduction.totalReduced} units reduced from source, ${stockTransferResult.destinationIncrease.totalAdded} units added to destination`);
            
            // Step 4: Get current balances for timeline
            const sourceBalanceAfter = await StockBatchRepository.getTotalStock(sourceStoreCode, productBarcode);
            const destinationBalanceAfter = await StockBatchRepository.getTotalStock(destinationStoreCode, productBarcode);
            
            // Step 5: Log timeline entries
            const timelineResult = await TimelineService.logTransferMovements({
                sourceStoreCode,
                destinationStoreCode,
                productBarcode,
                productName,
                quantity,
                transferReference,
                userId,
                sourceBalanceAfter,
                destinationBalanceAfter
            }, connection);
            
            console.log(`✅ Timeline entries created: Source OUT (ID: ${timelineResult.sourceEntryId}), Destination IN (ID: ${timelineResult.destinationEntryId})`);
            
            // Commit transaction
            await StockBatchRepository.commitTransaction(connection);
            console.log(`✅ Transaction committed successfully for transfer ${transferReference}`);
            
            return {
                success: true,
                transferReference,
                billingEntryId,
                sourceStock: sourceBalanceAfter,
                destinationStock: destinationBalanceAfter,
                stockTransferResult,
                timelineResult
            };
            
        } catch (error) {
            console.error('❌ Transfer with billing failed:', error);
            
            // Rollback transaction
            if (connection) {
                await StockBatchRepository.rollbackTransaction(connection);
                console.log('🔄 Transaction rolled back');
            }
            
            throw error;
        }
    }

    /**
     * Create a billing entry for internal transfer
     * @param {object} billingData - Billing data
     * @param {object} connection - Database connection (for transaction)
     * @returns {Promise<number>} Billing entry ID
     */
    async createBillingEntry(billingData, connection) {
        const {
            transferReference,
            sourceStoreCode,
            destinationStoreCode,
            productBarcode,
            productName,
            quantity,
            userId
        } = billingData;
        
        const sql = `
            INSERT INTO bills (
                invoice_number,
                bill_type,
                customer_name,
                customer_phone,
                subtotal,
                grand_total,
                payment_mode,
                payment_status,
                items,
                total_items,
                created_by,
                created_at
            ) VALUES (?, 'INTERNAL_TRANSFER', ?, 'INTERNAL-OP', 0.00, 0.00, 'internal_transfer', 'completed', ?, 1, ?, NOW())
        `;
        
        // Create billing item details
        const billingItem = {
            product_name: productName,
            barcode: productBarcode,
            quantity: quantity,
            unit_price: 0.00,
            total: 0.00,
            transfer_details: {
                source: sourceStoreCode,
                destination: destinationStoreCode,
                reference: transferReference,
                timestamp: new Date().toISOString()
            }
        };
        
        const customerName = `Internal Transfer: ${sourceStoreCode} → ${destinationStoreCode}`;
        const itemsJson = JSON.stringify([billingItem]);
        
        return new Promise((resolve, reject) => {
            connection.query(sql, [
                transferReference,
                customerName,
                itemsJson,
                userId || 'system'
            ], (err, result) => {
                if (err) {
                    console.error('Error creating billing entry:', err);
                    reject(err);
                } else {
                    resolve(result.insertId);
                }
            });
        });
    }

    /**
     * Get billing history for a store (filtered by INTERNAL_TRANSFER type)
     * @param {string} storeCode - Store code
     * @param {object} filters - Query filters
     * @returns {Promise<Array>} Billing entries
     */
    async getBillingHistory(storeCode, filters = {}) {
        const {
            dateFrom,
            dateTo,
            productBarcode,
            limit = 50,
            offset = 0
        } = filters;
        
        let sql = `
            SELECT 
                id,
                invoice_number,
                bill_type,
                customer_name,
                items,
                total_items,
                payment_status,
                created_by,
                created_at
            FROM bills
            WHERE bill_type = 'INTERNAL_TRANSFER'
            AND (customer_name LIKE ? OR customer_name LIKE ?)
        `;
        
        const params = [`%${storeCode}%`, `%${storeCode}%`];
        
        // Apply filters
        if (dateFrom) {
            sql += ` AND created_at >= ?`;
            params.push(dateFrom);
        }
        
        if (dateTo) {
            sql += ` AND created_at <= ?`;
            params.push(dateTo);
        }
        
        if (productBarcode) {
            sql += ` AND JSON_SEARCH(items, 'one', ?, NULL, '$[*].barcode') IS NOT NULL`;
            params.push(productBarcode);
        }
        
        // Order by most recent first
        sql += ` ORDER BY created_at DESC`;
        
        // Apply pagination
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) {
                    console.error('Error fetching billing history:', err);
                    reject(err);
                } else {
                    // Parse items JSON
                    const parsedResults = results.map(row => ({
                        ...row,
                        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
                    }));
                    resolve(parsedResults);
                }
            });
        });
    }

    /**
     * Get billing entry by reference number
     * @param {string} referenceNumber - Transfer reference number
     * @returns {Promise<object>} Billing entry
     */
    async getBillingByReference(referenceNumber) {
        const sql = `
            SELECT 
                id,
                invoice_number,
                bill_type,
                customer_name,
                items,
                total_items,
                payment_status,
                created_by,
                created_at
            FROM bills
            WHERE invoice_number = ?
            AND bill_type = 'INTERNAL_TRANSFER'
        `;
        
        return new Promise((resolve, reject) => {
            db.query(sql, [referenceNumber], (err, results) => {
                if (err) {
                    console.error('Error fetching billing entry:', err);
                    reject(err);
                } else if (results.length === 0) {
                    resolve(null);
                } else {
                    const billing = results[0];
                    billing.items = typeof billing.items === 'string' ? JSON.parse(billing.items) : billing.items;
                    resolve(billing);
                }
            });
        });
    }

    /**
     * Batch create transfers with billing (for multiple items in one transfer)
     * @param {object} batchTransferData - Batch transfer data
     * @returns {Promise<object>} Batch transfer result
     */
    async createBatchTransferWithBilling(batchTransferData) {
        const {
            sourceStoreCode,
            destinationStoreCode,
            items, // Array of {productBarcode, productName, quantity}
            userId,
            transferReference
        } = batchTransferData;
        
        let connection = null;
        
        try {
            // Begin transaction
            connection = await StockBatchRepository.beginTransaction();
            console.log(`🔄 Starting batch billing-triggered transfer: ${sourceStoreCode} → ${destinationStoreCode} (${items.length} items)`);
            
            // Validate all items first
            for (const item of items) {
                const validation = await StockReductionService.validateStock(
                    sourceStoreCode,
                    item.productBarcode,
                    item.quantity
                );
                if (!validation.valid) {
                    throw new Error(`${validation.message} for item ${item.productName}`);
                }
            }
            
            // Create single billing entry for all items
            const billingEntryId = await this.createBatchBillingEntry({
                transferReference,
                sourceStoreCode,
                destinationStoreCode,
                items,
                userId
            }, connection);
            
            console.log(`✅ Batch billing entry created: ${transferReference} (ID: ${billingEntryId})`);
            
            // Process each item
            const itemResults = [];
            for (const item of items) {
                // Execute stock transfer
                const stockTransferResult = await StockReductionService.executeStockTransfer({
                    sourceLocationCode: sourceStoreCode,
                    destinationLocationCode: destinationStoreCode,
                    productBarcode: item.productBarcode,
                    productName: item.productName,
                    quantity: item.quantity,
                    sourceType: 'SELF_TRANSFER',
                    sourceRefId: billingEntryId
                }, connection);
                
                // Get current balances
                const sourceBalanceAfter = await StockBatchRepository.getTotalStock(sourceStoreCode, item.productBarcode);
                const destinationBalanceAfter = await StockBatchRepository.getTotalStock(destinationStoreCode, item.productBarcode);
                
                // Log timeline entries
                const timelineResult = await TimelineService.logTransferMovements({
                    sourceStoreCode,
                    destinationStoreCode,
                    productBarcode: item.productBarcode,
                    productName: item.productName,
                    quantity: item.quantity,
                    transferReference,
                    userId,
                    sourceBalanceAfter,
                    destinationBalanceAfter
                }, connection);
                
                itemResults.push({
                    productBarcode: item.productBarcode,
                    productName: item.productName,
                    quantity: item.quantity,
                    sourceBalanceAfter,
                    destinationBalanceAfter,
                    stockTransferResult,
                    timelineResult
                });
            }
            
            // Commit transaction
            await StockBatchRepository.commitTransaction(connection);
            console.log(`✅ Batch transaction committed successfully for transfer ${transferReference}`);
            
            return {
                success: true,
                transferReference,
                billingEntryId,
                itemResults
            };
            
        } catch (error) {
            console.error('❌ Batch transfer with billing failed:', error);
            
            // Rollback transaction
            if (connection) {
                await StockBatchRepository.rollbackTransaction(connection);
                console.log('🔄 Transaction rolled back');
            }
            
            throw error;
        }
    }

    /**
     * Create a batch billing entry for multiple items
     * @param {object} billingData - Billing data
     * @param {object} connection - Database connection (for transaction)
     * @returns {Promise<number>} Billing entry ID
     */
    async createBatchBillingEntry(billingData, connection) {
        const {
            transferReference,
            sourceStoreCode,
            destinationStoreCode,
            items,
            userId
        } = billingData;
        
        const sql = `
            INSERT INTO bills (
                invoice_number,
                bill_type,
                customer_name,
                customer_phone,
                subtotal,
                grand_total,
                payment_mode,
                payment_status,
                items,
                total_items,
                created_by,
                created_at
            ) VALUES (?, 'INTERNAL_TRANSFER', ?, 'INTERNAL-OP', 0.00, 0.00, 'internal_transfer', 'completed', ?, ?, ?, NOW())
        `;
        
        // Create billing items
        const billingItems = items.map(item => ({
            product_name: item.productName,
            barcode: item.productBarcode,
            quantity: item.quantity,
            unit_price: 0.00,
            total: 0.00,
            transfer_details: {
                source: sourceStoreCode,
                destination: destinationStoreCode,
                reference: transferReference,
                timestamp: new Date().toISOString()
            }
        }));
        
        const customerName = `Internal Transfer: ${sourceStoreCode} → ${destinationStoreCode}`;
        const itemsJson = JSON.stringify(billingItems);
        
        return new Promise((resolve, reject) => {
            connection.query(sql, [
                transferReference,
                customerName,
                itemsJson,
                items.length,
                userId || 'system'
            ], (err, result) => {
                if (err) {
                    console.error('Error creating batch billing entry:', err);
                    reject(err);
                } else {
                    resolve(result.insertId);
                }
            });
        });
    }
}

module.exports = new BillingIntegrationService();
