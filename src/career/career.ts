import type { GameMode, RaceResult } from '../game/scene';
import type { Medal, SaveData } from '../save/storage';

export type CareerMode = Extract<GameMode, 'race' | 'time' | 'trial'>;

export interface CareerEvent {
  id: string;
  chapterFa: string;
  titleFa: string;
  briefingFa: string;
  trackId: string;
  mode: CareerMode;
  carId: string;
  opponents: number;
  medalTarget: Medal;
  rewards: { credits: number; xp: number };
  requires?: string;
}

/**
 * Ten offline events across the roster. Requirements form a chain; each event
 * unlocks the next, and the final event needs a gold on the mountain time trial.
 */
export const CAREER_EVENTS: readonly CareerEvent[] = [
  {
    id: 'c01-first-shift',
    chapterFa: 'فصل ۱ · شروع',
    titleFa: 'اولین تعویض',
    briefingFa: 'شاهین دستی، کمربندی جنوبی. کلاچ را بگیر، دنده یک را بزن و آرام رها کن. مسیر ساده است؛ فقط عجله نکن.',
    trackId: 'tehran-industrial',
    mode: 'race',
    carId: 'shahin-1401',
    opponents: 2,
    medalTarget: 'bronze',
    rewards: { credits: 1800, xp: 180 },
  },
  {
    id: 'c02-jajrud-time',
    chapterFa: 'فصل ۱ · شروع',
    titleFa: 'زمانِ گردنه',
    briefingFa: 'همان شاهین، گردنهٔ جاجرود. ترمز را دیر نکن؛ شیب‌ها سرعت را می‌گیرند و کلاچ باید نرم برگردد.',
    trackId: 'jajrud-pass',
    mode: 'time',
    carId: 'shahin-1401',
    opponents: 0,
    medalTarget: 'bronze',
    rewards: { credits: 2200, xp: 220 },
    requires: 'c01-first-shift',
  },
  {
    id: 'c03-forest-trial',
    chapterFa: 'فصل ۲ · مهارت',
    titleFa: 'گِل هیرکانی',
    briefingFa: 'پژو ۲۰۶ روی گِل. گاز زیاد یعنی هرزگردی؛ دنده دو و گاز ثابت بهتر از دنده یک و گاز تا ته است.',
    trackId: 'hyrcanian-mud',
    mode: 'trial',
    carId: 'peugeot-206',
    opponents: 0,
    medalTarget: 'bronze',
    rewards: { credits: 2600, xp: 260 },
    requires: 'c02-jajrud-time',
  },
  {
    id: 'c04-dune-race',
    chapterFa: 'فصل ۲ · مهارت',
    titleFa: 'مسابقهٔ تلماسه',
    briefingFa: 'تندر ۹۰ و دو حریف روی ماسهٔ لوت. مسیر باریک است؛ اول ترمز، بعد فرمان—اینجا فرمان نداری، پس فقط گاز و ترمز.',
    trackId: 'lut-dunes',
    mode: 'race',
    carId: 'tondar-90',
    opponents: 2,
    medalTarget: 'silver',
    rewards: { credits: 3200, xp: 320 },
    requires: 'c03-forest-trial',
  },
  {
    id: 'c05-ring-time',
    chapterFa: 'فصل ۳ · شهر',
    titleFa: 'رکورد کمربندی',
    briefingFa: 'تارا خودکار، کمربندی جنوبی. جعبه خودش تصمیم می‌گیرد؛ تو فقط خط ترمز و ورودی بلوک‌ها را درست بگیر.',
    trackId: 'tehran-industrial',
    mode: 'time',
    carId: 'ikco-tara',
    opponents: 0,
    medalTarget: 'silver',
    rewards: { credits: 3400, xp: 340 },
    requires: 'c04-dune-race',
  },
  {
    id: 'c06-corolla-race',
    chapterFa: 'فصل ۳ · شهر',
    titleFa: 'کرولا در گردنه',
    briefingFa: 'کرولا ۱٫۶ با جعبهٔ CVT. شیب‌های جاجرود را با گاز پیوسته برو؛ پدال را رها و دوباره فشار نده.',
    trackId: 'jajrud-pass',
    mode: 'race',
    carId: 'corolla-e210',
    opponents: 2,
    medalTarget: 'silver',
    rewards: { credits: 3800, xp: 380 },
    requires: 'c05-ring-time',
  },
  {
    id: 'c07-zagros-trial',
    chapterFa: 'فصل ۴ · کوه',
    titleFa: 'صعود زاگرس',
    briefingFa: 'پرادو سنگین است. روی سنگ، دنده یک و کلاچ نیمه‌درگیر؛ اگر چرخ هرزگردید، گاز را کم کن نه بیشتر.',
    trackId: 'zagros-climb',
    mode: 'trial',
    carId: 'prado-150-2021',
    opponents: 0,
    medalTarget: 'silver',
    rewards: { credits: 4200, xp: 420 },
    requires: 'c06-corolla-race',
  },
  {
    id: 'c08-kavir-time',
    chapterFa: 'فصل ۴ · کوه',
    titleFa: 'پرش‌های کویر',
    briefingFa: 'بی‌ام‌و ۳۲۰i، دشت کویر. سه پرش پشت‌سرهم؛ سرعت ورودی را بسنج، نه اینکه فقط گاز را نگه داری.',
    trackId: 'kavir-dash',
    mode: 'time',
    carId: 'bmw-320i-g20',
    opponents: 0,
    medalTarget: 'gold',
    rewards: { credits: 5200, xp: 520 },
    requires: 'c07-zagros-trial',
  },
  {
    id: 'c09-mx5-race',
    chapterFa: 'فصل ۵ · فینال',
    titleFa: 'سبک و عقب‌ران',
    briefingFa: 'MX-5 روی جاجرود. چابک است، اما گشتاور کم؛ از هر پیچ و شیب با سرعت بیرون بیا، نه با گاز ناگهانی.',
    trackId: 'jajrud-pass',
    mode: 'race',
    carId: 'mx5-nd',
    opponents: 2,
    medalTarget: 'gold',
    rewards: { credits: 6000, xp: 600 },
    requires: 'c08-kavir-time',
  },
  {
    id: 'c10-final-race',
    chapterFa: 'فصل ۵ · فینال',
    titleFa: 'فینال کمربندی',
    briefingFa: 'بی‌ام‌و، کمربندی جنوبی، سه حریف. این آخرین ایست است؛ خط ترمز بلوک بتنی را حفظ کن و از خط پایان رد شو.',
    trackId: 'tehran-industrial',
    mode: 'race',
    carId: 'bmw-320i-g20',
    opponents: 3,
    medalTarget: 'gold',
    rewards: { credits: 9000, xp: 900 },
    requires: 'c09-mx5-race',
  },
];

export function getCareerEvent(id: string): CareerEvent {
  const event = CAREER_EVENTS.find((e) => e.id === id);
  if (!event) throw new Error(`Unknown career event: ${id}`);
  return event;
}

export interface EventState {
  event: CareerEvent;
  unlocked: boolean;
  completed: boolean;
  medal?: Medal;
}

export function eventStates(save: SaveData): EventState[] {
  return CAREER_EVENTS.map((event) => {
    const completed = save.career.completed.includes(event.id);
    const requiresMet = !event.requires || save.career.completed.includes(event.requires);
    return {
      event,
      unlocked: completed || requiresMet,
      completed,
      medal: save.career.medals[event.id],
    };
  });
}

const MEDAL_RANK: Record<Medal, number> = { bronze: 1, silver: 2, gold: 3 };

export function medalAtLeast(medal: Medal | undefined, target: Medal): boolean {
  return medal !== undefined && MEDAL_RANK[medal] >= MEDAL_RANK[target];
}

export interface Thresholds {
  gold: number;
  silver: number;
  bronze: number;
}

/** Transparent time thresholds: derived from route length, printed in the UI. */
export function medalThresholds(lengthM: number, difficulty: number): Thresholds {
  const base = lengthM / 18 + 5 + difficulty * 1.4;
  return { gold: base, silver: base * 1.16, bronze: base * 1.36 };
}

export function medalForTime(timeS: number, thresholds: Thresholds): Medal | null {
  if (timeS <= thresholds.gold) return 'gold';
  if (timeS <= thresholds.silver) return 'silver';
  if (timeS <= thresholds.bronze) return 'bronze';
  return null;
}

/**
 * Trial scoring.
 *
 * A clean run at the route's target pace is worth 1000 points; slower runs lose
 * points in proportion, and every reset or percent of damage is a visible
 * deduction. The target pace scales with the route, so a medal means the same
 * thing on a 400 m course and an 1 800 m one.
 */
export const TRIAL_GOLD = 820;
export const TRIAL_SILVER = 640;
export const TRIAL_BRONZE = 450;

export function trialParSeconds(lengthM: number, difficulty: number): number {
  return lengthM / 21 + 4 + difficulty * 0.8;
}

export interface TrialScoreInput {
  timeS: number;
  penaltiesS: number;
  damage: number;
  parS: number;
  checkpointsHit: number;
  totalCheckpoints: number;
}

export function trialScore(input: TrialScoreInput): number {
  const par = Math.max(5, input.parS);
  const pace = Math.min(1.08, par / Math.max(input.timeS, par * 0.35));
  const checkpointShare = input.totalCheckpoints > 0
    ? input.checkpointsHit / input.totalCheckpoints
    : 1;
  const base = 1000 * pace;
  const resetPenalty = input.penaltiesS * 40;
  const damagePenalty = input.damage * 260;
  const gatePenalty = (1 - checkpointShare) * 120;
  return Math.max(0, Math.round(base - resetPenalty - damagePenalty - gatePenalty));
}

export function medalForScore(score: number): Medal | null {
  if (score >= TRIAL_GOLD) return 'gold';
  if (score >= TRIAL_SILVER) return 'silver';
  if (score >= TRIAL_BRONZE) return 'bronze';
  return null;
}

export function betterMedal(a: Medal | undefined, b: Medal | null): Medal | undefined {
  if (!b) return a;
  if (!a) return b;
  return MEDAL_RANK[b] > MEDAL_RANK[a] ? b : a;
}
