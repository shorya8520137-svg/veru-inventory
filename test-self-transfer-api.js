/**
 * Self Transfer API Test Script
 * Tests all Self Transfer and Timeline endpoints
 */

const API_BASE = 'https://api.giftgala.in';

// Mock token (replace with real token from login)
const TOKEN = 'your_jwt_token_here';

const tests = [
    {
        name: 'Get All Transfers',
        method: 'GET',
        endpoint: '/api/self-transfer',
        body: null
    },
    {
        name: 'Get Timeline Events',
        method: 'GET',
        endpoint: '/api/timeline?entityType=warehouse&entityId=1',
        body: null
    },
    {
        name: 'Get Timeline Summary',
        method: 'GET',
        endpoint: '/api/timeline/summary/warehouse/1',
        body: null
    },
    {
        name: 'Create Transfer (Warehouse to Store)',
        method: 'POST',
        endpoint: '/api/self-transfer',
        body: {
            sourceType: 'warehouse',
            sourceId: 1,
            destinationType: 'store',
            destinationId: 1,
            items: [
                {
                    productId: 1,
                    transferQty: 10,
                    unit: 'pcs'
                }
            ],
            requiresShipment: true,
            courierPartner: 'fedex',
            estimatedDelivery: '2026-04-30',
            notes: 'Test transfer'
        }
    },
    {
        name: 'Get Warehouses',
        method: 'GET',
        endpoint: '/api/warehouse-management/warehouses',
        body: null
    },
    {
        name: 'Get Stores',
        method: 'GET',
        endpoint: '/api/warehouse-management/stores',
        body: null
    }
];

async function runTests() {
    console.log('========================================');
    console.log('Self Transfer API Test Suite');
    console.log('========================================\n');

    for (const test of tests) {
        console.log(`Testing: ${test.name}`);
        console.log(`${test.method} ${test.endpoint}`);

        try {
            const options = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                }
            };

            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            const response = await fetch(`${API_BASE}${test.endpoint}`, options);
            const data = await response.json();

            if (response.ok) {
                console.log('✅ SUCCESS');
                console.log('Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...\n');
            } else {
                console.log('❌ FAILED');
                console.log('Status:', response.status);
                console.log('Error:', data.message || data.error, '\n');
            }
        } catch (error) {
            console.log('❌ ERROR');
            console.log('Message:', error.message, '\n');
        }
    }

    console.log('========================================');
    console.log('Test Suite Complete');
    console.log('========================================');
}

// Run tests
runTests();
