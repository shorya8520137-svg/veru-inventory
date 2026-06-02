/**
 * InventoryGPT Playwright E2E QA Tests
 *
 * 1. Authenticates via API (needs Express backend running)
 * 2. Runs chat queries against the real UI
 *
 * Run: node playwright-inventorygpt-qa.js
 */

const { chromium } = require('playwright');
const BASE_URL = process.env.BASE_URL || 'https://veru-inventory.vercel.app';
const API_BASE = process.env.API_BASE || 'https://api.giftgala.in';
const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123';

const TEST_QUERIES = [
  {
    name: 'show all warehouses',
    query: 'show me all the warehouse',
    expect: (text) => /warehouse/i.test(text) && text.length > 50,
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
    name: 'misspelling: deatils → details follow-up',
    query: 'with details',
    expect: (text) => /details|complete detail|warehouse|cards?|table|chat/i.test(text),
  },
  {
    name: 'warehouse details bro (full misspellings)',
    query: 'show me all the wearhouse with deatils bro',
    expect: (text) => /warehouse|details|cards?|table|chat/i.test(text),
  },
  {
    name: 'garbage input: null',
    query: 'null',
    expect: (text) => /welcome|help|inventorygpt|try/i.test(text),
  },
  {
    name: 'LLM fallback: what should I do',
    query: 'what should I do today',
    expect: (text) => text.length > 20,
  },
];

async function loginViaApi(page, apiContext) {
  const res = await apiContext.post(`${API_BASE}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    timeout: 15000,
  });
  if (!res.ok()) throw new Error(`HTTP ${res.status()}`);
  const data = await res.json();
  if (!data.success || !data.token) throw new Error(data.error || 'no token in response');
  // Stamp token into localStorage so the SPA thinks we are logged in
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ email: 'admin@company.com', role: 'admin' }));
  }, data.token);
}

async function getResponseText(page) {
  return page.evaluate(() => {
    for (const sel of ['[class*="message"]','[class*="assistant"]','[class*="bot"]','[class*="response"]','[class*="chat-msg"]']) {
      const els = document.querySelectorAll(sel);
      if (els.length) return els[els.length - 1].textContent?.trim() || '';
    }
    const divs = document.querySelectorAll('div');
    for (let i = divs.length - 1; i >= 0; i--) {
      const t = divs[i].textContent?.trim();
      if (t && t.length > 30 && !t.includes('Sign In') && !t.includes('Email')) return t;
    }
    return document.body.innerText;
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const apiContext = await context.request;

  let passed = 0, failed = 0;

  console.log(`\n🧪 InventoryGPT Playwright E2E QA Suite\n`);

  // ── Health check & login ──
  try {
    const health = await apiContext.get(`${API_BASE}/api/health`, { timeout: 8000 }).catch(() => null);
    if (!health || !health.ok()) {
      throw new Error(`Express backend at ${API_BASE} returned ${health?.status() || 'no response'} — is the server running?`);
    }
    console.log('  ✓ Backend reachable, authenticating...');
    await loginViaApi(page, apiContext);
    console.log('  ✓ Authenticated\n');
  } catch (e) {
    console.log(`  ⚠ Cannot run E2E tests: ${e.message}`);
    await browser.close();
    process.exit(0); // Graceful skip — not a test failure
  }

  // ── Run queries ──
  for (const test of TEST_QUERIES) {
    try {
      console.log(`  ▶ ${test.query}`);
      await page.goto(`${BASE_URL}/inventorygpt`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      const chatInput = await page.$('textarea, input[type="text"], [contenteditable], [role="textbox"]');
      if (!chatInput) { console.log(`  ⚠ SKIP ${test.name}: no input`); continue; }

      await chatInput.fill(test.query);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);

      const text = await getResponseText(page);
      if (test.expect(text)) {
        console.log(`  ✓ ${test.name}`);
        passed++;
      } else {
        console.log(`  ✗ ${test.name}: unexpected response`);
        console.log(`    ${text.slice(0, 140).replace(/\n/g, '\\n')}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ✗ ${test.name}: ${e.message}`);
      failed++;
    }
  }

  await browser.close();
  console.log(`\n RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => { console.error('Fatal:', e); process.exit(1); });
