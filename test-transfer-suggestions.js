const http = require('http');

// Mock token for testing
const TOKEN = 'test-token';
const API_BASE = 'http://localhost:5000';

// Test cases for different transfer types
const testCases = [
    { transferType: 'warehouse-to-warehouse', label: 'W→W' },
    { transferType: 'warehouse-to-store', label: 'W→S' },
    { transferType: 'store-to-warehouse', label: 'S→W' },
    { transferType: 'store-to-store', label: 'S→S' }
];

async function testTransferSuggestions() {
    console.log('🧪 Testing Transfer Suggestions API\n');
    console.log('=' .repeat(60));

    for (const testCase of testCases) {
        console.log(`\n📋 Testing: ${testCase.label} (${testCase.transferType})`);
        console.log('-'.repeat(60));

        try {
            const url = `${API_BASE}/api/transfer-suggestions/${testCase.transferType}`;
            console.log(`📡 URL: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📊 Status: ${response.status}`);

            const data = await response.json();
            console.log(`✅ Response received`);

            if (data.success) {
                console.log(`\n✅ SUCCESS`);
                console.log(`   Transfer Type: ${data.transferType}`);
                console.log(`   Source Type: ${data.sourceType}`);
                console.log(`   Destination Type: ${data.destinationType}`);
                console.log(`   Sources Count: ${data.sources?.length || 0}`);
                console.log(`   Destinations Count: ${data.destinations?.length || 0}`);

                if (data.sources && data.sources.length > 0) {
                    console.log(`\n   📍 Sample Sources:`);
                    data.sources.slice(0, 3).forEach((s, i) => {
                        const name = s.warehouse_name || s.store_name;
                        const code = s.warehouse_code || s.store_code;
                        console.log(`      ${i + 1}. ${name} (${code}) - ID: ${s.id}`);
                    });
                }

                if (data.destinations && data.destinations.length > 0) {
                    console.log(`\n   📍 Sample Destinations:`);
                    data.destinations.slice(0, 3).forEach((d, i) => {
                        const name = d.warehouse_name || d.store_name;
                        const code = d.warehouse_code || d.store_code;
                        console.log(`      ${i + 1}. ${name} (${code}) - ID: ${d.id}`);
                    });
                }
            } else {
                console.log(`❌ ERROR: ${data.message}`);
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed\n');
}

// Run tests
testTransferSuggestions().catch(console.error);
