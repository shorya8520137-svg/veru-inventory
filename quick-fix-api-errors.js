#!/usr/bin/env node

/**
 * Quick Fix for API Errors
 * Simple solution to stop the api_usage_logs table errors
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Quick Fix: Disabling API Usage Logging');
console.log('==========================================');

// Read the current apiKeysController.js
const controllerPath = path.join(__dirname, 'controllers/apiKeysController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

// Simple fix: Replace the problematic logApiUsage method
const oldLogMethod = /logApiUsage\(apiKeyId, req\) \{[\s\S]*?^\s*\}/m;

const newLogMethod = `logApiUsage(apiKeyId, req) {
        // DISABLED: Prevents "Table 'api_usage_logs' doesn't exist" errors
        const endpoint = req.originalUrl || req.url;
        const method = req.method;
        console.log(\`✅ API Call: \${method} \${endpoint} - Key ID: \${apiKeyId}\`);
        // Database logging disabled - no table needed
    }`;

if (content.match(oldLogMethod)) {
    content = content.replace(oldLogMethod, newLogMethod);
    fs.writeFileSync(controllerPath, content);
    console.log('✅ API logging disabled successfully');
} else {
    console.log('ℹ️  API logging already appears to be disabled');
}

console.log('');
console.log('🎯 Fix Applied:');
console.log('   • API usage logging disabled');
console.log('   • No database table required');
console.log('   • Your API token will work without errors');
console.log('');
console.log('🚀 Next Steps:');
console.log('   1. Restart your server');
console.log('   2. Test your API token');
console.log('   3. No more database errors!');