/**
 * 2FA VERIFICATION DEBUGGING SCRIPT
 * Helps diagnose and fix 2FA token verification issues
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('./db/connection');

class TwoFactorDebugger {
    
    /**
     * Debug user's 2FA setup and generate diagnostic information
     */
    async debugUser2FA(userId) {
        console.log(`\n🔍 DEBUGGING 2FA FOR USER ${userId}`);
        console.log('=' .repeat(50));
        
        try {
            // Get user's 2FA data from database
            const userData = await this.getUserData(userId);
            
            if (!userData) {
                console.log('❌ User not found');
                return;
            }
            
            console.log(`📧 User: ${userData.email}`);
            console.log(`🔐 2FA Enabled: ${userData.two_factor_enabled}`);
            console.log(`🔑 Has Secret: ${!!userData.two_factor_secret}`);
            
            if (!userData.two_factor_secret) {
                console.log('❌ No 2FA secret found for user');
                return;
            }
            
            const secret = userData.two_factor_secret;
            console.log(`🔑 Secret Length: ${secret.length}`);
            console.log(`🔑 Secret Format Valid: ${/^[A-Z2-7]+=*$/.test(secret)}`);
            
            // Generate current tokens for different time windows
            console.log('\n⏰ CURRENT TIME ANALYSIS:');
            const currentTime = Math.floor(Date.now() / 1000);
            console.log(`🕐 Current Unix Time: ${currentTime}`);
            console.log(`🕐 Current Date: ${new Date().toISOString()}`);
            
            // Generate tokens for current time and nearby windows
            console.log('\n🔢 EXPECTED TOKENS:');
            for (let offset = -2; offset <= 2; offset++) {
                const timeStep = currentTime + (offset * 30);
                const token = speakeasy.totp({
                    secret: secret,
                    encoding: 'base32',
                    time: timeStep
                });
                const timeDesc = offset === 0 ? 'CURRENT' : `${offset > 0 ? '+' : ''}${offset * 30}s`;
                console.log(`  ${timeDesc.padEnd(10)}: ${token}`);
            }
            
            // Test verification with different windows
            console.log('\n🧪 VERIFICATION TESTS:');
            const testTokens = ['045936', '981290']; // From the error log
            
            for (const testToken of testTokens) {
                console.log(`\n  Testing token: ${testToken}`);
                
                // Test with different window sizes
                for (const window of [1, 2, 6, 10]) {
                    const result = speakeasy.totp.verify({
                        secret: secret,
                        encoding: 'base32',
                        token: testToken,
                        window: window
                    });
                    console.log(`    Window ${window}: ${result ? '✅ VALID' : '❌ Invalid'}`);
                }
            }
            
            // Generate fresh QR code for re-setup
            console.log('\n🔄 FRESH SETUP RECOMMENDATION:');
            await this.generateFreshSetup(userData.email, secret);
            
        } catch (error) {
            console.error('❌ Debug error:', error);
        }
    }
    
    /**
     * Get user data from database
     */
    async getUserData(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    id, email, two_factor_enabled, 
                    two_factor_secret, two_factor_backup_codes
                FROM users 
                WHERE id = ?
            `;
            
            db.query(query, [userId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results[0] || null);
                }
            });
        });
    }
    
    /**
     * Generate fresh setup with new QR code
     */
    async generateFreshSetup(userEmail, existingSecret = null) {
        try {
            // Use existing secret or generate new one
            const secret = existingSecret || speakeasy.generateSecret({
                name: userEmail,
                issuer: 'hunyhuny Inventory',
                length: 32
            }).base32;
            
            // Generate QR code
            const otpauthUrl = speakeasy.otpauthURL({
                secret: secret,
                label: userEmail,
                issuer: 'hunyhuny Inventory',
                encoding: 'base32'
            });
            
            const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
            
            console.log(`🔑 Secret: ${secret}`);
            console.log(`📱 Manual Entry Key: ${secret}`);
            console.log(`🔗 OTPAuth URL: ${otpauthUrl}`);
            console.log(`📊 QR Code Length: ${qrCodeUrl.length} characters`);
            
            // Test current token generation
            const currentToken = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });
            console.log(`🔢 Current Expected Token: ${currentToken}`);
            
            return {
                secret,
                qrCodeUrl,
                otpauthUrl,
                currentToken
            };
            
        } catch (error) {
            console.error('❌ Fresh setup generation error:', error);
        }
    }
    
    /**
     * Reset user's 2FA with fresh secret
     */
    async resetUser2FA(userId) {
        console.log(`\n🔄 RESETTING 2FA FOR USER ${userId}`);
        
        try {
            const userData = await this.getUserData(userId);
            if (!userData) {
                console.log('❌ User not found');
                return;
            }
            
            // Generate completely new secret
            const newSecret = speakeasy.generateSecret({
                name: userData.email,
                issuer: 'hunyhuny Inventory',
                length: 32
            }).base32;
            
            // Generate new backup codes
            const backupCodes = [];
            for (let i = 0; i < 10; i++) {
                const code = require('crypto').randomBytes(4).toString('hex').toUpperCase();
                backupCodes.push(code);
            }
            
            // Update database
            await new Promise((resolve, reject) => {
                const query = `
                    UPDATE users 
                    SET two_factor_secret = ?, 
                        two_factor_backup_codes = ?,
                        two_factor_enabled = FALSE,
                        two_factor_setup_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;
                
                db.query(query, [newSecret, JSON.stringify(backupCodes), userId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            console.log('✅ 2FA reset successfully');
            
            // Generate fresh setup
            await this.generateFreshSetup(userData.email, newSecret);
            
            console.log('\n📋 NEXT STEPS:');
            console.log('1. User should go to Security page in dashboard');
            console.log('2. Click "Enable Two-Factor Authentication"');
            console.log('3. Scan the NEW QR code with authenticator app');
            console.log('4. Verify with 6-digit code from app');
            
        } catch (error) {
            console.error('❌ Reset error:', error);
        }
    }
}

// Usage examples
async function main() {
    const debugger = new TwoFactorDebugger();
    
    // Debug user ID 1 (from the error log)
    await debugger.debugUser2FA(1);
    
    // Uncomment to reset user's 2FA completely
    // await debugger.resetUser2FA(1);
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TwoFactorDebugger;