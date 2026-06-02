/**
 * InventoryGPT Playwright E2E QA Tests
 *
 * Tests the real chat UI in a browser:
 *   1. Open the InventoryGPT page
 *   2. Type each test query
 *   3. Verify the bot responds correctly
 *
 * Run: npx playwright test playwright-inventorygpt-qa.js
 * Or:  node playwright-inventorygpt-qa.js  (if using @playwright/test)
 */

const { chromium } = require('playwright');
const BASE_URL = process.env.BASE_URL || 'https://veru-inventory.vercel.app';

const TEST_QUERIES = [
  {
    name: 'show all warehouses',
    query: 'show me all the warehouse',
    expect: (text) => /warehouse|warehouses/i.test(text) && text.length > 50,
  },
  {
    name: 'with details follow-up',
    query: 'with details',
    expect: (text) => /details|complete detail/i.test(text),
  },
  {
    name: 'all products',
    query: 'show me all the product',
    expect: (text) => /product|item|catalog/i.test(text) && text.length > 50,
  },
  {
    name: 'best seller',
    query: 'most selling product',
    expect: (text) => /selling|popular|best/i.test(text),
  },
  {
    name: 'misspelling: deatils → details',
    query: 'with deatils',
    expect: (text) => /details|complete detail/i.test(text),
  },
  {
    name: 'misspelling: shoe → show',
    query: 'ok shoe me in cards',
    expect: (text) => /card|table|chat|view/i.test(text),
  },
  {
    name: 'warehouse details bro',
    query: 'show me all the wearhouse with deatils bro',
    expect: (text) => /warehouse|details/i.test(text),
  },
  {
    name: 'garbage input: null',
    query: 'null',
    expect: (text) => /welcome|help|inventorygpt/i.test(text),
  },
  {
    name: 'LLM fallback: what should I do',
    query: 'what should I do today',
    expect: (text) => text.length > 20, // Should get some response
  },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  console.log(`\n🧪 InventoryGPT Playwright QA Suite\n`);
  console.log(`Target: ${BASE_URL}/inventorygpt\n`);

  for (const test of TEST_QUERIES) {
    try {
      await page.goto(`${BASE_URL}/inventorygpt`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait for input field to be ready
      await page.waitForSelector('textarea, input[type="text"], [contenteditable]', {
        timeout: 10000,
      });

      // Type the query
      const input = await page.$('textarea, input[type="text"], [contenteditable]');
      if (!input) {
        console.log(`  ⚠ SKIP ${test.name}: no input field found`);
        continue;
      }
      await input.fill(test.query);

      // Press Enter or click send button
      const sendBtn = await page.$('button[type="submit"], button:has(svg), .send-button');
      if (sendBtn) {
        await sendBtn.click();
      } else {
        await input.press('Enter');
      }

      // Wait for bot response (typing animation + response)
      await page.waitForTimeout(3000);

      // Wait for a message from assistant to appear
      const responseText = await page.evaluate(() => {
        const messages = document.querySelectorAll('[class*="message"], [class*="assistant"], [class*="bot"], [class*="response"]');
        const lastMsg = messages[messages.length - 1];
        return lastMsg ? lastMsg.textContent : '';
      });

      if (!responseText) {
        // Fallback: wait longer and try again
        await page.waitForTimeout(5000);
        const responseText2 = await page.evaluate(() => {
          const allDivs = document.querySelectorAll('div');
          for (const div of allDivs) {
            if (div.textContent && div.textContent.length > 30) return div.textContent;
          }
          return '';
        });

        if (!responseText2 || responseText2.length < 10) {
          console.log(`  ✗ ${test.name}: no response found`);
          failed++;
          continue;
        }

        if (test.expect(responseText2)) {
          console.log(`  ✓ ${test.name}`);
          passed++;
        } else {
          console.log(`  ✗ ${test.name}: unexpected response (${responseText2.slice(0, 80)}...)`);
          failed++;
        }
      } else {
        if (test.expect(responseText)) {
          console.log(`  ✓ ${test.name}`);
          passed++;
        } else {
          console.log(`  ✗ ${test.name}: unexpected response (${responseText.slice(0, 80)}...)`);
          failed++;
        }
      }
    } catch (e) {
      console.log(`  ✗ ${test.name}: error — ${e.message}`);
      failed++;
    }
  }

  await browser.close();

  console.log(`\n RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
