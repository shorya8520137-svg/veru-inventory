/**
 * TEST SPECIFIC TOKEN 271743
 * Quick test to see if this token was valid at any point
 */

const speakeasy = require('speakeasy');

// Test with a known good secret format
const testSecret = 'JBSWY3DPEHPK3PXP'; // Example secret

console.log('🔍 Testing token 271743 with different scenarios...\n');

const token = '271743';
const currentTime = Math.floor(Date.now() / 1000);

console.log('Current time:', new Date().toISOString());
console.log('Testing token:', token);
console.log('');

// Test with current time and different windows
console.log('📊 Testing with different time windows:');
for (let window = 0; window <= 20; window++) {
    const isValid = speakeasy.totp.verify({
        secret: testSecret,
        encoding: 'base32',
        token: token,
        window: window
    });
    
    if (isValid) {
        console.log(`✅ Valid with window ${window} (±${window * 30} seconds)`);
    }
}

console.log('\n⏰ Testing with time offsets:');
// Test with different time offsets (last 24 hours)
for (let hours = -24; hours <= 0; hours++) {
    for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeOffset = (hours * 3600) + (minutes * 60);
        const testTime = currentTime + timeOffset;
        
        const isValid = speakeasy.totp.verify({
            secret: testSecret,
            encoding: 'base32',
            token: token,
            time: testTime
        });
        
        if (isValid) {
            const timeStr = new Date(testTime * 1000).toISOString();
            console.log(`✅ Valid at ${timeStr} (${timeOffset}s offset)`);
        }
    }
}

console.log('\n🔢 Generating current valid tokens:');
// Generate tokens for current time windows
for (let i = -5; i <= 5; i++) {
    const timeWindow = currentTime + (i * 30);
    const generatedToken = speakeasy.totp({
        secret: testSecret,
        encoding: 'base32',
        time: timeWindow
    });
    
    const timeStr = new Date(timeWindow * 1000).toISOString();
    const status = generatedToken === token ? '🎯 MATCH!' : '';
    console.log(`${timeStr}: ${generatedToken} ${status}`);
}

console.log('\n📝 Summary:');
console.log('If no matches found, the token 271743 was either:');
console.log('1. Generated with a different secret');
console.log('2. From a different time period');
console.log('3. Invalid/corrupted');
console.log('\nNext step: Check the actual secret in the database');