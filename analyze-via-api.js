/**
 * ANALYZE DATABASE VIA API CALLS
 * Since SSH is not working, let's analyze via existing API endpoints
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.giftgala.in/api';

// You'll need to get a valid token from the frontend
const TOKEN = 'YOUR_TOKEN_HERE'; // Replace with actual token

async function makeAPICall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`API call failed for ${endpoint}:`, error.message);
        return null;
    }
}

async function analyzeViaAPI() {
    console.log('🔍 ANALYZING INVENTORY SYSTEM VIA API...');
    
    const analysis = {
        timestamp: new Date().toISOString(),
        endpoints_tested: [],
        data_collected: {},
        issues_found: [],
        recommendations: []
    };
    
    // Test various API endpoints to understand the system
    const endpoints = [
        '/inventory',
        '/self-transfer', 
        '/timeline/2005-999',
        '/products',
        '/warehouse-management/stores',
        '/billing/store-inventory'
    ];
    
    console.log('📊 Testing API endpoints...');
    
    for (const endpoint of endpoints) {
        console.log(`🔍 Testing ${endpoint}...`);
        const result = await makeAPICall(endpoint);
        
        analysis.endpoints_tested.push({
            endpoint,
            status: result ? 'success' : 'failed',
            data_sample: result ? JSON.stringify(result).substring(0, 200) + '...' : null
        });
        
        if (result) {
            analysis.data_collected[endpoint] = result;
            console.log(`✅ ${endpoint} - Success`);
        } else {
            console.log(`❌ ${endpoint} - Failed`);
        }
    }
    
    // Analyze specific product 2005-999
    console.log('\n🔍 Analyzing product 2005-999...');
    
    const timelineData = analysis.data_collected['/timeline/2005-999'];
    if (timelineData) {
        console.log('📊 Timeline data found for 2005-999:');
        if (timelineData.timeline && timelineData.timeline.length > 0) {
            timelineData.timeline.forEach((entry, index) => {
                if (index < 5) { // Show first 5 entries
                    console.log(`  ${entry.timestamp || entry.event_time}: ${entry.type || entry.movement_type} - ${entry.quantity || entry.qty} units`);
                }
            });
            
            analysis.issues_found.push({
                issue: 'Timeline data structure',
                details: `Timeline has ${timelineData.timeline.length} entries`,
                severity: 'info'
            });
        } else {
            analysis.issues_found.push({
                issue: 'No timeline data for product 2005-999',
                details: 'Product may not have any movement history',
                severity: 'warning'
            });
        }
    }
    
    // Analyze self-transfer data
    const selfTransferData = analysis.data_collected['/self-transfer'];
    if (selfTransferData) {
        console.log('\n🔄 Self-transfer analysis:');
        if (selfTransferData.transfers && selfTransferData.transfers.length > 0) {
            console.log(`📊 Found ${selfTransferData.transfers.length} self-transfers`);
            selfTransferData.transfers.slice(0, 3).forEach(transfer => {
                console.log(`  ${transfer.transfer_reference}: ${transfer.transfer_type} | ${transfer.source_location} → ${transfer.destination_location}`);
            });
        } else {
            analysis.issues_found.push({
                issue: 'No self-transfer data found',
                details: 'Self-transfer endpoint returned empty or no data',
                severity: 'error'
            });
        }
    }
    
    // Analyze store inventory
    const storeInventoryData = analysis.data_collected['/billing/store-inventory'];
    if (storeInventoryData) {
        console.log('\n🏪 Store inventory analysis:');
        if (storeInventoryData.data && storeInventoryData.data.length > 0) {
            console.log(`📊 Found ${storeInventoryData.data.length} store inventory items`);
            
            // Check for "Transferred" category issue
            const transferredItems = storeInventoryData.data.filter(item => 
                item.category === 'Transferred' || item.product_name === 'Transferred'
            );
            
            if (transferredItems.length > 0) {
                analysis.issues_found.push({
                    issue: 'Hardcoded "Transferred" category found',
                    details: `${transferredItems.length} items have "Transferred" as category/name`,
                    severity: 'high',
                    fix: 'Replace hardcoded "Transferred" with actual product names and categories'
                });
                
                console.log(`⚠️  Found ${transferredItems.length} items with "Transferred" category`);
            }
        }
    }
    
    // Generate recommendations based on findings
    console.log('\n💡 Generating recommendations...');
    
    if (analysis.issues_found.length === 0) {
        analysis.recommendations.push('System appears to be functioning correctly via API');
    } else {
        analysis.issues_found.forEach(issue => {
            if (issue.severity === 'high' || issue.severity === 'error') {
                analysis.recommendations.push(`URGENT: Fix ${issue.issue} - ${issue.fix || issue.details}`);
            }
        });
    }
    
    // Add general recommendations
    analysis.recommendations.push(
        'Implement proper error handling for all API endpoints',
        'Add data validation before storing in database',
        'Create comprehensive logging for debugging',
        'Add unit tests for critical inventory operations'
    );
    
    // Save analysis to file
    const analysisDir = path.join(__dirname, 'api_analysis');
    if (!fs.existsSync(analysisDir)) {
        fs.mkdirSync(analysisDir);
    }
    
    const analysisFile = path.join(analysisDir, 'inventory_analysis.json');
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
    
    // Create readable summary
    const summaryFile = path.join(analysisDir, 'analysis_summary.txt');
    let summary = `INVENTORY SYSTEM API ANALYSIS
========================================
Generated: ${analysis.timestamp}

ENDPOINTS TESTED:
`;
    
    analysis.endpoints_tested.forEach(test => {
        summary += `- ${test.endpoint}: ${test.status.toUpperCase()}\n`;
    });
    
    summary += `\nISSUES FOUND (${analysis.issues_found.length}):\n`;
    analysis.issues_found.forEach((issue, index) => {
        summary += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}\n   ${issue.details}\n`;
        if (issue.fix) {
            summary += `   FIX: ${issue.fix}\n`;
        }
        summary += '\n';
    });
    
    summary += `RECOMMENDATIONS:\n`;
    analysis.recommendations.forEach((rec, index) => {
        summary += `${index + 1}. ${rec}\n`;
    });
    
    fs.writeFileSync(summaryFile, summary);
    
    console.log('\n✅ Analysis complete!');
    console.log(`📁 Files saved in: ${analysisDir}`);
    console.log(`📋 Check analysis_summary.txt for readable report`);
    console.log(`📊 Check inventory_analysis.json for detailed data`);
    
    return analysis;
}

// Instructions for getting token
console.log(`
🔑 TO RUN THIS ANALYSIS:

1. Open your browser and go to the inventory system
2. Login to the system
3. Open Developer Tools (F12)
4. Go to Application/Storage tab
5. Find 'token' in localStorage
6. Copy the token value
7. Replace 'YOUR_TOKEN_HERE' in this file with the actual token
8. Run: node analyze-via-api.js

OR

Run this in browser console to get token:
console.log('Token:', localStorage.getItem('token'));
`);

// Uncomment to run (after adding token)
// analyzeViaAPI().catch(console.error);

module.exports = { analyzeViaAPI };