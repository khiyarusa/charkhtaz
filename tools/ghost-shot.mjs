/**
 * Records a real time-trial ghost and captures the replay overlay.
 * Usage: node tools/ghost-shot.mjs <outDir>
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const out = process.argv[2] ?? 'docs/visual-qa/v0.2.0/screenshots';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const toNumber = (t) =>
  Number(String(t).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d]/g, ''));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  const storage = await import('/src/save/storage.ts');
  const save = storage.defaultSave();
  save.ownedCars = ['prado-150-2021', 'shahin-1401'];
  save.lastCarId = 'prado-150-2021';
  save.settings.audio = false;
  save.bestTimes = {};
  save.ghosts = {};
  localStorage.setItem('charkhtaz.save.v3', JSON.stringify(save));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const runTrial = async () => {
  await page.locator('[data-action="mode"][data-mode="time"]').first().click();
  await page.waitForTimeout(250);
  await page.locator('[data-action="start-selected"]').click();
  await page.waitForTimeout(4200);
  await page.keyboard.down('KeyW');
  for (let i = 0; i < 70; i++) {
    if (await page.locator('.modal--result').count()) break;
    const speed = toNumber(await page.locator('.js-speed').innerText().catch(() => '0'));
    if (speed < 4) await page.keyboard.press('KeyR');
    await page.waitForTimeout(1200);
  }
  await page.keyboard.up('KeyW');
  const done = (await page.locator('.modal--result').count()) > 0;
  if (done) {
    await page.screenshot({ path: `${out}/19-time-trial-result.png` });
    await page.locator('[data-result="retry"]').click();
    await page.waitForTimeout(4200);
  }
  return done;
};

const first = await runTrial();
await page.keyboard.down('KeyW');
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/20-ghost-replay.png` });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/21-ghost-replay-late.png` });
await page.keyboard.up('KeyW');

const ghostInfo = await page.evaluate(() => {
  const raw = localStorage.getItem('charkhtaz.save.v3');
  const save = raw ? JSON.parse(raw) : null;
  const track = 'tehran-industrial';
  return {
    ghostFrames: save?.ghosts?.[track]?.length ?? 0,
    best: save?.bestTimes?.[track] ?? null,
  };
});
console.log(JSON.stringify({ firstFinished: first, ghostInfo, errors }, null, 2));
await browser.close();
