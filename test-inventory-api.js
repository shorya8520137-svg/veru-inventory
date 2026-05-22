// Test inventory API to diagnose AI agent issue
const API_BASE = 'https://api.giftgala.in';

async function testInventoryAPI() {
    console.log('🧪 Testing Inventory API...\n');

    // Test 1: Get all inventory
    console.log('📦 Test 1: Get all inventory');
    try {
        const response = await fetch(`${API_BASE}/api/inventory`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Total items:', data.data?.length || 0);
        
        if (data.data && data.data.length > 0) {
            console.log('\n📊 Sample inventory item:');
            console.log(JSON.stringify(data.data[0], null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 2: Get inventory for specific warehouse
    console.log('\n\n📦 Test 2: Get inventory for "gandu nagar" warehouse');
    try {
        const params = new URLSearchParams({
            warehouse: 'test-01' // warehouse code for "gandu nagar"
        });
        
        const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Total items:', data.data?.length || 0);
        
        if (data.data && data.data.length > 0) {
            console.log('\n📊 Sample items:');
            data.data.slice(0, 3).forEach((item, i) => {
                console.log(`\n${i + 1}. ${item.product || item.product_name}`);
                console.log(`   Barcode: ${item.code || item.barcode}`);
                console.log(`   Stock: ${item.stock || item.qty || 0}`);
                console.log(`   Warehouse: ${item.warehouse || item.warehouse_code}`);
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 3: Search for specific product
    console.log('\n\n📦 Test 3: Search for "Aashirvaad Atta"');
    try {
        const params = new URLSearchParams({
            search: 'Aashirvaad'
        });
        
        const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Total items found:', data.data?.length || 0);
        
        if (data.data && data.data.length > 0) {
            console.log('\n📊 Found items:');
            data.data.forEach((item, i) => {
                console.log(`\n${i + 1}. ${item.product || item.product_name}`);
                console.log(`   Barcode: ${item.code || item.barcode}`);
                console.log(`   Stock: ${item.stock || item.qty || 0}`);
                console.log(`   Warehouse: ${item.warehouse || item.warehouse_code}`);
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 4: Check what N8N webhook expects
    console.log('\n\n🔗 Test 4: What N8N webhook should receive');
    console.log('The AI agent webhook at:');
    console.log('http://13.215.172.213:5678/webhook/6cc5c704-0ebe-4779-a00d-16c7cee83ac8');
    console.log('\nShould be configured to:');
    console.log('1. Parse user query for warehouse name or product name');
    console.log('2. Call: GET https://api.giftgala.in/api/inventory?warehouse=CODE or ?search=PRODUCT');
    console.log('3. Format response with stock information');
    console.log('\n💡 The webhook needs to be updated in N8N to call the inventory API!');
}

testInventoryAPI();
