const CourierEngine = require('../engine/CourierEngine');
const WalletService = require('./wallet.service');
const db = require('../../../db/connection');
const crypto = require('crypto');

class ShipmentService {
  constructor() {
    this.engine = new CourierEngine();
  }

  /**
   * Main pipeline to dispatch a new shipment
   */
  async createDispatch(tenantId, payload, preferredCourier = null) {
    const shipmentId = 'SHP-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    
    // 1. Determine estimated cost (In a real app, query rates API first. Mocking 50 INR)
    const estimatedCost = 50.00;

    // 2. Hold funds in wallet
    const walletHold = await WalletService.deductForShipment(tenantId, estimatedCost, payload.order_id);
    if (!walletHold.success) {
      return { success: false, error: `Wallet Error: ${walletHold.error}` };
    }

    try {
      // 3. Dispatch to Courier Engine
      const dispatchResult = await this.engine.processShipment(payload, preferredCourier, 'CHEAPEST');

      if (!dispatchResult.success) {
        // ROLLBACK: Refund wallet if courier API fails
        await WalletService.refund(tenantId, estimatedCost, payload.order_id, `Courier API Failed: ${dispatchResult.error}`);
        return { success: false, error: `Courier API Error: ${dispatchResult.error}` };
      }

      // 4. Record Shipment in Database
      await db.promise().execute(
        `INSERT INTO logistics_shipments 
        (shipment_id, tenant_id, order_id, courier_name, awb_number, courier_shipment_id, 
         customer_name, customer_phone, shipping_address, city, state, pincode, 
         weight, length, width, height, payment_mode, cod_amount, shipping_cost, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CREATED')`,
        [
          shipmentId, tenantId, payload.order_id, dispatchResult.courier, dispatchResult.awb || null,
          dispatchResult.courier_shipment_id, payload.customer_name, payload.phone, payload.address,
          payload.city, payload.state, payload.pincode, payload.weight,
          payload.dimensions?.length || 0, payload.dimensions?.width || 0, payload.dimensions?.height || 0,
          payload.payment_mode, payload.payment_mode === 'COD' ? payload.amount : 0, estimatedCost
        ]
      );

      return {
        success: true,
        shipment_id: shipmentId,
        courier: dispatchResult.courier,
        awb: dispatchResult.awb,
        wallet_transaction: walletHold.transactionId
      };

    } catch (error) {
      // Emergency rollback if DB insertion fails after courier generation
      await WalletService.refund(tenantId, estimatedCost, payload.order_id, `System Exception: ${error.message}`);
      return { success: false, error: `Internal System Error: ${error.message}` };
    }
  }

  async getTracking(tenantId, shipmentId) {
    const [rows] = await db.promise().execute(
      'SELECT courier_name, awb_number FROM logistics_shipments WHERE shipment_id = ? AND tenant_id = ?',
      [shipmentId, tenantId]
    );

    if (rows.length === 0) return { success: false, error: 'Shipment not found' };
    if (!rows[0].awb_number) return { success: false, error: 'AWB not assigned yet' };

    return await this.engine.track(rows[0].courier_name, rows[0].awb_number);
  }
}

module.exports = new ShipmentService();
