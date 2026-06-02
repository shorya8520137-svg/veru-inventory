const db = require('../db/connection');

const VEHICLE_RATES = {
  bike:         { label: 'Bike',         capacity: 10,    baseFare: 100,  perKmRate: 8,  perKgRate: 1,   vehicleCost: 500,  maxRangeKm: 10   },
  three_wheeler:{ label: '3 Wheeler',    capacity: 50,    baseFare: 200,  perKmRate: 12, perKgRate: 1.5, vehicleCost: 1000, maxRangeKm: 50   },
  pickup:       { label: 'Pickup/Tata Ace', capacity: 500,  baseFare: 300, perKmRate: 18, perKgRate: 2,   vehicleCost: 2000, maxRangeKm: 100  },
  mini_truck:   { label: 'Mini Truck (Tata 407)', capacity: 7000, baseFare: 400, perKmRate: 25, perKgRate: 2.5, vehicleCost: 3500, maxRangeKm: 500  },
  truck:        { label: 'Truck (10+ wheeler)', capacity: 16000, baseFare: 500, perKmRate: 35, perKgRate: 3,   vehicleCost: 5000, maxRangeKm: 5000 },
};

const WEATHER_MULT = { clear: 1.0, rain: 1.15, heavy_rain: 1.3, storm: 1.5 };
const TRAFFIC_MULT = { low: 1.0, medium: 1.1, high: 1.25, extreme: 1.5 };
const DIESEL_BASE_PRICE = 90;
const FAF_RATE = 0.0065;
const GST_RATE = 0.05;
const DEFAULT_WEIGHT_KG = 0.5;

function selectVehicle(weightKg, distanceKm = 0) {
  // Weight-based recommendation
  let byWeight = 'truck';
  if (weightKg <= 10) byWeight = 'bike';
  else if (weightKg <= 50) byWeight = 'three_wheeler';
  else if (weightKg <= 500) byWeight = 'pickup';
  else if (weightKg <= 7000) byWeight = 'mini_truck';

  // Distance-based: find smallest vehicle that can cover the distance
  let byDistance = 'truck';
  const sorted = Object.entries(VEHICLE_RATES).sort((a, b) => a[1].maxRangeKm - b[1].maxRangeKm);
  for (const [key, v] of sorted) {
    if (distanceKm <= v.maxRangeKm) { byDistance = key; break; }
  }

  // Use stricter of the two (higher index = heavier duty)
  const order = ['bike', 'three_wheeler', 'pickup', 'mini_truck', 'truck'];
  const weightIdx = order.indexOf(byWeight);
  const distIdx = order.indexOf(byDistance);
  return order[Math.max(weightIdx, distIdx)];
}

function calcConfidence(distanceKm, product, weather, traffic) {
  let score = 0;
  const reasons = [];
  if (distanceKm > 0 && distanceKm !== 100) {
    score += 30; reasons.push('✓ Distance known');
  } else {
    reasons.push('✗ Distance estimated (default)');
  }
  if (product?.weight != null && parseFloat(product.weight) > 0) {
    score += 22; reasons.push('✓ Product weight known');
  } else {
    reasons.push('✗ Weight estimated (0.5kg default)');
  }
  if (product?.price != null && parseFloat(product.price) > 0) {
    score += 18; reasons.push('✓ Product price known');
  } else {
    reasons.push('✗ Product price unavailable');
  }
  if (weather && weather !== 'clear') {
    score += 10; reasons.push('✓ Weather factors applied');
  } else {
    reasons.push('✗ Weather: clear (default)');
  }
  if (traffic && traffic !== 'low') {
    score += 10; reasons.push('✓ Traffic factors applied');
  } else {
    reasons.push('✗ Traffic: low (default)');
  }
  score = Math.min(score, 90);
  reasons.push('✗ Real courier quote unavailable');
  reasons.push('✗ Historical route data unavailable');
  return { score, reasons };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

exports.logisticsEstimate = async (req, res) => {
  try {
    let {
      productName, productBarcode, sourceWarehouse, destWarehouse,
      quantity, weather, traffic, vehicleType,
      sourceLat, sourceLng, destLat, destLng,
    } = req.body;

    if (!sourceWarehouse || !destWarehouse) {
      return res.status(400).json({ error: 'sourceWarehouse and destWarehouse are required' });
    }

    const quantitySpecified = req.body.quantity !== undefined;
    quantity = parseInt(quantity) || 1;
    weather = weather || 'clear';
    traffic = traffic || 'low';

    // Look up product for weight/dimensions if provided
    let product = null;
    if (productName || productBarcode) {
      const pool = db.promise();
      if (productBarcode) {
        const [rows] = await pool.execute(
          `SELECT dp.p_id as id, dp.product_name, dp.barcode, dp.price, dp.weight
           FROM dispatch_product dp
           WHERE dp.barcode = ? LIMIT 1`,
          [productBarcode]
        );
        if (rows.length) product = rows[0];
      }
      if (!product && productName) {
        const like = `%${productName}%`;
        const [rows] = await db.promise().execute(
          `SELECT dp.p_id as id, dp.product_name, dp.barcode, dp.price, dp.weight
           FROM dispatch_product dp
           WHERE dp.product_name LIKE ? LIMIT 1`,
          [like]
        );
        if (rows.length) product = rows[0];
      }
    }

    // Fallback: if dispatch_product has no price, try website products
    if (product && !product.price && (productName || productBarcode)) {
      try {
        const pool = db.promise();
        const search = productBarcode || productName;
        const [wp] = await pool.execute(
          `SELECT price FROM website_products WHERE sku = ? OR barcode = ? OR product_name LIKE ? LIMIT 1`,
          [search, search, `%${productName || product.barcode || ''}%`]
        );
        if (wp.length && wp[0].price) {
          product = { ...product, price: wp[0].price };
        }
      } catch (_) {}
    }

    const weightKg = product?.weight ? parseFloat(product.weight) * quantity : DEFAULT_WEIGHT_KG * quantity;

    let volWeightKg = 0;
    if (product && product.length_cm > 0 && product.width_cm > 0 && product.height_cm > 0) {
      volWeightKg = (product.length_cm * product.width_cm * product.height_cm * quantity) / 5000;
    }
    const chargeableWeightKg = Math.max(weightKg, volWeightKg);

    // Distance calculation
    let distanceKm = 0;
    if (sourceLat && sourceLng && destLat && destLng) {
      distanceKm = Math.round(haversineKm(sourceLat, sourceLng, destLat, destLng));
    } else {
      // Try to get coordinates from warehouse_coordinates cache
      let srcLat = 0, srcLng = 0, dstLat = 0, dstLng = 0;
      try {
        const pool = db.promise();
        const [srcRows] = await pool.execute(
          `SELECT latitude, longitude FROM warehouse_coordinates WHERE warehouse_code = ? LIMIT 1`,
          [sourceWarehouse]
        );
        if (srcRows.length) { srcLat = parseFloat(srcRows[0].latitude); srcLng = parseFloat(srcRows[0].longitude); }
      } catch (_) {}

      try {
        const pool = db.promise();
        const [dstRows] = await pool.execute(
          `SELECT latitude, longitude FROM warehouse_coordinates WHERE warehouse_code = ? LIMIT 1`,
          [destWarehouse]
        );
        if (dstRows.length) { dstLat = parseFloat(dstRows[0].latitude); dstLng = parseFloat(dstRows[0].longitude); }
      } catch (_) {}

      if (srcLat && srcLng && dstLat && dstLng) {
        distanceKm = Math.round(haversineKm(parseFloat(srcLat), parseFloat(srcLng), parseFloat(dstLat), parseFloat(dstLng)));
      } else {
        // Fallback: estimate distance based on common routes or use a default
        distanceKm = 100;
      }
    }

    const suggestedVehicle = vehicleType || selectVehicle(chargeableWeightKg, distanceKm);
    const vehicle = VEHICLE_RATES[suggestedVehicle] || VEHICLE_RATES.pickup;

    const baseFare = vehicle.baseFare;
    const distanceCost = distanceKm * vehicle.perKmRate;
    const weightCost = chargeableWeightKg * vehicle.perKgRate;
    const vehicleCost = vehicle.vehicleCost;

    const dieselPrice = DIESEL_BASE_PRICE;
    let fuelAdj = 0;
    if (dieselPrice > DIESEL_BASE_PRICE) {
      const diff = dieselPrice - DIESEL_BASE_PRICE;
      fuelAdj = Math.round(diff * FAF_RATE * (distanceCost + weightCost));
    }

    const weatherMult = WEATHER_MULT[weather] || 1.0;
    const trafficMult = TRAFFIC_MULT[traffic] || 1.0;

    const subtotal = Math.round((baseFare + distanceCost + weightCost + vehicleCost + fuelAdj) * weatherMult * trafficMult);
    const gst = Math.round(subtotal * GST_RATE);
    const total = subtotal + gst;

    // Transfer decision
    const pendingOrders = quantitySpecified ? quantity : Math.max(50, quantity);
    const priceKnown = product?.price != null && parseFloat(product.price) > 0;
    const avgSellingPrice = priceKnown ? parseFloat(product.price) : 0;
    const revenueSaved = priceKnown ? pendingOrders * avgSellingPrice : null;
    const netBenefit = revenueSaved !== null ? revenueSaved - total : null;
    const transferScore = (revenueSaved !== null && total > 0) ? revenueSaved / total : null;

    let recommendation = 'insufficient_data';
    if (revenueSaved !== null && transferScore !== null) {
      if (transferScore > 1.2) recommendation = 'transfer';
      else if (transferScore > 0.8) recommendation = 'consider';
      else recommendation = 'do_not_transfer';
    }

    const confidence = calcConfidence(distanceKm, product, weather, traffic);

    res.json({
      success: true,
      source: sourceWarehouse,
      destination: destWarehouse,
      distanceKm,
      product: product ? {
        name: product.product_name,
        barcode: product.barcode,
        weightKg: product.weight || null,
        price: product.price || null,
      } : null,
      quantity,
      totalWeightKg: Math.round(weightKg * 100) / 100,
      volumetricWeightKg: Math.round(volWeightKg * 100) / 100,
      chargeableWeightKg: Math.round(chargeableWeightKg * 100) / 100,
      vehicleSuggested: suggestedVehicle,
      vehicleLabel: vehicle.label,
      costBreakdown: {
        baseFare,
        distanceCost: Math.round(distanceCost),
        weightCost: Math.round(weightCost),
        vehicleCost,
        fuelAdjustment: fuelAdj,
        weatherMultiplier: weatherMult,
        trafficMultiplier: trafficMult,
        subtotal,
        gst,
        total,
      },
      transferAnalysis: {
        pendingOrders,
        avgSellingPrice,
        revenueSaved,
        netBenefit,
        transferScore: transferScore !== null ? Math.round(transferScore * 100) / 100 : null,
        recommendation,
        priceKnown,
      },
      confidence,
    });
  } catch (err) {
    console.error('logistics-estimate error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.geocodeWarehouse = async (req, res) => {
  try {
    const { q, city } = req.query;
    if (!q) return res.status(400).json({ error: 'query param q required' });

    const searchQuery = city || q;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'VeruInventory/1.0' } });
    const data = await response.json();

    if (!data?.length) {
      return res.json({ success: false, places: [] });
    }

    const place = data[0];
    const lat = place.lat;
    const lng = place.lon;
    const address = place.display_name || '';

    // Cache in warehouse_coordinates table
    try {
      const pool = db.promise();
      await pool.execute(
        `CREATE TABLE IF NOT EXISTS warehouse_coordinates (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          warehouse_code VARCHAR(100) NOT NULL,
          latitude DECIMAL(10,8),
          longitude DECIMAL(11,8),
          address TEXT,
          cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_warehouse (warehouse_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      );
      await pool.execute(
        `INSERT INTO warehouse_coordinates (warehouse_code, latitude, longitude, address)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), address = VALUES(address), cached_at = CURRENT_TIMESTAMP`,
        [q, lat, lng, address]
      );
    } catch (cacheErr) {
      console.warn('Failed to cache coordinates:', cacheErr.message);
    }

    res.json({ success: true, lat, lng, address });
  } catch (err) {
    console.error('geocode error:', err);
    res.status(500).json({ error: err.message });
  }
};
