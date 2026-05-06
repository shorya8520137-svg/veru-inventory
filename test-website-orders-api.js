const fetch = require('node-fetch');

const API_BASE = 'https://api.giftgala.in';

async function testWebsiteOrdersAPI() {
    try {
        console.log('🔍 Testing Website Orders API...\n');
        
        // You need to replace this with a valid token
        const token = 'YOUR_TOKEN_HERE'; // Get this from localStorage in browser
        
        const response = await fetch(`${API_BASE}/api/website/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Response Status:', response.status);
        console.log('📊 Response OK:', response.ok);
        
        const data = await response.json();
        
        console.log('\n📦 Response Structure:');
        console.log('- success:', data.success);
        console.log('- data exists:', !!data.data);
        
        if (data.data) {
            console.log('- data.orders exists:', !!data.data.orders);
            console.log('- data.orders is array:', Array.isArray(data.data.orders));
            console.log('- orders count:', data.data.orders?.length || 0);
            
            if (data.data.orders && data.data.orders.length > 0) {
                console.log('\n📋 First Order Structure:');
                const firstOrder = data.data.orders[0];
                console.log(JSON.stringify(firstOrder, null, 2));
                
                console.log('\n🔑 Available Fields:');
                Object.keys(firstOrder).forEach(key => {
                    console.log(`  - ${key}: ${typeof firstOrder[key]}`);
                });
            }
            
            if (data.data.pagination) {
                console.log('\n📄 Pagination:');
                console.log(JSON.stringify(data.data.pagination, null, 2));
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testWebsiteOrdersAPI();
