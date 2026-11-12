import { PAINT_COLORS, type CarArt, type CarDetail, type ResolvedCar } from '../vehicles/profiles';

export interface WheelArt {
  /** Wheel centre in screen pixels. */
  x: number;
  y: number;
  radiusPx: number;
  angleRad: number;
  /** 0 = front, 1 = rear. */
  index: 0 | 1;
  slip: number;
  rimStyle?: 'mesh' | 'spoke' | 'rugged';
  /** Service brake applied: the caliper bites and the disc heats up. */
  braking?: boolean;
}

export interface CarDrawOptions {
  /** 0..1 body damage, drives the visible damage stages. */
  damage?: number;
  /** Brake pedal position 0..1, lights the rear lamps. */
  brake?: number;
  /** Headlamps on (garage preview, night biomes). */
  lights?: boolean;
}

interface Point {
  u: number;
  v: number;
}

/**
 * Fallback side profiles by body category. Cars with a model-specific outline
 * (the whole shipped roster) never use these directly; they are the safety net
 * for a new profile that has not been drawn yet.
 */
const PROFILES: Record<CarArt['kind'], Point[]> = {
  sedan: [
    { u: -0.5, v: 0.3 },
    { u: -0.495, v: 0.44 },
    { u: -0.455, v: 0.55 },
    { u: -0.36, v: 0.585 },
    { u: -0.25, v: 0.6 },
    { u: -0.16, v: 0.97 },
    { u: -0.05, v: 1.0 },
    { u: 0.11, v: 1.0 },
    { u: 0.215, v: 0.84 },
    { u: 0.265, v: 0.64 },
    { u: 0.37, v: 0.615 },
    { u: 0.465, v: 0.575 },
    { u: 0.5, v: 0.49 },
    { u: 0.5, v: 0.3 },
    { u: 0.49, v: 0.14 },
  ],
  suv: [
    { u: -0.5, v: 0.34 },
    { u: -0.5, v: 0.58 },
    { u: -0.475, v: 0.8 },
    { u: -0.42, v: 0.9 },
    { u: -0.32, v: 0.95 },
    { u: -0.23, v: 0.98 },
    { u: -0.12, v: 1.0 },
    { u: 0.17, v: 1.0 },
    { u: 0.27, v: 0.9 },
    { u: 0.31, v: 0.72 },
    { u: 0.42, v: 0.7 },
    { u: 0.485, v: 0.66 },
    { u: 0.5, v: 0.54 },
    { u: 0.5, v: 0.34 },
    { u: 0.49, v: 0.15 },
  ],
  sport: [
    { u: -0.5, v: 0.32 },
    { u: -0.495, v: 0.46 },
    { u: -0.46, v: 0.56 },
    { u: -0.38, v: 0.6 },
    { u: -0.29, v: 0.62 },
    { u: -0.22, v: 0.65 },
    { u: -0.12, v: 0.95 },
    { u: 0.0, v: 1.0 },
    { u: 0.09, v: 0.96 },
    { u: 0.2, v: 0.72 },
    { u: 0.3, v: 0.65 },
    { u: 0.42, v: 0.61 },
    { u: 0.49, v: 0.53 },
    { u: 0.5, v: 0.36 },
    { u: 0.49, v: 0.15 },
  ],
};

const DEFAULT_DETAIL: Record<CarArt['kind'], CarDetail> = {
  sedan: { lamp: 'projector', grille: 'slat', tail: 'block' },
  suv: { lamp: 'led', grille: 'chrome-bar', tail: 'block', roofRails: true, cladding: true },
  sport: { lamp: 'slim', grille: 'mesh', tail: 'wrap' },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function traceSmooth(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  toX: (u: number) => number,
  toY: (v: number) => number,
): void {
  const first = points[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(toX(first.u), toY(first.v));
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    const prev = points[i - 1]!;
    const mx = toX((prev.u + p.u) / 2);
    const my = toY((prev.v + p.v) / 2);
    ctx.quadraticCurveTo(toX(prev.u), toY(prev.v), mx, my);
  }
  const last = points[points.length - 1]!;
  ctx.lineTo(toX(last.u), toY(last.v));
}

/** Builds the closed body outline plus a rocker edge back to the rear bumper. */
function traceBody(
  ctx: CanvasRenderingContext2D,
  profile: readonly Point[],
  toX: (u: number) => number,
  toY: (v: number) => number,
): void {
  traceSmooth(ctx, profile, toX, toY);
  ctx.lineTo(toX(0.4), toY(0.075));
  ctx.lineTo(toX(-0.34), toY(0.065));
  const first = profile[0]!;
  ctx.lineTo(toX(first.u), toY(first.v));
  ctx.closePath();
}

/**
 * Derives the glasshouse from the actual roofline: every profile point above
 * the belt line becomes part of the cabin, with the belt intersections
 * interpolated. A hatchback therefore gets a tall rear screen and a roadster a
 * short one, without a per-category template.
 */
function cabinFromProfile(profile: readonly Point[], belt: number): Point[] {
  const upper = profile.filter((p) => p.v > belt + 0.035);
  if (upper.length < 2) return [];
  const firstIdx = profile.indexOf(upper[0]!);
  const lastIdx = profile.indexOf(upper[upper.length - 1]!);
  const before = profile[Math.max(0, firstIdx - 1)]!;
  const after = profile[Math.min(profile.length - 1, lastIdx + 1)]!;
  const start = crossAt(before, upper[0]!, belt + 0.02);
  const end = crossAt(upper[upper.length - 1]!, after, belt + 0.02);
  const inset = upper.map((p) => ({ u: p.u, v: p.v - 0.028 }));
  const glass = [{ u: start.u + 0.012, v: belt + 0.028 }, ...inset, { u: end.u - 0.012, v: belt + 0.028 }];
  return glass;
}

function crossAt(a: Point, b: Point, v: number): Point {
  const span = b.v - a.v;
  if (Math.abs(span) < 1e-6) return { u: b.u, v };
  const k = (v - a.v) / span;
  return { u: a.u + (b.u - a.u) * Math.min(1, Math.max(0, k)), v };
}

function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000;
}

/**
 * Draws the car body in chassis-local pixels (origin = chassis centre).
 *
 * The renderer draws wheels first, then calls this, so the wheel arches are
 * punched out of the body with an even-odd fill and the wheels show through.
 * Every detail is driven by the model's own profile, belt line and equipment
 * flags — there is no shared "generic sedan" body.
 */
export function drawCarBody(
  ctx: CanvasRenderingContext2D,
  car: ResolvedCar,
  ppm: number,
  wheelLocals: { xM: number; yM: number; radiusM: number }[],
  damage = 0,
  options: CarDrawOptions = {},
): void {
  const art = car.profile.art;
  const detail = art.detail ?? DEFAULT_DETAIL[art.kind];
  const paintOverride = car.cosmetics.paint !== 'stock' ? PAINT_COLORS[car.cosmetics.paint] : null;
  const bodyColor = paintOverride?.body ?? art.bodyColor;
  const bodyDark = paintOverride?.dark ?? art.bodyDark;
  const bodyLight = paintOverride?.light ?? art.bodyLight;

  const L = car.numbers.lengthM * ppm;
  const H = car.numbers.heightM * ppm;
  const wheelRadiusPx = car.numbers.wheelRadiusM * ppm;
  const lowestWheelY = Math.min(...wheelLocals.map((w) => w.yM));
  const sillYUp = lowestWheelY - car.numbers.wheelRadiusM + 0.035;
  const toX = (u: number) => u * L;
  const toY = (v: number) => -sillYUp * ppm - v * H;
  const profile: readonly Point[] = art.profile && art.profile.length >= 6 ? art.profile : PROFILES[art.kind];

  const belt = art.beltRatio;
  const bodyTop = toY(1);
  const bodyBottom = toY(0);
  const lineW = Math.max(1.1, ppm * 0.038);
  const roof = Math.max(...profile.map((p) => p.v));
  // The belt line is well above the bumper on a low sports car, so lamps and
  // grilles are anchored to the actual nose/tail height of this silhouette
  // instead of a shared constant (that mismatch used to leave a tail lamp
  // floating above the boot lid).
  const noseTop = Math.max(
    belt - 0.12,
    ...profile.filter((p) => p.u > 0.45).map((p) => p.v),
  );
  const tailTop = Math.max(
    belt - 0.12,
    ...profile.filter((p) => p.u < -0.45).map((p) => p.v),
  );

  // --- 1. Ground shadow under the body -------------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, toY(0.015), L * 0.44, H * 0.028, 0, 0, Math.PI * 2);
  const under = ctx.createLinearGradient(0, toY(0.05), 0, toY(-0.01));
  under.addColorStop(0, 'rgba(0,0,0,0.24)');
  under.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = under;
  ctx.fill();
  ctx.restore();

  // --- 2. Main shell with arches punched out --------------------------------
  ctx.save();
  traceBody(ctx, profile, toX, toY);
  for (const w of wheelLocals) {
    ctx.moveTo(w.xM * ppm + w.radiusM * ppm * 1.19, -w.yM * ppm);
    ctx.arc(w.xM * ppm, -w.yM * ppm, w.radiusM * ppm * 1.19, 0, Math.PI * 2, false);
  }
  const paint = ctx.createLinearGradient(0, bodyTop, 0, bodyBottom);
  paint.addColorStop(0, bodyLight);
  paint.addColorStop(0.22, bodyColor);
  paint.addColorStop(0.52, bodyColor);
  paint.addColorStop(0.78, bodyDark);
  paint.addColorStop(1, bodyDark);
  ctx.fillStyle = paint;
  ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(8, 10, 12, 0.9)';
  ctx.lineWidth = lineW;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  // --- 3. Flank reflection and shoulder -------------------------------
  ctx.save();
  ctx.beginPath();
  traceBody(ctx, profile, toX, toY);
  for (const w of wheelLocals) {
    ctx.moveTo(w.xM * ppm + w.radiusM * ppm * 1.19, -w.yM * ppm);
    ctx.arc(w.xM * ppm, -w.yM * ppm, w.radiusM * ppm * 1.19, 0, Math.PI * 2, false);
  }
  ctx.clip('evenodd');
  const flank = ctx.createLinearGradient(0, toY(belt + 0.04), 0, toY(belt - 0.34));
  flank.addColorStop(0, 'rgba(255,255,255,0.16)');
  flank.addColorStop(0.35, 'rgba(255,255,255,0.03)');
  flank.addColorStop(1, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = flank;
  ctx.fillRect(-L / 2, toY(belt + 0.04), L, (belt + 0.04 - (belt - 0.34)) * H);
  // Long character line just under the belt.
  ctx.beginPath();
  ctx.moveTo(toX(-0.44), toY(belt - 0.02));
  ctx.bezierCurveTo(toX(-0.1), toY(belt + 0.02), toX(0.2), toY(belt + 0.02), toX(0.47), toY(belt - 0.05));
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = Math.max(1, ppm * 0.02);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX(-0.44), toY(belt - 0.04));
  ctx.bezierCurveTo(toX(-0.1), toY(belt), toX(0.2), toY(belt), toX(0.47), toY(belt - 0.07));
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.stroke();
  ctx.restore();

  // --- 4. Lower cladding for off-road trims ---------------------------------
  if (detail.cladding) {
    ctx.save();
    ctx.beginPath();
    traceBody(ctx, profile, toX, toY);
    for (const w of wheelLocals) {
      ctx.moveTo(w.xM * ppm + w.radiusM * ppm * 1.19, -w.yM * ppm);
      ctx.arc(w.xM * ppm, -w.yM * ppm, w.radiusM * ppm * 1.19, 0, Math.PI * 2, false);
    }
    ctx.clip('evenodd');
    ctx.beginPath();
    ctx.moveTo(-L / 2, toY(0.2));
    ctx.lineTo(L / 2, toY(0.2));
    ctx.lineTo(L / 2, toY(0));
    ctx.lineTo(-L / 2, toY(0));
    ctx.closePath();
    const clad = ctx.createLinearGradient(0, toY(0.22), 0, toY(0.04));
    clad.addColorStop(0, '#3a3c3b');
    clad.addColorStop(1, '#1d1f1f');
    ctx.fillStyle = clad;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-L / 2, toY(0.2));
    ctx.lineTo(L / 2, toY(0.2));
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = Math.max(1, ppm * 0.018);
    ctx.stroke();
    ctx.restore();
  }

  // --- 5. Glasshouse --------------------------------------------------------
  const glass = art.detail?.cabin && art.detail.cabin.length >= 4
    ? [...art.detail.cabin]
    : cabinFromProfile(profile, belt);
  if (glass.length >= 3) {
    ctx.save();
    traceSmooth(ctx, glass, toX, toY);
    ctx.closePath();
    ctx.fillStyle = art.glassColor;
    ctx.fill();
    const glassGrad = ctx.createLinearGradient(0, toY(roof), 0, toY(belt + 0.03));
    glassGrad.addColorStop(0, '#8fa6b6');
    glassGrad.addColorStop(0.3, art.glassColor);
    glassGrad.addColorStop(1, '#0e151b');
    ctx.fillStyle = glassGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(250, 250, 245, 0.22)';
    ctx.lineWidth = Math.max(1, ppm * 0.016);
    ctx.stroke();

    // Diagonal sky reflection sweeping across the glass.
    ctx.save();
    traceSmooth(ctx, glass, toX, toY);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(toX(-0.2), toY(belt));
    ctx.lineTo(toX(0.02), toY(roof + 0.02));
    ctx.lineTo(toX(0.12), toY(roof + 0.02));
    ctx.lineTo(toX(-0.1), toY(belt));
    ctx.closePath();
    ctx.fillStyle = 'rgba(226, 240, 250, 0.14)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(toX(0.16), toY(belt));
    ctx.lineTo(toX(0.24), toY(belt + 0.16));
    ctx.lineTo(toX(0.28), toY(belt + 0.16));
    ctx.lineTo(toX(0.22), toY(belt));
    ctx.closePath();
    ctx.fillStyle = 'rgba(226, 240, 250, 0.1)';
    ctx.fill();
    ctx.restore();

    // Pillars: A at the windscreen base, B in the middle, C at the rear glass.
    const bPillarU = glass[Math.floor(glass.length / 2)]?.u ?? 0;
    const pillarW = Math.max(1.5, ppm * 0.045);
    ctx.fillStyle = bodyDark;
    for (const p of [glass[0], glass[glass.length - 1], glass[Math.floor(glass.length / 2)]]) {
      if (!p) continue;
      ctx.beginPath();
      ctx.moveTo(toX(p.u) - pillarW / 2, toY(p.v));
      ctx.lineTo(toX(p.u) + pillarW / 2, toY(p.v));
      ctx.lineTo(toX(p.u + 0.02) + pillarW / 2, toY(belt + 0.02));
      ctx.lineTo(toX(p.u + 0.02) - pillarW / 2, toY(belt + 0.02));
      ctx.closePath();
      ctx.fill();
    }
    // B-pillar emphasis.
    ctx.fillStyle = 'rgba(10, 12, 14, 0.85)';
    ctx.fillRect(toX(bPillarU) - pillarW * 0.6, toY(roof), pillarW * 1.2, (roof - belt - 0.02) * H);

    // Chrome window surround.
    if (detail.chrome) {
      traceSmooth(ctx, glass, toX, toY);
      ctx.strokeStyle = 'rgba(218, 222, 226, 0.55)';
      ctx.lineWidth = Math.max(1, ppm * 0.018);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- 6. Door seams, handles, mirror, antenna ------------------------------
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.lineWidth = Math.max(1, ppm * 0.016);
  const seams = [-0.27, 0.015];
  for (const seamU of seams) {
    ctx.beginPath();
    ctx.moveTo(toX(seamU), toY(belt - 0.04));
    ctx.quadraticCurveTo(toX(seamU - 0.012), toY(0.22), toX(seamU - 0.008), toY(0.09));
    ctx.stroke();
  }
  for (const handleU of [-0.18, 0.105]) {
    ctx.fillStyle = detail.chrome ? '#cfd3d6' : 'rgba(22, 24, 26, 0.85)';
    roundRect(ctx, toX(handleU), toY(belt - 0.035), L * 0.05, H * 0.03, H * 0.015);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(toX(handleU) + 1, toY(belt - 0.032), L * 0.045, Math.max(1, H * 0.006));
  }
  // Mirror: housing plus glass.
  const mirrorU = glass.length > 0 ? (glass[glass.length - 1]?.u ?? 0.24) - 0.02 : 0.24;
  ctx.beginPath();
  ctx.moveTo(toX(mirrorU), toY(belt + 0.1));
  ctx.lineTo(toX(mirrorU + 0.055), toY(belt + 0.075));
  ctx.lineTo(toX(mirrorU + 0.05), toY(belt + 0.005));
  ctx.lineTo(toX(mirrorU - 0.005), toY(belt + 0.03));
  ctx.closePath();
  ctx.fillStyle = bodyDark;
  ctx.fill();
  ctx.strokeStyle = 'rgba(8, 10, 12, 0.7)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(180, 200, 215, 0.5)';
  ctx.fillRect(toX(mirrorU + 0.035), toY(belt + 0.07), L * 0.012, H * 0.035);
  if (detail.antenna) {
    ctx.beginPath();
    ctx.moveTo(toX(-0.12), toY(roof));
    ctx.quadraticCurveTo(toX(-0.16), toY(roof + 0.055), toX(-0.2), toY(roof + 0.075));
    ctx.strokeStyle = 'rgba(20, 22, 24, 0.9)';
    ctx.lineWidth = Math.max(1.2, ppm * 0.026);
    ctx.stroke();
  }
  if (detail.roofRails) {
    ctx.strokeStyle = 'rgba(18, 20, 22, 0.9)';
    ctx.lineWidth = Math.max(2, ppm * 0.05);
    ctx.beginPath();
    ctx.moveTo(toX(-0.2), toY(roof) - ppm * 0.035);
    ctx.lineTo(toX(0.14), toY(roof) - ppm * 0.035);
    ctx.stroke();
    ctx.lineWidth = Math.max(1, ppm * 0.02);
    for (const railU of [-0.17, 0.1]) {
      ctx.beginPath();
      ctx.moveTo(toX(railU), toY(roof) - ppm * 0.035);
      ctx.lineTo(toX(railU), toY(roof) + ppm * 0.005);
      ctx.stroke();
    }
  }
  if (detail.spoiler === 'lip') {
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.moveTo(toX(-0.5), toY(belt + 0.02));
    ctx.lineTo(toX(-0.44), toY(belt + 0.05));
    ctx.lineTo(toX(-0.42), toY(belt + 0.055));
    ctx.lineTo(toX(-0.5), toY(belt + 0.06));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // --- 7. Lamps, grille, bumpers, plate -------------------------------------
  drawFrontLamp(ctx, detail, toX, toY, noseTop, L, H, lineW, Boolean(options.lights));
  drawTailLamp(ctx, detail, toX, toY, tailTop, L, H, lineW, options.brake ?? 0);
  drawGrille(ctx, detail, toX, toY, noseTop, L, H, ppm);
  drawBumpers(ctx, detail, toX, toY, belt, noseTop, tailTop, L, H, ppm, bodyDark);
  if (detail.sideStep) {
    ctx.fillStyle = 'rgba(18, 20, 22, 0.92)';
    const stepY = toY(0.13);
    ctx.fillRect(toX(-0.26), stepY, L * 0.52, Math.max(2, ppm * 0.05));
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(toX(-0.26), stepY, L * 0.52, Math.max(1, ppm * 0.014));
  }
  drawPlate(ctx, car, toX, toY, L, H, ppm);

  // --- 8. Wheels arches: liner, flare and contact shading -------------------
  ctx.save();
  for (const w of wheelLocals) {
    const cx = w.xM * ppm;
    const cy = -w.yM * ppm;
    const r = w.radiusM * ppm;
    // Liner: dark wall between tyre and paint.
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.175, Math.PI * 1.02, Math.PI * 1.98);
    ctx.strokeStyle = 'rgba(6, 8, 9, 0.85)';
    ctx.lineWidth = Math.max(1.5, ppm * 0.04);
    ctx.stroke();
    // Flare highlight.
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.23, Math.PI * 1.03, Math.PI * 1.97);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = Math.max(1, ppm * 0.022);
    ctx.stroke();
    if (detail.cladding) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.27, Math.PI * 1.02, Math.PI * 1.98);
      ctx.strokeStyle = 'rgba(28, 30, 30, 0.95)';
      ctx.lineWidth = Math.max(2, ppm * 0.055);
      ctx.stroke();
    }
    // Wheel-well shadow on the tyre top.
    const shade = ctx.createLinearGradient(0, cy - r, 0, cy - r * 0.55);
    shade.addColorStop(0, 'rgba(0,0,0,0.32)');
    shade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.02, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  }
  ctx.restore();

  // --- 9. Damage stages -----------------------------------------------------
  drawDamage(ctx, damage, toX, toY, L, H, ppm, belt, roof, bodyDark, art);
  void wheelRadiusPx;
}

function drawFrontLamp(
  ctx: CanvasRenderingContext2D,
  detail: CarDetail,
  toX: (u: number) => number,
  toY: (v: number) => number,
  topV: number,
  L: number,
  H: number,
  lineW: number,
  lights: boolean,
): void {
  ctx.save();
  const vTop = topV - 0.012;
  const vBottom = topV - 0.125;
  const midV = (vTop + vBottom) / 2;
  ctx.beginPath();
  if (detail.lamp === 'round') {
    ctx.ellipse(toX(0.455), toY(midV), L * 0.028, (vTop - vBottom) * H * 0.5, 0, 0, Math.PI * 2);
  } else if (detail.lamp === 'led') {
    ctx.moveTo(toX(0.43), toY(vTop));
    ctx.lineTo(toX(0.498), toY(vTop - 0.02));
    ctx.lineTo(toX(0.498), toY(vBottom - 0.015));
    ctx.lineTo(toX(0.43), toY(vBottom));
    ctx.closePath();
  } else if (detail.lamp === 'slim') {
    ctx.moveTo(toX(0.42), toY(vTop));
    ctx.lineTo(toX(0.497), toY(vTop - 0.03));
    ctx.lineTo(toX(0.497), toY(vBottom + 0.03));
    ctx.lineTo(toX(0.44), toY(vBottom));
    ctx.closePath();
  } else {
    ctx.moveTo(toX(0.435), toY(vTop));
    ctx.lineTo(toX(0.497), toY(vTop - 0.025));
    ctx.lineTo(toX(0.497), toY(vBottom));
    ctx.lineTo(toX(0.435), toY(vBottom + 0.01));
    ctx.closePath();
  }
  const lens = ctx.createLinearGradient(toX(0.43), toY(vTop), toX(0.5), toY(vBottom));
  lens.addColorStop(0, lights ? '#fff6d8' : '#e9e6d5');
  lens.addColorStop(0.55, lights ? '#ffe9a8' : '#b9b6a3');
  lens.addColorStop(1, '#7d7d70');
  ctx.fillStyle = lens;
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.75)';
  ctx.lineWidth = lineW * 0.8;
  ctx.stroke();
  // Projector bowl / LED strip.
  ctx.fillStyle = lights ? 'rgba(255, 252, 226, 0.95)' : 'rgba(240, 238, 222, 0.65)';
  if (detail.lamp === 'projector' || detail.lamp === 'round') {
    ctx.beginPath();
    ctx.arc(toX(0.465), toY(midV), Math.max(1.5, L * 0.011), 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(toX(0.44), toY(midV + 0.028), L * 0.05, Math.max(1, H * 0.008));
  }
  if (lights) {
    const glow = ctx.createRadialGradient(toX(0.5), toY(midV), 0, toX(0.5), toY(midV), L * 0.05);
    glow.addColorStop(0, 'rgba(255, 238, 180, 0.3)');
    glow.addColorStop(1, 'rgba(255, 238, 180, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(toX(0.46), toY(midV + 0.08), L * 0.06, H * 0.14);
  }
  ctx.restore();
}

function drawTailLamp(
  ctx: CanvasRenderingContext2D,
  detail: CarDetail,
  toX: (u: number) => number,
  toY: (v: number) => number,
  topV: number,
  L: number,
  H: number,
  lineW: number,
  brake: number,
): void {
  ctx.save();
  const glow = Math.min(1, Math.max(0, brake));
  const vTop = topV - 0.008;
  const vBottom = topV - 0.115;
  const midV = (vTop + vBottom) / 2;
  ctx.beginPath();
  if (detail.tail === 'round') {
    ctx.ellipse(toX(-0.462), toY(midV), L * 0.022, (vTop - vBottom) * H * 0.45, 0, 0, Math.PI * 2);
  } else if (detail.tail === 'wrap') {
    ctx.moveTo(toX(-0.497), toY(vTop));
    ctx.lineTo(toX(-0.432), toY(vTop - 0.012));
    ctx.lineTo(toX(-0.44), toY(vBottom));
    ctx.lineTo(toX(-0.497), toY(vBottom - 0.02));
    ctx.closePath();
  } else {
    ctx.moveTo(toX(-0.498), toY(vTop));
    ctx.lineTo(toX(-0.44), toY(vTop));
    ctx.lineTo(toX(-0.44), toY(vBottom));
    ctx.lineTo(toX(-0.498), toY(vBottom - 0.025));
    ctx.closePath();
  }
  const lens = ctx.createLinearGradient(toX(-0.5), toY(vTop), toX(-0.44), toY(vBottom));
  lens.addColorStop(0, glow > 0.05 ? '#ff6b52' : '#8f2a22');
  lens.addColorStop(1, glow > 0.05 ? '#c32b1c' : '#5d1a14');
  ctx.fillStyle = lens;
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 15, 15, 0.75)';
  ctx.lineWidth = lineW * 0.8;
  ctx.stroke();
  if (glow > 0.05) {
    const halo = ctx.createRadialGradient(toX(-0.49), toY(midV), 0, toX(-0.49), toY(midV), L * 0.08);
    halo.addColorStop(0, `rgba(255, 70, 40, ${0.45 * glow})`);
    halo.addColorStop(1, 'rgba(255, 70, 40, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(toX(-0.56), toY(midV + 0.06), L * 0.08, H * 0.2);
  }
  ctx.fillStyle = 'rgba(255, 190, 90, 0.55)';
  ctx.fillRect(toX(-0.49), toY(vBottom + 0.01), L * 0.045, Math.max(1, H * 0.01));
  ctx.restore();
}

function drawGrille(
  ctx: CanvasRenderingContext2D,
  detail: CarDetail,
  toX: (u: number) => number,
  toY: (v: number) => number,
  topV: number,
  L: number,
  H: number,
  ppm: number,
): void {
  if (detail.grille === 'none') return;
  ctx.save();
  const x0 = toX(0.452);
  const x1 = toX(0.497);
  const y0 = toY(topV - 0.155);
  const y1 = toY(topV - 0.305);
  ctx.beginPath();
  roundRect(ctx, x0, y0, x1 - x0, y1 - y0, ppm * 0.02);
  ctx.fillStyle = '#15181a';
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (detail.grille === 'mesh') {
    ctx.strokeStyle = 'rgba(200, 205, 210, 0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const gx = x0 + ((x1 - x0) * i) / 8;
      ctx.beginPath();
      ctx.moveTo(gx, y0);
      ctx.lineTo(gx + 3, y1);
      ctx.stroke();
    }
  } else if (detail.grille === 'slat') {
    ctx.strokeStyle = 'rgba(214, 218, 222, 0.22)';
    ctx.lineWidth = Math.max(1, ppm * 0.017);
    for (let i = 1; i < 5; i++) {
      const gy = y0 + ((y1 - y0) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x0, gy);
      ctx.lineTo(x1, gy);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = 'rgba(208, 212, 216, 0.5)';
    ctx.fillRect(x0, y0 + (y1 - y0) * 0.3, x1 - x0, Math.max(1.5, (y1 - y0) * 0.14));
    ctx.fillStyle = 'rgba(208, 212, 216, 0.32)';
    ctx.fillRect(x0, y0 + (y1 - y0) * 0.62, x1 - x0, Math.max(1, (y1 - y0) * 0.08));
  }
  ctx.restore();
  ctx.strokeStyle = detail.grille === 'chrome-bar' ? 'rgba(220, 224, 228, 0.6)' : 'rgba(0,0,0,0.6)';
  ctx.lineWidth = Math.max(1, ppm * 0.02);
  ctx.stroke();
  ctx.restore();
  void L;
  void H;
}

function drawBumpers(
  ctx: CanvasRenderingContext2D,
  detail: CarDetail,
  toX: (u: number) => number,
  toY: (v: number) => number,
  belt: number,
  noseTop: number,
  tailTop: number,
  L: number,
  H: number,
  ppm: number,
  bodyDark: string,
): void {
  ctx.save();
  ctx.fillStyle = detail.cladding ? '#26292a' : bodyDark;
  roundRect(ctx, toX(0.44), toY(noseTop - 0.13), L * 0.062, H * 0.16, ppm * 0.03);
  ctx.fill();
  roundRect(ctx, toX(-0.5), toY(tailTop - 0.11), L * 0.062, H * 0.16, ppm * 0.03);
  ctx.fill();
  // Air intake under the bumper.
  ctx.fillStyle = 'rgba(8,9,10,0.85)';
  roundRect(ctx, toX(0.455), toY(noseTop - 0.32), L * 0.04, H * 0.035, ppm * 0.015);
  ctx.fill();
  // Chrome strip on high trims.
  if (detail.chrome) {
    ctx.fillStyle = 'rgba(214, 218, 222, 0.5)';
    ctx.fillRect(toX(-0.5), toY(belt - 0.155), L * 0.06, Math.max(1, H * 0.008));
  }
  ctx.restore();
}

function drawPlate(
  ctx: CanvasRenderingContext2D,
  car: ResolvedCar,
  toX: (u: number) => number,
  toY: (v: number) => number,
  L: number,
  H: number,
  ppm: number,
): void {
  const digits = hashString(car.profile.id);
  const a = (digits % 9) + 1;
  const b = Math.floor(digits / 9) % 10;
  const c = Math.floor(digits / 90) % 10;
  const d = Math.floor(digits / 900) % 10;
  ctx.save();
  const w = L * 0.085;
  const h = H * 0.085;
  const x = toX(0.415);
  const y = toY(0.155);
  ctx.fillStyle = '#e9e6da';
  roundRect(ctx, x, y, w, h, Math.max(1, ppm * 0.012));
  ctx.fill();
  ctx.strokeStyle = 'rgba(30, 36, 32, 0.6)';
  ctx.lineWidth = Math.max(1, ppm * 0.008);
  ctx.stroke();
  ctx.fillStyle = '#1c4f8f';
  ctx.fillRect(x + w * 0.02, y + h * 0.12, w * 0.16, h * 0.76);
  ctx.fillStyle = '#1f2a24';
  ctx.font = `${Math.max(4, ppm * 0.11)}px Vazirmatn, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = `${a}${b}${c}${d}`;
  ctx.fillText(label, x + w * 0.58, y + h * 0.5);
  ctx.restore();
}

function drawDamage(
  ctx: CanvasRenderingContext2D,
  rawDamage: number,
  toX: (u: number) => number,
  toY: (v: number) => number,
  L: number,
  H: number,
  ppm: number,
  belt: number,
  roof: number,
  bodyDark: string,
  art: CarArt,
): void {
  const damage = Math.min(1, Math.max(0, rawDamage));
  if (damage <= 0.04) return;
  ctx.save();

  // Scratches and paint loss accumulate from the sill and the bumpers.
  const scratches = Math.round(2 + damage * 7);
  for (let i = 0; i < scratches; i++) {
    const r = (i * 0.618) % 1;
    const u = -0.34 + r * 0.68;
    const v = 0.12 + ((i * 0.37) % 0.3);
    ctx.beginPath();
    ctx.moveTo(toX(u), toY(v));
    ctx.lineTo(toX(u + 0.045), toY(v + 0.05 + r * 0.04));
    ctx.lineTo(toX(u + 0.012), toY(v + 0.1));
    ctx.strokeStyle = `rgba(228, 224, 210, ${0.2 + damage * 0.45})`;
    ctx.lineWidth = Math.max(1, ppm * 0.014);
    ctx.stroke();
  }

  // Dents: dark hollows with a bright rim, favouring the bumpers.
  if (damage > 0.18) {
    const dents = Math.round(1 + damage * 3);
    for (let i = 0; i < dents; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const u = side * (0.36 + ((i * 0.11) % 0.1));
      const v = 0.2 + ((i * 0.17) % 0.22);
      const rx = L * (0.028 + damage * 0.02);
      const ry = H * (0.02 + damage * 0.015);
      ctx.beginPath();
      ctx.ellipse(toX(u), toY(v), rx, ry, side * 0.3, 0, Math.PI * 2);
      const hollow = ctx.createRadialGradient(toX(u - 0.01), toY(v + 0.02), 1, toX(u), toY(v), rx);
      hollow.addColorStop(0, `rgba(20, 22, 24, ${0.35 + damage * 0.3})`);
      hollow.addColorStop(0.7, `rgba(20, 22, 24, ${0.18 + damage * 0.2})`);
      hollow.addColorStop(1, 'rgba(255,255,255,0.12)');
      ctx.fillStyle = hollow;
      ctx.fill();
    }
  }

  // Cracked windscreen and a broken lamp at heavy damage.
  if (damage > 0.34) {
    ctx.strokeStyle = `rgba(18, 24, 28, ${0.4 + damage * 0.45})`;
    ctx.lineWidth = Math.max(1, ppm * 0.018);
    const cx = toX(0.06);
    const cy = toY(belt + 0.28);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * L * 0.06, cy + Math.sin(angle) * H * 0.12);
      ctx.stroke();
    }
  }
  if (damage > 0.55) {
    ctx.fillStyle = 'rgba(10, 12, 14, 0.6)';
    ctx.beginPath();
    ctx.ellipse(toX(0.465), toY(belt - 0.07), L * 0.022, H * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hanging bumper corner.
    ctx.beginPath();
    ctx.moveTo(toX(-0.5), toY(0.16));
    ctx.lineTo(toX(-0.44), toY(0.17));
    ctx.lineTo(toX(-0.43), toY(0.1));
    ctx.lineTo(toX(-0.5), toY(0.12));
    ctx.closePath();
    ctx.fillStyle = bodyDark;
    ctx.fill();
  }
  if (damage > 0.75) {
    // Deformed silhouette: wobble the panel edges.
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(1, ppm * 0.025);
    for (let i = 0; i < 3; i++) {
      const u = -0.1 + i * 0.18;
      ctx.beginPath();
      ctx.moveTo(toX(u), toY(0.24));
      ctx.quadraticCurveTo(toX(u + 0.02), toY(0.35), toX(u), toY(0.46));
      ctx.stroke();
    }
  }
  ctx.restore();
  void roof;
  void art;
}

/**
 * One wheel: tyre with visible tread blocks (so rotation reads at gameplay
 * scale), sidewall, brake disc, caliper and a rim whose pattern follows the
 * model's equipment.
 */
export function drawWheel(ctx: CanvasRenderingContext2D, wheel: WheelArt): void {
  const { x, y, radiusPx: r } = wheel;
  ctx.save();
  ctx.translate(x, y);

  // Tyre carcass.
  const tyre = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.2, 0, 0, r);
  tyre.addColorStop(0, '#2a2f35');
  tyre.addColorStop(0.62, '#181c20');
  tyre.addColorStop(1, '#07090b');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = tyre;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.lineWidth = Math.max(1, r * 0.045);
  ctx.stroke();

  // Tread blocks: rotate with the wheel, clipped to the outer band.
  ctx.save();
  ctx.rotate(wheel.angleRad);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.995, 0, Math.PI * 2);
  ctx.arc(0, 0, r * 0.775, 0, Math.PI * 2, true);
  ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  const blocks = 22;
  for (let i = 0; i < blocks; i++) {
    const a = (i / blocks) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
    ctx.lineTo(Math.cos(a + 0.09) * r, Math.sin(a + 0.09) * r);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = Math.max(1, r * 0.02);
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + 0.05;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
    ctx.lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98);
    ctx.stroke();
  }
  ctx.restore();

  // Sidewall ring.
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.775, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(190, 192, 188, 0.16)';
  ctx.lineWidth = Math.max(1, r * 0.02);
  ctx.stroke();

  // Brake disc and caliper stay with the suspension, not the wheel spin.
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
  const disc = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 0.52);
  disc.addColorStop(0, '#6c7176');
  disc.addColorStop(1, '#3f4347');
  ctx.fillStyle = disc;
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 22, 24, 0.7)';
  ctx.lineWidth = Math.max(1, r * 0.02);
  ctx.stroke();
  if (wheel.slip > 0.25) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 120, 60, ${Math.min(0.5, wheel.slip * 0.35)})`;
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.stroke();
  }
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = wheel.braking ? '#b8352a' : '#2c3034';
  roundRect(ctx, r * 0.3, -r * 0.11, r * 0.2, r * 0.22, r * 0.05);
  ctx.fill();
  ctx.restore();

  // Rim and spokes.
  ctx.save();
  ctx.rotate(wheel.angleRad);
  const rim = ctx.createLinearGradient(-r * 0.5, -r * 0.5, r * 0.5, r * 0.5);
  rim.addColorStop(0, '#e2e5e7');
  rim.addColorStop(0.42, '#a7adb2');
  rim.addColorStop(1, '#55595e');
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.57, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();
  ctx.strokeStyle = 'rgba(18, 20, 22, 0.85)';
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.stroke();

  const style = wheel.rimStyle ?? 'spoke';
  if (style === 'mesh') {
    ctx.strokeStyle = 'rgba(38, 42, 46, 0.9)';
    ctx.lineWidth = Math.max(1, r * 0.035);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.14, Math.sin(a) * r * 0.14);
      ctx.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
      ctx.lineTo(Math.cos(a + 0.26) * r * 0.3, Math.sin(a + 0.26) * r * 0.3);
      ctx.stroke();
    }
  } else if (style === 'rugged') {
    ctx.strokeStyle = 'rgba(30, 33, 36, 0.95)';
    ctx.lineWidth = Math.max(1.4, r * 0.075);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16);
      ctx.lineTo(Math.cos(a) * r * 0.48, Math.sin(a) * r * 0.48);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(40, 44, 48, 0.95)';
    ctx.lineWidth = Math.max(1.2, r * 0.05);
    const spokes = wheel.index === 1 ? 5 : 10;
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15);
      ctx.lineTo(Math.cos(a + 0.05) * r * 0.49, Math.sin(a + 0.05) * r * 0.49);
      ctx.stroke();
    }
  }

  // Hub and centre cap.
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2e32';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = '#c9ced2';
  ctx.fill();
  ctx.restore();

  // Tyre contact patch shading where it meets the road.
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.stroke();

  ctx.restore();
}

/** Soft contact shadow under the car, plus a darker patch at each tyre. */
export function drawCarShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  lengthPx: number,
  ppm: number,
  wheelOffsetsPx: readonly number[] = [],
): void {
  ctx.save();
  ctx.translate(x, groundY);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, lengthPx * 0.62);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  g.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, lengthPx * 0.62, ppm * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const offset of wheelOffsetsPx) {
    const patch = ctx.createRadialGradient(offset, 0, 0, offset, 0, ppm * 0.34);
    patch.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    patch.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = patch;
    ctx.beginPath();
    ctx.ellipse(offset, 0, ppm * 0.34, ppm * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
