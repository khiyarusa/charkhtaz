import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

/**
 * Renders an SVG file to PNG at its natural aspect ratio.
 * Usage: node tools/render-svg.mjs <svg> <png> [width]
 */
const [svgPath, outPath, widthArg] = process.argv.slice(2);
const raw = readFileSync(svgPath, 'utf8');
const vb = /viewBox="([\d.\s-]+)"/.exec(raw)?.[1]?.trim().split(/\s+/).map(Number);
const naturalW = vb?.[2] ?? Number(/width="(\d+)"/.exec(raw)?.[1] ?? 512);
const naturalH = vb?.[3] ?? Number(/height="(\d+)"/.exec(raw)?.[1] ?? 512);
const width = Number(widthArg ?? Math.min(1024, naturalW));
const height = Math.round((width * naturalH) / naturalW);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
await page.goto(`file://${process.cwd().replace(/\\/g, '/')}/${svgPath}`);
await page.waitForTimeout(250);
await page.screenshot({ path: outPath, omitBackground: true });
await browser.close();
console.log('wrote', outPath, { width, height });
