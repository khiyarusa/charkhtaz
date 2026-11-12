/**
 * Builds the brand lockups as self-contained SVGs.
 *
 * The Persian wordmark must keep Vazirmatn shaping wherever the file is opened,
 * so the font is embedded as a data URI instead of relying on the viewer having
 * it installed. Four lockups are produced: horizontal and stacked, each on a
 * dark-ground (light text) and light-ground (graphite text) variant.
 */
import { readFile, writeFile } from 'node:fs/promises';

const font = await readFile('public/assets/fonts/Vazirmatn-ExtraBold.woff2');
const b64 = font.toString('base64');
const fontFace = `@font-face{font-family:'VazirmatnEmbed';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:800;font-style:normal;}`;

const emblem = await readFile('public/brand/pumpkin-emblem.svg', 'utf8');
const inner = emblem
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/id="badgeClip"/g, 'id="badgeClipLock"')
  .replace(/url\(#badgeClip\)/g, 'url(#badgeClipLock)');

const FA = 'چرخ‌تاز';

function horizontal(ink, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 280" width="1040" height="280" role="img" aria-label="چرخ‌تاز · CHARKHTAZ">
  <style>${fontFace}</style>
  <g transform="translate(12,14) scale(0.47)">${inner}</g>
  <text x="650" y="150" font-family="VazirmatnEmbed, Vazirmatn, sans-serif" font-weight="800" font-size="112" fill="${ink}" text-anchor="middle" direction="rtl">${FA}</text>
  <text x="650" y="212" font-family="VazirmatnEmbed, Vazirmatn, sans-serif" font-weight="800" font-size="26" letter-spacing="12" fill="${accent}" text-anchor="middle">CHARKHTAZ</text>
  <rect x="560" y="232" width="180" height="4" rx="2" fill="${accent}" opacity="0.45"/>
</svg>
`;
}

function stacked(ink, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 760" width="620" height="760" role="img" aria-label="چرخ‌تاز · CHARKHTAZ">
  <style>${fontFace}</style>
  <g transform="translate(70,10) scale(0.94)">${inner}</g>
  <text x="310" y="600" font-family="VazirmatnEmbed, Vazirmatn, sans-serif" font-weight="800" font-size="116" fill="${ink}" text-anchor="middle" direction="rtl">${FA}</text>
  <text x="310" y="660" font-family="VazirmatnEmbed, Vazirmatn, sans-serif" font-weight="800" font-size="26" letter-spacing="12" fill="${accent}" text-anchor="middle">CHARKHTAZ</text>
  <rect x="215" y="686" width="190" height="4" rx="2" fill="${accent}" opacity="0.45"/>
</svg>
`;
}

const DARK_INK = '#f4efe4';
const LIGHT_INK = '#14171c';
const AMBER = '#d9a441';

await writeFile('public/brand/logo-horizontal.svg', horizontal(DARK_INK, AMBER));
await writeFile('public/brand/logo-horizontal-dark.svg', horizontal(DARK_INK, AMBER));
await writeFile('public/brand/logo-horizontal-light.svg', horizontal(LIGHT_INK, '#b07a1c'));
await writeFile('public/brand/logo-stacked.svg', stacked(DARK_INK, AMBER));
await writeFile('public/brand/logo-stacked-dark.svg', stacked(DARK_INK, AMBER));
await writeFile('public/brand/logo-stacked-light.svg', stacked(LIGHT_INK, '#b07a1c'));
console.log('lockups written', { fontBytes: font.length });
