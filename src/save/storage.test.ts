import { describe, expect, it } from 'vitest';
import { migrateSave, STARTING_CREDITS, xpForLevel, levelFromXp } from './storage';
import { DEFAULT_CONDITION } from '../vehicles/profiles';

describe('save migration', () => {
  it('migrates a v2 save without losing records or settings', () => {
    const save = migrateSave({
      version: 2,
      settings: { audio: false, pedal: { handedness: 'left', scale: 1.1 } },
      bestTimes: { 'jajrud-pass': 62.4, bad: 'nope' },
      lastCarId: 'bmw-320i-g20',
      lastTrackId: 'kavir-dash',
      racesFinished: 7,
      credits: 5000,
      profile: { name: 'کیان', xp: 900 },
      ownedCars: ['shahin-1401', 'bmw-320i-g20'],
    });

    expect(save).not.toBeNull();
    expect(save!.version).toBe(3);
    expect(save!.settings.audio).toBe(false);
    expect(save!.settings.pedal.handedness).toBe('left');
    expect(save!.bestTimes['jajrud-pass']).toBe(62.4);
    expect(save!.bestTimes.bad).toBeUndefined();
    expect(save!.lastCarId).toBe('bmw-320i-g20');
    expect(save!.ownedCars).toContain('bmw-320i-g20');
    expect(save!.credits).toBe(5000);
    expect(save!.profile.name).toBe('کیان');
    expect(save!.racesFinished).toBe(7);
  });

  it('fills a fresh save with credits, profile and the starter car', () => {
    const save = migrateSave({});
    expect(save).not.toBeNull();
    expect(save!.credits).toBe(STARTING_CREDITS);
    expect(save!.ownedCars).toContain('shahin-1401');
    expect(save!.profile.level).toBe(1);
    expect(save!.career.completed).toEqual([]);
  });

  it('keeps valid upgrade levels, conditions and ghosts, drops corrupt ones', () => {
    const save = migrateSave({
      upgrades: {
        'shahin-1401': { engine: 2, clutch: 9, transmission: 1 },
        broken: 'nope',
      },
      condition: { 'shahin-1401': { tires: 0.5, engine: 2, body: -1 } },
      ghosts: {
        'tehran-industrial': [
          [0, 6, 1, 0, 0, 0],
          [0.1, 7, 1, 0.1, 1, 2],
          [0.2, 8, 1, 0.2, 2, 3],
        ],
        bad: [[1]],
      },
      claimedRuns: ['a', 'b'],
    });
    expect(save!.upgrades['shahin-1401']!.engine).toBe(2);
    expect(save!.upgrades['shahin-1401']!.clutch).toBe(3);
    expect(save!.upgrades.broken).toBeUndefined();
    expect(save!.condition['shahin-1401']!.engine).toBe(1);
    expect(save!.condition['shahin-1401']!.body).toBe(0);
    expect(save!.ghosts['tehran-industrial']).toHaveLength(3);
    expect(save!.ghosts.bad).toBeUndefined();
    expect(save!.claimedRuns).toEqual(['a', 'b']);
  });

  it('rejects a non-object payload', () => {
    expect(migrateSave('nope')).toBeNull();
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave(42)).toBeNull();
  });

  it('derives level from xp consistently', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(4))).toBe(4);
    expect(levelFromXp(xpForLevel(4) + 1)).toBe(4);
  });

  it('never stores a negative credit balance', () => {
    const save = migrateSave({ credits: -500 });
    expect(save!.credits).toBe(0);
    expect(DEFAULT_CONDITION.body).toBe(1);
  });
});
