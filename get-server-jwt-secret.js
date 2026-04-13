/**
 * GET SERVER JWT SECRET
 * Run this on the server to see what JWT_SECRET is being used
 */

console.log('🔍 SERVER JWT CONFIGURATION:');
console.log('='.repeat(50));
console.log('JWT_SECRET:', process.env.JWT_SECRET || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('');

// Try to load from .env file
try {
    require('dotenv').config();
    console.log('📄 After loading .env:');
    console.log('JWT_SECRET:', process.env.JWT_SECRET || 'NOT SET');
} catch (error) {
    console.log('⚠️  dotenv not available or .env file not found');
}

console.log('');
console.log('💡 If JWT_SECRET is not set, check:');
console.log('1. .env file in project root');
console.log('2. Environment variables on server');
console.log('3. PM2 ecosystem file');
console.log('4. Server startup script');