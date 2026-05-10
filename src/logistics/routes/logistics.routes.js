const express = require('express');
const router = express.Router();
const ShipmentService = require('../services/shipment.service');
const WalletService = require('../services/wallet.service');
const TrackingService = require('../services/tracking.service');

// Mock Authentication Middleware
const authenticateTenant = (req, res, next) => {
  // In a real app, extract tenant_id from JWT
  req.tenantId = req.headers['x-tenant-id'] || 'TENANT-001';
  next();
};

/**
 * 1. Create a new dispatch
 * POST /api/logistics/dispatch
 */
router.post('/dispatch', authenticateTenant, async (req, res) => {
  try {
    const { preferred_courier, ...payload } = req.body;
    
    // Call our unified service layer
    const result = await ShipmentService.createDispatch(req.tenantId, payload, preferred_courier);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Dispatch Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * 2. Get wallet balance
 * GET /api/logistics/wallet
 */
router.get('/wallet', authenticateTenant, async (req, res) => {
  try {
    const balance = await WalletService.getBalance(req.tenantId);
    res.status(200).json({ success: true, balance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch wallet' });
  }
});

/**
 * 2b. Get wallet transaction history
 * GET /api/logistics/wallet/history
 */
router.get('/wallet/history', authenticateTenant, async (req, res) => {
  try {
    const history = await WalletService.getHistory(req.tenantId);
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

/**
 * 3. Track a shipment
 * GET /api/logistics/track/:shipmentId
 */
router.get('/track/:shipmentId', authenticateTenant, async (req, res) => {
  try {
    const result = await ShipmentService.getTracking(req.tenantId, req.params.shipmentId);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Tracking Error' });
  }
});

/**
 * 4. Webhook Receiver (Public)
 * POST /api/logistics/webhook/:courierName
 */
router.post('/webhook/:courierName', express.json(), async (req, res) => {
  try {
    const { courierName } = req.params;
    await TrackingService.processWebhook(courierName.toUpperCase(), req.body);
    // Always return 200 to courier APIs to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send('ERROR');
  }
});

module.exports = router;
