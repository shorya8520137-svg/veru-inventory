const puppeteer = require('puppeteer');
const fs = require('fs');

async function testSelfTransfer() {
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
        log('Starting Self Transfer Form Test...', 'test');
        
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        // Capture console messages
        page.on('console', msg => {
            if (msg.text().includes('Transfer type changed')) {
                log(`🔔 Console: ${msg.text()}`, 'info');
            }
        });
        
        // Login
        log('Step 1: Logging in...', 'info');
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
        log('Step 2: Opening inventory...', 'info');
        await page.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));
        
        // Click Transfer Stock button
        log('Step 3: Opening Transfer Stock form...', 'info');
        const buttons = await page.$$('button');
        let found = false;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Transfer Stock')) {
                await btn.click();
                found = true;
                break;
            }
        }
        
        if (!found) {
            log('❌ Transfer Stock button not found', 'error');
            await browser.close();
            return;
        }
        
        await new Promise(r => setTimeout(r, 1500));
        log('✅ Form opened', 'success');
        
        // Test cases
        const testCases = [
            { type: 'Warehouse to Store', sourceLabel: 'Source Warehouse', destLabel: 'Destination Store' },
            { type: 'Store to Warehouse', sourceLabel: 'Source Store', destLabel: 'Destination Warehouse' },
            { type: 'Store to Store', sourceLabel: 'Source Store', destLabel: 'Destination Store' }
        ];
        
        log('\n🧪 Testing Transfer Type Changes:\n', 'test');
        
        for (const test of testCases) {
            log(`Testing: ${test.type}`, 'test');
            
            // Click the Transfer Type dropdown
            const select = await page.$('[data-testid="transfer-type-select"]');
            await select.click();
            await new Promise(r => setTimeout(r, 300));
            
            // Find and click the option
            const optionFound = await page.evaluate((optionText) => {
                const select = document.querySelector('[data-testid="transfer-type-select"]');
                const options = Array.from(select.options);
                const option = options.find(opt => opt.text === optionText);
                if (option) {
                    option.selected = true;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
                return false;
            }, test.type);
            
            if (!optionFound) {
                log(`  ❌ Option "${test.type}" not found`, 'error');
                continue;
            }
            
            await new Promise(r => setTimeout(r, 800));
            
            // Check the actual select value
            const selectValue = await page.evaluate(() => {
                const select = document.querySelector('[data-testid="transfer-type-select"]');
                return select ? select.value : 'NOT FOUND';
            });
            
            log(`  Select value in DOM: ${selectValue}`, 'info');
            
            // Check labels
            const labels = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('label'))
                    .map(l => l.textContent.trim())
                    .filter(t => t.includes('Source') || t.includes('Destination'));
            });
            
            const hasSource = labels.some(l => l.includes(test.sourceLabel));
            const hasDest = labels.some(l => l.includes(test.destLabel));
            
            if (hasSource && hasDest) {
                log(`  ✅ Correct labels: ${test.sourceLabel}, ${test.destLabel}`, 'success');
            } else {
                log(`  ❌ Wrong labels. Expected: ${test.sourceLabel}, ${test.destLabel}`, 'error');
                log(`     Found: ${labels.join(', ')}`, 'error');
            }
        }
        
        log('\n✅ Test completed!', 'success');
        await new Promise(r => setTimeout(r, 3000));
        await browser.close();
        
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'error');
        console.error(error);
        if (browser) await browser.close();
    }
    
    fs.writeFileSync('dropdown-test-results.txt', results.join('\n'));
    console.log('\n✅ Results saved to dropdown-test-results.txt');
}

testSelfTransfer();
