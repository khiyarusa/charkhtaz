import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const outDir = 'docs/visual-qa';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/01-home.png` });
await page.locator('.hero h1').screenshot({ path: `${outDir}/08-title.png` });

await page.locator('[data-action="garage"]').first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/02-garage.png` });

await page.locator('[data-car-select="prado-150-2021"]').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/03-garage-prado.png` });

await page.locator('[data-action="tracks"]').first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/04-tracks.png` });

await page.locator('[data-track-select="tehran-industrial"]').click();
await page.waitForTimeout(300);
await page.locator('[data-action="start-selected"]').click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${outDir}/05-game-countdown.png` });

await page.waitForTimeout(2800);

const pedal = await page.locator('.pedal--throttle .pedal__track').boundingBox();
if (pedal) {
  await page.mouse.move(pedal.x + pedal.width / 2, pedal.y + pedal.height - 10);
  await page.mouse.down();
  await page.mouse.move(pedal.x + pedal.width / 2, pedal.y + 10, { steps: 10 });
}
await page.waitForTimeout(4200);
await page.screenshot({ path: `${outDir}/06-game-driving.png` });

await page.waitForTimeout(2600);
await page.screenshot({ path: `${outDir}/07-game-driving-2.png` });
if (pedal) await page.mouse.up();

await page.locator('.js-pause').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/09-pause.png` });

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
