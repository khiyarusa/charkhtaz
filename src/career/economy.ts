import type { RaceResult } from '../game/scene';
import type { Medal, SaveData } from '../save/storage';
import { levelFromXp } from '../save/storage';

export interface RewardInput {
  mode: RaceResult['mode'];
  timeS: number;
  penaltiesS: number;
  damage: number;
  position: number;
  totalRacers: number;
  medal?: Medal;
  difficulty: number;
  /** Player-chosen challenge multiplier (easy 0.85 … hard 1.2). */
  challenge?: number;
}

export interface RewardBreakdown {
  credits: number;
  xp: number;
  linesFa: string[];
}

/**
 * Transparent reward formula. No random bonuses, no duplicate claim path:
 * the results screen calls claimReward exactly once per run id.
 */
export function computeReward(input: RewardInput): RewardBreakdown {
  const lines: string[] = [];
  const baseByMode: Record<RewardInput['mode'], number> = {
    race: 900,
    time: 700,
    trial: 850,
    practice: 120,
  };
  let credits = baseByMode[input.mode];
  lines.push(`پایهٔ ${modeLabel(input.mode)}: ${baseByMode[input.mode]}`);

  if (input.mode === 'race' && input.position > 0) {
    const positionBonus = input.position === 1 ? 700 : input.position === 2 ? 400 : input.position === 3 ? 200 : 0;
    credits += positionBonus;
    if (positionBonus > 0) lines.push(`ردهٔ ${input.position}: +${positionBonus}`);
  }

  if (input.medal) {
    const medalBonus = input.medal === 'gold' ? 900 : input.medal === 'silver' ? 500 : 250;
    credits += medalBonus;
    lines.push(`مدال ${medalLabel(input.medal)}: +${medalBonus}`);
  }

  if (input.penaltiesS === 0 && input.damage < 0.05) {
    credits += 300;
    lines.push('رانش تمیز: +۳۰۰');
  }

  const challenge = input.challenge ?? 1;
  if (challenge !== 1) {
    lines.push(challenge > 1 ? `سطح سخت: ×${challenge.toFixed(2)}` : `سطح آسان: ×${challenge.toFixed(2)}`);
  }

  const difficultyFactor = (1 + (input.difficulty - 3) * 0.1) * challenge;
  credits = Math.max(0, Math.min(14000, Math.round((credits * difficultyFactor) / 50) * 50));
  return { credits, xp: Math.round(credits / 8), linesFa: lines };
}

export function modeLabel(mode: RaceResult['mode']): string {
  return mode === 'race' ? 'مسابقه' : mode === 'time' ? 'رکورد زمانی' : mode === 'trial' ? 'مسیر مانع' : 'تمرین';
}

export function medalLabel(medal: Medal): string {
  return medal === 'gold' ? 'طلایی' : medal === 'silver' ? 'نقره‌ای' : 'برنزی';
}

export interface ClaimResult {
  save: SaveData;
  credited: boolean;
  credits: number;
  xp: number;
}

/** Adds a reward exactly once per run id. */
export function claimReward(save: SaveData, runId: string, reward: RewardBreakdown): ClaimResult {
  if (save.claimedRuns.includes(runId)) {
    return { save, credited: false, credits: 0, xp: 0 };
  }
  const next: SaveData = {
    ...save,
    credits: Math.max(0, save.credits + reward.credits),
    claimedRuns: [...save.claimedRuns.slice(-199), runId],
    profile: {
      ...save.profile,
      xp: save.profile.xp + reward.xp,
    },
  };
  next.profile.level = levelFromXp(next.profile.xp);
  return { save: next, credited: true, credits: reward.credits, xp: reward.xp };
}

export interface AchievementDef {
  id: string;
  titleFa: string;
  descFa: string;
  check: (save: SaveData, ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  result?: RaceResult;
  position?: number;
  medal?: Medal;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'first-finish', titleFa: 'خط پایان', descFa: 'اولین مسیر را کامل کن.', check: (s) => s.racesFinished >= 1 },
  { id: 'first-win', titleFa: 'اولین برد', descFa: 'در یک مسابقه اول شو.', check: (_s, c) => c.position === 1 },
  { id: 'gold-run', titleFa: 'طلایی', descFa: 'یک مدال طلایی بگیر.', check: (_s, c) => c.medal === 'gold' },
  { id: 'collector', titleFa: 'کلکسیونر', descFa: 'چهار خودرو داشته باش.', check: (s) => s.ownedCars.length >= 4 },
  { id: 'tuner', titleFa: 'تیونر', descFa: 'شش قطعه ارتقا نصب کن.', check: (s) => totalUpgradeLevels(s) >= 6 },
  { id: 'fleet', titleFa: 'ناوگان کامل', descFa: 'هر هشت خودرو را داشته باش.', check: (s) => s.ownedCars.length >= 8 },
  { id: 'career-half', titleFa: 'نیمهٔ راه', descFa: 'پنج رویداد کریر را کامل کن.', check: (s) => s.career.completed.length >= 5 },
  { id: 'career-all', titleFa: 'قهرمان', descFa: 'همهٔ رویدادهای کریر را کامل کن.', check: (s) => s.career.completed.length >= 10 },
];

function totalUpgradeLevels(save: SaveData): number {
  let total = 0;
  for (const levels of Object.values(save.upgrades)) {
    for (const v of Object.values(levels)) total += v;
  }
  return total;
}

export function evaluateAchievements(
  save: SaveData,
  ctx: AchievementContext = {},
): { save: SaveData; unlocked: AchievementDef[] } {
  const unlocked = ACHIEVEMENTS.filter(
    (a) => !save.profile.achievements.includes(a.id) && a.check(save, ctx),
  );
  if (unlocked.length === 0) return { save, unlocked: [] };
  return {
    save: {
      ...save,
      profile: {
        ...save.profile,
        achievements: [...save.profile.achievements, ...unlocked.map((a) => a.id)],
      },
    },
    unlocked,
  };
}
