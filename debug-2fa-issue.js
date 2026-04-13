/**
 * DEBUG 2FA VERIFICATION ISSUE
 * Test script to identify why tokens are failing
 */

const speakeasy = require('speakeasy');
const mysql = require('mysql2/promise');

async function debug2FAIssue() {
    console.log('🔍 Starting 2FA Debug Analysis...\n');
    
    // Database connection
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'inventory_user',
        password: 'Inventory@2024',
        database: 'inventory_db'
    });
    
    try {
        // 1. Check user's 2FA data
        console.log('1️⃣ Checking user 2FA data in database...');
        const [users] = await connection.execute(
            'SELECT id, email, two_factor_enabled, two_factor_secret, two_factor_setup_at FROM users WHERE id = 1'
        );
        
        if (users.length === 0) {
            console.log('❌ User ID 1 not found');
            return;
        }
        
        const user = users[0];
        console.log('User Data:', {
            id: user.id,
            email: user.email,
            two_factor_enabled: user.two_factor_enabled,
            has_secret: !!user.two_factor_secret,
            secret_length: user.two_factor_secret ? user.two_factor_secret.length : 0,
            setup_at: user.two_factor_setup_at
        });
        
        if (!user.two_factor_secret) {
            console.log('❌ No 2FA secret found for user');
            return;
        }
        
        // 2. Test current time-based tokens
        console.log('\n2️⃣ Testing current time-based tokens...');
        const secret = user.two_factor_secret;
        
        // Generate current token
        const currentToken = speakeasy.totp({
            secret: secret,
            encoding: 'base32'
        });
        
        console.log('Current generated token:', currentToken);
        
        // Test verification with different windows
        console.log('\n3️⃣ Testing token verification with different windows...');
        
        const testToken = '271743'; // The token from the screenshot
        
        for (let window = 0; window <= 10; window++) {
            const isValid = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: testToken,
                window: window
            });
            
            console.log(`Window ${window}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        }
        
        // 4. Test with current time adjustments
        console.log('\n4️⃣ Testing with time adjustments...');
        
        for (let timeOffset = -300; timeOffset <= 300; timeOffset += 30) {
            const adjustedTime = Math.floor(Date.now() / 1000) + timeOffset;
            const isValid = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: testToken,
                time: adjustedTime
            });
            
            if (isValid) {
                console.log(`✅ Valid with ${timeOffset}s offset (${new Date((adjustedTime) * 1000).toISOString()})`);
            }
        }
        
        // 5. Generate tokens for next few time windows
        console.log('\n5️⃣ Generating tokens for current time windows...');
        
        const currentTime = Math.floor(Date.now() / 1000);
        
        for (let i = -2; i <= 2; i++) {
            const timeWindow = currentTime + (i * 30);
            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32',
                time: timeWindow
            });
            
            const timeStr = new Date(timeWindow * 1000).toISOString();
            console.log(`Time ${i > 0 ? '+' : ''}${i * 30}s (${timeStr}): ${token}`);
        }
        
        // 6. Test secret format
        console.log('\n6️⃣ Testing secret format...');
        console.log('Secret length:', secret.length);
        console.log('Secret format valid:', /^[A-Z2-7]+=*$/.test(secret));
        
        // 7. Generate QR code URL for manual verification
        console.log('\n7️⃣ QR Code URL for manual verification:');
        const otpauthUrl = speakeasy.otpauthURL({
            secret: secret,
            label: user.email,
            issuer: 'StockIQ Inventory',
            encoding: 'base32'
        });
        console.log(otpauthUrl);
        
    } catch (error) {
        console.error('❌ Debug error:', error);
    } finally {
        await connection.end();
    }
}

// Run the debug
debug2FAIssue().catch(console.error);