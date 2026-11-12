import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => console.log('console', m.type(), m.text()));
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const info = await page.evaluate(() => {
  const h1 = document.querySelector('.hero h1');
  const text = h1?.textContent ?? '';
  const font = document.fonts.check('800 64px Vazirmatn');
  return {
    text,
    codes: Array.from(text).map((c) => c.codePointAt(0)?.toString(16)),
    font,
  };
});
console.log(JSON.stringify(info, null, 2));

await page.locator('[data-action="garage"]').first().click();
await page.waitForTimeout(400);
await page.locator('[data-car-select="prado-150-2021"]').click();
await page.waitForTimeout(400);
await page.locator('[data-action="tracks"]').first().click();
await page.waitForTimeout(300);
await page.locator('[data-track-select="tehran-industrial"]').click();
await page.waitForTimeout(200);
await page.locator('[data-action="start-selected"]').click();
await page.waitForTimeout(1200);

const pixels = await page.evaluate(() => {
  const c = document.querySelector('.game-canvas');
  const ctx = c.getContext('2d');
  const sample = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
  return {
    size: [c.width, c.height],
    groundTop: sample(640, 505),
    groundMid: sample(640, 560),
    groundLow: sample(640, 680),
    sky: sample(640, 300),
  };
});
console.log(JSON.stringify(pixels));
await browser.close();
