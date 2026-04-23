const puppeteer = require('puppeteer');
const fs = require('fs');

async function testDropdown() {
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
        log('Starting dropdown test...', 'test');
        
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        // Login
        log('Navigating to login...', 'info');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
        
        log('Logging in...', 'info');
        await page.type('input[type="email"]', 'admin@company.com');
        await page.type('input[type="password"]', 'Admin@123');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        
        log('Login successful', 'success');
        await new Promise(r => setTimeout(r, 1000));
        
        // Go to inventory
        log('Going to inventory...', 'info');
        await page.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));
        
        // Find and click Transfer Stock button in navbar
        log('Looking for Transfer Stock button in navbar...', 'info');
        const navButtons = await page.$$('button');
        let transferStockClicked = false;
        
        for (const btn of navButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Transfer Stock')) {
                log('Found Transfer Stock button, clicking...', 'info');
                await btn.click();
                transferStockClicked = true;
                break;
            }
        }
        
        if (!transferStockClicked) {
            log('Transfer Stock button not found', 'error');
            await browser.close();
            return;
        }
        
        await new Promise(r => setTimeout(r, 1500));
        
        // Test dropdown selection
        log('Testing dropdown selection...', 'test');
        
        // Get ALL select elements
        const allSelects = await page.$$('select');
        log(`Found ${allSelects.length} select elements`, 'info');
        
        // Find the Transfer Type dropdown (should have "W to W" option)
        let transferTypeSelect = null;
        for (let i = 0; i < allSelects.length; i++) {
            const options = await page.evaluate(select => {
                return Array.from(select.options).map(opt => opt.value);
            }, allSelects[i]);
            
            if (options.includes('W to W')) {
                transferTypeSelect = allSelects[i];
                log(`Found Transfer Type dropdown at index ${i}`, 'info');
                break;
            }
        }
        
        if (!transferTypeSelect) {
            log('Transfer Type dropdown not found!', 'error');
            await browser.close();
            return;
        }
        
        // Get all options
        const options = await page.evaluate(select => {
            return Array.from(select.options).map(opt => ({ value: opt.value, text: opt.text }));
        }, transferTypeSelect);
        
        log(`Transfer Type options: ${options.map(o => o.text).join(', ')}`, 'info');
        
        // Test each transfer type
        const transferTypes = ['W to W', 'W to S', 'S to W', 'S to S'];
        
        for (const type of transferTypes) {
            log(`\nTesting: ${type}`, 'test');
            
            // Select transfer type
            await page.evaluate((select, value) => {
                select.value = value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }, transferTypeSelect, type);
            
            await new Promise(r => setTimeout(r, 800));
            
            // Get the current value of the dropdown
            const currentValue = await page.evaluate(select => select.value, transferTypeSelect);
            log(`Dropdown value after selection: ${currentValue}`, 'info');
            
            // Get all selects again to find source and destination
            const updatedSelects = await page.$$('select');
            
            if (updatedSelects.length >= 3) {
                // Find source and destination dropdowns (they should be visible based on transfer type)
                let sourceSelect = null;
                let destSelect = null;
                
                for (let i = 0; i < updatedSelects.length; i++) {
                    const options = await page.evaluate(select => {
                        return Array.from(select.options).map(opt => opt.text);
                    }, updatedSelects[i]);
                    
                    const optionsStr = options.join(',');
                    
                    // Source dropdown should have warehouse or store options
                    if ((optionsStr.includes('Warehouse') || optionsStr.includes('Store')) && !sourceSelect) {
                        sourceSelect = updatedSelects[i];
                    } else if ((optionsStr.includes('Warehouse') || optionsStr.includes('Store')) && sourceSelect && !destSelect) {
                        destSelect = updatedSelects[i];
                    }
                }
                
                if (sourceSelect && destSelect) {
                    const sourceOptions = await page.evaluate(select => {
                        return Array.from(select.options).length - 1; // -1 for placeholder
                    }, sourceSelect);
                    
                    const destOptions = await page.evaluate(select => {
                        return Array.from(select.options).length - 1; // -1 for placeholder
                    }, destSelect);
                    
                    const sourceLabel = await page.evaluate(select => {
                        return select.previousElementSibling?.textContent || 'Unknown';
                    }, sourceSelect);
                    
                    const destLabel = await page.evaluate(select => {
                        return select.previousElementSibling?.textContent || 'Unknown';
                    }, destSelect);
                    
                    log(`✅ ${type}: Sources=${sourceOptions} (${sourceLabel}), Destinations=${destOptions} (${destLabel})`, 'success');
                } else {
                    log(`❌ Could not find source/destination dropdowns`, 'error');
                }
            } else {
                log(`❌ Not enough dropdowns found (${updatedSelects.length})`, 'error');
            }
        }
        
        log('\n✅ Test completed!', 'success');
        
        // Keep browser open for 5 seconds so you can see
        await new Promise(r => setTimeout(r, 5000));
        await browser.close();
        
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        if (browser) await browser.close();
    }
    
    // Save results
    fs.writeFileSync('dropdown-test-results.txt', results.join('\n'));
    console.log('\n✅ Results saved to dropdown-test-results.txt');
}

testDropdown();
