/**
 * Pure mapping helpers for the procedural CHARKHTAZ audio system.
 *
 * Everything in this file is deterministic, allocation-light and free of
 * WebAudio / DOM references, so it can be unit-tested in Node and reused by
 * the synthesis graph in `game-audio.ts`.
 *
 * Units: rpm, km/h, seconds, hertz. Gains are linear 0..1 unless stated.
 */

export type VehicleCharacter = 'i4' | 'v6' | 'flat4';

export interface EngineCharacterSpec {
  readonly kind: VehicleCharacter;
  /** Cylinder count of the modelled four-stroke engine. */
  readonly cylinders: number;
  /** Relative level of the sub-octave crank-order layer. */
  readonly subMix: number;
  /** Relative level of the second harmonic layer. */
  readonly secondMix: number;
  /** Relative level of the third harmonic layer. */
  readonly thirdMix: number;
  /** Multiplier applied to the engine low-pass cutoff. */
  readonly filterScale: number;
  /** Static detune (cents) on the second/third layers, producing beating. */
  readonly detuneCents: number;
  /** 0..1 firing unevenness; raises filter resonance and burble. */
  readonly rasp: number;
}

const CHARACTER_SPECS: Record<VehicleCharacter, EngineCharacterSpec> = {
  // Inline-four: even, slightly buzzy, strong low-order content.
  i4: {
    kind: 'i4',
    cylinders: 4,
    subMix: 0.55,
    secondMix: 0.34,
    thirdMix: 0.18,
    filterScale: 1,
    detuneCents: 6,
    rasp: 0.35,
  },
  // V6: smoother and brighter, with a denser second harmonic.
  v6: {
    kind: 'v6',
    cylinders: 6,
    subMix: 0.4,
    secondMix: 0.5,
    thirdMix: 0.28,
    filterScale: 1.12,
    detuneCents: 4,
    rasp: 0.22,
  },
  // Flat-four: deeper, lumpier idle and a pronounced boxer burble.
  flat4: {
    kind: 'flat4',
    cylinders: 4,
    subMix: 0.75,
    secondMix: 0.28,
    thirdMix: 0.14,
    filterScale: 0.86,
    detuneCents: 14,
    rasp: 0.6,
  },
};

/** Normalises an unknown runtime value to a known engine character. */
export function engineCharacter(kind: VehicleCharacter | string | null | undefined): EngineCharacterSpec {
  if (kind === 'i4' || kind === 'v6' || kind === 'flat4') return CHARACTER_SPECS[kind];
  return CHARACTER_SPECS.i4;
}

export function clamp(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value)) return lo;
  return value < lo ? lo : value > hi ? hi : value;
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/** Returns `fallback` for NaN / Infinity / non-numbers. */
export function safeNumber(value: number | null | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Four-stroke firing frequency.
 *
 * A four-stroke cylinder fires once every two crank revolutions, so an
 * N-cylinder engine produces `rpm / 60 * N / 2` exhaust pulses per second.
 * At 3000 rpm an inline-four therefore fires at 100 Hz.
 */
export function engineFiringHz(rpm: number, cylinders: number): number {
  const revs = Math.max(0, safeNumber(rpm, 0));
  const count = Math.max(1, Math.floor(safeNumber(cylinders, 4)));
  return (revs / 60) * (count / 2);
}

export interface EngineLayers {
  /** Half-order rumble. */
  readonly sub: number;
  /** Firing frequency (crank order). */
  readonly fundamental: number;
  /** Slightly detuned second harmonic. */
  readonly second: number;
  /** Slightly detuned third harmonic. */
  readonly third: number;
}

/** Frequencies for the four oscillator layers of one engine character. */
export function engineLayerFrequencies(rpm: number, character: EngineCharacterSpec): EngineLayers {
  const fundamental = Math.max(12, engineFiringHz(rpm, character.cylinders));
  return {
    sub: Math.max(8, fundamental * 0.5),
    fundamental,
    second: fundamental * 2.02,
    third: fundamental * 3.01,
  };
}

/**
 * Engine bus gain. Idle is always audible; throttle adds load and revs add
 * brightness. `running = false` silences the engine completely.
 */
export function engineGainCurve(throttle: number, rpmNorm: number, running: boolean): number {
  if (!running) return 0;
  const t = clamp01(throttle);
  const r = clamp01(rpmNorm);
  return clamp01(0.14 + 0.12 * r + 0.74 * t * (0.45 + 0.55 * r));
}

/**
 * Low-pass cutoff for the engine tone. Higher gears and revs open the filter;
 * the character scale keeps a flat-four darker than a V6.
 */
export function engineFilterHz(
  rpmNorm: number,
  throttle: number,
  gear: number,
  characterKind: VehicleCharacter | string | null | undefined,
): number {
  const spec = engineCharacter(characterKind);
  const r = clamp01(rpmNorm);
  const t = clamp01(throttle);
  const brightness = gearTimbre(gear).brightness;
  const raw = (240 + 280 * brightness + (2600 * Math.pow(r, 0.8) + 700 * t) * brightness) * spec.filterScale;
  return clamp(raw, 180, 9000);
}

export interface GearTimbre {
  /** Low-pass / harmonic brightness multiplier. */
  readonly brightness: number;
  /** Small overall level trim. */
  readonly gain: number;
}

const GEAR_BRIGHTNESS = [0.78, 0.84, 0.9, 0.96, 1, 1.05, 1.08, 1.1] as const;

/** First gear is darker and softer; top gears are brighter and more urgent. */
export function gearTimbre(gear: number): GearTimbre {
  const g = Math.round(safeNumber(gear, 1));
  if (g <= 0) return { brightness: 0.7, gain: 0.92 };
  const brightness = GEAR_BRIGHTNESS[Math.min(g, GEAR_BRIGHTNESS.length) - 1] ?? 1;
  return { brightness, gain: 1 };
}

export interface SurfaceAudioProfile {
  readonly id: string;
  /** Overall rolling-noise level multiplier. */
  readonly level: number;
  /** Low-pass cutoff of the body/rumble layer at reference speed, Hz. */
  readonly bodyHz: number;
  /** High-pass cutoff of the hiss layer, Hz. */
  readonly hissHz: number;
  /** 0..1 mix of the hiss layer. */
  readonly hiss: number;
  /** 0..1 slow amplitude roughness (loose stones, mud, sand). */
  readonly roughness: number;
  /** Centre frequency of the skid/squeal band, Hz. */
  readonly skidHz: number;
}

const SURFACE_PROFILES: Record<string, SurfaceAudioProfile> = {
  'asphalt-dry': {
    id: 'asphalt-dry',
    level: 0.55,
    bodyHz: 900,
    hissHz: 2400,
    hiss: 0.18,
    roughness: 0.05,
    skidHz: 1500,
  },
  'asphalt-wet': {
    id: 'asphalt-wet',
    level: 0.62,
    bodyHz: 1100,
    hissHz: 1800,
    hiss: 0.45,
    roughness: 0.08,
    skidHz: 1200,
  },
  dirt: {
    id: 'dirt',
    level: 0.7,
    bodyHz: 500,
    hissHz: 1600,
    hiss: 0.3,
    roughness: 0.35,
    skidHz: 900,
  },
  gravel: {
    id: 'gravel',
    level: 0.82,
    bodyHz: 650,
    hissHz: 2200,
    hiss: 0.45,
    roughness: 0.6,
    skidHz: 700,
  },
  sand: {
    id: 'sand',
    level: 0.5,
    bodyHz: 320,
    hissHz: 1200,
    hiss: 0.22,
    roughness: 0.45,
    skidHz: 500,
  },
  mud: {
    id: 'mud',
    level: 0.72,
    bodyHz: 240,
    hissHz: 900,
    hiss: 0.12,
    roughness: 0.55,
    skidHz: 420,
  },
  rock: {
    id: 'rock',
    level: 0.9,
    bodyHz: 950,
    hissHz: 2600,
    hiss: 0.35,
    roughness: 0.7,
    skidHz: 1100,
  },
  wood: {
    id: 'wood',
    level: 0.6,
    bodyHz: 700,
    hissHz: 1700,
    hiss: 0.25,
    roughness: 0.5,
    skidHz: 950,
  },
};

/** Resolves a game surface id; unknown ids fall back to dry asphalt. */
export function surfaceProfile(surfaceId: string | null | undefined): SurfaceAudioProfile {
  const key = typeof surfaceId === 'string' ? surfaceId : '';
  const exact = SURFACE_PROFILES[key];
  if (exact) return exact;
  if (key.startsWith('asphalt')) {
    return key.includes('wet') ? SURFACE_PROFILES['asphalt-wet']! : SURFACE_PROFILES['asphalt-dry']!;
  }
  return SURFACE_PROFILES['asphalt-dry']!;
}

/** Normalised speed factor for rolling noise, 0 at rest, 1 at ~130 km/h. */
export function rollingSpeedGain(speedKph: number): number {
  const speed = Math.max(0, safeNumber(speedKph, 0));
  return clamp01(Math.pow(clamp01(speed / 130), 0.9));
}

/** Overall tyre-rolling gain from speed and surface. Silent at standstill. */
export function tyreGain(speedKph: number, surfaceId: string | null | undefined): number {
  return clamp01(surfaceProfile(surfaceId).level * rollingSpeedGain(speedKph));
}

/**
 * Skid / wheelspin layer. Slip is an absolute slip ratio: below 0.1 the tyre
 * still grips; around 0.8 it is fully sliding. Speed only trims the layer, so
 * a stationary burnout still produces some squeal.
 */
export function skidGain(wheelSlip: number, speedKph: number): number {
  const slip = clamp01((Math.abs(safeNumber(wheelSlip, 0)) - 0.1) / 0.7);
  const speed = clamp01(Math.abs(safeNumber(speedKph, 0)) / 90);
  return clamp01(slip * (0.35 + 0.65 * speed));
}

/** Wind/ambience gain; inaudible below 10 km/h, ~0.26 at 200 km/h. */
export function windGain(speedKph: number): number {
  const speed = Math.max(0, safeNumber(speedKph, 0));
  return clamp01(Math.pow(clamp01((speed - 10) / 190), 1.7) * 0.26);
}

/** Event loudness from a 0..1 impact severity. */
export function impactGain(severity: number): number {
  const s = clamp01(severity);
  if (s <= 0) return 0;
  return Math.pow(s, 1.3);
}

/** Master gain from the user volume and mute flag. */
export function masterGainFor(volume: number, muted: boolean): number {
  if (muted) return 0;
  return Math.pow(clamp01(volume), 1.4);
}

/**
 * Frame-rate independent exponential approach.
 * `tau` is the time constant in seconds (63% of the distance travelled).
 */
export function damp(current: number, target: number, tau: number, dt: number): number {
  const c = safeNumber(current, 0);
  const t = safeNumber(target, c);
  const step = safeNumber(dt, 0);
  if (step <= 0) return c;
  if (!(tau > 0)) return t;
  return c + (t - c) * (1 - Math.exp(-step / tau));
}
