const fs = require('fs');
const db = require('./db/connection');

console.log('🔧 Setting up API Keys database tables...');

// Read the SQL file
const sqlScript = fs.readFileSync('./setup-api-keys-database.sql', 'utf8');

// Split the script into individual statements
const statements = sqlScript
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

let completedStatements = 0;
const totalStatements = statements.length;

function executeStatement(index) {
    if (index >= statements.length) {
        console.log('✅ API Keys database tables created successfully!');
        console.log('🚀 API Keys system is now ready to use!');
        process.exit(0);
        return;
    }

    const statement = statements[index];
    
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.trim() === '') {
        executeStatement(index + 1);
        return;
    }

    console.log(`Executing statement ${index + 1}/${totalStatements}...`);
    
    db.query(statement, (err, result) => {
        if (err) {
            console.error(`❌ Error executing statement ${index + 1}:`, err.message);
            console.error('Statement:', statement);
            process.exit(1);
        } else {
            completedStatements++;
            console.log(`✅ Statement ${index + 1} completed successfully`);
            
            // If this was a DESCRIBE statement, show the result
            if (statement.toUpperCase().includes('DESCRIBE')) {
                console.log('Table structure:', result);
            }
            
            // Execute next statement
            executeStatement(index + 1);
        }
    });
}

// Start executing statements
executeStatement(0);