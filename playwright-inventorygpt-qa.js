/**
 * InventoryGPT Playwright E2E QA Tests
 *
 * Real login → real JWT → ek session me queries → bot message count track
 *
 * Run: node playwright-inventorygpt-qa.js
 */

const { chromium } = require('playwright');
const BASE = 'https://veru-inventory.vercel.app';
const API = 'https://api.giftgala.in/api';

const TESTS = [
  // Order matters: "with details" must follow a warehouse query
  { n: 'show warehouses',         q: 'show me all the warehouse',                    c: t => /warehouse/i.test(t) },
  { n: 'deatils → details',       q: 'with details',                                 c: t => /details|card|table|chat|warehouse/i.test(t) },
  { n: 'wearhouse deatils bro',   q: 'show me all the wearhouse with deatils bro',    c: t => /warehouse|details|card|table|chat/i.test(t) },
  { n: 'all products',            q: 'show me all the product',                      c: t => /product|item|catalog/i.test(t) },
  { n: 'best seller',             q: 'most selling product',                         c: t => /selling|popular|best/i.test(t) },
  { n: 'garbage null',            q: 'null',                                          c: t => /welcome|help|inventorygpt|try/i.test(t) },
  { n: 'LLM fallback',            q: 'what should I do today',                        c: t => t.length > 20 },
];

function countBotMessages(page) {
  return page.evaluate(() => {
    const dash = document.querySelector('[data-inventorygpt-dashboard]');
    if (!dash) return 0;
    const panel = [...dash.children].find(c => c.tagName !== 'ASIDE');
    if (!panel) return 0;
    return [...panel.querySelectorAll('[class*="flex items-start"], [class*="flex gap-2"], [class*="flex gap-3"]')]
      .filter(m => {
        const t = m.textContent.trim();
        return t.length > 20 && !t.startsWith('ME') && !t.includes('InsoraOpps') && !t.includes('RECENT');
      }).length;
  });
}

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@company.com', password: 'Admin@123' }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Login failed: ' + JSON.stringify(data));
  return { token: data.token, user: data.user };
}

async function run() {
  console.log('Logging in...');
  const { token, user } = await login();
  console.log(`✓ ${user.name} (${user.role})`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.addInitScript(({ t, u }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, { t: token, u: user });

  await page.goto(`${BASE}/inventorygpt`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const SEL = 'input[placeholder*="Ask anything"]';
  if (!(await page.$(SEL))) {
    console.log('✗ No chat input');
    await browser.close();
    process.exit(1);
  }
  console.log('✓ Ready\n');

  let passed = 0, failed = 0;

  for (const t of TESTS) {
    try {
      console.log(`  ▶ "${t.q}"`);
      const before = await countBotMessages(page);
      const inp = await page.$(SEL);
      await inp.fill(t.q);
      await page.keyboard.press('Enter');

      let reply = null;
      for (let i = 0; i < 60; i++) { // up to 30s
        await page.waitForTimeout(500);
        const now = await countBotMessages(page);
        if (now > before) {
          reply = await page.evaluate(() => {
            const dash = document.querySelector('[data-inventorygpt-dashboard]');
            const panel = [...dash.children].find(c => c.tagName !== 'ASIDE');
            const msgs = [...panel.querySelectorAll('[class*="flex items-start"], [class*="flex gap-2"], [class*="flex gap-3"]')]
              .filter(m => {
                const t = m.textContent.trim();
                return t.length > 20 && !t.startsWith('ME') && !t.includes('InsoraOpps') && !t.includes('RECENT');
              });
            return msgs[msgs.length - 1].textContent.trim();
          });
          break;
        }
      }

      const text = reply || '[timeout]';
      if (t.c(text)) {
        console.log(`  ✓ ${t.n}`);
        passed++;
      } else {
        console.log(`  ✗ ${t.n}`);
        console.log(`    reply: ${text.slice(0, 250).replace(/\n/g, '\\n')}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ✗ ${t.n}: ${e.message}`);
      failed++;
    }
  }

  await browser.close();
  console.log(`\n  ${passed} passed, ${failed} failed, ${passed+failed} total`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
