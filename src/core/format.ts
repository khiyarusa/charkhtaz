/** Persian-first formatting helpers. All player-facing numbers go through these. */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Convert Latin digits in a string to Persian digits. */
export function faNum(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)] ?? d);
}

/** Persian decimal separator. */
export const FA_DECIMAL = '٫';

export function faFixed(value: number, digits = 1): string {
  const clamped = Number.isFinite(value) ? value : 0;
  return faNum(clamped.toFixed(digits).replace('.', FA_DECIMAL));
}

/** Integer with thousands separators (Persian digits, ٬ separator). */
export function faGroup(value: number): string {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  return faNum(n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
}

/** Race time: m:ss٫cc (Persian). */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const total = Math.floor(seconds * 100) / 100;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  // A period between seconds and hundredths reads unambiguously at HUD size;
  // the Persian decimal separator U+066B looks like a slash in many fonts.
  const sStr = faNum(s.toFixed(2).padStart(5, '0'));
  return m > 0 ? `${faNum(m)}:${sStr}` : sStr;
}

/** Short duration like ۰٫۳۴ ثانیه. */
export function formatSeconds(seconds: number): string {
  return `${faFixed(seconds, 2)} ثانیه`;
}

/** Gear label: R / N / 1..N with Persian digits. */
export function gearLabel(gear: number): string {
  if (gear === -1) return 'R';
  if (gear === 0) return 'N';
  return faNum(gear);
}
