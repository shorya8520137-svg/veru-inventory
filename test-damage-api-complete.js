const https = require('https');

const API_BASE = 'https://api.giftgala.in';

// Create HTTPS agent that accepts self-signed certificates
const agent = new https.Agent({
    rejectUnauthorized: false
});

class DamageAPITester {
    constructor() {
        this.token = null;
        this.testResults = [];
    }

    async makeRequest(endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, API_BASE);
            
            const requestOptions = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                agent
            };

            const req = https.request(url, requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({
                            statusCode: res.statusCode,
                            data: JSON.parse(data)
                        });
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            data: data
                        });
                    }
                });
            });

            req.on('error', reject);
            
            if (options.body) {
                req.write(JSON.stringify(options.body));
            }
            
            req.end();
        });
    }

    log(message, type = 'INFO') {
        const colors = {
            'INFO': '\x1b[36m',
            'SUCCESS': '\x1b[32m',
            'ERROR': '\x1b[31m',
            'WARN': '\x1b[33m',
            'BOLD': '\x1b[1m'
        };
        console.log(`${colors[type]}${message}\x1b[0m`);
    }

    async login() {
        this.log('\n🔐 Logging in...', 'BOLD');
        
        try {
            const response = await this.makeRequest('/api/auth/login', {
                method: 'POST',
                body: {
                    email: 'admin@company.com',
                    password: 'Admin@123'
                }
            });

            if (response.data.token) {
                this.token = response.data.token;
                this.log('✅ Login successful!', 'SUCCESS');
                return true;
            } else {
                this.log('❌ Login failed: No token received', 'ERROR');
                return false;
            }
        } catch (error) {
            this.log(`❌ Login error: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async getProductWithStock() {
        this.log('\n📦 Using product with confirmed stock...', 'BOLD');
        
        // Using product from database query: barcode 972946773347 has 50 units in BLR_WH
        const product = {
            barcode: '972946773347',
            product_name: 'Lounge / Resort Casual Product 11',
            warehouse: 'BLR_WH'
        };
        
        this.log(`✅ Product: ${product.product_name} (${product.barcode})`, 'SUCCESS');
        return product;
    }

    async checkStockBefore(barcode, warehouse) {
        this.log(`\n📊 Checking stock BEFORE damage for ${barcode} at ${warehouse}...`, 'BOLD');
        
        try {
            const response = await this.makeRequest(
                `/api/product-tracking/${barcode}?warehouse=${warehouse}`,
                { headers: { 'Authorization': `Bearer ${this.token}` } }
            );

            if (response.statusCode === 200) {
                const stock = response.data.finalStock || 0;
                this.log(`✅ Current stock: ${stock} units`, 'SUCCESS');
                return stock;
            } else {
                this.log('⚠️ Could not fetch stock', 'WARN');
                return 0;
            }
        } catch (error) {
            this.log(`❌ Error checking stock: ${error.message}`, 'ERROR');
            return 0;
        }
    }

    async reportDamage(product, warehouse, quantity, processedBy) {
        this.log(`\n⚠️ Reporting DAMAGE: ${quantity} units of ${product.product_name} at ${warehouse}...`, 'BOLD');
        
        try {
            const response = await this.makeRequest('/api/damage-recovery/damage', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` },
                body: {
                    product_type: product.product_name,
                    barcode: product.barcode,
                    inventory_location: warehouse,
                    quantity: quantity,
                    action_type: 'damage',
                    processed_by: processedBy
                }
            });

            if (response.statusCode === 201 && response.data.success) {
                this.log('✅ Damage reported successfully!', 'SUCCESS');
                this.log(`   Damage ID: ${response.data.damage_id}`, 'INFO');
                this.log(`   Reference: ${response.data.reference}`, 'INFO');
                this.log(`   Stock Updated: ${response.data.stock_updated}`, 'INFO');
                return response.data;
            } else {
                this.log(`❌ Damage report failed: ${response.data.message || 'Unknown error'}`, 'ERROR');
                return null;
            }
        } catch (error) {
            this.log(`❌ Error reporting damage: ${error.message}`, 'ERROR');
            return null;
        }
    }

    async checkStockAfter(barcode, warehouse) {
        this.log(`\n📊 Checking stock AFTER damage for ${barcode} at ${warehouse}...`, 'BOLD');
        
        try {
            const response = await this.makeRequest(
                `/api/product-tracking/${barcode}?warehouse=${warehouse}`,
                { headers: { 'Authorization': `Bearer ${this.token}` } }
            );

            if (response.statusCode === 200) {
                const stock = response.data.finalStock || 0;
                this.log(`✅ Current stock: ${stock} units`, 'SUCCESS');
                return stock;
            } else {
                this.log('⚠️ Could not fetch stock', 'WARN');
                return 0;
            }
        } catch (error) {
            this.log(`❌ Error checking stock: ${error.message}`, 'ERROR');
            return 0;
        }
    }

    async checkTimelineEntry(barcode, warehouse) {
        this.log(`\n📋 Checking timeline entry for ${barcode} at ${warehouse}...`, 'BOLD');
        
        try {
            const response = await this.makeRequest(
                `/api/timeline/${barcode}?warehouse=${warehouse}&limit=5`,
                { headers: { 'Authorization': `Bearer ${this.token}` } }
            );

            if (response.statusCode === 200 && response.data.success) {
                const timeline = response.data.data.timeline;
                const damageEntries = timeline.filter(t => t.type === 'DAMAGE');
                
                if (damageEntries.length > 0) {
                    this.log(`✅ Found ${damageEntries.length} DAMAGE entries in timeline`, 'SUCCESS');
                    damageEntries.forEach((entry, index) => {
                        this.log(`\n   Entry ${index + 1}:`, 'INFO');
                        this.log(`   - Timestamp: ${entry.timestamp}`, 'INFO');
                        this.log(`   - Quantity: ${entry.quantity}`, 'INFO');
                        this.log(`   - Direction: ${entry.direction}`, 'INFO');
                        this.log(`   - Reference: ${entry.reference}`, 'INFO');
                        this.log(`   - Processed By: ${entry.damage_details?.processed_by || 'N/A'}`, 'INFO');
                        this.log(`   - Balance After: ${entry.balance_after}`, 'INFO');
                    });
                    return true;
                } else {
                    this.log('⚠️ No DAMAGE entries found in timeline', 'WARN');
                    return false;
                }
            } else {
                this.log('❌ Could not fetch timeline', 'ERROR');
                return false;
            }
        } catch (error) {
            this.log(`❌ Error checking timeline: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async runTests() {
        this.log('\n╔════════════════════════════════════════════════════════════╗', 'BOLD');
        this.log('║         DAMAGE API COMPREHENSIVE TEST                     ║', 'BOLD');
        this.log('╚════════════════════════════════════════════════════════════╝', 'BOLD');

        // Step 1: Login
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            this.log('\n❌ Cannot proceed without login', 'ERROR');
            return;
        }

        // Step 2: Find product with stock
        const product = await this.getProductWithStock();
        if (!product) {
            this.log('\n❌ Cannot proceed without product', 'ERROR');
            return;
        }

        // Test 1: Warehouse Damage
        this.log('\n\n═══════════════════════════════════════════════════════════', 'BOLD');
        this.log('TEST 1: WAREHOUSE DAMAGE', 'BOLD');
        this.log('═══════════════════════════════════════════════════════════', 'BOLD');

        const warehouse = 'BLR_WH';
        const warehouseQty = 2;
        const processedBy = 'Anurag Singh';

        const stockBeforeWarehouse = await this.checkStockBefore(product.barcode, warehouse);
        
        if (stockBeforeWarehouse >= warehouseQty) {
            const damageResult = await this.reportDamage(product, warehouse, warehouseQty, processedBy);
            
            if (damageResult) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                const stockAfterWarehouse = await this.checkStockAfter(product.barcode, warehouse);
                const stockDifference = stockBeforeWarehouse - stockAfterWarehouse;
                
                this.log('\n📊 WAREHOUSE DAMAGE SUMMARY:', 'BOLD');
                this.log(`   Stock Before: ${stockBeforeWarehouse}`, 'INFO');
                this.log(`   Stock After:  ${stockAfterWarehouse}`, 'INFO');
                this.log(`   Difference:   ${stockDifference}`, stockDifference === warehouseQty ? 'SUCCESS' : 'ERROR');
                this.log(`   Expected:     ${warehouseQty}`, 'INFO');
                
                if (stockDifference === warehouseQty) {
                    this.log('✅ Stock deducted correctly!', 'SUCCESS');
                } else {
                    this.log('❌ Stock deduction mismatch!', 'ERROR');
                }

                // Check timeline
                await this.checkTimelineEntry(product.barcode, warehouse);
            }
        } else {
            this.log(`⚠️ Insufficient stock (${stockBeforeWarehouse}) for warehouse test`, 'WARN');
        }

        // Test 2: Store Damage (if stores are supported)
        this.log('\n\n═══════════════════════════════════════════════════════════', 'BOLD');
        this.log('TEST 2: STORE DAMAGE (Note: Stores may not have stock_batches)', 'BOLD');
        this.log('═══════════════════════════════════════════════════════════', 'BOLD');

        const store = 'STORE001';
        const storeQty = 1;

        this.log('⚠️ Note: Store damage tracking may work differently', 'WARN');
        this.log('   Stores typically use store_timeline, not stock_batches', 'WARN');

        const damageResultStore = await this.reportDamage(product, store, storeQty, processedBy);
        
        if (damageResultStore) {
            this.log('✅ Store damage API call successful', 'SUCCESS');
            this.log('   (Stock tracking for stores may differ from warehouses)', 'INFO');
        }

        // Final Summary
        this.log('\n\n╔════════════════════════════════════════════════════════════╗', 'BOLD');
        this.log('║                    TEST COMPLETE                          ║', 'BOLD');
        this.log('╚════════════════════════════════════════════════════════════╝', 'BOLD');
    }
}

// Run tests
const tester = new DamageAPITester();
tester.runTests().catch(console.error);
