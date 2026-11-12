import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';

/**
 * Renders the brand emblem to every PNG size the web app and Android launcher
 * need. Android mipmaps are overwritten in place so the launcher icon and the
 * in-game mark stay the same artwork.
 */
const sizes = {
  'public/brand': [512, 192, 96, 48, 32],
  'android/app/src/main/res/mipmap-mdpi': [48],
  'android/app/src/main/res/mipmap-hdpi': [72],
  'android/app/src/main/res/mipmap-xhdpi': [96],
  'android/app/src/main/res/mipmap-xxhdpi': [144],
  'android/app/src/main/res/mipmap-xxxhdpi': [192],
};

const svg = await readFile('public/brand/pumpkin-emblem.svg', 'utf8');
const svgHtml = `<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`;

const browser = await chromium.launch({ channel: 'msedge', headless: true });

for (const [dir, list] of Object.entries(sizes)) {
  await mkdir(dir, { recursive: true });
  for (const size of list) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(svgHtml);
    await page.waitForTimeout(60);
    const name =
      dir === 'public/brand' ? `pumpkin-${size}.png` : 'ic_launcher.png';
    await page.screenshot({ path: `${dir}/${name}`, omitBackground: true });
    if (dir !== 'public/brand') {
      await page.screenshot({
        path: `${dir}/ic_launcher_round.png`,
        omitBackground: true,
      });
    }
    await page.close();
    console.log(`${dir}/${name}`, size);
  }
}

await browser.close();
