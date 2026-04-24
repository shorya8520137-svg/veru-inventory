const mysql = require('mysql2/promise');
const fs = require('fs');

async function downloadAndAnalyzeDatabase() {
    console.log('🔍 Starting complete database analysis...');
    
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'inventory_user',
        password: process.env.DB_PASSWORD,
        database: 'inventory_db'
    });

    try {
        // 1. Get all tables
        console.log('\n📋 GETTING ALL TABLES...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables found:', tables.length);
        
        let analysis = '# COMPLETE DATABASE ANALYSIS\n\n';
        analysis += `Generated: ${new Date().toISOString()}\n\n`;
        
        // 2. Analyze each table structure
        analysis += '## TABLE STRUCTURES\n\n';
        
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            console.log(`\n🔍 Analyzing table: ${tableName}`);
            
            // Get table structure
            const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
            
            // Get row count
            const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            const rowCount = countResult[0].count;
            
            analysis += `### ${tableName} (${rowCount} rows)\n\n`;
            analysis += '| Field | Type | Null | Key | Default | Extra |\n';
            analysis += '|-------|------|------|-----|---------|-------|\n';
            
            structure.forEach(col => {
                analysis += `| ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'} | ${col.Extra} |\n`;
            });
            analysis += '\n';
            
            // Get sample data for key tables
            if (['self_transfer', 'self_transfer_items', 'store_inventory', 'bills', 'inventory_ledger_base'].includes(tableName)) {
                console.log(`📊 Getting sample data from ${tableName}...`);
                const [sampleData] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 5`);
                
                if (sampleData.length > 0) {
                    analysis += `#### Sample Data (${tableName})\n\n`;
                    analysis += '```json\n';
                    analysis += JSON.stringify(sampleData, null, 2);
                    analysis += '\n```\n\n';
                }
            }
        }
        
        // 3. Analyze self-transfer related data
        analysis += '## SELF-TRANSFER ANALYSIS\n\n';
        
        // Check existing self_transfer records
        const [selfTransfers] = await connection.execute(`
            SELECT transfer_type, source_location, destination_location, status, COUNT(*) as count
            FROM self_transfer 
            GROUP BY transfer_type, source_location, destination_location, status
            ORDER BY count DESC
        `);
        
        analysis += '### Self Transfer Summary\n\n';
        analysis += '| Transfer Type | Source | Destination | Status | Count |\n';
        analysis += '|---------------|--------|-------------|-----------|-------|\n';
        selfTransfers.forEach(row => {
            analysis += `| ${row.transfer_type} | ${row.source_location} | ${row.destination_location} | ${row.status} | ${row.count} |\n`;
        });
        analysis += '\n';
        
        // Check store inventory entries
        const [storeInventory] = await connection.execute(`
            SELECT category, COUNT(*) as count, SUM(stock) as total_stock
            FROM store_inventory 
            GROUP BY category
            ORDER BY count DESC
        `);
        
        analysis += '### Store Inventory Summary\n\n';
        analysis += '| Category | Products | Total Stock |\n';
        analysis += '|----------|----------|-------------|\n';
        storeInventory.forEach(row => {
            analysis += `| ${row.category} | ${row.count} | ${row.total_stock} |\n`;
        });
        analysis += '\n';
        
        // Check billing entries related to transfers
        const [billingTransfers] = await connection.execute(`
            SELECT bill_type, payment_mode, COUNT(*) as count
            FROM bills 
            WHERE bill_type LIKE '%transfer%' OR payment_mode = 'transfer'
            GROUP BY bill_type, payment_mode
        `);
        
        if (billingTransfers.length > 0) {
            analysis += '### Transfer-Related Billing\n\n';
            analysis += '| Bill Type | Payment Mode | Count |\n';
            analysis += '|-----------|--------------|-------|\n';
            billingTransfers.forEach(row => {
                analysis += `| ${row.bill_type} | ${row.payment_mode} | ${row.count} |\n`;
            });
            analysis += '\n';
        }
        
        // Check timeline entries for self transfers
        const [timelineTransfers] = await connection.execute(`
            SELECT movement_type, direction, location_code, COUNT(*) as count
            FROM inventory_ledger_base 
            WHERE movement_type = 'SELF_TRANSFER'
            GROUP BY movement_type, direction, location_code
            ORDER BY count DESC
        `);
        
        if (timelineTransfers.length > 0) {
            analysis += '### Timeline Self-Transfer Entries\n\n';
            analysis += '| Movement Type | Direction | Location | Count |\n';
            analysis += '|---------------|-----------|----------|-------|\n';
            timelineTransfers.forEach(row => {
                analysis += `| ${row.movement_type} | ${row.direction} | ${row.location_code} | ${row.count} |\n`;
            });
            analysis += '\n';
        }
        
        // 4. Check for potential issues
        analysis += '## POTENTIAL ISSUES TO ADDRESS\n\n';
        
        // Check for W to W transfers in store systems
        const [wToWInStore] = await connection.execute(`
            SELECT st.transfer_reference, st.transfer_type, st.source_location, st.destination_location
            FROM self_transfer st
            WHERE st.transfer_type = 'W to W'
            AND (
                EXISTS (SELECT 1 FROM bills b WHERE b.invoice_number = st.transfer_reference)
                OR EXISTS (SELECT 1 FROM inventory_ledger_base ilb WHERE ilb.reference = st.transfer_reference AND ilb.location_code NOT LIKE 'WH%')
            )
            LIMIT 10
        `);
        
        if (wToWInStore.length > 0) {
            analysis += '### ⚠️ W to W Transfers Found in Store Systems\n\n';
            analysis += 'These W to W transfers should NOT appear in store billing or store timeline:\n\n';
            wToWInStore.forEach(row => {
                analysis += `- ${row.transfer_reference}: ${row.source_location} → ${row.destination_location}\n`;
            });
            analysis += '\n';
        }
        
        // Check for products with "Transferred" names
        const [transferredProducts] = await connection.execute(`
            SELECT barcode, product_name, category, stock
            FROM store_inventory 
            WHERE product_name = 'Transferred' OR category = 'Transferred'
            LIMIT 10
        `);
        
        if (transferredProducts.length > 0) {
            analysis += '### ⚠️ Products with "Transferred" Names\n\n';
            analysis += 'These products need proper names:\n\n';
            transferredProducts.forEach(row => {
                analysis += `- ${row.barcode}: "${row.product_name}" (${row.category}) - Stock: ${row.stock}\n`;
            });
            analysis += '\n';
        }
        
        // 5. Recommendations
        analysis += '## IMPLEMENTATION RECOMMENDATIONS\n\n';
        analysis += '1. **W to W Transfer Isolation**: Ensure W to W transfers only create records in:\n';
        analysis += '   - `self_transfer` table\n';
        analysis += '   - `self_transfer_items` table\n';
        analysis += '   - NO entries in `bills`, `store_inventory`, or store-related `inventory_ledger_base`\n\n';
        
        analysis += '2. **Store-Based Transfer Documentation**: For S to W, W to S, S to S transfers:\n';
        analysis += '   - Update `store_inventory` (create/update products)\n';
        analysis += '   - Create `bills` entries for documentation\n';
        analysis += '   - Create `inventory_ledger_base` entries for timeline\n\n';
        
        analysis += '3. **Product Name Fixes**: Update products with "Transferred" names to actual product names from `dispatch_product`\n\n';
        
        analysis += '4. **Location Code Standards**: Ensure consistent location codes (WH for warehouses, ST for stores)\n\n';
        
        // Save analysis
        fs.writeFileSync('veru-inventory-main/DATABASE_COMPLETE_ANALYSIS.md', analysis);
        console.log('\n✅ Complete database analysis saved to DATABASE_COMPLETE_ANALYSIS.md');
        
        // Create backup SQL
        console.log('\n💾 Creating database backup...');
        const backupSql = await createDatabaseBackup(connection);
        fs.writeFileSync('veru-inventory-main/database_backup_complete.sql', backupSql);
        console.log('✅ Database backup saved to database_backup_complete.sql');
        
    } catch (error) {
        console.error('❌ Database analysis error:', error);
    } finally {
        await connection.end();
    }
}

async function createDatabaseBackup(connection) {
    let backup = '-- COMPLETE DATABASE BACKUP\n';
    backup += `-- Generated: ${new Date().toISOString()}\n\n`;
    
    // Get all tables
    const [tables] = await connection.execute('SHOW TABLES');
    
    for (const table of tables) {
        const tableName = Object.values(table)[0];
        console.log(`📦 Backing up table: ${tableName}`);
        
        // Get CREATE TABLE statement
        const [createTable] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
        backup += `-- Table: ${tableName}\n`;
        backup += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        backup += createTable[0]['Create Table'] + ';\n\n';
        
        // Get data
        const [data] = await connection.execute(`SELECT * FROM ${tableName}`);
        if (data.length > 0) {
            backup += `-- Data for ${tableName}\n`;
            
            // Get column names
            const columns = Object.keys(data[0]);
            const columnList = columns.map(col => `\`${col}\``).join(', ');
            
            backup += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n`;
            
            const values = data.map(row => {
                const rowValues = columns.map(col => {
                    const value = row[col];
                    if (value === null) return 'NULL';
                    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                    if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                    return value;
                });
                return `(${rowValues.join(', ')})`;
            });
            
            backup += values.join(',\n') + ';\n\n';
        }
    }
    
    return backup;
}

// Run the analysis
if (require.main === module) {
    downloadAndAnalyzeDatabase().catch(console.error);
}

module.exports = { downloadAndAnalyzeDatabase };