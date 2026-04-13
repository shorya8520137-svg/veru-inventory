/**
 * TEST CURRENT 2FA TOKEN
 * Quick script to test what tokens should be valid right now
 */

const speakeasy = require('speakeasy');
const db = require('./db/connection');

async function testCurrentToken() {
    console.log('🧪 TESTING CURRENT 2FA TOKENS');
    console.log('=' .repeat(40));
    
    try {
        // Get user 1's secret from database
        const query = 'SELECT two_factor_secret, email FROM users WHERE id = 1';
        
        db.query(query, [], (err, results) => {
            if (err) {
                console.error('❌ Database error:', err);
                return;
            }
            
            if (results.length === 0) {
                console.log('❌ User 1 not found');
                return;
            }
            
            const user = results[0];
            const secret = user.two_factor_secret;
            
            if (!secret) {
                console.log('❌ No 2FA secret found for user 1');
                return;
            }
            
            console.log(`📧 User: ${user.email}`);
            console.log(`🔑 Secret: ${secret}`);
            console.log(`🕐 Current Time: ${new Date().toISOString()}`);
            
            // Generate current and nearby tokens
            console.log('\n🔢 VALID TOKENS RIGHT NOW:');
            const currentTime = Math.floor(Date.now() / 1000);
            
            for (let offset = -2; offset <= 2; offset++) {
                const timeStep = currentTime + (offset * 30);
                const token = speakeasy.totp({
                    secret: secret,
                    encoding: 'base32',
                    time: timeStep
                });
                
                const timeDesc = offset === 0 ? '🎯 CURRENT' : 
                               offset === -1 ? '⏪ PREVIOUS' :
                               offset === 1 ? '⏩ NEXT' :
                               `${offset > 0 ? '+' : ''}${offset * 30}s`;
                
                console.log(`  ${timeDesc.padEnd(12)}: ${token}`);
            }
            
            // Test the failed tokens from the log
            console.log('\n🔍 TESTING FAILED TOKENS:');
            const failedTokens = ['045936', '981290'];
            
            for (const testToken of failedTokens) {
                const isValid = speakeasy.totp.verify({
                    secret: secret,
                    encoding: 'base32',
                    token: testToken,
                    window: 10 // 5 minute window
                });
                
                console.log(`  ${testToken}: ${isValid ? '✅ VALID' : '❌ Invalid'}`);
            }
            
            console.log('\n💡 INSTRUCTIONS FOR USER:');
            console.log('1. Open Google Authenticator app');
            console.log('2. Find "hunyhuny Inventory" entry');
            console.log('3. Use the 6-digit code shown (refreshes every 30 seconds)');
            console.log('4. If still failing, try the CURRENT token shown above');
            
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Test error:', error);
        process.exit(1);
    }
}

// Run the test
testCurrentToken();