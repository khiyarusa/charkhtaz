import { PAINT_COLORS, type ResolvedCar } from '../vehicles/profiles';
import {
  bodyShiftM,
  type CarBlueprint,
  type Pt,
  type WheelBlueprint,
} from '../vehicles/art/types';
import { blueprintFor } from '../vehicles/art';

export interface WheelArt {
  /** Wheel centre in screen pixels. */
  x: number;
  y: number;
  radiusPx: number;
  angleRad: number;
  /** 0 = front, 1 = rear. */
  index: 0 | 1;
  slip: number;
  rimStyle?: 'mesh' | 'spoke' | 'rugged' | 'multi' | 'aero' | 'steel';
  /** Service brake applied: the caliper bites and the disc heats up. */
  braking?: boolean;
  blueprint?: WheelBlueprint;
}

export interface CarDrawOptions {
  /** 0..1 body damage. */
  damage?: number;
  /** Brake pedal position 0..1, lights the rear lamps. */
  brake?: number;
  /** Headlamps on (garage preview). */
  lights?: boolean;
}

function traceSmooth(
  ctx: CanvasRenderingContext2D,
  points: readonly Pt[],
  toX: (u: number) => number,
  toY: (v: number) => number,
): void {
  if (points.length < 2) return;
  const xy = points.map((q) => ({ x: toX(q.u), y: toY(q.v) }));
  ctx.beginPath();
  ctx.moveTo(xy[0]!.x, xy[0]!.y);
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[Math.max(0, i - 1)]!;
    const p1 = xy[i]!;
    const p2 = xy[i + 1]!;
    const p3 = xy[Math.min(xy.length - 1, i + 2)]!;
    // Keep genuine corners (bumper edges, lamp cuts) sharp.
    const a1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const a0 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    let turn = Math.abs(a1 - a0);
    if (turn > Math.PI) turn = Math.PI * 2 - turn;
    if (i > 0 && turn > 0.95) {
      ctx.lineTo(p2.x, p2.y);
      continue;
    }
    ctx.bezierCurveTo(
      p1.x + (p2.x - p0.x) / 6,
      p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6,
      p2.y - (p3.y - p1.y) / 6,
      p2.x,
      p2.y,
    );
  }
}

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

function polygon(
  ctx: CanvasRenderingContext2D,
  points: readonly Pt[],
  toX: (u: number) => number,
  toY: (v: number) => number,
): void {
  const first = points[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(toX(first.u), toY(first.v));
  for (let i = 1; i < points.length; i++) {
    const q = points[i]!;
    ctx.lineTo(toX(q.u), toY(q.v));
  }
  ctx.closePath();
}

/**
 * Draws the car in chassis-local pixels (origin = chassis centre).
 *
 * Wheel bodies are drawn by the caller before this, so the arches are cut out of
 * the shell with an even-odd fill and the real wheels show through. Every shape
 * comes from the car's own blueprint; there is no shared body template.
 */
export function drawCarBody(
  ctx: CanvasRenderingContext2D,
  car: ResolvedCar,
  ppm: number,
  wheelLocals: { xM: number; yM: number; radiusM: number }[],
  damage = 0,
  options: CarDrawOptions = {},
): void {
  const bp = blueprintFor(car.profile.id);
  const art = car.profile.art;
  const paint = car.cosmetics.paint !== 'stock' ? PAINT_COLORS[car.cosmetics.paint] : null;
  const bodyColor = paint?.body ?? art.bodyColor;
  const bodyDark = paint?.dark ?? art.bodyDark;
  const bodyLight = paint?.light ?? art.bodyLight;

  const length = car.numbers.lengthM;
  const shift = bodyShiftM(bp);
  const H = (car.numbers.heightM - 0.04) * ppm;
  const lowestWheelY = Math.min(...wheelLocals.map((w) => w.yM));
  const sillYUp = lowestWheelY - car.numbers.wheelRadiusM + 0.035;
  const toX = (u: number) => (u + shift) * ppm;
  const toY = (v: number) => -sillYUp * ppm - v * H;
  const line = Math.max(1, ppm * 0.028);
  const belt = glassBelt(bp);

  const traceBody = (): void => {
    traceSmooth(ctx, bp.outline, toX, toY);
    const last = bp.outline[bp.outline.length - 1]!;
    const first = bp.outline[0]!;
    ctx.lineTo(toX(last.u), toY(0.06));
    ctx.lineTo(toX(first.u), toY(0.06));
    ctx.closePath();
  };

  const withArches = (): void => {
    traceBody();
    for (const w of wheelLocals) {
      const r = w.radiusM * ppm * 1.16;
      ctx.moveTo(w.xM * ppm + r, -w.yM * ppm);
      ctx.arc(w.xM * ppm, -w.yM * ppm, r, 0, Math.PI * 2, false);
    }
  };

  // 1. Ground shadow under the shell.
  ctx.save();
  const under = ctx.createLinearGradient(0, toY(0.1), 0, toY(0));
  under.addColorStop(0, 'rgba(0,0,0,0.32)');
  under.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = under;
  ctx.beginPath();
  ctx.ellipse(toX(0), toY(0.04), (length * 0.46) * ppm, H * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Shell with arches punched out.
  ctx.save();
  withArches();
  const skin = ctx.createLinearGradient(0, toY(1), 0, toY(0));
  skin.addColorStop(0, bodyLight);
  skin.addColorStop(0.1, bodyLight);
  skin.addColorStop(0.26, bodyColor);
  skin.addColorStop(0.58, bodyColor);
  skin.addColorStop(0.84, bodyDark);
  skin.addColorStop(1, bodyDark);
  ctx.fillStyle = skin;
  ctx.fill('evenodd');
  ctx.restore();

  // 3. Everything that must stay inside the painted panels.
  ctx.save();
  withArches();
  ctx.clip('evenodd');

  // Sky reflection across the upper flank, ground bounce low down.
  const sky = ctx.createLinearGradient(0, toY(belt + 0.12), 0, toY(belt - 0.42));
  sky.addColorStop(0, 'rgba(255,255,255,0.16)');
  sky.addColorStop(0.4, 'rgba(255,255,255,0.04)');
  sky.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = sky;
  ctx.fillRect(toX(-length / 2), toY(1), length * ppm, H * 1.1);

  const ground = ctx.createLinearGradient(0, toY(0.3), 0, toY(0));
  ground.addColorStop(0, 'rgba(0,0,0,0)');
  ground.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = ground;
  ctx.fillRect(toX(-length / 2), toY(0.32), length * ppm, H * 0.32);

  // Horizon reflection: a soft dark band through the middle of the flank,
  // which is what makes a flat colour read as a curved painted panel.
  const horizon = ctx.createLinearGradient(0, toY(0.62), 0, toY(0.36));
  horizon.addColorStop(0, 'rgba(255,255,255,0)');
  horizon.addColorStop(0.45, 'rgba(255,255,255,0.05)');
  horizon.addColorStop(0.62, 'rgba(0,0,0,0.1)');
  horizon.addColorStop(1, 'rgba(0,0,0,0.02)');
  ctx.fillStyle = horizon;
  ctx.fillRect(toX(-length / 2), toY(0.64), length * ppm, H * 0.3);

  // Clear-coat: a bright catch along the shoulder following the profile.
  ctx.beginPath();
  let started = false;
  for (const q of bp.outline) {
    if (q.v < belt - 0.02 || q.v > belt + 0.34) continue;
    const x = toX(q.u);
    const y = toY(q.v) + H * 0.03;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else ctx.lineTo(x, y);
  }
  if (started) {
    ctx.strokeStyle = 'rgba(255,255,255,0.26)';
    ctx.lineWidth = Math.max(1, ppm * 0.022);
    ctx.stroke();
  }

  // Character lines: dark undercut plus a light catch on the upper edge.
  for (const cl of bp.characterLines) {
    traceSmooth(ctx, cl.points, toX, toY);
    ctx.strokeStyle = `rgba(0,0,0,${0.22 * cl.strength})`;
    ctx.lineWidth = Math.max(1, ppm * 0.02);
    ctx.stroke();
    ctx.save();
    ctx.translate(0, -Math.max(1, ppm * 0.014));
    traceSmooth(ctx, cl.points, toX, toY);
    ctx.strokeStyle = `rgba(255,255,255,${0.16 * cl.strength})`;
    ctx.lineWidth = Math.max(1, ppm * 0.012);
    ctx.stroke();
    ctx.restore();
  }

  // Door cuts: shadow line with a light lip on the leading edge.
  for (const seam of bp.doors.seams) {
    const top = toY(seam.top);
    const bottom = toY(seam.bottom);
    const x = toX(seam.u);
    const lean = seam.slope * H;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.quadraticCurveTo(x + lean * 0.4, (top + bottom) / 2, x + lean, bottom);
    ctx.strokeStyle = 'rgba(0,0,0,0.42)';
    ctx.lineWidth = Math.max(1, ppm * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - Math.max(1, ppm * 0.016), top);
    ctx.quadraticCurveTo(x + lean * 0.4 - ppm * 0.016, (top + bottom) / 2, x + lean - ppm * 0.016, bottom);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = Math.max(1, ppm * 0.01);
    ctx.stroke();
  }

  // Rocker seam and lower bumper separation.
  ctx.beginPath();
  ctx.moveTo(toX(-length / 2 + 0.05), toY(0.2));
  ctx.lineTo(toX(length / 2 - 0.05), toY(0.2));
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = Math.max(1, ppm * 0.014);
  ctx.stroke();

  if (bp.trim.fuelFlap) {
    const f = bp.trim.fuelFlap;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    roundRect(ctx, toX(f.u) - ppm * 0.09, toY(f.v), ppm * 0.18, H * 0.08, ppm * 0.02);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = Math.max(1, ppm * 0.01);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Glasshouse.
  drawGlass(ctx, bp, toX, toY, H, bodyColor, bodyDark, art.glassColor, Boolean(bp.trim.chrome));

  // Boot / tailgate step: a horizontal crease separating the deck from the rear
  // panel. Without it the tail reads as a bubble.
  const tail = bp.outline[0]!;
  const rearGlass = bp.glass[0]!;
  ctx.beginPath();
  ctx.moveTo(toX(tail.u + 0.02), toY(tail.v + 0.11));
  ctx.lineTo(toX(rearGlass.u + 0.05), toY(rearGlass.v + 0.012));
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = Math.max(1, ppm * 0.016);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX(tail.u + 0.02), toY(tail.v + 0.118));
  ctx.lineTo(toX(rearGlass.u + 0.05), toY(rearGlass.v + 0.02));
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = Math.max(1, ppm * 0.008);
  ctx.stroke();

  // Roof highlight: a bright band along the top edge separates the roof from
  // the background and gives the body a readable crown.
  ctx.beginPath();
  let roofStarted = false;
  for (const q of bp.outline) {
    if (q.v < 0.9) continue;
    const x = toX(q.u);
    const y = toY(q.v) + H * 0.012;
    if (!roofStarted) {
      ctx.moveTo(x, y);
      roofStarted = true;
    } else ctx.lineTo(x, y);
  }
  if (roofStarted) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = Math.max(1, ppm * 0.026);
    ctx.stroke();
  }

  // 5. Door handles.
  for (const h of bp.doors.handles) {
    ctx.fillStyle = bp.trim.chrome ? '#d9dde0' : bodyDark;
    roundRect(ctx, toX(h.u) - ppm * 0.14, toY(h.v), ppm * 0.28, H * 0.032, H * 0.016);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(toX(h.u) - ppm * 0.12, toY(h.v) + 0.5, ppm * 0.2, Math.max(1, H * 0.007));
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(1, ppm * 0.008);
    ctx.stroke();
  }

  // 6. Lamps, grille, bumpers, plate — clipped to the painted shell so no
  // detail can float outside the body outline.
  ctx.save();
  withArches();
  ctx.clip('evenodd');
  drawBumpers(ctx, bp, toX, toY, H, ppm, bodyDark);
  drawLamp(ctx, bp.head, toX, toY, optionLights(options), 0, ppm, 'head', H);
  drawLamp(ctx, bp.tail, toX, toY, false, options.brake ?? 0, ppm, 'tail', H);
  drawGrille(ctx, bp.grille, toX, toY, ppm, Boolean(bp.trim.chrome));
  drawPlate(ctx, car, bp, toX, toY, ppm, H);
  ctx.restore();

  drawMirror(ctx, bp, toX, toY, H, ppm, bodyDark);
  drawTrim(ctx, bp, toX, toY, H, ppm, bodyDark);

  // 7. Arch liner, flare and contact shading.
  ctx.save();
  for (const w of wheelLocals) {
    const cx = w.xM * ppm;
    const cy = -w.yM * ppm;
    const r = w.radiusM * ppm;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.175, Math.PI * 1.02, Math.PI * 1.98);
    ctx.strokeStyle = 'rgba(6,8,9,0.9)';
    ctx.lineWidth = Math.max(1.5, ppm * 0.04);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.24, Math.PI * 1.04, Math.PI * 1.96);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = Math.max(1, ppm * 0.02);
    ctx.stroke();
    if (bp.trim.archTrim) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (1.2 + bp.trim.archTrim * 0.2), Math.PI * 1.03, Math.PI * 1.97);
      ctx.strokeStyle = 'rgba(26,28,29,0.95)';
      ctx.lineWidth = Math.max(2, ppm * bp.trim.archTrim * 0.5);
      ctx.stroke();
    }
    const shade = ctx.createLinearGradient(0, cy - r, 0, cy - r * 0.55);
    shade.addColorStop(0, 'rgba(0,0,0,0.34)');
    shade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.02, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  }
  ctx.restore();

  // 8. Damage.
  drawDamage(ctx, damage, bp, toX, toY, H, ppm, belt, bodyDark, bodyColor);
}

function optionLights(options: CarDrawOptions): boolean {
  return Boolean(options.lights);
}

function glassBelt(bp: CarBlueprint): number {
  const pts = bp.glass;
  return Math.min(...pts.map((q) => q.v));
}

function drawGlass(
  ctx: CanvasRenderingContext2D,
  bp: CarBlueprint,
  toX: (u: number) => number,
  toY: (v: number) => number,
  H: number,
  bodyColor: string,
  bodyDark: string,
  glassColor: string,
  chrome: boolean,
): void {
  const panels = [bp.glass, ...(bp.quarterGlass ? [bp.quarterGlass] : [])];
  for (const panel of panels) {
    polygon(ctx, panel, toX, toY);
    const top = Math.min(...panel.map((q) => q.v));
    const bottom = Math.max(...panel.map((q) => q.v));
    const grad = ctx.createLinearGradient(0, toY(top), 0, toY(bottom));
    grad.addColorStop(0, '#a8bccb');
    grad.addColorStop(0.3, glassColor);
    grad.addColorStop(0.78, '#243039');
    grad.addColorStop(1, '#141c22');
    ctx.fillStyle = grad;
    ctx.fill();

    // Reflections clipped to the glass.
    ctx.save();
    polygon(ctx, panel, toX, toY);
    ctx.clip();
    ctx.beginPath();
    const a = panel[0]!;
    const b = panel[panel.length - 1]!;
    ctx.moveTo(toX(a.u), toY(bottom));
    ctx.lineTo(toX(a.u + (b.u - a.u) * 0.42), toY(top));
    ctx.lineTo(toX(a.u + (b.u - a.u) * 0.58), toY(top));
    ctx.lineTo(toX(a.u + (b.u - a.u) * 0.18), toY(bottom));
    ctx.closePath();
    ctx.fillStyle = 'rgba(226,240,250,0.16)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(toX(a.u + (b.u - a.u) * 0.66), toY(bottom));
    ctx.lineTo(toX(a.u + (b.u - a.u) * 0.86), toY(top));
    ctx.lineTo(toX(a.u + (b.u - a.u) * 0.93), toY(top));
    ctx.lineTo(toX(a.u + (b.u - a.u) * 0.78), toY(bottom));
    ctx.closePath();
    ctx.fillStyle = 'rgba(226,240,250,0.1)';
    ctx.fill();
    // Darker frit along the top edge.
    const frit = ctx.createLinearGradient(0, toY(top), 0, toY(top + 0.06));
    frit.addColorStop(0, 'rgba(6,8,10,0.7)');
    frit.addColorStop(1, 'rgba(6,8,10,0)');
    ctx.fillStyle = frit;
    ctx.fillRect(toX(a.u), toY(top), Math.abs(toX(b.u) - toX(a.u)), H * 0.07);
    ctx.restore();

    polygon(ctx, panel, toX, toY);
    ctx.strokeStyle = chrome ? 'rgba(222,226,230,0.7)' : 'rgba(12,14,16,0.85)';
    ctx.lineWidth = Math.max(1, H * 0.012);
    ctx.stroke();
  }

  // B-pillar where a four-door body separates the windows.
  const bSeam = bp.doors.seams.find((s) => s.top > glassBelt(bp) && s.u < 0);
  if (bSeam) {
    const x = toX(bSeam.u);
    const top = Math.min(...bp.glass.map((q) => q.v));
    const bottom = glassBelt(bp) + 0.02;
    ctx.fillStyle = 'rgba(12,14,16,0.92)';
    ctx.fillRect(x - H * 0.04, toY(top + 0.01), H * 0.08, (top - bottom) * H + H * 0.01);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x - H * 0.04, toY(top + 0.01), Math.max(1, H * 0.008), (top - bottom) * H);
  }

  // A/C pillar shading: the body colour already frames the glass, so only a
  // thin shadow is needed to seat the glass into the aperture.
  for (const panel of panels) {
    polygon(ctx, panel, toX, toY);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(1, H * 0.006);
    ctx.stroke();
  }
  void bodyColor;
}

function drawLamp(
  ctx: CanvasRenderingContext2D,
  lamp: { lens: Pt[]; projector?: Pt; signature?: Pt[]; indicator?: Pt[] },
  toX: (u: number) => number,
  toY: (v: number) => number,
  lit: boolean,
  brake: number,
  ppm: number,
  kind: 'head' | 'tail',
  H = 0,
): void {
  if (lamp.lens.length < 3) return;
  // The authored polygons are exact, but at gameplay scale a lamp needs a
  // little more vertical presence to read as a lamp cluster rather than a
  // sticker. Scale around the centroid, consistently for every car.
  const cu = lamp.lens.reduce((a, q) => a + q.u, 0) / lamp.lens.length;
  const cv = lamp.lens.reduce((a, q) => a + q.v, 0) / lamp.lens.length;
  const lens = lamp.lens.map((q) => ({ u: cu + (q.u - cu) * 1.06, v: cv + (q.v - cv) * 1.22 }));
  const vs = lens.map((q) => q.v);
  const top = Math.min(...vs);
  const bottom = Math.max(...vs);
  const isTail = kind === 'tail';
  const glow = Math.min(1, Math.max(0, brake));

  // Housing: a dark surround that seats the lens into the bumper.
  polygon(ctx, lens.map((q) => ({ u: cu + (q.u - cu) * 1.09, v: cv + (q.v - cv) * 1.14 })), toX, toY);
  ctx.fillStyle = 'rgba(12,14,16,0.9)';
  ctx.fill();

  polygon(ctx, lens, toX, toY);
  const grad = ctx.createLinearGradient(0, toY(top), 0, toY(bottom));
  if (isTail && glow > 0.05) {
    grad.addColorStop(0, '#ff7a5e');
    grad.addColorStop(1, '#c02a1b');
  } else if (isTail) {
    grad.addColorStop(0, '#8e2a21');
    grad.addColorStop(0.55, '#6c1d16');
    grad.addColorStop(1, '#3d100c');
  } else if (lit) {
    grad.addColorStop(0, '#fffbe8');
    grad.addColorStop(0.5, '#ffe9ac');
    grad.addColorStop(1, '#c9b27a');
  } else {
    grad.addColorStop(0, '#e8e6d8');
    grad.addColorStop(0.55, '#b9b7a6');
    grad.addColorStop(1, '#6f7066');
  }
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,12,14,0.8)';
  ctx.lineWidth = Math.max(1, ppm * 0.02);
  ctx.stroke();

  if (lamp.projector) {
    ctx.beginPath();
    ctx.arc(toX(lamp.projector.u), toY(lamp.projector.v), Math.max(1.5, ppm * 0.06), 0, Math.PI * 2);
    ctx.fillStyle = lit ? 'rgba(255,252,226,0.95)' : 'rgba(238,236,220,0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,42,44,0.5)';
    ctx.lineWidth = Math.max(1, ppm * 0.012);
    ctx.stroke();
  }
  if (lamp.signature && lamp.signature.length > 1) {
    ctx.beginPath();
    lamp.signature.forEach((q, i) => {
      const x = toX(q.u);
      const y = toY(q.v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = isTail
      ? `rgba(255,190,150,${0.5 + glow * 0.45})`
      : lit
        ? 'rgba(255,252,230,0.95)'
        : 'rgba(250,248,232,0.65)';
    ctx.lineWidth = Math.max(1, ppm * 0.018);
    ctx.stroke();
  }
  if (lamp.indicator) {
    polygon(ctx, lamp.indicator, toX, toY);
    ctx.fillStyle = 'rgba(230,150,60,0.85)';
    ctx.fill();
  }
  if (lit) {
    const cx = toX(lens[lens.length - 1]!.u);
    const cy = toY((top + bottom) / 2);
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, ppm * 0.3);
    halo.addColorStop(0, 'rgba(255,240,190,0.35)');
    halo.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, ppm * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Reversing / indicator segment on the tail lamp.
  if (isTail) {
    const q = lens[0]!;
    ctx.fillStyle = 'rgba(236,236,228,0.55)';
    ctx.fillRect(toX(q.u) + ppm * 0.02, toY(bottom + 0.02), ppm * 0.06, Math.max(1, H * 0.035));
  }
}

function drawGrille(
  ctx: CanvasRenderingContext2D,
  grille: Pt[],
  toX: (u: number) => number,
  toY: (v: number) => number,
  ppm: number,
  chrome: boolean,
): void {
  if (grille.length < 3) return;
  const cu = grille.reduce((a, q) => a + q.u, 0) / grille.length;
  const cv = grille.reduce((a, q) => a + q.v, 0) / grille.length;
  const shape = grille.map((q) => ({ u: cu + (q.u - cu) * 1.12, v: cv + (q.v - cv) * 1.15 }));
  polygon(ctx, shape, toX, toY);
  ctx.fillStyle = '#141719';
  ctx.fill();
  ctx.save();
  polygon(ctx, shape, toX, toY);
  ctx.clip();
  const vs = shape.map((q) => q.v);
  const top = Math.min(...vs);
  const bottom = Math.max(...vs);
  const us = shape.map((q) => q.u);
  const left = Math.min(...us);
  const right = Math.max(...us);
  ctx.strokeStyle = chrome ? 'rgba(214,218,222,0.35)' : 'rgba(190,194,198,0.18)';
  ctx.lineWidth = Math.max(1, ppm * 0.014);
  for (let i = 1; i < 4; i++) {
    const v = top + ((bottom - top) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(toX(left), toY(v));
    ctx.lineTo(toX(right), toY(v));
    ctx.stroke();
  }
  ctx.restore();
  polygon(ctx, shape, toX, toY);
  ctx.strokeStyle = chrome ? 'rgba(222,226,230,0.65)' : 'rgba(10,12,14,0.7)';
  ctx.lineWidth = Math.max(1, ppm * 0.016);
  ctx.stroke();
}

function drawBumpers(
  ctx: CanvasRenderingContext2D,
  bp: CarBlueprint,
  toX: (u: number) => number,
  toY: (v: number) => number,
  H: number,
  ppm: number,
  bodyDark: string,
): void {
  const extent = Math.max(...bp.outline.map((q) => q.u));
  const band = ctx.createLinearGradient(0, toY(0.24), 0, toY(0.06));
  band.addColorStop(0, bp.trim.cladding ? 'rgba(40,42,43,0.95)' : bodyDark);
  band.addColorStop(1, 'rgba(14,16,18,0.92)');
  ctx.save();
  ctx.fillStyle = band;
  ctx.fillRect(toX(-extent), toY(0.23), extent * 2 * ppm, H * 0.17);
  // Bumper-to-body seam and a light catch along its top edge.
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = Math.max(1, ppm * 0.012);
  ctx.beginPath();
  ctx.moveTo(toX(-extent), toY(0.23));
  ctx.lineTo(toX(extent), toY(0.23));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX(-extent), toY(0.225));
  ctx.lineTo(toX(extent), toY(0.225));
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = Math.max(1, ppm * 0.008);
  ctx.stroke();
  // Corner seams.
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = Math.max(1, ppm * 0.012);
  for (const u of [extent - 0.34, -extent + 0.3]) {
    ctx.beginPath();
    ctx.moveTo(toX(u), toY(0.23));
    ctx.lineTo(toX(u), toY(0.06));
    ctx.stroke();
  }
  ctx.restore();
}

function drawMirror(
  ctx: CanvasRenderingContext2D,
  bp: CarBlueprint,
  toX: (u: number) => number,
  toY: (v: number) => number,
  H: number,
  ppm: number,
  bodyDark: string,
): void {
  const a = bp.glass[bp.glass.length - 1]!;
  const u = a.u + 0.04;
  const v = a.v + 0.03;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(toX(u), toY(v));
  ctx.lineTo(toX(u + 0.16), toY(v + 0.01));
  ctx.lineTo(toX(u + 0.14), toY(v - 0.07));
  ctx.lineTo(toX(u + 0.01), toY(v - 0.05));
  ctx.closePath();
  ctx.fillStyle = bodyDark;
  ctx.fill();
  ctx.strokeStyle = 'rgba(8,10,12,0.6)';
  ctx.lineWidth = Math.max(1, ppm * 0.012);
  ctx.stroke();
  ctx.fillStyle = 'rgba(190,208,220,0.55)';
  ctx.fillRect(toX(u + 0.11), toY(v - 0.005), ppm * 0.03, H * 0.035);
  ctx.restore();
}

function drawPlate(
  ctx: CanvasRenderingContext2D,
  car: ResolvedCar,
  bp: CarBlueprint,
  toX: (u: number) => number,
  toY: (v: number) => number,
  ppm: number,
  H: number,
): void {
  const length = car.numbers.lengthM;
  const w = 0.52 * ppm;
  const h = H * 0.075;
  const x = toX(length / 2 - 0.62);
  const y = toY(0.13);
  let hash = 2166136261;
  for (let i = 0; i < car.profile.id.length; i++) {
    hash ^= car.profile.id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const digits = ((hash >>> 0) % 9000) + 1000;
  ctx.save();
  ctx.fillStyle = '#eceadd';
  roundRect(ctx, x, y, w, h, Math.max(1, ppm * 0.012));
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,36,32,0.55)';
  ctx.lineWidth = Math.max(1, ppm * 0.008);
  ctx.stroke();
  ctx.fillStyle = '#1c4f8f';
  ctx.fillRect(x + w * 0.03, y + h * 0.12, w * 0.14, h * 0.76);
  ctx.fillStyle = '#1f2a24';
  ctx.font = `${Math.max(4, ppm * 0.1)}px Vazirmatn, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(digits), x + w * 0.58, y + h * 0.5);
  ctx.restore();
  void bp;
}

function drawTrim(
  ctx: CanvasRenderingContext2D,
  bp: CarBlueprint,
  toX: (u: number) => number,
  toY: (v: number) => number,
  H: number,
  ppm: number,
  bodyDark: string,
): void {
  const t = bp.trim;
  if (t.cladding) {
    ctx.save();
    ctx.fillStyle = 'rgba(30,32,33,0.85)';
    ctx.fillRect(toX(-callExtent(bp) + 0.12), toY(0.19), (callExtent(bp) * 2 - 0.24) * ppm, H * 0.13);
    ctx.restore();
  }
  if (t.sideStep) {
    ctx.fillStyle = 'rgba(20,22,23,0.92)';
    ctx.fillRect(toX(t.sideStep.u0), toY(0.12), (t.sideStep.u1 - t.sideStep.u0) * ppm, Math.max(2, ppm * 0.045));
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(toX(t.sideStep.u0), toY(0.12), (t.sideStep.u1 - t.sideStep.u0) * ppm, Math.max(1, ppm * 0.012));
  }
  if (t.roofRails) {
    const top = Math.min(...bp.outline.map((q) => q.v));
    ctx.strokeStyle = 'rgba(16,18,20,0.9)';
    ctx.lineWidth = Math.max(1.5, ppm * 0.035);
    ctx.beginPath();
    ctx.moveTo(toX(t.roofRails.u0), toY(top) - ppm * t.roofRails.height);
    ctx.lineTo(toX(t.roofRails.u1), toY(top) - ppm * t.roofRails.height);
    ctx.stroke();
    ctx.lineWidth = Math.max(1, ppm * 0.02);
    for (const u of [t.roofRails.u0 + 0.25, t.roofRails.u1 - 0.25]) {
      ctx.beginPath();
      ctx.moveTo(toX(u), toY(top) - ppm * t.roofRails.height);
      ctx.lineTo(toX(u), toY(top));
      ctx.stroke();
    }
  }
  if (t.spoiler) {
    const tail = bp.outline[0]!;
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.moveTo(toX(tail.u), toY(tail.v + 0.06));
    ctx.lineTo(toX(tail.u + 0.14), toY(tail.v + 0.09));
    ctx.lineTo(toX(tail.u + 0.1), toY(tail.v + 0.04));
    ctx.lineTo(toX(tail.u), toY(tail.v + 0.02));
    ctx.closePath();
    ctx.fill();
  }
  if (t.antenna) {
    const top = Math.min(...bp.outline.map((q) => q.v));
    ctx.strokeStyle = 'rgba(18,20,22,0.9)';
    ctx.lineWidth = Math.max(1, ppm * 0.02);
    if (t.antenna.fin) {
      ctx.beginPath();
      ctx.moveTo(toX(t.antenna.u), toY(top));
      ctx.lineTo(toX(t.antenna.u - 0.14), toY(top) - ppm * 0.05);
      ctx.lineTo(toX(t.antenna.u - 0.12), toY(top));
      ctx.closePath();
      ctx.fillStyle = 'rgba(22,24,26,0.92)';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(toX(t.antenna.u), toY(top));
      ctx.lineTo(toX(t.antenna.u - 0.1), toY(top) - ppm * 0.22);
      ctx.stroke();
    }
  }
}

function callExtent(bp: CarBlueprint): number {
  return Math.max(...bp.outline.map((q) => Math.abs(q.u)));
}

function drawDamage(
  ctx: CanvasRenderingContext2D,
  rawDamage: number,
  bp: CarBlueprint,
  toX: (u: number) => number,
  toY: (v: number) => number,
  H: number,
  ppm: number,
  belt: number,
  bodyDark: string,
  bodyColor: string,
): void {
  const damage = Math.min(1, Math.max(0, rawDamage));
  if (damage <= 0.04) return;
  const extent = callExtent(bp);
  ctx.save();
  const scratches = Math.round(2 + damage * 7);
  for (let i = 0; i < scratches; i++) {
    const r = (i * 0.618) % 1;
    const u = -extent + 0.3 + r * (extent * 2 - 0.6);
    const v = 0.14 + ((i * 0.37) % 0.28);
    ctx.beginPath();
    ctx.moveTo(toX(u), toY(v));
    ctx.lineTo(toX(u + 0.12), toY(v + 0.05 + r * 0.03));
    ctx.lineTo(toX(u + 0.03), toY(v + 0.1));
    ctx.strokeStyle = `rgba(230,226,212,${0.18 + damage * 0.42})`;
    ctx.lineWidth = Math.max(1, ppm * 0.012);
    ctx.stroke();
  }
  if (damage > 0.18) {
    const dents = Math.round(1 + damage * 3);
    for (let i = 0; i < dents; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const u = side * (extent - 0.16 - ((i * 0.11) % 0.1));
      const v = 0.2 + ((i * 0.17) % 0.2);
      const rx = ppm * (0.1 + damage * 0.08);
      const ry = H * (0.02 + damage * 0.014);
      ctx.beginPath();
      ctx.ellipse(toX(u), toY(v), rx, ry, side * 0.3, 0, Math.PI * 2);
      const hollow = ctx.createRadialGradient(toX(u - 0.03), toY(v + 0.02), 1, toX(u), toY(v), rx);
      hollow.addColorStop(0, `rgba(18,20,22,${0.3 + damage * 0.3})`);
      hollow.addColorStop(0.72, `rgba(18,20,22,${0.16 + damage * 0.18})`);
      hollow.addColorStop(1, 'rgba(255,255,255,0.12)');
      ctx.fillStyle = hollow;
      ctx.fill();
    }
  }
  if (damage > 0.34) {
    const g = bp.glass;
    const c = g[Math.floor(g.length / 2)]!;
    ctx.strokeStyle = `rgba(14,20,24,${0.4 + damage * 0.4})`;
    ctx.lineWidth = Math.max(1, ppm * 0.014);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.moveTo(toX(c.u), toY(c.v));
      ctx.lineTo(toX(c.u + Math.cos(a) * 0.22), toY(c.v + Math.sin(a) * 0.1));
      ctx.stroke();
    }
  }
  if (damage > 0.55) {
    const head = bp.head.lens;
    const hu = head[0]!.u;
    ctx.fillStyle = 'rgba(10,12,14,0.55)';
    ctx.beginPath();
    ctx.ellipse(toX(hu + 0.1), toY(0.45), ppm * 0.1, H * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    const tail = bp.outline[0]!;
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.moveTo(toX(tail.u), toY(0.16));
    ctx.lineTo(toX(tail.u + 0.16), toY(0.18));
    ctx.lineTo(toX(tail.u + 0.18), toY(0.1));
    ctx.lineTo(toX(tail.u), toY(0.12));
    ctx.closePath();
    ctx.fill();
  }
  if (damage > 0.75) {
    ctx.strokeStyle = 'rgba(0,0,0,0.32)';
    ctx.lineWidth = Math.max(1, ppm * 0.022);
    for (let i = 0; i < 3; i++) {
      const u = -0.3 + i * 0.55;
      ctx.beginPath();
      ctx.moveTo(toX(u), toY(0.24));
      ctx.quadraticCurveTo(toX(u + 0.06), toY(0.35), toX(u), toY(0.46));
      ctx.stroke();
    }
  }
  ctx.restore();
  void belt;
  void bodyColor;
}

/* ------------------------------------------------------------------ wheel -- */

export function drawWheel(ctx: CanvasRenderingContext2D, wheel: WheelArt): void {
  const { x, y, radiusPx: r } = wheel;
  const spec = wheel.blueprint;
  const rimRatio = spec?.rimRatio ?? 0.6;
  const sidewall = spec?.sidewall ?? 0.6;
  ctx.save();
  ctx.translate(x, y);

  // Tyre carcass with a visible sidewall band.
  const tyre = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.2, 0, 0, r);
  tyre.addColorStop(0, '#2c3137');
  tyre.addColorStop(0.66, '#191d21');
  tyre.addColorStop(1, '#07090b');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = tyre;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();

  // Tread blocks rotate with the wheel.
  ctx.save();
  ctx.rotate(wheel.angleRad);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.995, 0, Math.PI * 2);
  ctx.arc(0, 0, r * (1 - 0.1 * sidewall), 0, Math.PI * 2, true);
  ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  const blocks = 22;
  for (let i = 0; i < blocks; i++) {
    const a = (i / blocks) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * (1 - 0.14 * sidewall), Math.sin(a) * r * (1 - 0.14 * sidewall));
    ctx.lineTo(Math.cos(a + 0.09) * r, Math.sin(a + 0.09) * r);
    ctx.stroke();
  }
  ctx.restore();

  // Sidewall ring + lettering.
  ctx.beginPath();
  ctx.arc(0, 0, r * (1 - 0.1 * sidewall), 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(190,192,188,0.18)';
  ctx.lineWidth = Math.max(1, r * 0.02);
  ctx.stroke();
  if (spec?.lettering) {
    ctx.save();
    ctx.rotate(-0.7);
    ctx.fillStyle = 'rgba(210,212,208,0.35)';
    ctx.font = `${Math.max(3, r * 0.11)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('CHARKHTAZ', 0, -r * 0.72);
    ctx.restore();
  }

  // Brake disc and caliper (do not spin with the rim).
  ctx.beginPath();
  ctx.arc(0, 0, r * rimRatio * 0.82, 0, Math.PI * 2);
  const disc = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r * rimRatio * 0.82);
  disc.addColorStop(0, '#6e7378');
  disc.addColorStop(1, '#3d4145');
  ctx.fillStyle = disc;
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,22,24,0.7)';
  ctx.lineWidth = Math.max(1, r * 0.015);
  ctx.stroke();
  if (wheel.slip > 0.25) {
    ctx.beginPath();
    ctx.arc(0, 0, r * rimRatio * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,120,60,${Math.min(0.45, wheel.slip * 0.3)})`;
    ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.stroke();
  }
  ctx.save();
  ctx.rotate(-0.55);
  ctx.fillStyle = wheel.braking ? '#c03a2a' : (spec?.caliper ?? '#2c3034');
  roundRect(ctx, r * (rimRatio * 0.52), -r * 0.1, r * 0.18, r * 0.2, r * 0.05);
  ctx.fill();
  ctx.restore();

  // Rim face.
  ctx.save();
  ctx.rotate(wheel.angleRad);
  const rim = ctx.createLinearGradient(-r * 0.5, -r * 0.5, r * 0.5, r * 0.5);
  rim.addColorStop(0, '#e4e7e9');
  rim.addColorStop(0.42, '#a9afb4');
  rim.addColorStop(1, '#54585c');
  ctx.beginPath();
  ctx.arc(0, 0, r * rimRatio, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,20,22,0.85)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();

  const style = spec?.style ?? wheel.rimStyle ?? 'multi';
  const spokes = spec?.spokes ?? (style === 'mesh' ? 12 : style === 'rugged' ? 6 : 5);
  ctx.strokeStyle = 'rgba(36,40,44,0.92)';
  ctx.lineWidth = Math.max(1, r * (style === 'rugged' ? 0.07 : 0.04));
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    ctx.beginPath();
    if (style === 'mesh') {
      ctx.moveTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16);
      ctx.lineTo(Math.cos(a) * r * (rimRatio - 0.06), Math.sin(a) * r * (rimRatio - 0.06));
      ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
      ctx.lineTo(Math.cos(a + 0.3) * r * 0.3, Math.sin(a + 0.3) * r * 0.3);
    } else if (style === 'multi') {
      const spread = 0.08;
      ctx.moveTo(Math.cos(a - spread) * r * 0.16, Math.sin(a - spread) * r * 0.16);
      ctx.lineTo(Math.cos(a - spread * 0.4) * r * (rimRatio - 0.05), Math.sin(a - spread * 0.4) * r * (rimRatio - 0.05));
      ctx.moveTo(Math.cos(a + spread) * r * 0.16, Math.sin(a + spread) * r * 0.16);
      ctx.lineTo(Math.cos(a + spread * 0.4) * r * (rimRatio - 0.05), Math.sin(a + spread * 0.4) * r * (rimRatio - 0.05));
    } else if (style === 'steel') {
      continue;
    } else {
      ctx.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15);
      ctx.lineTo(Math.cos(a) * r * (rimRatio - 0.05), Math.sin(a) * r * (rimRatio - 0.05));
    }
    ctx.stroke();
  }
  if (style === 'steel') {
    // Plastic wheel cover: a ring of slots.
    ctx.strokeStyle = 'rgba(40,44,48,0.75)';
    ctx.lineWidth = Math.max(1, r * 0.035);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34, r * 0.07, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (style === 'rugged') {
    ctx.beginPath();
    ctx.arc(0, 0, r * (rimRatio - 0.02), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(30,33,36,0.9)';
    ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.stroke();
  }

  // Hub.
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2e32';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.075, 0, Math.PI * 2);
  ctx.fillStyle = '#c9ced2';
  ctx.fill();
  ctx.restore();

  // Contact patch shading.
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = Math.max(2, r * 0.09);
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
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.25)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, lengthPx * 0.62, ppm * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const offset of wheelOffsetsPx) {
    const patch = ctx.createRadialGradient(offset, 0, 0, offset, 0, ppm * 0.34);
    patch.addColorStop(0, 'rgba(0,0,0,0.55)');
    patch.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = patch;
    ctx.beginPath();
    ctx.ellipse(offset, 0, ppm * 0.34, ppm * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
