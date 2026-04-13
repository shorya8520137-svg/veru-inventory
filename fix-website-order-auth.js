#!/usr/bin/env node

/**
 * Fix Website Order Authentication
 * Allow API key authentication for website order endpoints
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Website Order Authentication');
console.log('=====================================');

// Read the server.js file
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Find the JWT middleware section and update it to allow API key auth for orders
const oldMiddleware = /\/\/ Skip authentication for public website product routes[\s\S]*?return next\(\);\s*}/;

const newMiddleware = `// Skip authentication for public website routes OR if API key is provided
    if (req.path.startsWith('/website/products') || 
        req.path.startsWith('/website/categories') ||
        req.path.startsWith('/website/orders')) {
        
        // Check if API key is provided in headers
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (apiKey) {
            // Use API key authentication instead of JWT
            console.log('🔑 Using API key authentication for website route');
            const apiKeysController = require('./controllers/apiKeysController');
            return apiKeysController.validateApiKey(req, res, next);
        }
        
        // Skip authentication for GET requests (public access)
        if (req.method === 'GET') {
            console.log('✅ Skipping auth for public website GET routes');
            return next();
        }
        
        // For POST/PUT/DELETE without API key, require JWT
        console.log('🔒 Applying JWT authentication for website write operations');
    }`;

if (serverContent.match(oldMiddleware)) {
    serverContent = serverContent.replace(oldMiddleware, newMiddleware);
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Server.js updated to support API key auth for website orders');
} else {
    console.log('ℹ️  Server.js middleware already appears to be updated');
}

console.log('');
console.log('🎯 Fix Applied:');
console.log('   • Website orders now accept API key authentication');
console.log('   • Your API token will work for POST /api/website/orders');
console.log('   • Frontend can use the same token for all operations');
console.log('');
console.log('🚀 Next Steps:');
console.log('   1. Restart your server');
console.log('   2. Update your frontend to use API key in headers');
console.log('   3. Test order placement with your token');
console.log('');
console.log('📋 Frontend Header Example:');
console.log('   Authorization: Bearer wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37');
console.log('   OR');
console.log('   X-API-Key: wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37');