// Test Warehouse API using native fetch (Node.js 18+)

async function testWarehouseAPI() {
  try {
    console.log('🔍 Testing Warehouse API...');
    
    const token = process.env.TEST_TOKEN || 'your-test-token-here';
    
    console.log(' Endpoint: http://localhost:5000/api/permissions/warehouses');
    
    const response = await fetch('http://localhost:5000/api/permissions/warehouses', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        console.log(`\n🏭 Found ${data.data.length} warehouses:`);
        data.data.forEach(wh => {
          console.log(`   - ${wh.warehouse_code}: ${wh.warehouse_name}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log(' Error Response:', errorText);
    }
  } catch (error) {
    console.error(' Test failed:', error.message);
  }
}

testWarehouseAPI();
