/**
 * QUICK FIX FOR 2FA TOKEN ISSUE
 * Run this on the server to debug and fix the problem
 */

const speakeasy = require('speakeasy');
const mysql = require('mysql2/promise');

async function fix2FATokenIssue() {
    console.log('🔧 Starting 2FA Token Issue Fix...\n');
    
    // Database connection
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'inventory_user',
        password: 'Inventory@2024',
        database: 'inventory_db'
    });
    
    try {
        // 1. Get user data
        console.log('1️⃣ Getting user data...');
        const [users] = await connection.execute(
            'SELECT id, email, two_factor_enabled, two_factor_secret FROM users WHERE id = 1'
        );
        
        if (users.length === 0) {
            console.log('❌ User not found');
            return;
        }
        
        const user = users[0];
        console.log('User:', user.email);
        console.log('2FA Enabled:', user.two_factor_enabled);
        console.log('Has Secret:', !!user.two_factor_secret);
        
        // 2. If no secret or invalid secret, regenerate
        if (!user.two_factor_secret || user.two_factor_secret.length < 16) {
            console.log('\n2️⃣ Regenerating 2FA secret...');
            
            const newSecret = speakeasy.generateSecret({
                name: user.email,
                issuer: 'StockIQ Inventory',
                length: 32
            });
            
            console.log('New Secret:', newSecret.base32);
            console.log('Secret Length:', newSecret.base32.length);
            
            // Update database
            await connection.execute(
                'UPDATE users SET two_factor_secret = ?, two_factor_enabled = FALSE WHERE id = ?',
                [newSecret.base32, user.id]
            );
            
            console.log('✅ New secret saved to database');
            
            // Generate QR code URL
            console.log('\n📱 New QR Code URL:');
            console.log(newSecret.otpauth_url);
            
            console.log('\n🔑 Manual Entry Key:', newSecret.base32);
            
        } else {
            console.log('\n2️⃣ Testing existing secret...');
            
            // Generate current token
            const currentToken = speakeasy.totp({
                secret: user.two_factor_secret,
                encoding: 'base32'
            });
            
            console.log('Current Expected Token:', currentToken);
            
            // Test the problematic token
            const testToken = '271743';
            console.log('\n3️⃣ Testing problematic token:', testToken);
            
            // Try with different windows
            for (let window = 0; window <= 10; window++) {
                const isValid = speakeasy.totp.verify({
                    secret: user.two_factor_secret,
                    encoding: 'base32',
                    token: testToken,
                    window: window
                });
                
                if (isValid) {
                    console.log(`✅ Token valid with window ${window}`);
                    break;
                }
            }
            
            // Try with time offsets
            console.log('\n4️⃣ Testing with time offsets...');
            const currentTime = Math.floor(Date.now() / 1000);
            
            for (let offset = -300; offset <= 300; offset += 30) {
                const adjustedTime = currentTime + offset;
                const isValid = speakeasy.totp.verify({
                    secret: user.two_factor_secret,
                    encoding: 'base32',
                    token: testToken,
                    time: adjustedTime
                });
                
                if (isValid) {
                    console.log(`✅ Token valid with ${offset}s time offset`);
                    console.log(`   Time: ${new Date(adjustedTime * 1000).toISOString()}`);
                }
            }
        }
        
        console.log('\n✅ 2FA debugging complete!');
        console.log('\n📋 Next Steps:');
        console.log('1. If a new secret was generated, scan the new QR code');
        console.log('2. Try the verification again with a fresh token');
        console.log('3. Ensure your device time is synchronized');
        
    } catch (error) {
        console.error('❌ Fix error:', error);
    } finally {
        await connection.end();
    }
}

// Run the fix
fix2FATokenIssue().catch(console.error);