/** Ghost capture and replay: compact samples, no physics contact. */

export interface GhostFrame {
  t: number;
  x: number;
  y: number;
  angle: number;
  frontWheelAngle: number;
  rearWheelAngle: number;
}

export interface GhostPose {
  x: number;
  y: number;
  angle: number;
  frontWheelAngle: number;
  rearWheelAngle: number;
}

export interface GhostSource {
  x: number;
  y: number;
  angle: number;
  wheels: readonly { angleRad: number }[];
}

export const GHOST_INTERVAL_S = 0.1;
export const GHOST_FORMAT_VERSION = 1;

export function encodeGhost(frames: readonly GhostFrame[]): number[][] {
  return frames.map((f) => [
    round(f.t, 3),
    round(f.x, 3),
    round(f.y, 3),
    round(f.angle, 4),
    round(f.frontWheelAngle, 3),
    round(f.rearWheelAngle, 3),
  ]);
}

export function decodeGhost(raw: readonly number[][]): GhostFrame[] {
  const frames: GhostFrame[] = [];
  for (const row of raw) {
    if (row.length < 6) continue;
    const [t, x, y, angle, frontWheelAngle, rearWheelAngle] = row;
    if ([t, x, y, angle, frontWheelAngle, rearWheelAngle].some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
      continue;
    }
    frames.push({ t: t!, x: x!, y: y!, angle: angle!, frontWheelAngle: frontWheelAngle!, rearWheelAngle: rearWheelAngle! });
  }
  return frames.sort((a, b) => a.t - b.t);
}

export class GhostRecorder {
  private readonly frames: GhostFrame[] = [];
  private nextAt = 0;

  constructor(
    private readonly interval = GHOST_INTERVAL_S,
    private readonly maxFrames = 4000,
  ) {}

  reset(): void {
    this.frames.length = 0;
    this.nextAt = 0;
  }

  sample(t: number, source: GhostSource): void {
    if (t < this.nextAt) return;
    this.nextAt = t + this.interval;
    const front = source.wheels[0]?.angleRad ?? 0;
    const rear = source.wheels[1]?.angleRad ?? 0;
    this.frames.push({
      t: round(t, 3),
      x: round(source.x, 3),
      y: round(source.y, 3),
      angle: round(source.angle, 4),
      frontWheelAngle: round(front, 3),
      rearWheelAngle: round(rear, 3),
    });
    if (this.frames.length > this.maxFrames) this.frames.shift();
  }

  finish(): number[][] {
    return encodeGhost(this.frames);
  }

  get length(): number {
    return this.frames.length;
  }
}

/** Interpolates the ghost pose at time t; null before/after the recording. */
export function sampleGhost(frames: readonly GhostFrame[], t: number): GhostPose | null {
  if (frames.length === 0) return null;
  const first = frames[0]!;
  const last = frames[frames.length - 1]!;
  if (t < first.t || t > last.t) return null;
  let lo = 0;
  let hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (frames[mid]!.t < t) lo = mid + 1;
    else hi = mid;
  }
  const b = frames[lo]!;
  const a = frames[Math.max(0, lo - 1)]!;
  const span = Math.max(1e-6, b.t - a.t);
  const k = Math.min(1, Math.max(0, (t - a.t) / span));
  return {
    x: lerp(a.x, b.x, k),
    y: lerp(a.y, b.y, k),
    angle: lerpAngle(a.angle, b.angle, k),
    frontWheelAngle: lerpAngle(a.frontWheelAngle, b.frontWheelAngle, k),
    rearWheelAngle: lerpAngle(a.rearWheelAngle, b.rearWheelAngle, k),
  };
}

function round(v: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
