/**
 * Renders every roster car side by side at a common world scale, using the
 * shipped renderer (not a mockup). Used for art review and committed as QA
 * evidence.
 *
 * Usage: node tools/fleet-sheet.mjs [out.png] [pxPerMetre]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const out = process.argv[2] ?? 'docs/vehicle-art/exports/fleet-sheet.png';
const ppm = Number(process.argv[3] ?? 92);
await mkdir(path.dirname(out), { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1500 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const result = await page.evaluate(async (ppmValue) => {
  const reg = await import('/src/vehicles/registry.ts');
  const prof = await import('/src/vehicles/profiles.ts');
  const art = await import('/src/render/vehicle-art.ts');
  const blueprints = await import('/src/vehicles/art/index.ts');

  const CARS = reg.ALL_CARS;
  const rowH = Math.max(190, Math.round(2.0 * ppmValue) + 96);
  const width = 1800;
  const height = rowH * CARS.length + 40;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.id = 'fleet';
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.background = '#0d0f13';
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no ctx');

  ctx.fillStyle = '#0d0f13';
  ctx.fillRect(0, 0, width, height);

  const names = [];
  CARS.forEach((car, index) => {
    const bp = blueprints.blueprintFor(car.id);
    const resolved = prof.resolveCar(car);
    const y = 20 + index * rowH + rowH * 0.62;
    const cx = width * 0.5;

    ctx.strokeStyle = 'rgba(217,164,65,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + car.numbers.wheelRadiusM * ppmValue);
    ctx.lineTo(width, y + car.numbers.wheelRadiusM * ppmValue);
    ctx.stroke();

    ctx.fillStyle = '#f2ede1';
    ctx.font = '600 15px Vazirmatn, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${car.brandFa} ${car.modelFa}`, 24, y - 90);
    ctx.fillStyle = '#8d8677';
    ctx.font = '12px Vazirmatn, sans-serif';
    ctx.fillText(
      `${car.year} · ${car.trim} · ${Math.round(car.numbers.lengthM * 1000)} mm · WB ${Math.round(car.numbers.wheelbaseM * 1000)}`,
      24,
      y - 70,
    );
    ctx.fillText(
      `overhang ${bp.frontOverhangM.toFixed(2)} / ${bp.rearOverhangM.toFixed(2)} m`,
      24,
      y - 52,
    );

    const half = car.numbers.wheelbaseM / 2;
    const wheels = [
      { xM: -half, yM: 0, radiusM: car.numbers.wheelRadiusM },
      { xM: half, yM: 0, radiusM: car.numbers.wheelRadiusM },
    ];

    ctx.save();
    // Chassis origin sits at axle height, wheels touch the row baseline.
    ctx.translate(cx, y - car.numbers.wheelRadiusM * ppmValue);
    for (const w of wheels) {
      art.drawWheel(ctx, {
        x: w.xM * ppmValue,
        y: 0,
        radiusPx: w.radiusM * ppmValue,
        angleRad: 0,
        index: w.xM > 0 ? 0 : 1,
        slip: 0,
        blueprint: bp.wheel,
      });
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.moveTo(w.xM * ppmValue, 0);
      ctx.lineTo(w.xM * ppmValue, w.radiusM * ppmValue);
      ctx.stroke();
    }
    art.drawCarBody(ctx, resolved, ppmValue, wheels, 0, { lights: true });
    ctx.restore();
    names.push(car.id);
  });

  return { count: CARS.length, names, width, height };
}, ppm);

const el = await page.locator('#fleet');
await el.screenshot({ path: out });
console.log(JSON.stringify({ out, ppm, ...result, errors }, null, 2));
await browser.close();
