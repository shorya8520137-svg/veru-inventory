/**
 * BaseCourier.js
 * Abstract class that enforces the standard interface for all courier integrations.
 * Any new courier added to the platform MUST extend this class.
 */

class BaseCourier {
  constructor(config = {}) {
    this.config = config;
    if (this.constructor === BaseCourier) {
      throw new Error("BaseCourier cannot be instantiated directly.");
    }
  }

  /**
   * Convert internal unified payload to courier-specific payload and dispatch.
   * @param {Object} payload Standardized logistics payload
   * @returns {Promise<Object>} Contains success, shipment_id, awb, etc.
   */
  async createShipment(payload) {
    throw new Error("Method 'createShipment()' must be implemented.");
  }

  /**
   * Assign Airway Bill (AWB) to an existing shipment if not done during creation.
   * @param {String} shipmentId 
   */
  async assignAWB(shipmentId) {
    throw new Error("Method 'assignAWB()' must be implemented.");
  }

  /**
   * Request pickup for an assigned shipment.
   * @param {String} shipmentId 
   */
  async requestPickup(shipmentId) {
    throw new Error("Method 'requestPickup()' must be implemented.");
  }

  /**
   * Generate PDF label for printing.
   * @param {Array<String>} shipmentIds 
   * @returns {Promise<String>} URL to the label PDF
   */
  async generateLabel(shipmentIds) {
    throw new Error("Method 'generateLabel()' must be implemented.");
  }

  /**
   * Get current tracking status.
   * @param {String} awb 
   */
  async trackShipment(awb) {
    throw new Error("Method 'trackShipment()' must be implemented.");
  }

  /**
   * Cancel an un-shipped order.
   * @param {String} awb 
   */
  async cancelShipment(awb) {
    throw new Error("Method 'cancelShipment()' must be implemented.");
  }

  /**
   * Check if courier serves a specific pincode pair.
   * @param {String} originPincode 
   * @param {String} destinationPincode 
   * @param {Number} weight 
   */
  async checkServiceability(originPincode, destinationPincode, weight) {
    throw new Error("Method 'checkServiceability()' must be implemented.");
  }

  /**
   * Fetch live rates for standard/express shipping.
   * @param {Object} details 
   */
  async getRates(details) {
    throw new Error("Method 'getRates()' must be implemented.");
  }
}

module.exports = BaseCourier;
