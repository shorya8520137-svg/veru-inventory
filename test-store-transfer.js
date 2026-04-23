/**
 * SIMPLE STORE TRANSFER TEST
 * Tests W to S transfer with store inventory updates and billing
 */

console.log('🧪 Testing Store Transfer via SSH...\n');

// Test data for W to S transfer
const testTransfer = {
    sourceType: 'warehouse',
    sourceId: 'BLR_WH',
    destinationType: 'store',
    destinationId: 'BLR_BROOKEFIELD',
    items: [
        {
            productId: 'Unknown Product | | 2460-3499',
            transferQty: 2
        }
    ],
    notes: 'Test W to S transfer'
};

console.log('Test Transfer Data:');
console.log(JSON.stringify(testTransfer, null, 2));

console.log('\n📋 Steps to test manually:');
console.log('1. Check warehouse inventory: SELECT * FROM inventory WHERE code = "2460-3499"');
console.log('2. Check store inventory before: SELECT * FROM store_inventory WHERE barcode = "2460-3499"');
console.log('3. Make API call to: POST https://api.giftgala.in/api/self-transfer');
console.log('4. Check store inventory after: SELECT * FROM store_inventory WHERE barcode = "2460-3499"');
console.log('5. Check billing history: SELECT * FROM bills WHERE invoice_number LIKE "TRF_%"');

console.log('\n✅ Expected Results:');
console.log('- If product exists in store: stock should increase by 2');
console.log('- If product not exists in store: new product created with stock = 2');
console.log('- Billing entry created with customer_name = "Store Transfer: BLR_WH → BLR_BROOKEFIELD"');
console.log('- W to W transfers should NOT create billing entries');

console.log('\n🔧 Test this with Postman or frontend!');