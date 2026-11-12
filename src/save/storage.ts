import { DEFAULT_PEDAL_SETTINGS, type PedalSettings } from '../controls/pedals';
import { DEFAULT_CONDITION, DEFAULT_COSMETICS, type CarCondition, type CarCosmetics, type CarUpgrades } from '../vehicles/profiles';
import { emptyUpgrades } from '../vehicles/upgrades';

export type Medal = 'bronze' | 'silver' | 'gold';

export interface PlayerProfile {
  name: string;
  xp: number;
  level: number;
  achievements: string[];
}

export interface CareerProgress {
  completed: string[];
  medals: Record<string, Medal>;
}

export interface GameSettings {
  pedal: PedalSettings;
  audio: boolean;
  volume: number;
  showDebug: boolean;
  reducedMotion: boolean;
  /** Opponent strength and reward multiplier for quick races. */
  difficulty: 'easy' | 'normal' | 'hard';
}

export interface SaveData {
  version: 3;
  settings: GameSettings;
  bestTimes: Record<string, number>;
  bestScores: Record<string, number>;
  lastCarId: string;
  lastTrackId: string;
  racesFinished: number;
  credits: number;
  profile: PlayerProfile;
  ownedCars: string[];
  upgrades: Record<string, CarUpgrades>;
  condition: Record<string, CarCondition>;
  cosmetics: Record<string, CarCosmetics>;
  career: CareerProgress;
  /** Compact ghost frames per track: [t, x, y, angle, frontWheelAngle, rearWheelAngle]. */
  ghosts: Record<string, number[][]>;
  /** Result ids already paid, so replaying a results screen cannot duplicate credits. */
  claimedRuns: string[];
}

const KEY = 'charkhtaz.save.v3';
const LEGACY_KEYS = ['charkhtaz.save.v2', 'charkhtaz.save.v1', 'charkhtaz.save'];

export const DEFAULT_SETTINGS: GameSettings = {
  pedal: DEFAULT_PEDAL_SETTINGS,
  audio: true,
  volume: 0.8,
  showDebug: false,
  reducedMotion: false,
  difficulty: 'normal',
};

export const DEFAULT_PROFILE: PlayerProfile = {
  name: 'رانندهٔ مهمان',
  xp: 0,
  level: 1,
  achievements: [],
};

export const STARTING_CREDITS = 16000;

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1);
}

export function xpForLevel(level: number): number {
  return Math.max(0, level - 1) ** 2 * 120;
}

export function defaultSave(): SaveData {
  return {
    version: 3,
    settings: {
      ...DEFAULT_SETTINGS,
      pedal: { ...DEFAULT_PEDAL_SETTINGS, spring: { ...DEFAULT_PEDAL_SETTINGS.spring } },
    },
    bestTimes: {},
    bestScores: {},
    lastCarId: 'shahin-1401',
    lastTrackId: 'tehran-industrial',
    racesFinished: 0,
    credits: STARTING_CREDITS,
    profile: { ...DEFAULT_PROFILE, achievements: [] },
    ownedCars: ['shahin-1401'],
    upgrades: {},
    condition: {},
    cosmetics: {},
    career: { completed: [], medals: {} },
    ghosts: {},
    claimedRuns: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mergeSettings(raw: unknown): GameSettings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS, pedal: { ...DEFAULT_PEDAL_SETTINGS } };
  const pedalRaw = isRecord(raw.pedal) ? raw.pedal : {};
  const springRaw = isRecord(pedalRaw.spring) ? pedalRaw.spring : {};
  const spring = { ...DEFAULT_PEDAL_SETTINGS.spring };
  for (const key of ['throttle', 'brake', 'clutch'] as const) {
    const v = springRaw[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      spring[key] = Math.min(12, Math.max(0.5, v));
    }
  }
  const num = (v: unknown, def: number, lo: number, hi: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
  return {
    pedal: {
      handedness: pedalRaw.handedness === 'left' ? 'left' : 'right',
      scale: num(pedalRaw.scale, 1, 0.75, 1.35),
      opacity: num(pedalRaw.opacity, 0.92, 0.4, 1),
      sensitivity: num(pedalRaw.sensitivity, 1, 0.7, 1.3),
      spring,
    },
    audio: raw.audio !== false,
    volume: num(raw.volume, 0.8, 0, 1),
    showDebug: raw.showDebug === true,
    reducedMotion: raw.reducedMotion === true,
    difficulty:
      raw.difficulty === 'easy' || raw.difficulty === 'hard' ? raw.difficulty : 'normal',
  };
}

function mergeUpgrades(raw: unknown): Record<string, CarUpgrades> {
  const out: Record<string, CarUpgrades> = {};
  if (!isRecord(raw)) return out;
  for (const [carId, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;
    const levels = emptyUpgrades();
    for (const key of Object.keys(levels) as (keyof CarUpgrades)[]) {
      const v = value[key];
      levels[key] = typeof v === 'number' && Number.isFinite(v) ? Math.min(3, Math.max(0, Math.floor(v))) : 0;
    }
    out[carId] = levels;
  }
  return out;
}

function mergeCondition(raw: unknown): Record<string, CarCondition> {
  const out: Record<string, CarCondition> = {};
  if (!isRecord(raw)) return out;
  for (const [carId, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;
    const clamp = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1);
    out[carId] = { tires: clamp(value.tires), engine: clamp(value.engine), body: clamp(value.body) };
  }
  return out;
}

function mergeCosmetics(raw: unknown): Record<string, CarCosmetics> {
  const out: Record<string, CarCosmetics> = {};
  if (!isRecord(raw)) return out;
  const paints = ['stock', 'amber', 'graphite', 'cream', 'racing'];
  const rims = ['stock', 'sport', 'mesh'];
  for (const [carId, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;
    out[carId] = {
      paint: paints.includes(String(value.paint)) ? (value.paint as CarCosmetics['paint']) : 'stock',
      rims: rims.includes(String(value.rims)) ? (value.rims as CarCosmetics['rims']) : 'stock',
    };
  }
  return out;
}

function mergeGhosts(raw: unknown): Record<string, number[][]> {
  const out: Record<string, number[][]> = {};
  if (!isRecord(raw)) return out;
  for (const [trackId, frames] of Object.entries(raw)) {
    if (!Array.isArray(frames)) continue;
    const clean: number[][] = [];
    for (const frame of frames.slice(0, 4000)) {
      if (!Array.isArray(frame) || frame.length < 6) continue;
      const nums = frame.slice(0, 6).map(Number);
      if (nums.every((n) => Number.isFinite(n))) clean.push(nums);
    }
    if (clean.length > 1) out[trackId] = clean;
  }
  return out;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function migrate(raw: unknown): SaveData | null {
  if (!isRecord(raw)) return null;
  const base = defaultSave();
  const bestRaw = isRecord(raw.bestTimes) ? raw.bestTimes : {};
  const bestTimes: Record<string, number> = {};
  for (const [key, value] of Object.entries(bestRaw)) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) bestTimes[key] = value;
  }
  const bestScores: Record<string, number> = {};
  if (isRecord(raw.bestScores)) {
    for (const [key, value] of Object.entries(raw.bestScores)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) bestScores[key] = value;
    }
  }
  const profileRaw = isRecord(raw.profile) ? raw.profile : {};
  const xp = typeof profileRaw.xp === 'number' && Number.isFinite(profileRaw.xp) ? Math.max(0, profileRaw.xp) : 0;
  const careerRaw = isRecord(raw.career) ? raw.career : {};
  const medals: Record<string, Medal> = {};
  if (isRecord(careerRaw.medals)) {
    for (const [key, value] of Object.entries(careerRaw.medals)) {
      if (value === 'bronze' || value === 'silver' || value === 'gold') medals[key] = value;
    }
  }
  const lastName = typeof raw.lastCarId === 'string' ? raw.lastCarId : base.lastCarId;
  const owned = new Set(asStringArray(raw.ownedCars));
  owned.add('shahin-1401');
  owned.add(lastName);
  const credits = typeof raw.credits === 'number' && Number.isFinite(raw.credits)
    ? Math.max(0, Math.floor(raw.credits))
    : base.credits;

  return {
    version: 3,
    settings: mergeSettings(raw.settings),
    bestTimes,
    bestScores,
    lastCarId: lastName,
    lastTrackId: typeof raw.lastTrackId === 'string' ? raw.lastTrackId : base.lastTrackId,
    racesFinished:
      typeof raw.racesFinished === 'number' && Number.isFinite(raw.racesFinished)
        ? Math.max(0, Math.floor(raw.racesFinished))
        : 0,
    credits,
    profile: {
      name:
        typeof profileRaw.name === 'string' && profileRaw.name.trim().length > 0
          ? profileRaw.name.slice(0, 24)
          : base.profile.name,
      xp,
      level: levelFromXp(xp),
      achievements: asStringArray(profileRaw.achievements),
    },
    ownedCars: [...owned],
    upgrades: mergeUpgrades(raw.upgrades),
    condition: mergeCondition(raw.condition),
    cosmetics: mergeCosmetics(raw.cosmetics),
    career: { completed: asStringArray(careerRaw.completed), medals },
    ghosts: mergeGhosts(raw.ghosts),
    claimedRuns: asStringArray(raw.claimedRuns).slice(-200),
  };
}

/** Exposed for migration tests; returns null when the payload is unusable. */
export function migrateSave(raw: unknown): SaveData | null {
  return migrate(raw);
}

export function loadSave(): SaveData {
  try {
    const current = localStorage.getItem(KEY);
    if (current) {
      const parsed = migrate(JSON.parse(current));
      if (parsed) return parsed;
    }
    for (const legacy of LEGACY_KEYS) {
      const raw = localStorage.getItem(legacy);
      if (!raw) continue;
      const parsed = migrate(JSON.parse(raw));
      if (parsed) {
        saveGame(parsed);
        localStorage.removeItem(legacy);
        return parsed;
      }
    }
  } catch {
    try {
      const corrupt = localStorage.getItem(KEY);
      if (corrupt) localStorage.setItem(`${KEY}.corrupt`, corrupt);
    } catch {
      /* storage may be blocked entirely */
    }
  }
  return defaultSave();
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota — the session still works in memory */
  }
}

export function resetSave(): void {
  try {
    localStorage.removeItem(KEY);
    for (const legacy of LEGACY_KEYS) localStorage.removeItem(legacy);
  } catch {
    /* ignore */
  }
}

export function conditionFor(save: SaveData, carId: string): CarCondition {
  return save.condition[carId] ?? DEFAULT_CONDITION;
}

export function cosmeticsFor(save: SaveData, carId: string): CarCosmetics {
  return save.cosmetics[carId] ?? DEFAULT_COSMETICS;
}

export function upgradesFor(save: SaveData, carId: string): CarUpgrades {
  return save.upgrades[carId] ?? emptyUpgrades();
}
