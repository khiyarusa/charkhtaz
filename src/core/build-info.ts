/**
 * CHARKHTAZ (چرخ‌تاز) — build identity constants.
 *
 * Keep GAME_VERSION in sync with package.json and (later) the Android
 * versionName/versionCode. See AGENTS.md for release conventions.
 */
export const GAME_NAME_FA = 'چرخ‌تاز';
export const GAME_NAME_LATIN = 'CHARKHTAZ';
export const GAME_TAGLINE = 'RACE • SHIFT • CONQUER';
export const GAME_VERSION = '0.2.0';

/** Human-readable version label, e.g. `v0.1.0`. */
export function versionLabel(): string {
  return `v${GAME_VERSION}`;
}
