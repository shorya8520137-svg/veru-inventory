const Shiprocket = require('../adapters/Shiprocket');
const Delhivery = require('../adapters/Delhivery');
const RoutingAI = require('./RoutingAI');

class CourierEngine {
  constructor(tenantConfigs = {}) {
    this.tenantConfigs = tenantConfigs;
  }

  /**
   * Factory method to load the correct adapter
   * @param {String} courierName 'SHIPROCKET', 'DELHIVERY', etc.
   * @returns {BaseCourier} Courier Adapter Instance
   */
  _getAdapter(courierName) {
    const config = this.tenantConfigs[courierName] || {};
    
    switch (courierName.toUpperCase()) {
      case 'SHIPROCKET':
        return new Shiprocket(config);
      case 'DELHIVERY':
        return new Delhivery(config);
      // case 'XPRESSBEES': return new XpressBees(config);
      default:
        throw new Error(`Unsupported Courier: ${courierName}`);
    }
  }

  /**
   * Complete flow: Route -> Create -> Assign
   */
  async processShipment(payload, preferredCourier = null, strategy = 'CHEAPEST') {
    let selectedCourier = preferredCourier;
    let courierRate = 0;

    // 1. If no specific courier is requested, invoke AI Routing
    if (!selectedCourier) {
      // In a real app, we would query Shiprocket's or a master serviceability API here
      // For this implementation, we simulate fetching serviceability
      const dummyServiceability = [
        { courier_company_id: 'SHIPROCKET', rate: 45, estimated_delivery_days: 4, rating: 4.1 },
        { courier_company_id: 'DELHIVERY', rate: 55, estimated_delivery_days: 2, rating: 4.5 }
      ];
      
      const best = RoutingAI.selectBestCourier(dummyServiceability, strategy);
      selectedCourier = best.courier_company_id;
      courierRate = best.rate;
    }

    // 2. Initialize Adapter
    const adapter = this._getAdapter(selectedCourier);

    // 3. Create Shipment
    const creationResult = await adapter.createShipment(payload);

    if (!creationResult.success) {
      return { success: false, error: creationResult.error, step: 'CREATION' };
    }

    // 4. Assign AWB immediately (if the API supports/requires it as a 2nd step)
    // Shiprocket generally auto-assigns if using adhoc, but let's safely try to assign if AWB is missing
    let awb = creationResult.awb || null;
    if (!awb && creationResult.shipment_id) {
       const awbResult = await adapter.assignAWB(creationResult.shipment_id);
       if (awbResult.success) awb = awbResult.awb;
    }

    return {
      success: true,
      courier: selectedCourier,
      courier_shipment_id: creationResult.courier_shipment_id || creationResult.shipment_id,
      awb: awb,
      estimated_cost: courierRate,
      raw_response: creationResult.raw_response
    };
  }

  /**
   * Direct tracking interface
   */
  async track(courierName, awb) {
    const adapter = this._getAdapter(courierName);
    return await adapter.trackShipment(awb);
  }
}

module.exports = CourierEngine;
