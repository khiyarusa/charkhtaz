import type { CarArt, ResolvedCar } from '../vehicles/profiles';

export interface WheelArt {
  /** Wheel centre in screen pixels. */
  x: number;
  y: number;
  radiusPx: number;
  angleRad: number;
  /** 0 = front, 1 = rear. */
  index: 0 | 1;
  slip: number;
}

interface ProfilePoint {
  u: number;
  v: number;
}

/** Side-profile control points: u along the car (−0.5 rear … 0.5 front), v sill→roof. */
const PROFILES: Record<CarArt['kind'], ProfilePoint[]> = {
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

/** Builds a smooth outline from the profile plus a rocker bottom edge. */
function traceBody(
  ctx: CanvasRenderingContext2D,
  profile: ProfilePoint[],
  toX: (u: number) => number,
  toY: (v: number) => number,
): void {
  const first = profile[0]!;
  ctx.beginPath();
  ctx.moveTo(toX(first.u), toY(first.v));
  for (let i = 1; i < profile.length; i++) {
    const p = profile[i]!;
    const prev = profile[i - 1]!;
    const mx = toX((prev.u + p.u) / 2);
    const my = toY((prev.v + p.v) / 2);
    ctx.quadraticCurveTo(toX(prev.u), toY(prev.v), mx, my);
  }
  const last = profile[profile.length - 1]!;
  ctx.lineTo(toX(last.u), toY(last.v));
  // Rocker / underbody back to the rear bumper.
  ctx.lineTo(toX(0.36), toY(0.07));
  ctx.lineTo(toX(-0.3), toY(0.06));
  ctx.lineTo(toX(first.u), toY(first.v));
  ctx.closePath();
}

function drawWheelArch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.moveTo(cx + radius, cy);
  ctx.arc(cx, cy, radius, 0, Math.PI * 2, false);
}

/** Draws the car body in chassis-local pixels (origin = chassis centre). */
export function drawCarBody(
  ctx: CanvasRenderingContext2D,
  car: ResolvedCar,
  ppm: number,
  wheelLocals: { xM: number; yM: number; radiusM: number }[],
): void {
  const art = car.profile.art;
  const L = car.numbers.lengthM * ppm;
  const H = car.numbers.heightM * ppm;
  const wheelRadiusPx = car.numbers.wheelRadiusM * ppm;

  const lowestWheelY = Math.min(...wheelLocals.map((w) => w.yM));
  const sillYUp = lowestWheelY - car.numbers.wheelRadiusM + 0.035;
  const toX = (u: number) => u * L;
  const toY = (v: number) => -sillYUp * ppm - v * H;

  const profile = PROFILES[art.kind];
  const bodyTop = toY(1);
  const bodyBottom = toY(0);

  // --- Main shell -----------------------------------------------------------
  ctx.save();
  traceBody(ctx, profile, toX, toY);
  for (const w of wheelLocals) {
    drawWheelArch(ctx, w.xM * ppm, -w.yM * ppm, w.radiusM * ppm * 1.16);
  }
  const paint = ctx.createLinearGradient(0, bodyTop, 0, bodyBottom);
  paint.addColorStop(0, art.bodyLight);
  paint.addColorStop(0.38, art.bodyColor);
  paint.addColorStop(1, art.bodyDark);
  ctx.fillStyle = paint;
  ctx.fill('evenodd');

  ctx.strokeStyle = 'rgba(8, 10, 12, 0.85)';
  ctx.lineWidth = Math.max(1.4, ppm * 0.045);
  ctx.stroke();

  // Top highlight along the shoulder.
  ctx.beginPath();
  const shoulder = profile.slice(3, 10);
  for (let i = 0; i < shoulder.length; i++) {
    const p = shoulder[i]!;
    const x = toX(p.u);
    const y = toY(p.v) + H * 0.035;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = Math.max(1, ppm * 0.02);
  ctx.stroke();

  // --- Glasshouse -----------------------------------------------------------
  const beltV = art.beltRatio;
  const glass: ProfilePoint[] =
    art.kind === 'suv'
      ? [
          { u: -0.44, v: beltV + 0.03 },
          { u: -0.4, v: 0.88 },
          { u: -0.3, v: 0.92 },
          { u: -0.1, v: 0.95 },
          { u: 0.16, v: 0.95 },
          { u: 0.24, v: 0.8 },
          { u: 0.25, v: beltV + 0.03 },
        ]
      : art.kind === 'sport'
        ? [
            { u: -0.4, v: beltV + 0.02 },
            { u: -0.22, v: beltV + 0.28 },
            { u: -0.11, v: 0.9 },
            { u: 0.0, v: 0.95 },
            { u: 0.08, v: 0.9 },
            { u: 0.19, v: beltV + 0.05 },
          ]
        : [
            { u: -0.34, v: beltV + 0.02 },
            { u: -0.175, v: beltV + 0.3 },
            { u: -0.055, v: 0.94 },
            { u: 0.11, v: 0.94 },
            { u: 0.21, v: beltV + 0.12 },
            { u: 0.245, v: beltV + 0.03 },
          ];

  ctx.beginPath();
  ctx.moveTo(toX(glass[0]!.u), toY(glass[0]!.v));
  for (let i = 1; i < glass.length; i++) {
    const p = glass[i]!;
    const prev = glass[i - 1]!;
    ctx.quadraticCurveTo(
      toX(prev.u),
      toY(prev.v),
      toX((prev.u + p.u) / 2),
      toY((prev.v + p.v) / 2),
    );
  }
  const glast = glass[glass.length - 1]!;
  ctx.lineTo(toX(glast.u), toY(glast.v));
  ctx.closePath();
  const glassGrad = ctx.createLinearGradient(0, toY(0.95), 0, toY(beltV));
  glassGrad.addColorStop(0, art.glassColor);
  glassGrad.addColorStop(0.55, '#4d6a80');
  glassGrad.addColorStop(1, '#1d2933');
  ctx.fillStyle = glassGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(250, 250, 245, 0.16)';
  ctx.lineWidth = Math.max(1, ppm * 0.02);
  ctx.stroke();

  // Glass highlight streak.
  ctx.beginPath();
  ctx.moveTo(toX(-0.12), toY(0.9));
  ctx.lineTo(toX(0.1), toY(0.9));
  ctx.lineTo(toX(0.02), toY(beltV + 0.1));
  ctx.lineTo(toX(-0.16), toY(beltV + 0.06));
  ctx.closePath();
  ctx.fillStyle = 'rgba(220, 240, 255, 0.12)';
  ctx.fill();

  // Pillars: B-pillar and door frames.
  const pillar = art.bodyDark;
  ctx.fillStyle = pillar;
  const bU = art.kind === 'suv' ? -0.06 : -0.02;
  ctx.fillRect(toX(bU) - ppm * 0.035, toY(0.96), ppm * 0.07, H * 0.42);

  // --- Door seams, handles --------------------------------------------------
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = Math.max(1, ppm * 0.016);
  for (const seamU of [-0.28, 0.02]) {
    ctx.beginPath();
    ctx.moveTo(toX(seamU), toY(beltV - 0.04));
    ctx.quadraticCurveTo(
      toX(seamU - 0.015),
      toY(0.22),
      toX(seamU - 0.01),
      toY(0.08),
    );
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(20, 22, 24, 0.75)';
  for (const handleU of [-0.2, 0.1]) {
    roundRect(ctx, toX(handleU), toY(beltV - 0.03), L * 0.045, H * 0.028, H * 0.014);
    ctx.fill();
  }

  // --- Lights and bumpers ---------------------------------------------------
  const lightW = L * 0.075;
  const headlight = ctx.createLinearGradient(toX(0.42), 0, toX(0.5), 0);
  headlight.addColorStop(0, '#f6f2df');
  headlight.addColorStop(1, '#c9c2a2');
  ctx.fillStyle = headlight;
  ctx.beginPath();
  ctx.moveTo(toX(0.44), toY(beltV - 0.02));
  ctx.lineTo(toX(0.495), toY(beltV - 0.05));
  ctx.lineTo(toX(0.497), toY(beltV - 0.14));
  ctx.lineTo(toX(0.445), toY(beltV - 0.12));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(30, 30, 30, 0.6)';
  ctx.stroke();

  ctx.fillStyle = '#8d2a22';
  ctx.beginPath();
  ctx.moveTo(toX(-0.497), toY(beltV - 0.02));
  ctx.lineTo(toX(-0.45), toY(beltV - 0.02));
  ctx.lineTo(toX(-0.45), toY(beltV - 0.14));
  ctx.lineTo(toX(-0.497), toY(beltV - 0.17));
  ctx.closePath();
  ctx.fill();

  // Grille.
  ctx.fillStyle = 'rgba(16, 18, 20, 0.9)';
  roundRect(ctx, toX(0.455), toY(0.3), L * 0.04, H * 0.1, ppm * 0.02);
  ctx.fill();

  // Front bumper lip / rear bumper.
  ctx.fillStyle = art.bodyDark;
  roundRect(ctx, toX(-0.5), toY(0.16), L * 0.06, H * 0.1, ppm * 0.03);
  ctx.fill();
  roundRect(ctx, toX(0.44), toY(0.16), L * 0.06, H * 0.1, ppm * 0.03);
  ctx.fill();

  // Side mirror.
  ctx.fillStyle = art.bodyDark;
  ctx.beginPath();
  ctx.moveTo(toX(0.235), toY(beltV + 0.12));
  ctx.lineTo(toX(0.28), toY(beltV + 0.09));
  ctx.lineTo(toX(0.275), toY(beltV + 0.03));
  ctx.lineTo(toX(0.235), toY(beltV + 0.05));
  ctx.closePath();
  ctx.fill();

  // Plate (Persian text rendered by the canvas font system).
  ctx.fillStyle = '#ece9de';
  roundRect(ctx, toX(0.43), toY(0.2), L * 0.07, H * 0.075, ppm * 0.01);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30, 40, 30, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#1f2a24';
  ctx.font = `${Math.max(6, ppm * 0.16)}px Vazirmatn, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('چ‌ت', toX(0.465), toY(0.163));

  // Fender flares: dark arcs that seat the wheels into the body.
  ctx.strokeStyle = 'rgba(8, 10, 12, 0.55)';
  ctx.lineWidth = Math.max(2, ppm * 0.07);
  for (const w of wheelLocals) {
    ctx.beginPath();
    ctx.arc(w.xM * ppm, -w.yM * ppm, w.radiusM * ppm * 1.16, Math.PI * 1.02, Math.PI * 1.98);
    ctx.stroke();
  }

  // Running board / side step.
  ctx.fillStyle = 'rgba(20, 22, 24, 0.9)';
  const stepY = toY(0.05);
  ctx.fillRect(toX(-0.3), stepY, L * 0.6, Math.max(2, ppm * 0.055));

  // Roof rails on tall vehicles.
  if (art.kind === 'suv') {
    ctx.strokeStyle = 'rgba(16, 18, 20, 0.85)';
    ctx.lineWidth = Math.max(2, ppm * 0.045);
    ctx.beginPath();
    ctx.moveTo(toX(-0.16), toY(1.0) - ppm * 0.03);
    ctx.lineTo(toX(0.13), toY(1.0) - ppm * 0.03);
    ctx.stroke();
  }

  // Rocker shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(toX(-0.28), toY(0.07), L * 0.56, H * 0.02);

  ctx.restore();
  void wheelRadiusPx;
  void lightW;
}

/** Draws one wheel: tyre, rim, spokes, hub and a hint of the brake disc. */
export function drawWheel(ctx: CanvasRenderingContext2D, wheel: WheelArt): void {
  const { x, y, radiusPx: r } = wheel;
  ctx.save();
  ctx.translate(x, y);

  // Tyre.
  const tyre = ctx.createRadialGradient(0, 0, r * 0.55, 0, 0, r);
  tyre.addColorStop(0, '#20242a');
  tyre.addColorStop(0.72, '#14171b');
  tyre.addColorStop(1, '#0a0c0e');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = tyre;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();

  // Sidewall lettering hint.
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(200, 200, 195, 0.12)';
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.stroke();

  ctx.rotate(wheel.angleRad);

  // Brake disc (does not spin visually with the rim pattern).
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = '#4a4e52';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = '#6b7075';
  ctx.fill();

  // Rim.
  const rim = ctx.createLinearGradient(-r * 0.5, -r * 0.5, r * 0.5, r * 0.5);
  rim.addColorStop(0, '#d8dbdd');
  rim.addColorStop(0.45, '#9aa0a6');
  rim.addColorStop(1, '#5d6166');
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 22, 24, 0.8)';
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(28, 31, 34, 0.85)';
  ctx.lineWidth = Math.max(1.2, r * 0.08);
  const spokes = wheel.index === 1 ? 10 : 5;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16);
    ctx.lineTo(Math.cos(a) * r * 0.48, Math.sin(a) * r * 0.48);
    ctx.stroke();
  }

  // Hub.
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#2b2f33';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#b9bec2';
  ctx.fill();

  ctx.restore();
}

/** Contact shadow under the car on the road surface. */
export function drawCarShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  lengthPx: number,
  ppm: number,
): void {
  ctx.save();
  ctx.translate(x, groundY);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, lengthPx * 0.62);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, lengthPx * 0.62, ppm * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
