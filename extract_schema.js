const fs = require('fs');

const sql = fs.readFileSync('inventory_db_dump.sql', 'utf8');

// Extract all CREATE TABLE statements
const tableRegex = /CREATE TABLE `([^`]+)` \(([\s\S]+?)\)\s*ENGINE[^\n]+/gm;
const tables = {};
let match;

while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const body = match[2];
    
    // Parse columns
    const columns = [];
    const foreignKeys = [];
    const indexes = [];
    
    const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('--'));
    
    for (const line of lines) {
        if (line.startsWith('`')) {
            // Column definition
            const colMatch = line.match(/^`([^`]+)`\s+(\S+(?:\([^)]+\))?)\s*(.*)/);
            if (colMatch) {
                const colName = colMatch[1];
                const colType = colMatch[2];
                const rest = colMatch[3] || '';
                const isNull = rest.includes('NOT NULL') ? 'NOT NULL' : 'NULL';
                const isPK = rest.includes('AUTO_INCREMENT');
                const defaultVal = rest.match(/DEFAULT\s+([^\s,]+)/)?.[1] || null;
                columns.push({ name: colName, type: colType, nullable: isNull, autoIncrement: isPK, default: defaultVal });
            }
        } else if (line.startsWith('PRIMARY KEY')) {
            const pkMatch = line.match(/PRIMARY KEY \(`([^`]+)`\)/);
            if (pkMatch) {
                const pkCol = columns.find(c => c.name === pkMatch[1]);
                if (pkCol) pkCol.isPrimaryKey = true;
            }
        } else if (line.startsWith('CONSTRAINT') || line.startsWith('FOREIGN KEY')) {
            const fkMatch = line.match(/FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)` \(`([^`]+)`\)/);
            if (fkMatch) {
                foreignKeys.push({ column: fkMatch[1], referencedTable: fkMatch[2], referencedColumn: fkMatch[3] });
            }
        } else if (line.startsWith('KEY') || line.startsWith('UNIQUE KEY') || line.startsWith('INDEX')) {
            const idxMatch = line.match(/(UNIQUE\s+)?KEY\s+`([^`]+)`\s+\(([^)]+)\)/);
            if (idxMatch) {
                indexes.push({ name: idxMatch[2], unique: !!idxMatch[1], columns: idxMatch[3] });
            }
        }
    }
    
    tables[tableName] = { columns, foreignKeys, indexes };
}

// Extract views
const viewRegex = /VIEW `([^`]+)` AS select([\s\S]+?)(?=\/\*|CREATE|$)/gm;
const views = [];
while ((match = viewRegex.exec(sql)) !== null) {
    views.push(match[1]);
}

const output = { tables: Object.keys(tables).sort(), tableDetails: tables, views: [...new Set(views)] };
fs.writeFileSync('schema_analysis.json', JSON.stringify(output, null, 2));

console.log('=== DATABASE SCHEMA SUMMARY ===');
console.log('Total Tables:', Object.keys(tables).length);
console.log('');
Object.keys(tables).sort().forEach(t => {
    const fks = tables[t].foreignKeys;
    console.log(`[${t}] - ${tables[t].columns.length} columns${fks.length > 0 ? ' | FK→ ' + fks.map(f => f.referencedTable).join(', ') : ''}`);
});
console.log('');
console.log('Views found:', output.views.join(', '));
