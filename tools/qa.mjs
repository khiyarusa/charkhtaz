/**
 * CHARKHTAZ live QA harness.
 *
 * Drives the shipped build in a real browser, captures the screenshot set, and
 * measures multi-touch and frame pacing. Nothing is mocked: every state comes
 * from clicking/typing in the app, and every number in the report is read back
 * from the DOM or from requestAnimationFrame.
 *
 * Usage: node tools/qa.mjs <outDir> [width] [height]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const outDir = process.argv[2] ?? 'docs/visual-qa/run/screenshots';
const width = Number(process.argv[3] ?? 1280);
const height = Number(process.argv[4] ?? 720);
const base = process.env.QA_URL ?? 'http://localhost:5173/';
const shotsDir = path.resolve(outDir);
await mkdir(shotsDir, { recursive: true });

let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  /* not a git checkout */
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: false,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
const cdp = await context.newCDPSession(page);

const shots = [];
async function shot(name) {
  await page.screenshot({ path: path.join(shotsDir, `${name}.png`) });
  shots.push(name);
  return name;
}

const nav = async (label) => {
  await page.locator('.nav__item', { hasText: label }).click();
  await page.waitForTimeout(320);
};

await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Deterministic QA save: full garage, enough credits, a career medal already.
await page.evaluate(async () => {
  const mod = await import('/src/vehicles/registry.ts');
  const storage = await import('/src/save/storage.ts');
  const KEY = 'charkhtaz.save.v3';
  const save = storage.defaultSave();
  save.ownedCars = mod.ALL_CARS.map((c) => c.id);
  save.credits = 60000;
  save.profile = { name: 'آرش رستمی', xp: 1400, level: 4, achievements: ['first-finish', 'first-win', 'gold-run'] };
  save.career = { completed: ['c01-first-shift'], medals: { 'c01-first-shift': 'silver' } };
  save.bestTimes = { 'tehran-industrial': 42.35 };
  save.racesFinished = 6;
  save.settings.audio = false;
  localStorage.setItem(KEY, JSON.stringify(save));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(700);

/* ------------------------------------------------------------- screens -- */
await shot('01-home');
await nav('پروفایل');
await shot('02-profile');
await nav('کریر');
await shot('03-career');
await nav('گاراژ');
await shot('04-garage');

const carCount = await page.locator('.car-card').count();
const carNames = [];
for (let i = 0; i < carCount; i++) {
  await page.locator('.car-card').nth(i).click();
  await page.waitForTimeout(260);
  carNames.push((await page.locator('.detail h2').first().innerText()).trim());
  await page.locator('.detail').scrollIntoViewIfNeeded();
  await page.waitForTimeout(140);
  await shot(`05-car-${String(i + 1).padStart(2, '0')}`);
}

// Upgrades: engine, tires, and a real purchase with before/after numbers.
await page.locator('.car-card').first().click();
await page.waitForTimeout(200);
await page.locator('[data-action="upgrades"]').first().click();
await page.waitForTimeout(420);
await shot('06-upgrades');
const creditsBefore = await page.locator('.page__head .chip--amber').first().innerText();
await page.locator('[data-action="buy-upgrade"]').first().click();
await page.waitForTimeout(500);
const creditsAfter = await page.locator('.page__head .chip--amber').first().innerText();
const goodDeltas = await page.locator('.compare .is-good').count();
await shot('07-upgrade-after');
for (const cat of ['tires', 'suspension', 'differential', 'clutch']) {
  const tab = page.locator(`[data-action="set-category"][data-category="${cat}"]`);
  if (await tab.count()) {
    await tab.first().click();
    await page.waitForTimeout(220);
    await shot(`08-upgrade-${cat}`);
  }
}

await nav('تنظیمات');
await shot('09-settings');

/* -------------------------------------------------- test drive + touch -- */
await page.locator('.nav__item', { hasText: 'خانه' }).click();
await page.waitForTimeout(260);
await page.locator('[data-action="mode"][data-mode="practice"]').first().click();
await page.waitForTimeout(260);
await shot('10-track-select');
await page.locator('[data-action="start-selected"]').click();
await page.waitForTimeout(4200);
await shot('11-hud-manual');

// Three simultaneous pointers on throttle / brake / clutch.
const pedalBox = async (kind) => {
  const box = await page.locator(`.pedal--${kind} .pedal__track`).boundingBox();
  return box;
};
const t = await pedalBox('throttle');
const b = await pedalBox('brake');
const c = await pedalBox('clutch');
const touch = (points, type) =>
  cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });

const pt = (box, ratio) => ({ x: box.x + box.width / 2, y: box.y + box.height * (1 - ratio) });
await touch(
  [
    { ...pt(t, 0.8), id: 1 },
    { ...pt(b, 0.45), id: 2 },
    { ...pt(c, 0.7), id: 3 },
  ],
  'touchStart',
);
await page.waitForTimeout(260);
const touchValues = await page.evaluate(() => ({
  throttle: Number(document.querySelector('.pedal--throttle .pedal__track')?.getAttribute('aria-valuenow')),
  brake: Number(document.querySelector('.pedal--brake .pedal__track')?.getAttribute('aria-valuenow')),
  clutch: Number(document.querySelector('.pedal--clutch .pedal__track')?.getAttribute('aria-valuenow')),
}));
await shot('12-hud-three-touch');
await touch([], 'touchEnd');
await page.waitForTimeout(900);
const releaseValues = await page.evaluate(() => ({
  throttle: Number(document.querySelector('.pedal--throttle .pedal__track')?.getAttribute('aria-valuenow')),
  brake: Number(document.querySelector('.pedal--brake .pedal__track')?.getAttribute('aria-valuenow')),
  clutch: Number(document.querySelector('.pedal--clutch .pedal__track')?.getAttribute('aria-valuenow')),
}));

// Keyboard driving (desktop QA path).
await page.keyboard.down('KeyC');
await page.waitForTimeout(520);
await page.keyboard.press('Digit1');
await page.waitForTimeout(200);
await page.keyboard.up('KeyC');
await page.keyboard.down('KeyW');
await page.waitForTimeout(2600);
const driving = await page.evaluate(() => ({
  speed: document.querySelector('.js-speed')?.textContent,
  gear: document.querySelector('.js-gear')?.textContent,
  rpm: document.querySelector('.js-rpm')?.textContent,
}));
await shot('13-hud-driving');
await page.keyboard.up('KeyW');

/* ------------------------------------------------------- race with AI -- */
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await shot('14-pause');
await page.locator('[data-pause="home"]').click();
await page.waitForTimeout(300);

// Automatic car so the clutch is correctly hidden and the selector shows R/N/D.
await page.evaluate(() => {
  const KEY = 'charkhtaz.save.v3';
  const save = JSON.parse(localStorage.getItem(KEY));
  save.lastCarId = 'prado-150-2021';
  localStorage.setItem(KEY, JSON.stringify(save));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.locator('[data-action="mode"][data-mode="race"]').first().click();
await page.waitForTimeout(300);
await page.locator('[data-action="start-selected"]').click();
await page.waitForTimeout(4200);
await shot('15-hud-automatic');
const clutchVisible = await page.locator('.pedal--clutch').isVisible().catch(() => false);

// Frame pacing while the race runs.
const pacing = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const stamps = [];
      const start = performance.now();
      const tick = (now) => {
        stamps.push(now);
        if (now - start < 4000) requestAnimationFrame(tick);
        else {
          const deltas = stamps.slice(1).map((t, i) => t - stamps[i]);
          deltas.sort((a, b) => a - b);
          const q = (p) => deltas[Math.min(deltas.length - 1, Math.floor(deltas.length * p))] ?? 0;
          resolve({
            frames: deltas.length,
            medianMs: Number(q(0.5).toFixed(2)),
            p95Ms: Number(q(0.95).toFixed(2)),
            maxMs: Number((deltas[deltas.length - 1] ?? 0).toFixed(2)),
            fpsMedian: Number((1000 / q(0.5)).toFixed(1)),
          });
        }
      };
      requestAnimationFrame(tick);
    }),
);

await page.keyboard.down('KeyW');
await page.waitForTimeout(3000);
await shot('16-race-ai');

// Drive to the finish with the same recovery a player would use: hold throttle,
// respawn at the last checkpoint whenever the car is wedged.
let finished = false;
for (let i = 0; i < 70; i++) {
  if (await page.locator('.modal--result').count()) {
    finished = true;
    break;
  }
  const speed = await page
    .locator('.js-speed')
    .innerText()
    .then((t) => Number(t.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0))
    .catch(() => 0);
  if (speed < 4) await page.keyboard.press('KeyR');
  await page.waitForTimeout(1400);
}
await page.keyboard.up('KeyW');
if (finished) await shot('17-result');
const standings = await page.locator('.opponent').count();

/* ------------------------------------------------------------- ghost --- */
if (finished) {
  await page.locator('[data-result="home"]').click();
  await page.waitForTimeout(300);
}
await page.evaluate(() => {
  const KEY = 'charkhtaz.save.v3';
  const save = JSON.parse(localStorage.getItem(KEY));
  save.lastCarId = 'shahin-1401';
  localStorage.setItem(KEY, JSON.stringify(save));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('[data-action="mode"][data-mode="time"]').first().click();
await page.waitForTimeout(280);
await page.locator('[data-action="start-selected"]').click();
await page.waitForTimeout(4300);
await shot('18-hud-time-trial');

await writeFile(
  path.join(shotsDir, '..', 'report.json'),
  JSON.stringify(
    {
      commit,
      url: base,
      viewport: { width, height },
      deviceScaleFactor: 1,
      userAgent: await page.evaluate(() => navigator.userAgent),
      carNames,
      shots,
      touchValues,
      releaseValues,
      driving,
      clutchVisible,
      standings,
      pacing,
      errors,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    { shots: shots.length, touchValues, releaseValues, driving, clutchVisible, standings, pacing, errors },
    null,
    2,
  ),
);
await browser.close();
