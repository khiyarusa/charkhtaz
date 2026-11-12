/**
 * Small math helpers shared across the simulation.
 * Angles in radians, angular speeds in rad/s, torques in Nm.
 */

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** rpm → rad/s. */
export function rpmToRadS(rpm: number): number {
  return (rpm * 2 * Math.PI) / 60;
}

/** rad/s → rpm. */
export function radSToRpm(w: number): number {
  return (w * 60) / (2 * Math.PI);
}

export interface CurvePoint {
  x: number;
  y: number;
}

export function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** Exponential smoothing factor for a time constant, frame-rate independent. */
export function dampFactor(tauSeconds: number, dt: number): number {
  if (tauSeconds <= 0) return 1;
  return 1 - Math.exp(-dt / tauSeconds);
}

/** Move `value` toward `target` by at most `maxDelta`. */
export function moveTowards(value: number, target: number, maxDelta: number): number {
  if (Math.abs(target - value) <= maxDelta) return target;
  return value + Math.sign(target - value) * maxDelta;
}

/** Deterministic 0..1 hash of an integer (terrain texture, prop placement). */
export function hash01(n: number): number {
  let x = Math.imul(n | 0, 0x27d4eb2d) ^ 0x165667b1;
  x = Math.imul(x ^ (x >>> 15), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Piecewise-linear curve lookup with end clamping.
 * Points must be sorted by ascending x.
 */
export function sampleCurve(curve: readonly CurvePoint[], x: number): number {
  const first = curve[0];
  if (!first) return 0;
  const last = curve[curve.length - 1];
  if (!last) return 0;
  if (x <= first.x) return first.y;
  if (x >= last.x) return last.y;
  for (let i = 1; i < curve.length; i++) {
    const p = curve[i]!;
    if (x <= p.x) {
      const prev = curve[i - 1]!;
      const t = (x - prev.x) / (p.x - prev.x);
      return lerp(prev.y, p.y, t);
    }
  }
  return last.y; // unreachable for sorted input
}
