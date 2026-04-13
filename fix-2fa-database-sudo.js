/**
 * FIX 2FA BACKUP CODES DATABASE ISSUE USING SUDO MYSQL
 * Fixes the JSON parsing error by using direct MySQL access
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create temporary SQL file
const createSQLFile = () => {
    const sqlContent = `
-- FIX 2FA BACKUP CODES DATABASE ISSUE
-- This script fixes the JSON parsing error

USE inventory_db;

-- Show current state
SELECT 'BEFORE FIX - Current backup codes:' as status;
SELECT 
    id, 
    name, 
    email,
    two_factor_enabled,
    two_factor_backup_codes,
    CASE 
        WHEN two_factor_backup_codes IS NULL THEN 'NULL'
        WHEN JSON_VALID(two_factor_backup_codes) = 1 THEN 'VALID JSON'
        ELSE 'INVALID JSON'
    END as backup_codes_status
FROM users 
WHERE two_factor_backup_codes IS NOT NULL 
AND two_factor_backup_codes != '';

-- Fix backup codes for user ID 1 (convert comma-separated to JSON array)
UPDATE users 
SET two_factor_backup_codes = JSON_ARRAY('CA1EAEE4','F1228D17','D619399F','2FC39886','D37E6C7A','A9B78C38','3D2575E6','B8862F4D','8D9C2BFD','6E383380')
WHERE id = 1 
AND two_factor_backup_codes LIKE '%CA1EAEE4%'
AND JSON_VALID(two_factor_backup_codes) = 0;

-- Alternative: Fix any comma-separated backup codes for all users
UPDATE users 
SET two_factor_backup_codes = CONCAT('[', 
    '"', REPLACE(two_factor_backup_codes, ',', '","'), 
    '"]')
WHERE two_factor_backup_codes IS NOT NULL 
AND two_factor_backup_codes != ''
AND two_factor_backup_codes NOT LIKE '[%'
AND JSON_VALID(two_factor_backup_codes) = 0;

-- Show results after fix
SELECT 'AFTER FIX - Updated backup codes:' as status;
SELECT 
    id, 
    name,
    two_factor_enabled,
    two_factor_backup_codes,
    JSON_VALID(two_factor_backup_codes) as is_valid_json,
    JSON_LENGTH(two_factor_backup_codes) as backup_codes_count
FROM users 
WHERE two_factor_backup_codes IS NOT NULL 
AND two_factor_backup_codes != '';

-- Test JSON parsing
SELECT 'TESTING JSON PARSING:' as status;
SELECT 
    id,
    name,
    JSON_EXTRACT(two_factor_backup_codes, '$[0]') as first_backup_code,
    JSON_EXTRACT(two_factor_backup_codes, '$[1]') as second_backup_code
FROM users 
WHERE two_factor_backup_codes IS NOT NULL 
AND JSON_VALID(two_factor_backup_codes) = 1;
`;

    const tempFile = path.join(__dirname, 'temp_fix_2fa.sql');
    fs.writeFileSync(tempFile, sqlContent);
    return tempFile;
};

// Execute SQL using sudo mysql
const executeSQLWithSudo = (sqlFile) => {
    return new Promise((resolve, reject) => {
        const command = `sudo mysql < "${sqlFile}"`;
        
        console.log('🔧 Executing SQL fix with sudo mysql...');
        console.log(`📝 Command: ${command}`);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Error executing SQL:', error);
                reject(error);
                return;
            }
            
            if (stderr) {
                console.warn('⚠️ SQL warnings:', stderr);
            }
            
            console.log('✅ SQL executed successfully');
            if (stdout) {
                console.log('📊 Results:');
                console.log(stdout);
            }
            
            resolve(stdout);
        });
    });
};

// Alternative: Direct MySQL commands
const executeDirectMySQLCommands = () => {
    const commands = [
        // Show current state
        `sudo mysql -e "USE inventory_db; SELECT id, name, two_factor_backup_codes, JSON_VALID(two_factor_backup_codes) as is_valid FROM users WHERE two_factor_backup_codes IS NOT NULL;"`,
        
        // Fix the backup codes
        `sudo mysql -e "USE inventory_db; UPDATE users SET two_factor_backup_codes = '[\\\"CA1EAEE4\\\",\\\"F1228D17\\\",\\\"D619399F\\\",\\\"2FC39886\\\",\\\"D37E6C7A\\\",\\\"A9B78C38\\\",\\\"3D2575E6\\\",\\\"B8862F4D\\\",\\\"8D9C2BFD\\\",\\\"6E383380\\\"]' WHERE id = 1 AND two_factor_backup_codes LIKE '%CA1EAEE4%';"`,
        
        // Verify the fix
        `sudo mysql -e "USE inventory_db; SELECT id, name, two_factor_backup_codes, JSON_VALID(two_factor_backup_codes) as is_valid, JSON_LENGTH(two_factor_backup_codes) as count FROM users WHERE two_factor_backup_codes IS NOT NULL;"`
    ];
    
    return commands.reduce((promise, command) => {
        return promise.then(() => {
            return new Promise((resolve, reject) => {
                console.log(`\n🔧 Executing: ${command}`);
                
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error('❌ Error:', error.message);
                        reject(error);
                        return;
                    }
                    
                    if (stderr) {
                        console.warn('⚠️ Warning:', stderr);
                    }
                    
                    if (stdout) {
                        console.log('📊 Result:');
                        console.log(stdout);
                    }
                    
                    resolve(stdout);
                });
            });
        });
    }, Promise.resolve());
};

// Test the fix by running a simple 2FA API call
const test2FAAfterFix = () => {
    return new Promise((resolve, reject) => {
        const testCommand = `node -e "
            const https = require('https');
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            
            const options = {
                hostname: '52.221.231.85',
                port: 8443,
                path: '/api/auth/login',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                rejectUnauthorized: false
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log('Login Response:', JSON.parse(data));
                    
                    if (JSON.parse(data).success) {
                        const token = JSON.parse(data).token;
                        
                        // Test 2FA status
                        const statusOptions = {
                            ...options,
                            path: '/api/2fa/status',
                            method: 'GET',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            }
                        };
                        
                        const statusReq = https.request(statusOptions, (statusRes) => {
                            let statusData = '';
                            statusRes.on('data', chunk => statusData += chunk);
                            statusRes.on('end', () => {
                                console.log('2FA Status Response:', JSON.parse(statusData));
                            });
                        });
                        
                        statusReq.end();
                    }
                });
            });
            
            req.write(JSON.stringify({email: 'admin@company.com', password: 'admin@123'}));
            req.end();
        "`;
        
        console.log('\n🧪 Testing 2FA API after database fix...');
        
        exec(testCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Test error:', error.message);
                reject(error);
                return;
            }
            
            if (stderr) {
                console.warn('⚠️ Test warning:', stderr);
            }
            
            console.log('✅ Test completed:');
            console.log(stdout);
            resolve(stdout);
        });
    });
};

// Main execution
async function main() {
    try {
        console.log('🚀 Starting 2FA database fix with sudo mysql...\n');
        
        const method = process.argv[2] || 'direct';
        
        if (method === 'file') {
            // Method 1: Create SQL file and execute
            console.log('📝 Method: SQL file execution');
            const sqlFile = createSQLFile();
            console.log(`📄 Created SQL file: ${sqlFile}`);
            
            await executeSQLWithSudo(sqlFile);
            
            // Cleanup
            fs.unlinkSync(sqlFile);
            console.log('🗑️ Cleaned up temporary SQL file');
            
        } else {
            // Method 2: Direct MySQL commands
            console.log('⚡ Method: Direct MySQL commands');
            await executeDirectMySQLCommands();
        }
        
        console.log('\n✅ Database fix completed!');
        
        // Test the API after fix
        await test2FAAfterFix();
        
        console.log('\n🎉 All done! The 2FA backup codes should now work properly.');
        
    } catch (error) {
        console.error('\n💥 Fatal error:', error.message);
        console.log('\n🔧 Manual fix commands:');
        console.log('1. sudo mysql');
        console.log('2. USE inventory_db;');
        console.log('3. UPDATE users SET two_factor_backup_codes = \'["CA1EAEE4","F1228D17","D619399F","2FC39886","D37E6C7A","A9B78C38","3D2575E6","B8862F4D","8D9C2BFD","6E383380"]\' WHERE id = 1;');
        console.log('4. SELECT * FROM users WHERE id = 1;');
        process.exit(1);
    }
}

// Run the fix
if (require.main === module) {
    main();
}

module.exports = { main, executeDirectMySQLCommands, test2FAAfterFix };