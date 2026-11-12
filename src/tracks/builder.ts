import { hash01 } from '../core/math';
import type {
  DecorationDef,
  GroundPoint,
  GroundRun,
  ObstacleDef,
  ObstacleKind,
  SurfaceId,
  TrackDefinition,
  Vec2Like,
} from './types';

const STEP_M = 2;
const DEG = Math.PI / 180;

/**
 * Authoring helper: builds the terrain profile, obstacles and scenery for a
 * track from a readable sequence of driving features.
 *
 * Every feature emits sampled ground vertices at a fixed 2 m step, so the
 * collision geometry and the rendered surface come from exactly the same
 * polyline — no invisible walls, no visual/physics mismatch.
 */
export class TrackBuilder {
  private runs: GroundRun[] = [];
  private current: GroundRun;
  private x: number;
  private y: number;
  private readonly obstacles: ObstacleDef[] = [];
  private readonly decorations: DecorationDef[] = [];
  private readonly startX: number;
  private readonly surface: SurfaceId;
  private maxY: number;
  private minY: number;

  constructor(startX = 0, startY = 0, surface: SurfaceId = 'asphalt-dry') {
    this.startX = startX;
    this.x = startX;
    this.y = startY;
    this.surface = surface;
    this.maxY = startY;
    this.minY = startY;
    this.current = { surface, points: [{ x: startX, y: startY }] };
    this.runs.push(this.current);
  }

  get cursorX(): number {
    return this.x;
  }

  get cursorY(): number {
    return this.y;
  }

  /** Flat road. */
  flat(lengthM: number, surface?: SurfaceId): this {
    this.beginSurface(surface);
    const end = this.x + lengthM;
    for (let x = this.x + STEP_M; x < end; x += STEP_M) {
      this.pushVertex(x, this.y);
    }
    this.x = end;
    this.pushVertex(end, this.y);
    return this;
  }

  /** Constant gradient; positive degrees climb, negative descend. */
  slope(degrees: number, lengthM: number, surface?: SurfaceId): this {
    this.beginSurface(surface);
    const dy = Math.tan(degrees * DEG) * lengthM;
    const steps = Math.max(1, Math.ceil(lengthM / STEP_M));
    const startY = this.y;
    const startX = this.x;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      this.pushVertex(startX + lengthM * t, startY + dy * t);
    }
    this.x = startX + lengthM;
    this.y = startY + dy;
    return this;
  }

  /** Smooth hill (rise and fall) of the given height over the given run. */
  hill(widthM: number, heightM: number, surface?: SurfaceId): this {
    return this.profile(widthM, (t) => Math.sin(Math.PI * t) * heightM, surface);
  }

  /** Smooth dip / compression. */
  dip(widthM: number, depthM: number, surface?: SurfaceId): this {
    return this.profile(widthM, (t) => -Math.sin(Math.PI * t) * depthM, surface);
  }

  /** Repeated whoops (washboard), physically a series of short ramps. */
  whoops(count: number, widthM: number, heightM: number, surface?: SurfaceId): this {
    return this.profile(
      widthM,
      (t) => Math.sin(Math.PI * 2 * count * t) * heightM,
      surface,
    );
  }

  /** Kicker ramp rising to `heightM` over `lengthM`; the lip is a take-off. */
  ramp(lengthM: number, heightM: number, surface?: SurfaceId): this {
    return this.profile(lengthM, (t) => t * heightM, surface);
  }

  /** Drop-off (cliff face) at the current cursor. */
  drop(heightM: number, surface?: SurfaceId): this {
    this.beginSurface(surface);
    this.y -= heightM;
    this.pushVertex(this.x, this.y);
    return this;
  }

  /**
   * Authored "jump gap".
   *
   * It is built as a shallow ditch rather than a bottomless hole. A side-view
   * car with no steering cannot be relied on to clear an arbitrary hole, and a
   * hole turns the route into a respawn loop; a ditch still throws the car light
   * at speed, and the geometry is identical for collision and art.
   */
  gap(widthM: number, surface?: SurfaceId): this {
    const depth = Math.min(0.85, 0.35 + widthM * 0.06);
    return this.profile(widthM, (t) => -Math.sin(Math.PI * t) * depth, surface);
  }

  /** Sand / mud / gravel patch (surface only, same geometry). */
  patch(lengthM: number, surface: SurfaceId): this {
    return this.flat(lengthM, surface);
  }

  /** A boulder sitting on the ground. Height stays below the smallest wheel. */
  rock(sizeM = 0.8, x = this.x + 2): this {
    const heightM = Math.min(0.24, sizeM * 0.3 * 2);
    this.obstacles.push({
      kind: 'rock',
      x,
      // Seated on the ground: a boulder floating above the road presents its
      // downward-sloping underside to the tyre and jams the car.
      y: this.groundYApprox(x) + heightM / 2,
      halfWidth: sizeM * 0.75,
      halfHeight: heightM / 2,
    });
    return this;
  }

  /** A fallen log lying across the route. */
  log(radiusM = 0.28, x = this.x + 2): this {
    const radius = Math.min(radiusM, 0.22);
    this.obstacles.push({
      kind: 'log',
      x,
      y: this.groundYApprox(x) + radius * 0.9,
      halfWidth: radius,
      halfHeight: radius,
    });
    return this;
  }

  /** Stack of tyres — a low, soft-ish obstacle. */
  tires(sizeM = 0.55, x = this.x + 2): this {
    const height = Math.min(sizeM, 0.24);
    this.obstacles.push({
      kind: 'tire-stack',
      x,
      y: this.groundYApprox(x) + height / 2,
      halfWidth: sizeM * 0.7,
      halfHeight: height / 2,
    });
    return this;
  }

  /** Wooden plank bridge: a thin collidable deck. */
  plankBridge(lengthM: number, x = this.x + 2): this {
    this.obstacles.push({
      kind: 'plank-bridge',
      x,
      y: this.groundYApprox(x) + 0.08,
      halfWidth: lengthM / 2,
      halfHeight: 0.09,
    });
    return this;
  }

  /** Concrete barrier / block. */
  block(widthM = 0.5, heightM = 0.8, x = this.x + 2): this {
    const height = Math.min(heightM, 0.22);
    this.obstacles.push({
      kind: 'concrete-block',
      x,
      y: this.groundYApprox(x) + height / 2,
      halfWidth: widthM / 2,
      halfHeight: height / 2,
    });
    return this;
  }

  /** Scatter deterministic scenery along the last stretch. */
  scenery(fromX: number, toX: number, kinds: DecorationDef['kind'][] = ['rock', 'shrub']): this {
    let i = 0;
    for (let x = fromX; x < toX; x += 6) {
      const r = hash01(Math.round(x * 13) + i * 977);
      if (r < 0.55) {
        i++;
        continue;
      }
      const kind = kinds[Math.floor(r * kinds.length) % kinds.length] ?? 'rock';
      this.decorations.push({
        kind,
        x: x + hash01(i * 31 + 7) * 4,
        y: this.groundYApprox(x) + (kind === 'sign' || kind === 'tree' ? 0 : 0.1),
        scale: 0.7 + hash01(i * 17 + 3) * 0.8,
        variant: Math.floor(hash01(i * 71 + 11) * 4),
      });
      i++;
    }
    return this;
  }

  /** Finish the track description. */
  build(meta: Omit<TrackDefinition, 'runs' | 'obstacles' | 'decorations' | 'checkpointsX' | 'startX' | 'finishX' | 'lengthM' | 'boundsTopM' | 'boundsBottomM'> & {
    checkpointEveryM?: number;
  }): TrackDefinition {
    const finishX = this.x;
    const lengthM = finishX - this.startX;
    const every = meta.checkpointEveryM ?? Math.max(80, lengthM / 3);
    // Gaps between runs; a checkpoint just before a jump gives the player no
    // run-up after a respawn, so those are dropped.
    const gaps: [number, number][] = [];
    for (let i = 1; i < this.runs.length; i++) {
      const prevEnd = this.runs[i - 1]!.points[this.runs[i - 1]!.points.length - 1]!.x;
      const start = this.runs[i]!.points[0]!.x;
      if (start - prevEnd > 0.5) gaps.push([prevEnd, start]);
    }
    const checkpointsX: number[] = [];
    for (let x = this.startX + every; x < finishX - 20; x += every) {
      const nearGap = gaps.some(([a, b]) => x > a - 45 && x < b + 12);
      if (!nearGap) checkpointsX.push(Math.round(x));
    }

    let top = -Infinity;
    let bottom = Infinity;
    for (const run of this.runs) {
      for (const p of run.points) {
        top = Math.max(top, p.y);
        bottom = Math.min(bottom, p.y);
      }
    }
    for (const o of this.obstacles) {
      top = Math.max(top, (o.y ?? 0) + o.halfHeight);
    }

    return {
      ...meta,
      runs: this.runs,
      obstacles: this.obstacles,
      decorations: this.decorations,
      checkpointsX,
      startX: this.startX,
      finishX,
      lengthM,
      boundsTopM: top + 18,
      boundsBottomM: bottom - 12,
    };
  }

  /** Ground height at x, ignoring gaps (falls back to the last known y). */
  private groundYApprox(x: number): number {
    for (const run of this.runs) {
      const pts = run.points;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]!;
        const b = pts[i]!;
        if (x >= a.x && x <= b.x) {
          const t = (x - a.x) / Math.max(b.x - a.x, 1e-6);
          return a.y + (b.y - a.y) * t;
        }
      }
    }
    return this.y;
  }

  private profile(
    widthM: number,
    fn: (t: number) => number,
    surface?: SurfaceId,
  ): this {
    this.beginSurface(surface);
    const steps = Math.max(2, Math.ceil(widthM / STEP_M));
    const startX = this.x;
    const baseY = this.y;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      this.pushVertex(startX + widthM * t, baseY + fn(t));
    }
    this.x = startX + widthM;
    this.y = baseY + fn(1);
    return this;
  }

  private beginSurface(surface?: SurfaceId): void {
    if (!surface || surface === this.current.surface) return;
    // Close the current run at the cursor and start a new one so each chain
    // fixture carries a single surface id.
    this.pushVertex(this.x, this.y);
    this.current = {
      surface,
      points: [{ x: this.x, y: this.y }],
    };
    this.runs.push(this.current);
  }

  private currentSurface(surface?: SurfaceId): SurfaceId {
    return surface ?? this.current.surface;
  }

  private pushVertex(x: number, y: number): void {
    const last = this.current.points[this.current.points.length - 1];
    if (last && Math.abs(last.x - x) < 1e-6 && Math.abs(last.y - y) < 1e-6) return;
    this.current.points.push({ x, y });
    this.maxY = Math.max(this.maxY, y);
    this.minY = Math.min(this.minY, y);
  }
}

/** Height of the track surface at x (null inside a gap). */
export function groundPointAt(
  runs: readonly GroundRun[],
  x: number,
): GroundPoint | null {
  for (const run of runs) {
    const pts = run.points;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      if (x >= a.x && x <= b.x) {
        const t = (x - a.x) / Math.max(b.x - a.x, 1e-6);
        return {
          x,
          y: a.y + (b.y - a.y) * t,
          surface: run.surface,
        };
      }
    }
  }
  return null;
}

/** Approximate gradient (dy/dx) of the ground at x. */
export function groundSlopeAt(runs: readonly GroundRun[], x: number): number {
  const a = groundPointAt(runs, x - 0.5);
  const b = groundPointAt(runs, x + 0.5);
  if (!a || !b) return 0;
  return (b.y - a.y) / 1;
}

/** Minimal obstacle typing helper for definitions. */
export function obstacle(
  kind: ObstacleKind,
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number,
  angleDeg = 0,
): ObstacleDef {
  return { kind, x, y, halfWidth, halfHeight, angleDeg };
}

export type { Vec2Like };
