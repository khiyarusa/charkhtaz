import { describe, expect, it } from 'vitest';
import { computeReward, claimReward, evaluateAchievements } from './economy';
import { CAREER_EVENTS, TRIAL_GOLD, eventStates, medalForScore, medalForTime, medalThresholds, trialScore } from './career';
import { defaultSave, type SaveData } from '../save/storage';

const baseInput = {
  mode: 'race' as const,
  timeS: 60,
  penaltiesS: 0,
  damage: 0.02,
  position: 1,
  totalRacers: 3,
  medal: 'gold' as const,
  difficulty: 3,
};

describe('economy', () => {
  it('computes a deterministic, transparent reward', () => {
    const a = computeReward(baseInput);
    const b = computeReward(baseInput);
    expect(a).toEqual(b);
    expect(a.credits).toBeGreaterThan(2000);
    expect(a.linesFa.length).toBeGreaterThan(2);
    expect(a.xp).toBe(Math.round(a.credits / 8));
  });

  it('pays a run only once', () => {
    let save: SaveData = { ...defaultSave(), credits: 0 };
    const reward = computeReward(baseInput);
    const first = claimReward(save, 'run-1', reward);
    expect(first.credited).toBe(true);
    save = first.save;
    expect(save.credits).toBe(reward.credits);

    const second = claimReward(save, 'run-1', reward);
    expect(second.credited).toBe(false);
    expect(second.save.credits).toBe(reward.credits);
  });

  it('unlocks achievements without duplicating them', () => {
    const save: SaveData = { ...defaultSave(), racesFinished: 1 };
    const first = evaluateAchievements(save, { position: 1 });
    expect(first.unlocked.map((a) => a.id)).toContain('first-finish');
    expect(first.unlocked.map((a) => a.id)).toContain('first-win');
    const again = evaluateAchievements(first.save, { position: 1 });
    expect(again.unlocked).toHaveLength(0);
  });
});

describe('career and scoring', () => {
  it('locks events until their prerequisite is completed', () => {
    const save = defaultSave();
    const states = eventStates(save);
    expect(states[0]!.unlocked).toBe(true);
    expect(states[1]!.unlocked).toBe(false);

    save.career.completed.push('c01-first-shift');
    expect(eventStates(save)[1]!.unlocked).toBe(true);
  });

  it('has a complete ten-event chain with unique ids', () => {
    expect(CAREER_EVENTS).toHaveLength(10);
    expect(new Set(CAREER_EVENTS.map((e) => e.id)).size).toBe(10);
    for (const event of CAREER_EVENTS.slice(1)) {
      expect(event.requires).toBeDefined();
    }
  });

  it('maps times to medals with ordered thresholds', () => {
    const t = medalThresholds(400, 3);
    expect(t.gold).toBeLessThan(t.silver);
    expect(t.silver).toBeLessThan(t.bronze);
    expect(medalForTime(t.gold, t)).toBe('gold');
    expect(medalForTime(t.silver, t)).toBe('silver');
    expect(medalForTime(t.bronze, t)).toBe('bronze');
    expect(medalForTime(t.bronze + 1, t)).toBeNull();
  });

  it('scores obstacle trials and awards medals deterministically', () => {
    const result = {
      mode: 'trial' as const,
      timeS: 40,
      topSpeedKph: 80,
      damage: 0.05,
      checkpointsHit: 3,
      totalCheckpoints: 3,
      penaltiesS: 0,
      trackId: 'zagros-climb',
      carId: 'prado-150-2021',
      position: 1,
      totalRacers: 1,
      medal: null,
      score: null,
      runId: 'x',
      parS: 40,
    };
    const score = trialScore(result);
    expect(score).toBeGreaterThanOrEqual(TRIAL_GOLD);
    expect(medalForScore(score)).toBe('gold');
    expect(trialScore({ ...result, damage: 1, penaltiesS: 9 })).toBeLessThan(score);
    // A slow run at the same damage scores less than a clean one at par.
    expect(trialScore({ ...result, timeS: 60 })).toBeLessThan(score);
    // A route with a longer par still scores 1000 at its own par pace.
    expect(trialScore({ ...result, parS: 70, timeS: 70, damage: 0 })).toBeGreaterThanOrEqual(1000);
  });
});
