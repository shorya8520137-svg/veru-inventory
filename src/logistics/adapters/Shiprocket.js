const axios = require('axios');
const BaseCourier = require('./BaseCourier');

class Shiprocket extends BaseCourier {
  constructor(config = {}) {
    super(config);
    this.baseURL = 'https://apiv2.shiprocket.in/v1/external';
    this.token = config.token || process.env.SHIPROCKET_TOKEN;
  }

  async _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  /**
   * Maps common payload to Shiprocket Custom Order API
   */
  async createShipment(payload) {
    try {
      const shiprocketPayload = {
        order_id: payload.order_id,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: payload.pickup_location || "Primary",
        billing_customer_name: payload.customer_name,
        billing_last_name: payload.customer_last_name || "",
        billing_address: payload.address,
        billing_city: payload.city,
        billing_pincode: payload.pincode,
        billing_state: payload.state,
        billing_country: "India",
        billing_email: payload.email || "test@example.com",
        billing_phone: payload.phone,
        shipping_is_billing: true,
        order_items: [
          {
            name: payload.item_name || "Logistics Package",
            sku: payload.item_sku || "PKG-01",
            units: 1,
            selling_price: payload.amount,
            discount: 0,
            tax: 0,
            hsn: 441122
          }
        ],
        payment_method: payload.payment_mode === 'COD' ? 'COD' : 'Prepaid',
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: payload.amount,
        length: payload.dimensions?.length || 10,
        breadth: payload.dimensions?.width || 10,
        height: payload.dimensions?.height || 10,
        weight: payload.weight || 0.5
      };

      const response = await axios.post(`${this.baseURL}/orders/create/adhoc`, shiprocketPayload, {
        headers: await this._getHeaders()
      });

      return {
        success: true,
        courier_shipment_id: response.data.order_id,
        shipment_id: response.data.shipment_id,
        status: response.data.status,
        raw_response: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        raw_error: error.response?.data
      };
    }
  }

  async assignAWB(shipmentId) {
    try {
      const response = await axios.post(`${this.baseURL}/courier/assign/awb`, {
        shipment_id: shipmentId
      }, { headers: await this._getHeaders() });

      return {
        success: true,
        awb: response.data.response?.data?.awb_code,
        courier_name: response.data.response?.data?.courier_name,
        routing_code: response.data.response?.data?.routing_code
      };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async requestPickup(shipmentId) {
    try {
      const response = await axios.post(`${this.baseURL}/courier/generate/pickup`, {
        shipment_id: [shipmentId]
      }, { headers: await this._getHeaders() });
      return { success: true, message: response.data.pickup_status };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async generateLabel(shipmentIds) {
    try {
      const response = await axios.post(`${this.baseURL}/courier/generate/label`, {
        shipment_id: shipmentIds
      }, { headers: await this._getHeaders() });
      return { success: true, label_url: response.data.label_url };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async trackShipment(awb) {
    try {
      const response = await axios.get(`${this.baseURL}/courier/track/awb/${awb}`, {
        headers: await this._getHeaders()
      });
      const trackingData = response.data.tracking_data;
      return {
        success: true,
        status: trackingData.shipment_status,
        tracking_url: trackingData.track_url,
        timeline: trackingData.shipment_track_activities
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async cancelShipment(awb) {
    try {
      const response = await axios.post(`${this.baseURL}/orders/cancel/awb`, {
        awbs: [awb]
      }, { headers: await this._getHeaders() });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkServiceability(originPincode, destinationPincode, weight, cod = 0) {
    try {
      const response = await axios.get(`${this.baseURL}/courier/serviceability/`, {
        params: {
          pickup_postcode: originPincode,
          delivery_postcode: destinationPincode,
          weight: weight,
          cod: cod > 0 ? 1 : 0
        },
        headers: await this._getHeaders()
      });
      return {
        success: true,
        available_couriers: response.data.data.available_courier_companies
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = Shiprocket;
