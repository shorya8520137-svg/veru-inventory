require('dotenv').config();
const ShipmentService = require('./src/logistics/services/shipment.service');

async function runTest() {
  console.log("🚀 Starting Logistics Engine Test...");

  const tenantId = 'TENANT-001';

  const mockPayload = {
    order_id: `ORD-${Date.now()}`,
    customer_name: "John Doe",
    phone: "9876543210",
    address: "123 Test Street, Block B",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001",
    weight: 1.5,
    dimensions: { length: 15, width: 10, height: 10 },
    payment_mode: "PREPAID",
    amount: 1500.00
  };

  console.log(`\n📦 Sending Dispatch Request for Order: ${mockPayload.order_id}`);
  
  // Notice we use the Service layer directly here, skipping Express
  // This will check balance, deduct 50 INR, query AI routing (Cheapest -> Shiprocket), and hit the API
  const result = await ShipmentService.createDispatch(tenantId, mockPayload);

  if (result.success) {
    console.log("✅ Dispatch Successful!");
    console.log(`   Shipment ID: ${result.shipment_id}`);
    console.log(`   Assigned Courier: ${result.courier}`);
    console.log(`   Wallet Deduction TXN: ${result.wallet_transaction}`);
  } else {
    console.log("❌ Dispatch Failed!");
    console.log(`   Reason: ${result.error}`);
    console.log(`   Note: Ensure your wallet has funds and the database is configured.`);
  }

  process.exit();
}

runTest();
