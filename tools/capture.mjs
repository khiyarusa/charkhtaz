/**
 * Live visual QA capture.
 *
 * Usage: node tools/capture.mjs [outDir] [width] [height]
 * Requires a running dev server on http://localhost:5173.
 *
 * Writes real PNG screenshots of the running game plus a JSON report with
 * console errors and layout measurements. Nothing here is mocked: every state
 * is produced by clicking the shipped UI.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outDir = process.argv[2] ?? 'docs/visual-qa/live/screenshots';
const width = Number(process.argv[3] ?? 1280);
const height = Number(process.argv[4] ?? 720);
const base = process.env.QA_URL ?? 'http://localhost:5173/';

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1,
  hasTouch: true,
});
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

const shots = [];
const shot = async (name, opts = {}) => {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, ...opts });
  shots.push(name);
};

const clickNav = async (label) => {
  await page.locator('.nav__item', { hasText: label }).click();
  await page.waitForTimeout(350);
};

await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(700);

// Seed a deterministic QA save: own every car, enough credits for upgrades.
await page.evaluate(() => {
  const KEY = 'charkhtaz.save.v3';
  const base = {
    version: 3,
    settings: { audio: false, volume: 0.8, showDebug: false, reducedMotion: false },
    bestTimes: {},
    bestScores: {},
    lastCarId: 'shahin-1401',
    lastTrackId: 'tehran-industrial',
    racesFinished: 3,
    credits: 48000,
    profile: { name: 'آرش رستمی', xp: 900, level: 3, achievements: ['first-finish', 'first-win'] },
    ownedCars: [],
    upgrades: {},
    condition: {},
    cosmetics: {},
    career: { completed: [], medals: {} },
    ghosts: {},
    claimedRuns: [],
  };
  base.ownedCars = [];
  localStorage.setItem(KEY, JSON.stringify(base));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
// Own every roster car through the real save store.
const ownership = await page.evaluate(async () => {
  const mod = await import('/src/vehicles/registry.ts');
  const KEY = 'charkhtaz.save.v3';
  const save = JSON.parse(localStorage.getItem(KEY));
  save.ownedCars = mod.ALL_CARS.map((c) => c.id);
  localStorage.setItem(KEY, JSON.stringify(save));
  return save.ownedCars;
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);

await shot('01-home');

await clickNav('پروفایل');
await shot('02-profile');

await clickNav('کریر');
await shot('03-career');

await clickNav('گاراژ');
await shot('04-garage');

// Every car's detail view.
const cars = await page.locator('.car-card').count();
const carNames = [];
for (let i = 0; i < cars; i++) {
  await page.locator('.car-card').nth(i).click();
  await page.waitForTimeout(280);
  const name = await page.locator('.detail h2').first().innerText();
  carNames.push(name);
  await page.locator('.detail').scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  await shot(`05-garage-${String(i + 1).padStart(2, '0')}`);
}

// Upgrades for the first car.
await page.locator('.car-card').first().click();
await page.waitForTimeout(250);
await page.locator('[data-action="upgrades"]').first().click();
await page.waitForTimeout(400);
await shot('06-upgrades');
for (const cat of ['engine', 'transmission', 'clutch', 'tires', 'suspension', 'brakes', 'weight', 'differential']) {
  const tab = page.locator(`[data-action="set-category"][data-category="${cat}"]`);
  if (await tab.count()) {
    await tab.first().click();
    await page.waitForTimeout(220);
    await shot(`07-upgrade-${cat}`);
  }
}

await clickNav('تنظیمات');
await shot('08-settings');

// Manual car race HUD: practice + keyboard throttle.
await page.locator('.nav__item', { hasText: 'خانه' }).click();
await page.waitForTimeout(300);
await page.locator('[data-action="mode"][data-mode="practice"]').first().click();
await page.waitForTimeout(300);
await shot('09-track-select');
await page.locator('[data-action="start-selected"]').click();
await page.waitForTimeout(4200);
await shot('10-hud-manual-idle');
await page.keyboard.down('KeyC');
await page.waitForTimeout(250);
await page.keyboard.press('Digit1');
await page.waitForTimeout(150);
await page.keyboard.up('KeyC');
await page.keyboard.down('KeyW');
await page.waitForTimeout(2600);
await shot('11-hud-manual-driving');
await page.keyboard.up('KeyW');
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await shot('12-pause');

const layout = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  return {
    viewport: { w: innerWidth, h: innerHeight },
    speedo: pick('.speedo'),
    speedRing: pick('.speedo__ring'),
    standings: pick('.opponents'),
    pedals: pick('.pedals'),
    gearRow: pick('.gear-select'),
    hint: pick('.hud__hint'),
  };
});

await writeFile(
  path.join(outDir, '..', 'report.json'),
  JSON.stringify({ url: base, viewport: { width, height }, carNames, shots, layout, errors }, null, 2),
);
console.log(JSON.stringify({ shots: shots.length, errors, layout }, null, 2));
await browser.close();
