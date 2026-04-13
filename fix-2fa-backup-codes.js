/**
 * FIX 2FA BACKUP CODES DATABASE ISSUE
 * Converts comma-separated backup codes to proper JSON format
 */

const db = require('./db/connection');

async function fixBackupCodes() {
    console.log('🔧 Starting 2FA backup codes fix...');
    
    return new Promise((resolve, reject) => {
        // Get all users with backup codes
        const selectQuery = `
            SELECT id, two_factor_backup_codes 
            FROM users 
            WHERE two_factor_backup_codes IS NOT NULL 
            AND two_factor_backup_codes != ''
        `;
        
        db.query(selectQuery, (err, users) => {
            if (err) {
                console.error('❌ Error fetching users:', err);
                reject(err);
                return;
            }
            
            console.log(`📊 Found ${users.length} users with backup codes`);
            
            let fixedCount = 0;
            let alreadyValidCount = 0;
            
            const promises = users.map(user => {
                return new Promise((userResolve, userReject) => {
                    let backupCodes;
                    
                    try {
                        // Try to parse as JSON first
                        backupCodes = JSON.parse(user.two_factor_backup_codes);
                        console.log(`✅ User ${user.id}: Backup codes already in JSON format`);
                        alreadyValidCount++;
                        userResolve();
                        return;
                    } catch (jsonError) {
                        // If JSON parsing fails, it's likely a comma-separated string
                        try {
                            backupCodes = user.two_factor_backup_codes.split(',').map(code => code.trim());
                            console.log(`🔄 User ${user.id}: Converting comma-separated codes to JSON`);
                            console.log(`   Original: ${user.two_factor_backup_codes}`);
                            console.log(`   Converted: ${JSON.stringify(backupCodes)}`);
                        } catch (splitError) {
                            console.error(`❌ User ${user.id}: Failed to parse backup codes:`, splitError);
                            userReject(splitError);
                            return;
                        }
                    }
                    
                    // Update the database with proper JSON format
                    const updateQuery = `
                        UPDATE users 
                        SET two_factor_backup_codes = ?
                        WHERE id = ?
                    `;
                    
                    db.query(updateQuery, [JSON.stringify(backupCodes), user.id], (updateErr) => {
                        if (updateErr) {
                            console.error(`❌ User ${user.id}: Failed to update backup codes:`, updateErr);
                            userReject(updateErr);
                        } else {
                            console.log(`✅ User ${user.id}: Backup codes fixed successfully`);
                            fixedCount++;
                            userResolve();
                        }
                    });
                });
            });
            
            Promise.all(promises)
                .then(() => {
                    console.log('\n📋 SUMMARY:');
                    console.log(`✅ Fixed: ${fixedCount} users`);
                    console.log(`✅ Already valid: ${alreadyValidCount} users`);
                    console.log(`📊 Total processed: ${users.length} users`);
                    console.log('\n🎉 2FA backup codes fix completed successfully!');
                    resolve({ fixed: fixedCount, alreadyValid: alreadyValidCount, total: users.length });
                })
                .catch(error => {
                    console.error('❌ Error during batch update:', error);
                    reject(error);
                });
        });
    });
}

async function verifyFix() {
    console.log('\n🔍 Verifying the fix...');
    
    return new Promise((resolve, reject) => {
        const verifyQuery = `
            SELECT id, two_factor_backup_codes 
            FROM users 
            WHERE two_factor_backup_codes IS NOT NULL 
            AND two_factor_backup_codes != ''
        `;
        
        db.query(verifyQuery, (err, users) => {
            if (err) {
                console.error('❌ Error during verification:', err);
                reject(err);
                return;
            }
            
            let validCount = 0;
            let invalidCount = 0;
            
            users.forEach(user => {
                try {
                    const parsed = JSON.parse(user.two_factor_backup_codes);
                    if (Array.isArray(parsed)) {
                        validCount++;
                        console.log(`✅ User ${user.id}: Valid JSON array with ${parsed.length} codes`);
                    } else {
                        invalidCount++;
                        console.log(`❌ User ${user.id}: JSON but not an array`);
                    }
                } catch (error) {
                    invalidCount++;
                    console.log(`❌ User ${user.id}: Invalid JSON format`);
                }
            });
            
            console.log('\n📊 VERIFICATION RESULTS:');
            console.log(`✅ Valid: ${validCount} users`);
            console.log(`❌ Invalid: ${invalidCount} users`);
            
            if (invalidCount === 0) {
                console.log('🎉 All backup codes are now in proper JSON format!');
            } else {
                console.log('⚠️ Some backup codes still need manual fixing');
            }
            
            resolve({ valid: validCount, invalid: invalidCount });
        });
    });
}

async function main() {
    try {
        console.log('🚀 Starting 2FA backup codes database fix...\n');
        
        // Fix the backup codes
        await fixBackupCodes();
        
        // Verify the fix
        await verifyFix();
        
        console.log('\n✅ Database fix completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    }
}

// Run the fix
if (require.main === module) {
    main();
}

module.exports = { fixBackupCodes, verifyFix };