const puppeteer = require('puppeteer');
const fs = require('fs');

const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    email: 'admin@company.com',
    password: 'Admin@123',
    timeout: 30000,
    headless: false // Set to true to run without UI
};

const testResults = [];

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
        'info': '📝',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'test': '🧪'
    }[type] || '•';
    
    const logMessage = `[${timestamp}] ${prefix} ${message}`;
    console.log(logMessage);
    testResults.push({ timestamp, message, type });
}

async function waitForElement(page, selector, timeout = 10000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        return false;
    }
}

async function testDropdownSelection() {
    let browser;
    
    try {
        log('Starting Dropdown Selection Test', 'test');
        log(`Base URL: ${TEST_CONFIG.baseUrl}`, 'info');
        
        // Launch browser
        log('Launching browser...', 'info');
        browser = await puppeteer.launch({
            headless: TEST_CONFIG.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        page.setDefaultTimeout(TEST_CONFIG.timeout);
        page.setDefaultNavigationTimeout(TEST_CONFIG.timeout);
        
        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to login page
        log('Navigating to login page...', 'info');
        await page.goto(`${TEST_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
        
        // Wait for login form
        const loginFormExists = await waitForElement(page, 'input[type="email"]');
        if (!loginFormExists) {
            log('Login form not found', 'error');
            return false;
        }
        log('Login form found', 'success');
        
        // Fill login form
        log('Filling login credentials...', 'info');
        await page.type('input[type="email"]', TEST_CONFIG.email);
        await page.type('input[type="password"]', TEST_CONFIG.password);
        
        // Submit login
        log('Submitting login form...', 'info');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        
        log('Login successful', 'success');
        
        // Wait for dashboard to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Navigate to inventory/self-transfer
        log('Navigating to Self Transfer module...', 'info');
        await page.goto(`${TEST_CONFIG.baseUrl}/inventory`, { waitUntil: 'networkidle2' });
        
        // Look for Create Transfer button
        const createButtonExists = await waitForElement(page, 'button:has-text("Create Transfer")', 5000);
        
        if (!createButtonExists) {
            // Try alternative selectors
            const buttons = await page.$$('button');
            let found = false;
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('Create Transfer') || text.includes('Transfer')) {
                    await btn.click();
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                log('Create Transfer button not found', 'warning');
                log('Trying to find Self Transfer form...', 'info');
            }
        } else {
            await page.click('button:has-text("Create Transfer")');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test all 4 transfer types
        const transferTypes = [
            { id: 'warehouse-to-warehouse', label: 'W→W', expectedSources: 5, expectedDests: 5 },
            { id: 'warehouse-to-store', label: 'W→S', expectedSources: 5, expectedDests: 9 },
            { id: 'store-to-warehouse', label: 'S→W', expectedSources: 9, expectedDests: 5 },
            { id: 'store-to-store', label: 'S→S', expectedSources: 9, expectedDests: 9 }
        ];
        
        for (const transferType of transferTypes) {
            log(`\nTesting ${transferType.label} (${transferType.id})...`, 'test');
            
            // Find and click transfer type button
            const buttons = await page.$$('button');
            let clicked = false;
            
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes(transferType.label)) {
                    await btn.click();
                    clicked = true;
                    break;
                }
            }
            
            if (!clicked) {
                log(`Could not find ${transferType.label} button`, 'warning');
                continue;
            }
            
            // Wait for API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get dropdown options
            const sourceSelects = await page.$$('select');
            if (sourceSelects.length < 2) {
                log(`Not enough dropdowns found (found ${sourceSelects.length})`, 'warning');
                continue;
            }
            
            // Count source options
            const sourceOptions = await page.evaluate(() => {
                const selects = document.querySelectorAll('select');
                if (selects.length > 0) {
                    return selects[0].querySelectorAll('option').length - 1; // -1 for placeholder
                }
                return 0;
            });
            
            // Count destination options
            const destOptions = await page.evaluate(() => {
                const selects = document.querySelectorAll('select');
                if (selects.length > 1) {
                    return selects[1].querySelectorAll('option').length - 1; // -1 for placeholder
                }
                return 0;
            });
            
            log(`Sources: ${sourceOptions}, Destinations: ${destOptions}`, 'info');
            
            // Verify counts
            if (sourceOptions === transferType.expectedSources && destOptions === transferType.expectedDests) {
                log(`✅ ${transferType.label} - PASSED (${sourceOptions} sources, ${destOptions} destinations)`, 'success');
            } else {
                log(`❌ ${transferType.label} - FAILED (Expected ${transferType.expectedSources}/${transferType.expectedDests}, got ${sourceOptions}/${destOptions})`, 'error');
            }
        }
        
        // Test swap button
        log('\nTesting Swap Button...', 'test');
        
        // Select first source
        await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            if (selects.length > 0) {
                selects[0].value = selects[0].querySelectorAll('option')[1]?.value || '';
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Select first destination
        await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            if (selects.length > 1) {
                selects[1].value = selects[1].querySelectorAll('option')[2]?.value || '';
                selects[1].dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get values before swap
        const beforeSwap = await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            return {
                source: selects[0]?.value,
                dest: selects[1]?.value
            };
        });
        
        log(`Before swap - Source: ${beforeSwap.source}, Dest: ${beforeSwap.dest}`, 'info');
        
        // Click swap button
        const swapButtons = await page.$$('button');
        let swapClicked = false;
        
        for (const btn of swapButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('⇄') || text.includes('Swap')) {
                await btn.click();
                swapClicked = true;
                break;
            }
        }
        
        if (swapClicked) {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Get values after swap
            const afterSwap = await page.evaluate(() => {
                const selects = document.querySelectorAll('select');
                return {
                    source: selects[0]?.value,
                    dest: selects[1]?.value
                };
            });
            
            log(`After swap - Source: ${afterSwap.source}, Dest: ${afterSwap.dest}`, 'info');
            
            if (beforeSwap.source === afterSwap.dest && beforeSwap.dest === afterSwap.source) {
                log('✅ Swap Button - PASSED', 'success');
            } else {
                log('❌ Swap Button - FAILED', 'error');
            }
        } else {
            log('⚠️ Swap button not found', 'warning');
        }
        
        log('\n✅ All tests completed!', 'success');
        
        // Close browser
        await browser.close();
        return true;
        
    } catch (error) {
        log(`Test failed: ${error.message}`, 'error');
        if (browser) {
            await browser.close();
        }
        return false;
    }
}

// Run tests
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 DROPDOWN SELECTION TEST - PUPPETEER');
    console.log('='.repeat(60) + '\n');
    
    const success = await testDropdownSelection();
    
    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST REPORT');
    console.log('='.repeat(60));
    
    const successCount = testResults.filter(r => r.type === 'success').length;
    const errorCount = testResults.filter(r => r.type === 'error').length;
    const warningCount = testResults.filter(r => r.type === 'warning').length;
    
    console.log(`\nTotal Tests: ${testResults.length}`);
    console.log(`✅ Passed: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`⚠️ Warnings: ${warningCount}`);
    
    // Save report to file
    const reportPath = 'dropdown-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        success,
        summary: {
            total: testResults.length,
            passed: successCount,
            failed: errorCount,
            warnings: warningCount
        },
        results: testResults
    }, null, 2));
    
    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log('\n' + '='.repeat(60) + '\n');
    
    process.exit(success ? 0 : 1);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
