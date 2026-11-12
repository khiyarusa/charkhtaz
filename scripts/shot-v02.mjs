import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('docs/visual-qa/v0.2.0/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
console.log('title:', await page.title());
console.log('cards:', await page.locator('.car-card').count());
console.log('modes:', await page.locator('.mode').count());
await page.screenshot({ path: 'docs/visual-qa/v0.2.0/screenshots/01-home.png' });

await page.locator('.nav__item', { hasText: 'کریر' }).click();
await page.waitForTimeout(500);
console.log('events:', await page.locator('.event-card').count());
await page.screenshot({ path: 'docs/visual-qa/v0.2.0/screenshots/02-career.png' });

await page.locator('.nav__item', { hasText: 'گاراژ' }).click();
await page.waitForTimeout(500);
console.log('garage cards:', await page.locator('.car-card').count());
await page.screenshot({ path: 'docs/visual-qa/v0.2.0/screenshots/03-garage.png' });

await page.locator('[data-action="upgrades"]').first().click();
await page.waitForTimeout(500);
console.log('parts:', await page.locator('.part').count());
await page.screenshot({ path: 'docs/visual-qa/v0.2.0/screenshots/04-upgrades.png' });

console.log('ERRORS', JSON.stringify(errors, null, 2));
await browser.close();
