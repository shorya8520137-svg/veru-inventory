const fs = require('fs');
const path = require('path');

console.log('🚨 Emergency Fix: API Key Context Issue');
console.log('=====================================');

const controllerPath = path.join(__dirname, 'controllers/apiKeysController.js');

try {
    // Read the current file
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    console.log('📖 Reading apiKeysController.js...');
    
    // Find and replace the problematic line
    const oldPattern = /self\.logApiUsage\(keyData\.id, req\);/g;
    const newCode = `// Log API usage directly (emergency fix)
            const endpoint = req.originalUrl || req.url;
            const method = req.method;
            console.log(\`✅ API Call: \${method} \${endpoint} - Key ID: \${keyData.id}\`);`;
    
    if (content.includes('self.logApiUsage(keyData.id, req);')) {
        content = content.replace(oldPattern, newCode);
        
        // Write the fixed file
        fs.writeFileSync(controllerPath, content);
        
        console.log('✅ Emergency fix applied successfully!');
        console.log('   • Removed problematic self.logApiUsage call');
        console.log('   • Added direct console logging');
        console.log('   • Server should now work without crashes');
        console.log('');
        console.log('🔄 Please restart your server now:');
        console.log('   node server.js');
        
    } else {
        console.log('ℹ️  No problematic code found. File may already be fixed.');
    }
    
} catch (error) {
    console.error('❌ Emergency fix failed:', error.message);
    console.log('');
    console.log('🔧 Manual fix required:');
    console.log('1. Open controllers/apiKeysController.js');
    console.log('2. Find line: self.logApiUsage(keyData.id, req);');
    console.log('3. Replace with:');
    console.log('   const endpoint = req.originalUrl || req.url;');
    console.log('   const method = req.method;');
    console.log('   console.log(`✅ API Call: ${method} ${endpoint} - Key ID: ${keyData.id}`);');
}