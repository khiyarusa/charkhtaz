import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const dir = 'docs/visual-qa/v0.2.0/screenshots';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

// Clear any existing save so the run starts from a known economy.
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
// QA seed: own the automatic Prado and select it so the race HUD can be
// exercised without a clutch gesture; this is test data, not a shipped default.
await page.evaluate(() => {
  const raw = localStorage.getItem('charkhtaz.save.v3');
  const save = raw
    ? JSON.parse(raw)
    : { version: 3, settings: { audio: false }, credits: 16000 };
  save.ownedCars = Array.from(new Set([...(save.ownedCars || []), 'shahin-1401', 'prado-150-2021']));
  save.lastCarId = 'prado-150-2021';
  save.credits = save.credits ?? 16000;
  localStorage.setItem('charkhtaz.save.v3', JSON.stringify(save));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.screenshot({ path: `${dir}/01-home.png` });

// Profile + career + garage + upgrades at the top of each page.
await page.locator('.nav__item', { hasText: 'پروفایل' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/05-profile.png` });
await page.locator('.nav__item', { hasText: 'کریر' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/02-career.png` });
await page.locator('.nav__item', { hasText: 'گاراژ' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/03-garage.png` });
await page.locator('[data-action="upgrades"]').first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/04-upgrades.png` });

// Buy the first engine tier and confirm credits + stats update.
const creditsBefore = await page.locator('.chip--amber').first().innerText();
await page.locator('[data-action="buy-upgrade"]').first().click();
await page.waitForTimeout(500);
const creditsAfter = await page.locator('.chip--amber').first().innerText();
const compareGood = await page.locator('.compare .is-good').count();
await page.screenshot({ path: `${dir}/06-upgrade-after.png` });
console.log('upgrade', { creditsBefore, creditsAfter, compareGood });

// Reload and verify the purchase persisted.
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const persisted = await page.evaluate(() => {
  const raw = localStorage.getItem('charkhtaz.save.v3');
  if (!raw) return null;
  const save = JSON.parse(raw);
  return { credits: save.credits, engine: save.upgrades?.['prado-150-2021']?.engine };
});
console.log('persisted', persisted);

// Start a race with AI opponents.
await page.locator('[data-action="quick-race"]').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/07-tracks.png` });
await page.locator('[data-action="start-selected"]').click();
await page.waitForTimeout(3800);
await page.screenshot({ path: `${dir}/08-hud-manual.png` });

const pedal = await page.locator('.pedal--throttle .pedal__track').boundingBox();
if (pedal) {
  await page.mouse.move(pedal.x + pedal.width / 2, pedal.y + pedal.height - 8);
  await page.mouse.down();
  await page.mouse.move(pedal.x + pedal.width / 2, pedal.y + 8, { steps: 8 });
}
await page.waitForTimeout(6500);
await page.screenshot({ path: `${dir}/09-race-ai.png` });
const standing = await page.locator('.opponent').count();
const speed = await page.locator('.js-speed').innerText();
const gear = await page.locator('.js-gear').innerText();
console.log('race', { standing, speed, gear });

await page.waitForTimeout(22000);
const overlay = await page.locator('.js-overlay .modal').count();
if (overlay) {
  await page.screenshot({ path: `${dir}/10-results.png` });
  console.log('result:', (await page.locator('.js-overlay .modal').innerText()).replace(/\n+/g, ' | ').slice(0, 500));
} else {
  await page.screenshot({ path: `${dir}/10-race-late.png` });
}

console.log('ERRORS', JSON.stringify(errors, null, 2));
await browser.close();
