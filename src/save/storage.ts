import { DEFAULT_PEDAL_SETTINGS, type PedalSettings } from '../controls/pedals';

export interface GameSettings {
  pedal: PedalSettings;
  audio: boolean;
  showDebug: boolean;
}

export interface SaveData {
  version: 2;
  settings: GameSettings;
  /** Best clean run per track in time-trial, seconds. */
  bestTimes: Record<string, number>;
  lastCarId: string;
  lastTrackId: string;
  racesFinished: number;
}

const KEY = 'charkhtaz.save.v2';
const LEGACY_KEYS = ['charkhtaz.save.v1', 'charkhtaz.save'];

export const DEFAULT_SETTINGS: GameSettings = {
  pedal: DEFAULT_PEDAL_SETTINGS,
  audio: true,
  showDebug: false,
};

export const DEFAULT_SAVE: SaveData = {
  version: 2,
  settings: DEFAULT_SETTINGS,
  bestTimes: {},
  lastCarId: 'shahin-1401',
  lastTrackId: 'tehran-industrial',
  racesFinished: 0,
};

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
    if (typeof v === 'number' && Number.isFinite(v)) spring[key] = Math.min(12, Math.max(0.5, v));
  }
  const handedness = pedalRaw.handedness === 'left' ? 'left' : 'right';
  const num = (v: unknown, def: number, lo: number, hi: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;

  return {
    pedal: {
      handedness,
      scale: num(pedalRaw.scale, 1, 0.75, 1.35),
      opacity: num(pedalRaw.opacity, 0.92, 0.4, 1),
      sensitivity: num(pedalRaw.sensitivity, 1, 0.7, 1.3),
      spring,
    },
    audio: raw.audio !== false,
    showDebug: raw.showDebug === true,
  };
}

function migrate(raw: unknown): SaveData | null {
  if (!isRecord(raw)) return null;
  const bestRaw = isRecord(raw.bestTimes) ? raw.bestTimes : {};
  const bestTimes: Record<string, number> = {};
  for (const [key, value] of Object.entries(bestRaw)) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      bestTimes[key] = value;
    }
  }
  return {
    version: 2,
    settings: mergeSettings(raw.settings),
    bestTimes,
    lastCarId: typeof raw.lastCarId === 'string' ? raw.lastCarId : DEFAULT_SAVE.lastCarId,
    lastTrackId: typeof raw.lastTrackId === 'string' ? raw.lastTrackId : DEFAULT_SAVE.lastTrackId,
    racesFinished:
      typeof raw.racesFinished === 'number' && Number.isFinite(raw.racesFinished)
        ? Math.max(0, Math.floor(raw.racesFinished))
        : 0,
  };
}

/** Loads the save, migrating older versions and recovering from corruption. */
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
    // Corrupt or unavailable storage: keep the corrupt payload for diagnosis
    // and fall back to defaults rather than blocking the game.
    try {
      const corrupt = localStorage.getItem(KEY);
      if (corrupt) localStorage.setItem(`${KEY}.corrupt`, corrupt);
    } catch {
      /* storage may be blocked entirely */
    }
  }
  return {
    ...DEFAULT_SAVE,
    settings: { ...DEFAULT_SETTINGS, pedal: { ...DEFAULT_PEDAL_SETTINGS } },
    bestTimes: {},
  };
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
