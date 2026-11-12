import { describe, expect, it } from 'vitest';
import { GAME_NAME_FA, GAME_TAGLINE, GAME_VERSION, versionLabel } from './build-info';

describe('build info', () => {
  it('uses a valid semver version', () => {
    expect(GAME_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('labels the version with a leading v', () => {
    expect(versionLabel()).toBe(`v${GAME_VERSION}`);
  });

  it('carries the Persian product name and a tagline', () => {
    expect(GAME_NAME_FA).toBe('چرخ‌تاز');
    expect(GAME_TAGLINE.length).toBeGreaterThan(0);
  });
});
