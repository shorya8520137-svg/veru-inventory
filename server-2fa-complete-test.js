#!/usr/bin/env node
/**
 * COMPLETE SERVER-SIDE 2FA TEST
 * Run this on the server to test and fix 2FA issues
 */

const speakeasy = require('speakeasy');
const mysql = require('mysql2/promise');
const QRCode = require('qrcode');

async function completeServerTest() {
    console.log('🔧 COMPLETE SERVER-SIDE 2FA TEST');
    console.log('================================\n');
    
    // Database connection
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'inventory_user',
            password: 'Inventory@2024',
            database: 'inventory_db'
        });
        console.log('✅ Database connected');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return;
    }
    
    try {
        // 1. Check current user data
        console.log('\n1️⃣ CHECKING USER DATA');
        console.log('---------------------');
        
        const [users] = await connection.execute(
            'SELECT id, email, two_factor_enabled, two_factor_secret, two_factor_backup_codes FROM users WHERE id = 1'
        );
        
        if (users.length === 0) {
            console.log('❌ User ID 1 not found');
            return;
        }
        
        const user = users[0];
        console.log('User Email:', user.email);
        console.log('2FA Enabled:', user.two_factor_enabled);
        console.log('Has Secret:', !!user.two_factor_secret);
        console.log('Secret Length:', user.two_factor_secret ? user.two_factor_secret.length : 0);
        console.log('Has Backup Codes:', !!user.two_factor_backup_codes);
        
        // 2. Generate fresh secret and QR code
        console.log('\n2️⃣ GENERATING FRESH 2FA SETUP');
        console.log('------------------------------');
        
        const secret = speakeasy.generateSecret({
            name: user.email,
            issuer: 'StockIQ Inventory',
            length: 32
        });
        
        console.log('New Secret:', secret.base32);
        console.log('Secret Length:', secret.base32.length);
        console.log('Secret Valid:', /^[A-Z2-7]+=*$/.test(secret.base32));
        
        // Generate QR code
        const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);
        console.log('QR Code Generated:', qrCodeDataURL.length > 0);
        console.log('QR Code URL Length:', qrCodeDataURL.length);
        
        // Generate backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            const code = require('crypto').randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push(code);
        }
        
        console.log('Backup Codes Generated:', backupCodes.length);
        
        // 3. Save to database
        console.log('\n3️⃣ SAVING TO DATABASE');
        console.log('---------------------');
        
        await connection.execute(
            `UPDATE users SET 
             two_factor_secret = ?, 
             two_factor_backup_codes = ?,
             two_factor_enabled = FALSE,
             two_factor_setup_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [secret.base32, JSON.stringify(backupCodes), user.id]
        );
        
        console.log('✅ Secret saved to database');
        
        // 4. Test current token generation
        console.log('\n4️⃣ TESTING TOKEN GENERATION');
        console.log('---------------------------');
        
        const currentToken = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32'
        });
        
        console.log('Current Expected Token:', currentToken);
        console.log('Current Time:', new Date().toISOString());
        
        // Generate tokens for next few windows
        const currentTime = Math.floor(Date.now() / 1000);
        console.log('\nNext 5 tokens:');
        for (let i = 0; i < 5; i++) {
            const timeWindow = currentTime + (i * 30);
            const token = speakeasy.totp({
                secret: secret.base32,
                encoding: 'base32',
                time: timeWindow
            });
            const timeStr = new Date(timeWindow * 1000).toLocaleTimeString();
            console.log(`${timeStr}: ${token}`);
        }
        
        // 5. Test problematic tokens
        console.log('\n5️⃣ TESTING PROBLEMATIC TOKENS');
        console.log('-----------------------------');
        
        const testTokens = ['271743', '855162'];
        
        for (const testToken of testTokens) {
            console.log(`\nTesting token: ${testToken}`);
            
            // Test with current secret
            const isValid = speakeasy.totp.verify({
                secret: secret.base32,
                encoding: 'base32',
                token: testToken,
                window: 10
            });
            
            console.log(`Valid with new secret: ${isValid ? '✅' : '❌'}`);
            
            // Test with time offsets
            let foundValidTime = false;
            for (let offset = -3600; offset <= 3600; offset += 30) {
                const testTime = currentTime + offset;
                const offsetValid = speakeasy.totp.verify({
                    secret: secret.base32,
                    encoding: 'base32',
                    token: testToken,
                    time: testTime
                });
                
                if (offsetValid) {
                    const timeStr = new Date(testTime * 1000).toISOString();
                    console.log(`✅ Valid at ${timeStr} (${offset}s offset)`);
                    foundValidTime = true;
                    break;
                }
            }
            
            if (!foundValidTime) {
                console.log('❌ Token not valid at any tested time');
            }
        }
        
        // 6. Output setup information
        console.log('\n6️⃣ SETUP INFORMATION');
        console.log('--------------------');
        
        console.log('\n📱 QR CODE DATA URL:');
        console.log(qrCodeDataURL);
        
        console.log('\n🔑 MANUAL ENTRY KEY:');
        console.log(secret.base32);
        
        console.log('\n🔗 OTPAUTH URL:');
        console.log(secret.otpauth_url);
        
        console.log('\n💾 BACKUP CODES:');
        backupCodes.forEach((code, index) => {
            console.log(`${index + 1}. ${code}`);
        });
        
        console.log('\n✅ SETUP COMPLETE!');
        console.log('\nNext steps:');
        console.log('1. Copy the QR code data URL and paste in browser to see QR code');
        console.log('2. Or manually enter the key in Google Authenticator');
        console.log('3. Use the current expected token to verify setup');
        console.log('4. Save the backup codes securely');
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the test
completeServerTest().catch(console.error);