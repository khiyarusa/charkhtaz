import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.locator('[data-action="garage"]').first().click();
await page.locator('[data-car-select="prado-150-2021"]').click();
await page.locator('[data-action="tracks"]').first().click();
await page.locator('[data-track-select="tehran-industrial"]').click();
await page.locator('[data-action="start-selected"]').click();

await page.waitForTimeout(3300);
const pedal = await page.locator('.pedal--throttle .pedal__track').boundingBox();
if (pedal) {
  await page.mouse.move(pedal.x + pedal.width / 2, pedal.y + pedal.height - 10);
  await page.mouse.down();
  await page.mouse.move(pedal.x + pedal.width / 2, pedal.y + 6, { steps: 8 });
}

let finished = false;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(2000);
  finished = (await page.locator('.js-overlay .modal').count()) > 0;
  const timer = await page.locator('.js-timer').textContent();
  const speed = await page.locator('.js-speed').textContent();
  const dbg = await page.evaluate(() => {
    const w = window;
    const sc = w.__charkhtaz && w.__charkhtaz.scene;
    if (!sc) return null;
    const t = sc.vehicle.telemetry;
    return {
      x: +sc.vehicle.x.toFixed(1),
      y: +sc.vehicle.y.toFixed(2),
      cp: sc.checkpointsHit,
      gear: t.gear,
      rpm: Math.round(t.rpm),
      finish: sc.track.finishX,
      nextObstacle: sc.track.obstacles.find((o) => o.x > sc.vehicle.x - 2)?.kind ?? 'none',
    };
  });
  console.log(`t+${(i + 1) * 2}s timer=${timer} speed=${speed} finished=${finished}`, JSON.stringify(dbg));
  if (finished) break;
}

if (pedal) await page.mouse.up();
await page.screenshot({ path: 'docs/visual-qa/10-smoke-drive.png' });
if (finished) {
  console.log('RESULT:', (await page.locator('.js-overlay .modal').innerText()).replace(/\n+/g, ' | '));
}
await browser.close();
