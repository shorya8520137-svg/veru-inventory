const { exec } = require('child_process');
const fs = require('fs');

async function sshDatabaseAnalysis() {
    console.log('🔍 Starting SSH database analysis...');
    
    const sshCommand = `ssh -i "C:\\Users\\singh\\.ssh\\pem.pem" ubuntu@54.254.254.75`;
    
    // Create the analysis script to run on server
    const analysisScript = `
#!/bin/bash
echo "🔍 Starting database analysis on server..."

# Connect to MySQL and run analysis
mysql -u inventory_user -p'${process.env.DB_PASSWORD || 'your_password'}' inventory_db << 'EOF'

-- Get all tables
SELECT 'TABLES:' as info;
SHOW TABLES;

-- Analyze self_transfer table
SELECT 'SELF_TRANSFER_SUMMARY:' as info;
SELECT transfer_type, source_location, destination_location, status, COUNT(*) as count
FROM self_transfer 
GROUP BY transfer_type, source_location, destination_location, status
ORDER BY count DESC;

-- Check store inventory
SELECT 'STORE_INVENTORY_SUMMARY:' as info;
SELECT category, COUNT(*) as count, SUM(stock) as total_stock
FROM store_inventory 
GROUP BY category
ORDER BY count DESC;

-- Check for W to W in store systems
SELECT 'W_TO_W_IN_STORE_SYSTEMS:' as info;
SELECT st.transfer_reference, st.transfer_type, st.source_location, st.destination_location
FROM self_transfer st
WHERE st.transfer_type = 'W to W'
AND (
    EXISTS (SELECT 1 FROM bills b WHERE b.invoice_number = st.transfer_reference)
    OR EXISTS (SELECT 1 FROM inventory_ledger_base ilb WHERE ilb.reference = st.transfer_reference AND ilb.location_code NOT LIKE 'WH%')
)
LIMIT 10;

-- Check products with "Transferred" names
SELECT 'TRANSFERRED_PRODUCTS:' as info;
SELECT barcode, product_name, category, stock
FROM store_inventory 
WHERE product_name = 'Transferred' OR category = 'Transferred'
LIMIT 10;

-- Check timeline entries for self transfers
SELECT 'TIMELINE_SELF_TRANSFERS:' as info;
SELECT movement_type, direction, location_code, COUNT(*) as count
FROM inventory_ledger_base 
WHERE movement_type = 'SELF_TRANSFER'
GROUP BY movement_type, direction, location_code
ORDER BY count DESC;

-- Check billing entries related to transfers
SELECT 'BILLING_TRANSFERS:' as info;
SELECT bill_type, payment_mode, COUNT(*) as count
FROM bills 
WHERE bill_type LIKE '%transfer%' OR payment_mode = 'transfer'
GROUP BY bill_type, payment_mode;

-- Get table structures for key tables
SELECT 'SELF_TRANSFER_STRUCTURE:' as info;
DESCRIBE self_transfer;

SELECT 'SELF_TRANSFER_ITEMS_STRUCTURE:' as info;
DESCRIBE self_transfer_items;

SELECT 'STORE_INVENTORY_STRUCTURE:' as info;
DESCRIBE store_inventory;

SELECT 'BILLS_STRUCTURE:' as info;
DESCRIBE bills;

SELECT 'INVENTORY_LEDGER_BASE_STRUCTURE:' as info;
DESCRIBE inventory_ledger_base;

-- Sample data from key tables
SELECT 'SELF_TRANSFER_SAMPLE:' as info;
SELECT * FROM self_transfer ORDER BY created_at DESC LIMIT 3;

SELECT 'SELF_TRANSFER_ITEMS_SAMPLE:' as info;
SELECT * FROM self_transfer_items LIMIT 3;

SELECT 'STORE_INVENTORY_SAMPLE:' as info;
SELECT * FROM store_inventory LIMIT 3;

EOF
`;

    // Write the script to a temporary file
    fs.writeFileSync('temp_analysis.sh', analysisScript);
    
    console.log('📤 Uploading analysis script to server...');
    
    // Upload and run the script
    const uploadCommand = `scp -i "C:\\Users\\singh\\.ssh\\pem.pem" temp_analysis.sh ubuntu@54.254.254.75:~/analysis.sh`;
    
    return new Promise((resolve, reject) => {
        exec(uploadCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Upload error:', error);
                reject(error);
                return;
            }
            
            console.log('✅ Script uploaded, running analysis...');
            
            // Run the analysis script on server
            const runCommand = `${sshCommand} "chmod +x ~/analysis.sh && ~/analysis.sh"`;
            
            exec(runCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Analysis error:', error);
                    reject(error);
                    return;
                }
                
                console.log('✅ Analysis completed, saving results...');
                
                // Save the results
                const analysisResults = `# DATABASE ANALYSIS RESULTS
Generated: ${new Date().toISOString()}

## Raw Output
\`\`\`
${stdout}
\`\`\`

## Error Output (if any)
\`\`\`
${stderr}
\`\`\`
`;
                
                fs.writeFileSync('veru-inventory-main/DATABASE_SSH_ANALYSIS.md', analysisResults);
                
                // Clean up
                fs.unlinkSync('temp_analysis.sh');
                
                console.log('✅ Analysis saved to DATABASE_SSH_ANALYSIS.md');
                resolve(stdout);
            });
        });
    });
}

// Alternative: Create a simpler MySQL dump command
function createMySQLDumpCommand() {
    const dumpScript = `
#!/bin/bash
echo "Creating MySQL dump..."

# Create structure dump
mysqldump -u inventory_user -p'${process.env.DB_PASSWORD || 'your_password'}' --no-data inventory_db > /tmp/structure.sql

# Create data dump for key tables
mysqldump -u inventory_user -p'${process.env.DB_PASSWORD || 'your_password'}' inventory_db self_transfer self_transfer_items store_inventory bills inventory_ledger_base > /tmp/data.sql

# Combine and compress
cat /tmp/structure.sql /tmp/data.sql | gzip > /tmp/database_backup.sql.gz

echo "Database backup created at /tmp/database_backup.sql.gz"
`;

    fs.writeFileSync('veru-inventory-main/create_dump.sh', dumpScript);
    console.log('✅ MySQL dump script created: create_dump.sh');
    console.log('📋 To use: Upload this script to server and run it');
}

// Run the analysis
if (require.main === module) {
    console.log('🚀 Choose analysis method:');
    console.log('1. SSH Analysis (requires working SSH)');
    console.log('2. Create MySQL dump script');
    
    // For now, create both
    createMySQLDumpCommand();
    
    // Try SSH analysis
    sshDatabaseAnalysis().catch(error => {
        console.error('❌ SSH analysis failed:', error.message);
        console.log('💡 Use the create_dump.sh script instead');
    });
}

module.exports = { sshDatabaseAnalysis, createMySQLDumpCommand };