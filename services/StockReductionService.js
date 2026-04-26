/**
 * StockReductionService
 * 
 * Validates stock availability and reduces stock using FIFO batch exhaustion
 * Part of the Billing-Triggers-Stock synchronous integration architecture
 */

const StockBatchRepository = require('../repositories/StockBatchRepository');

class StockReductionService {
    /**
     * Validate that sufficient stock exists at a location
     * @param {string} locationCode - Store code or warehouse code
     * @param {string} productBarcode - Product barcode
     * @param {number} requiredQty - Quantity needed
     * @returns {Promise<{valid: boolean, available: number, message: string}>}
     */
    async validateStock(locationCode, productBarcode, requiredQty) {
        try {
            const availableStock = await StockBatchRepository.getTotalStock(locationCode, productBarcode);
            
            if (availableStock < requiredQty) {
                return {
                    valid: false,
                    available: availableStock,
                    message: `Insufficient stock at ${locationCode} for product ${productBarcode}. Available: ${availableStock}, Requested: ${requiredQty}`
                };
            }
            
            return {
                valid: true,
                available: availableStock,
                message: 'Stock validation passed'
            };
        } catch (error) {
            console.error('Stock validation error:', error);
            throw new Error(`Stock validation failed: ${error.message}`);
        }
    }

    /**
     * Reduce stock from source location using FIFO batches
     * @param {string} sourceLocationCode - Source store/warehouse code
     * @param {string} productBarcode - Product barcode
     * @param {string} productName - Product name
     * @param {number} quantity - Quantity to reduce
     * @param {object} connection - Database connection (for transaction)
     * @returns {Promise<{exhaustedBatches: Array, totalReduced: number}>}
     */
    async reduceStock(sourceLocationCode, productBarcode, productName, quantity, connection) {
        try {
            // Get FIFO batches to fulfill the quantity
            const fifoBatches = await StockBatchRepository.getFIFOBatches(sourceLocationCode, productBarcode, quantity);
            
            if (fifoBatches.length === 0) {
                throw new Error(`No active batches found for product ${productBarcode} at ${sourceLocationCode}`);
            }
            
            // Calculate total available from selected batches
            const totalAvailable = fifoBatches.reduce((sum, batch) => sum + batch.qtyToTake, 0);
            
            if (totalAvailable < quantity) {
                throw new Error(`Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}`);
            }
            
            // Exhaust batches in FIFO order
            const exhaustedBatches = [];
            for (const batch of fifoBatches) {
                await StockBatchRepository.exhaustBatch(batch.id, batch.qtyToTake, connection);
                exhaustedBatches.push({
                    batchId: batch.id,
                    quantityExhausted: batch.qtyToTake,
                    unitCost: batch.unit_cost
                });
            }
            
            console.log(`✅ Reduced ${quantity} units of ${productBarcode} from ${sourceLocationCode} using ${exhaustedBatches.length} batches`);
            
            return {
                exhaustedBatches,
                totalReduced: quantity
            };
        } catch (error) {
            console.error('Stock reduction error:', error);
            throw error;
        }
    }

    /**
     * Increase stock at destination location by creating new batches
     * @param {string} destinationLocationCode - Destination store/warehouse code
     * @param {string} productBarcode - Product barcode
     * @param {string} productName - Product name
     * @param {number} quantity - Quantity to add
     * @param {string} sourceType - Source type (e.g., 'SELF_TRANSFER')
     * @param {number} sourceRefId - Reference ID (e.g., transfer ID)
     * @param {Array} parentBatches - Parent batches from source (for linkage)
     * @param {object} connection - Database connection (for transaction)
     * @returns {Promise<{createdBatches: Array, totalAdded: number}>}
     */
    async increaseStock(destinationLocationCode, productBarcode, productName, quantity, sourceType, sourceRefId, parentBatches, connection) {
        try {
            const createdBatches = [];
            
            // Create destination batches linked to source batches
            for (const parentBatch of parentBatches) {
                const batchData = {
                    product_name: productName,
                    prodcode: productBarcode,
                    variant: parentBatch.variant || '',
                    warehouse: destinationLocationCode,
                    source_type: sourceType,
                    source_ref_id: sourceRefId,
                    parent_batch_id: parentBatch.batchId,
                    qty_initial: parentBatch.quantityExhausted,
                    qty_available: parentBatch.quantityExhausted,
                    unit_cost: parentBatch.unitCost || 0.00
                };
                
                const newBatchId = await StockBatchRepository.createBatch(batchData, connection);
                createdBatches.push({
                    batchId: newBatchId,
                    quantity: parentBatch.quantityExhausted,
                    parentBatchId: parentBatch.batchId
                });
            }
            
            console.log(`✅ Added ${quantity} units of ${productBarcode} to ${destinationLocationCode} in ${createdBatches.length} batches`);
            
            return {
                createdBatches,
                totalAdded: quantity
            };
        } catch (error) {
            console.error('Stock increase error:', error);
            throw error;
        }
    }

    /**
     * Execute a complete stock transfer (reduce source + increase destination)
     * @param {object} transferData - Transfer data
     * @param {object} connection - Database connection (for transaction)
     * @returns {Promise<{sourceReduction: object, destinationIncrease: object}>}
     */
    async executeStockTransfer(transferData, connection) {
        const {
            sourceLocationCode,
            destinationLocationCode,
            productBarcode,
            productName,
            quantity,
            sourceType,
            sourceRefId
        } = transferData;
        
        try {
            // Step 1: Validate source stock
            const validation = await this.validateStock(sourceLocationCode, productBarcode, quantity);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            
            // Step 2: Reduce stock from source using FIFO
            const sourceReduction = await this.reduceStock(
                sourceLocationCode,
                productBarcode,
                productName,
                quantity,
                connection
            );
            
            // Step 3: Increase stock at destination with parent linkage
            const destinationIncrease = await this.increaseStock(
                destinationLocationCode,
                productBarcode,
                productName,
                quantity,
                sourceType,
                sourceRefId,
                sourceReduction.exhaustedBatches,
                connection
            );
            
            console.log(`✅ Stock transfer completed: ${sourceLocationCode} → ${destinationLocationCode}, ${quantity} units of ${productBarcode}`);
            
            return {
                sourceReduction,
                destinationIncrease
            };
        } catch (error) {
            console.error('Stock transfer execution error:', error);
            throw error;
        }
    }
}

module.exports = new StockReductionService();
