const puppeteer = require('puppeteer');
const fs = require('fs');

async function testDropdownClick() {
    let browser;
    const results = [];
    
    function log(msg, type = 'info') {
        const time = new Date().toLocaleTimeString();
        const prefix = { success: '✅', error: '❌', info: '📝', test: '🧪' }[type] || '•';
        const line = `[${time}] ${prefix} ${msg}`;
        console.log(line);
        results.push(line);
    }
    
    try {
        log('Starting dropdown click test...', 'test');
        
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        // Login
        log('Logging in...', 'info');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
        await page.type('input[type="email"]', 'admin@company.com');
        await page.type('input[type="password"]', 'Admin@123');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        log('✅ Login successful', 'success');
        await new Promise(r => setTimeout(r, 1000));
        
        // Go to inventory
        log('Opening inventory...', 'info');
        await page.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));
        
        // Click Transfer Stock button
        log('Opening Transfer Stock form...', 'info');
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Transfer Stock')) {
                await btn.click();
                break;
            }
        }
        await new Promise(r => setTimeout(r, 1500));
        log('✅ Form opened', 'success');
        
        // Test by clicking the dropdown and selecting options
        log('\n🧪 Testing dropdown by clicking options:\n', 'test');
        
        const testCases = [
            { value: 'W to S', label: 'Warehouse to Store' },
            { value: 'S to W', label: 'Store to Warehouse' },
            { value: 'S to S', label: 'Store to Store' },
            { value: 'W to W', label: 'Warehouse to Warehouse' }
        ];
        
        for (const test of testCases) {
            log(`Testing: ${test.label}`, 'test');
            
            // Click the Transfer Type dropdown
            const select = await page.$('[data-testid="transfer-type-select"]');
            await select.click();
            await new Promise(r => setTimeout(r, 300));
            
            // Find and click the option
            const options = await page.$$('option');
            let found = false;
            for (const option of options) {
                const value = await page.evaluate(el => el.value, option);
                if (value === test.value) {
                    await page.evaluate(el => el.selected = true, option);
                    await select.click(); // Click to close dropdown
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                log(`  ❌ Option not found: ${test.value}`, 'error');
                continue;
            }
            
            await new Promise(r => setTimeout(r, 600));
            
            // Check what labels are visible
            const labels = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('label'))
                    .map(l => l.textContent.trim())
                    .filter(t => t.includes('Source') || t.includes('Destination'));
            });
            
            log(`  Labels visible: ${labels.join(', ')}`, 'info');
        }
        
        log('\n✅ Test completed!', 'success');
        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
        
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'error');
        console.error(error);
        if (browser) await browser.close();
    }
    
    fs.writeFileSync('dropdown-test-results.txt', results.join('\n'));
    console.log('\n✅ Results saved to dropdown-test-results.txt');
}

testDropdownClick();
