/**
 * PROFILE ISSUE DIAGNOSTIC SCRIPT
 * Run this on the server to check database and API
 */

const db = require('./db/connection');

console.log('🔍 DIAGNOSING PROFILE ISSUE...\n');

// Step 1: Check users table structure
console.log('📋 Step 1: Checking users table structure...');
db.query('DESCRIBE users', (err, columns) => {
    if (err) {
        console.error('❌ Error describing users table:', err);
        return;
    }
    
    console.log('✅ Users table columns:');
    columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
    });
    console.log('');
    
    // Step 2: Check all users in database
    console.log('📋 Step 2: Checking all users in database...');
    db.query('SELECT id, name, email, role_id, is_active, created_at FROM users', (err, users) => {
        if (err) {
            console.error('❌ Error fetching users:', err);
            return;
        }
        
        console.log(`✅ Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role_id}, Active: ${user.is_active}`);
        });
        console.log('');
        
        // Step 3: Check if avatar/profile_image column exists
        console.log('📋 Step 3: Checking for avatar/profile_image column...');
        const hasAvatar = columns.find(col => col.Field === 'avatar');
        const hasProfileImage = columns.find(col => col.Field === 'profile_image');
        
        if (!hasAvatar && !hasProfileImage) {
            console.log('⚠️  WARNING: No avatar or profile_image column found!');
            console.log('   Need to add avatar column to users table');
        } else {
            console.log(`✅ Found image column: ${hasAvatar ? 'avatar' : 'profile_image'}`);
        }
        console.log('');
        
        // Step 4: Check roles table
        console.log('📋 Step 4: Checking roles table...');
        db.query('SELECT id, name, display_name FROM roles', (err, roles) => {
            if (err) {
                console.error('❌ Error fetching roles:', err);
                return;
            }
            
            console.log(`✅ Found ${roles.length} roles:`);
            roles.forEach(role => {
                console.log(`   - ID: ${role.id}, Name: ${role.name}, Display: ${role.display_name}`);
            });
            console.log('');
            
            // Step 5: Test profile query for user ID 1
            console.log('📋 Step 5: Testing profile query for user ID 1...');
            const testQuery = `
                SELECT u.id, u.name, u.email, u.avatar, u.created_at, r.name as role_name
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `;
            
            db.query(testQuery, [1], (err, result) => {
                if (err) {
                    console.error('❌ Error testing profile query:', err);
                    return;
                }
                
                if (result.length === 0) {
                    console.log('⚠️  No user found with ID 1');
                } else {
                    console.log('✅ Profile query result for user ID 1:');
                    console.log(JSON.stringify(result[0], null, 2));
                }
                console.log('');
                
                // Step 6: Check if phone and address columns exist
                console.log('📋 Step 6: Checking for phone and address columns...');
                const hasPhone = columns.find(col => col.Field === 'phone');
                const hasAddress = columns.find(col => col.Field === 'address');
                
                if (!hasPhone) {
                    console.log('⚠️  WARNING: No phone column found!');
                }
                if (!hasAddress) {
                    console.log('⚠️  WARNING: No address column found!');
                }
                
                if (hasPhone && hasAddress) {
                    console.log('✅ Phone and address columns exist');
                }
                console.log('');
                
                // Summary
                console.log('📊 SUMMARY:');
                console.log('='.repeat(50));
                console.log(`Total users: ${users.length}`);
                console.log(`Total roles: ${roles.length}`);
                console.log(`Avatar column: ${hasAvatar ? '✅ EXISTS' : '❌ MISSING'}`);
                console.log(`Profile_image column: ${hasProfileImage ? '✅ EXISTS' : '❌ MISSING'}`);
                console.log(`Phone column: ${hasPhone ? '✅ EXISTS' : '❌ MISSING'}`);
                console.log(`Address column: ${hasAddress ? '✅ EXISTS' : '❌ MISSING'}`);
                console.log('='.repeat(50));
                
                // Recommendations
                console.log('\n💡 RECOMMENDATIONS:');
                if (!hasAvatar && !hasProfileImage) {
                    console.log('1. Add avatar column: ALTER TABLE users ADD COLUMN avatar VARCHAR(500) AFTER email;');
                }
                if (!hasPhone) {
                    console.log('2. Add phone column: ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER email;');
                }
                if (!hasAddress) {
                    console.log('3. Add address column: ALTER TABLE users ADD COLUMN address TEXT AFTER phone;');
                }
                
                process.exit(0);
            });
        });
    });
});
