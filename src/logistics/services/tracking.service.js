const db = require('../../../db/connection');

class TrackingService {
  /**
   * Process incoming webhook from a courier and record it in the timeline.
   */
  static async processWebhook(courierName, webhookData) {
    // 1. Parse courier specific webhook payload
    let awb = null;
    let status = null;
    let location = null;
    let remarks = null;
    let eventTime = new Date();

    if (courierName === 'SHIPROCKET') {
      awb = webhookData.awb;
      status = webhookData.current_status;
      location = webhookData.scanned_location;
      remarks = webhookData.remarks;
    } 
    // Add logic for Delhivery, XpressBees, etc.

    if (!awb || !status) return { success: false, error: 'Invalid webhook payload' };

    const connection = await db.promise().getConnection();
    try {
      // Find the shipment ID from AWB
      const [shipments] = await connection.execute(
        'SELECT shipment_id FROM logistics_shipments WHERE awb_number = ?',
        [awb]
      );

      if (shipments.length === 0) return { success: false, error: 'AWB not found in system' };
      const shipmentId = shipments[0].shipment_id;

      // Update master status
      await connection.execute(
        'UPDATE logistics_shipments SET status = ? WHERE shipment_id = ?',
        [status, shipmentId]
      );

      // Record timeline
      await connection.execute(
        'INSERT INTO logistics_shipment_tracking (shipment_id, status, location, remarks, event_time) VALUES (?, ?, ?, ?, ?)',
        [shipmentId, status, location, remarks, eventTime]
      );

      // (If status is RTO, trigger refund logic via queue here)

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }
}

module.exports = TrackingService;
