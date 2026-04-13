/**
 * QUICK 2FA TOKEN VERIFICATION FIX
 * Run this script to debug and fix the current 2FA issue
 */

const TwoFactorDebugger = require('./debug-2fa-verification-issue');

async function quickFix() {
    console.log('🔧 QUICK 2FA FIX SCRIPT');
    console.log('=' .repeat(40));
    
    const debugger = new TwoFactorDebugger();
    
    try {
        // Debug user 1 (from the error log)
        console.log('\n1️⃣ DEBUGGING USER 1:');
        await debugger.debugUser2FA(1);
        
        console.log('\n\n🔄 RECOMMENDED ACTIONS:');
        console.log('1. Reset user\'s 2FA completely (fresh secret)');
        console.log('2. User re-scans QR code with authenticator app');
        console.log('3. Verify time synchronization on both server and user device');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('\nDo you want to reset user 1\'s 2FA? (y/N): ', async (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                console.log('\n🔄 Resetting 2FA for user 1...');
                await debugger.resetUser2FA(1);
                console.log('\n✅ Reset complete! User should now:');
                console.log('   1. Go to Security page in dashboard');
                console.log('   2. Enable 2FA with the new QR code');
                console.log('   3. Verify with fresh token from authenticator app');
            } else {
                console.log('\n⏭️ Skipping reset. Manual debugging info provided above.');
            }
            rl.close();
        });
        
    } catch (error) {
        console.error('❌ Fix script error:', error);
    }
}

// Run the quick fix
quickFix();