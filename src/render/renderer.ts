import type { TrackDefinition, Vec2Like } from '../tracks/types';
import { BIOME_PALETTES, SURFACE_LOOK, type BiomePalette } from './palettes';
import { drawCarBody, drawCarShadow, drawWheel } from './vehicle-art';
import type { Vehicle } from '../physics/vehicle';
import { groundPointAt } from '../tracks/builder';
import { hash01 } from '../core/math';
import { faNum } from '../core/format';
import type { SurfaceId } from '../tracks/types';

export interface Camera {
  x: number;
  y: number;
  ppm: number;
  shakeX: number;
  shakeY: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: 'dust' | 'smoke' | 'spark' | 'mud';
}

export interface RenderState {
  vehicle: Vehicle;
  camera: Camera;
  particles: readonly Particle[];
  elapsedS: number;
  paused: boolean;
  showDebug: boolean;
}

const paletteCache = new Map<string, CanvasGradient>();

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    readonly track: TrackDefinition,
  ) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D not available');
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.25);
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(240, Math.round(rect.height));
    if (this.width === width && this.height === height && this.dpr === dpr) return;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paletteCache.clear();
  }

  get viewWidthM(): number {
    return this.width / 44;
  }

  private sx(x: number, cam: Camera): number {
    return this.width / 2 + (x - cam.x) * cam.ppm + cam.shakeX;
  }

  private sy(y: number, cam: Camera): number {
    return this.height * 0.56 - (y - cam.y) * cam.ppm + cam.shakeY;
  }

  draw(state: RenderState): void {
    const ctx = this.ctx;
    const cam = state.camera;
    const palette = BIOME_PALETTES[this.track.biome];

    ctx.save();
    this.drawSky(palette);
    this.drawBackground(palette, cam, state.elapsedS);
    this.drawTerrain(cam);
    this.drawGates(cam, state.elapsedS);
    this.drawDecorations(cam);
    this.drawObstacles(cam);
    this.drawVehicle(state);
    this.drawParticles(state, cam);
    this.drawVignette(palette);
    if (state.showDebug) this.drawDebug(state, cam);
    ctx.restore();
  }

  // ---------------------------------------------------------------- sky ----
  private drawSky(palette: BiomePalette): void {
    const key = `sky:${this.track.biome}:${this.width}x${this.height}`;
    let grad = paletteCache.get(key);
    if (!grad) {
      grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, palette.skyTop);
      grad.addColorStop(0.52, palette.skyMid);
      grad.addColorStop(1, palette.skyBottom);
      paletteCache.set(key, grad);
    }
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Sun with atmospheric glow.
    const sunX = this.width * 0.74;
    const sunY = this.height * 0.2;
    const glow = this.ctx.createRadialGradient(
      sunX,
      sunY,
      this.height * 0.02,
      sunX,
      sunY,
      this.height * 0.42,
    );
    glow.addColorStop(0, palette.sunGlow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, this.height * 0.045, 0, Math.PI * 2);
    this.ctx.fillStyle = palette.sun;
    this.ctx.fill();
  }

  // ----------------------------------------------------------- background ----
  private drawBackground(palette: BiomePalette, cam: Camera, time: number): void {
    const biome = this.track.biome;
    if (biome === 'urban') {
      this.drawSkyline(palette, cam, 0.1, 0.36, 0.24, 11, 0.55);
      this.drawSkyline(palette, cam, 0.24, 0.46, 0.2, 7, 0.85);
    } else if (biome === 'forest') {
      this.drawTreeline(palette, cam, 0.12, 0.55, 0.6, '#33443a', 1.6);
      this.drawTreeline(palette, cam, 0.32, 0.66, 0.38, '#26382f', 1.2);
    } else {
      const sharp = biome === 'mountain';
      this.drawRidge(palette.farRidge, cam, 0.1, 0.5, sharp ? 85 : 130, sharp ? 68 : 34, 3, 0.85);
      this.drawRidge(palette.midRidge, cam, 0.26, 0.62, sharp ? 70 : 115, sharp ? 52 : 26, 7, 1);
      if (biome === 'desert') {
        this.drawDunes(palette, cam);
      } else {
        this.drawRidge(palette.nearRidge, cam, 0.48, 0.74, 55, 38, 13, 1.25);
      }
    }

    // Ground haze band that ties the parallax layers to the road.
    const haze = this.ctx.createLinearGradient(0, this.height * 0.45, 0, this.height * 0.78);
    haze.addColorStop(0, 'rgba(0,0,0,0)');
    haze.addColorStop(1, palette.haze);
    this.ctx.fillStyle = haze;
    this.ctx.fillRect(0, 0, this.width, this.height);
    void time;
  }

  private ridgeValue(worldX: number, seed: number, wavelength: number): number {
    const t = worldX / wavelength;
    const i = Math.floor(t);
    const f = t - i;
    const a = hash01(i * 71 + seed * 13);
    const b = hash01((i + 1) * 71 + seed * 13);
    const c = hash01(i * 19 + seed * 7);
    const smooth = f * f * (3 - 2 * f);
    return (a + (b - a) * smooth) * 0.75 + c * 0.25;
  }

  private drawRidge(
    color: string,
    cam: Camera,
    parallax: number,
    baseRatio: number,
    wavelength: number,
    amplitude: number,
    seed: number,
    detail: number,
  ): void {
    const ctx = this.ctx;
    const baseY = this.height * baseRatio;
    const offset = cam.x * cam.ppm * parallax;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    const step = 26;
    for (let px = 0; px <= this.width + step; px += step) {
      const worldX = px + offset;
      const n =
        this.ridgeValue(worldX, seed, wavelength) * 0.68 +
        this.ridgeValue(worldX * 2.3, seed + 4, wavelength * 0.45) * 0.32 * detail;
      const y = baseY - n * amplitude;
      ctx.lineTo(px, y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  private drawDunes(palette: BiomePalette, cam: Camera): void {
    const ctx = this.ctx;
    const offset = cam.x * cam.ppm * 0.42;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let px = 0; px <= this.width + 20; px += 18) {
      const worldX = px + offset;
      const y =
        this.height * 0.7 -
        (Math.sin(worldX / 210) * 0.5 + 0.5) * 44 -
        Math.sin(worldX / 88 + 1.4) * 9;
      ctx.lineTo(px, y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(201, 160, 106, 0.55)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let px = 0; px <= this.width + 20; px += 16) {
      const worldX = px + offset * 1.5;
      const y =
        this.height * 0.78 -
        (Math.sin(worldX / 170 + 2.1) * 0.5 + 0.5) * 30 -
        Math.sin(worldX / 61) * 6;
      ctx.lineTo(px, y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fillStyle = palette.nearRidge;
    ctx.fill();
  }

  private drawTree(x: number, baseY: number, scale: number, color: string, variant: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    const h = 26 * scale;
    if (variant % 3 === 0) {
      // Conifer.
      ctx.beginPath();
      ctx.moveTo(x, baseY - h);
      ctx.lineTo(x + 7 * scale, baseY);
      ctx.lineTo(x - 7 * scale, baseY);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x - 1.2 * scale, baseY - h * 0.75, 2.4 * scale, h * 0.75);
      ctx.beginPath();
      ctx.arc(x, baseY - h * 0.78, 7 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 5 * scale, baseY - h * 0.62, 5.4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 5 * scale, baseY - h * 0.64, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawTreeline(
    palette: BiomePalette,
    cam: Camera,
    parallax: number,
    baseRatio: number,
    scale: number,
    color: string,
    spacingM: number,
  ): void {
    const offset = cam.x * cam.ppm * parallax;
    const baseY = this.height * baseRatio;
    const spacing = spacingM * 40 * scale;
    const start = Math.floor(offset / spacing) - 1;
    const count = Math.ceil(this.width / spacing) + 3;
    for (let i = 0; i < count; i++) {
      const index = start + i;
      const px = index * spacing - offset;
      const r = hash01(index * 131 + 17);
      this.drawTree(px, baseY, 0.7 + r * 0.9, color, Math.floor(r * 7));
    }
    void palette;
  }

  private drawSkyline(
    palette: BiomePalette,
    cam: Camera,
    parallax: number,
    baseRatio: number,
    heightRatio: number,
    seed: number,
    alpha = 1,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    const offset = cam.x * cam.ppm * parallax;
    const baseY = this.height * baseRatio;
    const unit = 54;
    const start = Math.floor(offset / unit) - 1;
    const count = Math.ceil(this.width / unit) + 3;
    for (let i = 0; i < count; i++) {
      const index = start + i;
      const r = hash01(index * 97 + seed * 31);
      const w = unit * (0.55 + r * 0.65);
      const h = this.height * heightRatio * (0.35 + hash01(index * 41 + seed) * 0.75);
      const x = index * unit - offset;
      ctx.fillStyle = palette.farRidge;
      ctx.fillRect(x, baseY - h, w, h);
      // Windows.
      ctx.fillStyle = 'rgba(255, 214, 140, 0.2)';
      for (let wy = baseY - h + 8; wy < baseY - 10; wy += 14) {
        for (let wx = x + 6; wx < x + w - 6; wx += 12) {
          if (hash01(Math.round(wx * 3 + wy * 7)) > 0.62) {
            ctx.fillRect(wx, wy, 3, 4);
          }
        }
      }
    }
    ctx.restore();
  }

  // -------------------------------------------------------------- terrain ----
  private drawTerrain(cam: Camera): void {
    const ctx = this.ctx;
    const leftM = cam.x - this.width / cam.ppm - 12;
    const rightM = cam.x + this.width / cam.ppm + 12;

    for (const run of this.track.runs) {
      const points = run.points.filter((p) => p.x >= leftM && p.x <= rightM);
      if (points.length < 2) {
        if (run.points.length >= 2) {
          const first = run.points[0]!;
          const last = run.points[run.points.length - 1]!;
          if (last.x < leftM || first.x > rightM) continue;
        } else continue;
      }
      const visible = run.points.filter((p) => p.x >= leftM - 4 && p.x <= rightM + 4);
      if (visible.length < 2) continue;
      const look = SURFACE_LOOK[run.surface];
      const bottom = this.height + 40;

      // Body of the ground with strata.
      ctx.beginPath();
      const first = visible[0]!;
      ctx.moveTo(this.sx(first.x, cam), this.sy(first.y, cam));
      for (const p of visible) ctx.lineTo(this.sx(p.x, cam), this.sy(p.y, cam));
      const last = visible[visible.length - 1]!;
      ctx.lineTo(this.sx(last.x, cam), bottom);
      ctx.lineTo(this.sx(first.x, cam), bottom);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, this.sy(first.y, cam), 0, bottom);
      grad.addColorStop(0, look.fill);
      grad.addColorStop(0.55, look.deep);
      grad.addColorStop(1, '#141414');
      ctx.fillStyle = grad;
      ctx.fill();

      // Surface band.
      ctx.beginPath();
      ctx.moveTo(this.sx(first.x, cam), this.sy(first.y, cam));
      for (const p of visible) ctx.lineTo(this.sx(p.x, cam), this.sy(p.y, cam));
      ctx.strokeStyle = look.top;
      ctx.lineWidth = Math.max(3, cam.ppm * 0.09);
      ctx.lineJoin = 'round';
      ctx.stroke();

      this.drawSurfaceDetail(run.surface, visible, cam);

      // Surface grain: deterministic dashes, limited to the visible span.
      ctx.strokeStyle = look.grain;
      ctx.globalAlpha = look.loose ? 0.5 : 0.25;
      ctx.lineWidth = 1;
      const from = Math.max(0, Math.floor((first.x - 2) / 2));
      const to = Math.ceil((last.x + 2) / 2);
      for (let i = from; i < to; i++) {
        const r = hash01(i * 53 + run.surface.length * 7);
        if (r > 0.55) continue;
        const xM = i * 2 + r * 2;
        const hit = groundPointAt([run], xM);
        if (!hit) continue;
        const px = this.sx(xM, cam);
        const py = this.sy(hit.y, cam) + 2 + r * 7;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 2 + r * 5, py + (r - 0.5) * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Highlight edge below the surface.
      ctx.beginPath();
      for (let i = 0; i < visible.length; i++) {
        const p = visible[i]!;
        const px = this.sx(p.x, cam);
        const py = this.sy(p.y, cam) + cam.ppm * 0.22;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = Math.max(2, cam.ppm * 0.1);
      ctx.stroke();
    }
  }

  /** Lane paint, ripples, puddles and loose stones that make the surface read. */
  private drawSurfaceDetail(
    surface: SurfaceId,
    visible: { x: number; y: number }[],
    cam: Camera,
  ): void {
    const ctx = this.ctx;
    const asphalt = surface.startsWith('asphalt');

    // Shoulder shadow a little below the crown.
    ctx.save();
    ctx.beginPath();
    visible.forEach((p, i) => {
      const x = this.sx(p.x, cam);
      const y = this.sy(p.y, cam) + cam.ppm * 0.75;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.lineWidth = cam.ppm * 0.5;
    ctx.stroke();
    ctx.restore();

    if (asphalt) {
      ctx.save();
      ctx.beginPath();
      visible.forEach((p, i) => {
        const x = this.sx(p.x, cam);
        const y = this.sy(p.y, cam) + cam.ppm * 0.22;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = surface === 'asphalt-wet'
        ? 'rgba(225, 238, 246, 0.4)'
        : 'rgba(244, 240, 226, 0.42)';
      ctx.lineWidth = Math.max(1.5, cam.ppm * 0.045);
      ctx.setLineDash([cam.ppm * 0.55, cam.ppm * 0.75]);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (surface === 'sand') {
      for (let i = 0; i < visible.length; i += 2) {
        const p = visible[i]!;
        const r = hash01(Math.round(p.x * 7));
        if (r < 0.4) continue;
        const x = this.sx(p.x, cam);
        const y = this.sy(p.y, cam) + cam.ppm * (0.25 + r * 0.3);
        ctx.beginPath();
        ctx.arc(x, y, cam.ppm * (0.18 + r * 0.16), Math.PI * 0.15, Math.PI * 0.85);
        ctx.strokeStyle = 'rgba(255, 238, 205, 0.22)';
        ctx.lineWidth = Math.max(1, cam.ppm * 0.02);
        ctx.stroke();
      }
    } else if (surface === 'mud') {
      for (let i = 0; i < visible.length; i += 4) {
        const p = visible[i]!;
        const r = hash01(Math.round(p.x * 13) + 5);
        if (r < 0.5) continue;
        const x = this.sx(p.x, cam);
        const y = this.sy(p.y, cam) + cam.ppm * 0.35;
        ctx.beginPath();
        ctx.ellipse(x, y, cam.ppm * (0.35 + r * 0.4), cam.ppm * 0.12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 17, 12, 0.32)';
        ctx.fill();
      }
    } else if (surface === 'gravel' || surface === 'rock' || surface === 'dirt') {
      for (let i = 0; i < visible.length; i += 1) {
        const p = visible[i]!;
        const r = hash01(Math.round(p.x * 31 + surface.length));
        if (r < 0.55) continue;
        const x = this.sx(p.x, cam);
        const y = this.sy(p.y, cam) + cam.ppm * (0.15 + r * 0.6);
        ctx.fillStyle = 'rgba(220, 210, 190, 0.18)';
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, cam.ppm * 0.03), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // -------------------------------------------------------------- scenery ----
  private drawDecorations(cam: Camera): void {
    const ctx = this.ctx;
    const palette = BIOME_PALETTES[this.track.biome];
    const left = cam.x - this.width / cam.ppm - 5;
    const right = cam.x + this.width / cam.ppm + 5;

    // Delineator posts every 18 m: a constant speed cue along the shoulder.
    for (let xM = Math.floor(left / 18) * 18; xM < right; xM += 18) {
      const g = groundPointAt(this.track.runs, xM);
      if (!g) continue;
      const px = this.sx(xM, cam);
      const py = this.sy(g.y, cam);
      ctx.fillStyle = '#cfc9b8';
      ctx.fillRect(px - 1.2, py - 14, 2.4, 14);
      ctx.fillStyle = '#b6462f';
      ctx.fillRect(px - 1.2, py - 14, 2.4, 4);
    }

    for (const d of this.track.decorations) {
      if (d.x < left || d.x > right) continue;
      const x = this.sx(d.x, cam);
      const y = this.sy(d.y, cam);
      const s = d.scale * cam.ppm * 0.02;
      ctx.save();
      ctx.translate(x, y);
      switch (d.kind) {
        case 'rock': {
          ctx.beginPath();
          ctx.moveTo(-7 * s, 0);
          ctx.lineTo(-4 * s, -9 * s);
          ctx.lineTo(2 * s, -11 * s);
          ctx.lineTo(7 * s, -5 * s);
          ctx.lineTo(6 * s, 0);
          ctx.closePath();
          ctx.fillStyle = palette.nearRidge;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.stroke();
          break;
        }
        case 'shrub':
        case 'bush': {
          ctx.fillStyle = palette.vegetation;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc((i - 1) * 5 * s, -4 * s, 5 * s, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'grass': {
          ctx.strokeStyle = palette.vegetation;
          ctx.lineWidth = 1.4;
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 2.4 * s, 0);
            ctx.lineTo(i * 3.2 * s + 2 * s, -8 * s);
            ctx.stroke();
          }
          break;
        }
        case 'tree': {
          ctx.fillStyle = '#2b2019';
          ctx.fillRect(-2 * s, -22 * s, 4 * s, 22 * s);
          ctx.fillStyle = palette.vegetation;
          ctx.beginPath();
          ctx.arc(0, -26 * s, 13 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-9 * s, -20 * s, 9 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(9 * s, -21 * s, 8 * s, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'pole': {
          ctx.fillStyle = '#4c4a46';
          ctx.fillRect(-1.2 * s, -34 * s, 2.4 * s, 34 * s);
          ctx.fillRect(-8 * s, -32 * s, 16 * s, 1.6 * s);
          break;
        }
        case 'sign': {
          ctx.fillStyle = '#6b655c';
          ctx.fillRect(-1.2 * s, -18 * s, 2.4 * s, 18 * s);
          ctx.fillStyle = '#1f5c46';
          ctx.fillRect(-11 * s, -26 * s, 22 * s, 9 * s);
          ctx.strokeStyle = '#e8e2d2';
          ctx.lineWidth = 1;
          ctx.strokeRect(-11 * s, -26 * s, 22 * s, 9 * s);
          ctx.fillStyle = '#f4efe1';
          ctx.font = `${9 * s}px Vazirmatn, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('چرخ‌تاز', 0, -21.4 * s);
          break;
        }
        case 'crack': {
          ctx.strokeStyle = 'rgba(15,15,15,0.5)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(4 * s, -2 * s);
          ctx.lineTo(7 * s, 1 * s);
          ctx.stroke();
          break;
        }
      }
      ctx.restore();
    }
  }

  private drawObstacles(cam: Camera): void {
    const ctx = this.ctx;
    const palette = BIOME_PALETTES[this.track.biome];
    for (const o of this.track.obstacles) {
      const x = this.sx(o.x, cam);
      const y = this.sy(o.y ?? 0, cam);
      const w = o.halfWidth * cam.ppm;
      const h = o.halfHeight * cam.ppm;
      if (x < -w * 2 || x > this.width + w * 2) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-((o.angleDeg ?? 0) * Math.PI) / 180);

      switch (o.kind) {
        case 'log': {
          const r = h;
          const g = ctx.createLinearGradient(0, -r, 0, r);
          g.addColorStop(0, '#7d5a3a');
          g.addColorStop(0.5, '#5a3f27');
          g.addColorStop(1, '#332416');
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
          ctx.strokeStyle = '#3a2717';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(220, 190, 150, 0.25)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          break;
        }
        case 'tire-stack': {
          const layers = 3;
          for (let i = layers - 1; i >= 0; i--) {
            const ly = h - (i * 2 * h) / layers;
            ctx.fillStyle = i % 2 === 0 ? '#1c1f22' : '#25282c';
            ctx.beginPath();
            ctx.ellipse(0, ly, w, h / layers, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0d0f10';
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, ly, w * 0.45, (h / layers) * 0.45, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#33373b';
            ctx.fill();
          }
          break;
        }
        case 'plank-bridge': {
          ctx.fillStyle = '#7a5836';
          ctx.fillRect(-w, -h, w * 2, h * 2);
          ctx.strokeStyle = 'rgba(40, 26, 14, 0.7)';
          ctx.lineWidth = 1;
          const planks = Math.max(2, Math.round(w / 12));
          for (let i = 0; i <= planks; i++) {
            const px = -w + (i * 2 * w) / planks;
            ctx.beginPath();
            ctx.moveTo(px, -h);
            ctx.lineTo(px, h);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(220, 190, 140, 0.18)';
          ctx.fillRect(-w, -h, w * 2, h * 0.6);
          break;
        }
        case 'concrete-block': {
          const g = ctx.createLinearGradient(0, -h, 0, h);
          g.addColorStop(0, '#9a978f');
          g.addColorStop(1, '#5f5c56');
          ctx.fillStyle = g;
          ctx.fillRect(-w, -h, w * 2, h * 2);
          ctx.strokeStyle = 'rgba(30, 30, 30, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-w, -h, w * 2, h * 2);
          break;
        }
        case 'rock': {
          const g = ctx.createLinearGradient(-w, -h, w, h);
          g.addColorStop(0, '#8f8a7e');
          g.addColorStop(0.6, '#615c52');
          g.addColorStop(1, '#3f3b34');
          ctx.beginPath();
          const n = 7;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const wob = 0.82 + 0.18 * Math.cos(a * 3 + 0.7);
            ctx.lineTo(Math.cos(a) * w * wob, Math.sin(a) * h * wob);
          }
          ctx.closePath();
          ctx.fillStyle = g;
          ctx.fill();
          ctx.strokeStyle = 'rgba(20, 20, 20, 0.55)';
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
          ctx.beginPath();
          ctx.ellipse(-w * 0.2, -h * 0.35, w * 0.35, h * 0.18, -0.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        default:
          ctx.fillStyle = palette.nearRidge;
          ctx.fillRect(-w, -h, w * 2, h * 2);
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- gates ----
  private drawGates(cam: Camera, time: number): void {
    const ctx = this.ctx;
    const drawGate = (xM: number, label: string, color: string) => {
      const g = groundPointAt(this.track.runs, xM);
      if (!g) return;
      const x = this.sx(xM, cam);
      if (x < -80 || x > this.width + 80) return;
      const y = this.sy(g.y, cam);
      const h = cam.ppm * 3.4;
      ctx.strokeStyle = '#3d3b37';
      ctx.lineWidth = Math.max(3, cam.ppm * 0.11);
      ctx.beginPath();
      ctx.moveTo(x - cam.ppm * 2.4, y);
      ctx.lineTo(x - cam.ppm * 2.4, y - h);
      ctx.moveTo(x + cam.ppm * 2.4, y);
      ctx.lineTo(x + cam.ppm * 2.4, y - h);
      ctx.stroke();
      const banner = ctx.createLinearGradient(x, y - h, x, y - h + cam.ppm * 0.7);
      banner.addColorStop(0, color);
      banner.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = banner;
      ctx.fillRect(x - cam.ppm * 2.6, y - h, cam.ppm * 5.2, cam.ppm * 0.7);
      ctx.fillStyle = '#f7f1e3';
      ctx.font = `${Math.max(10, cam.ppm * 0.45)}px Vazirmatn, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y - h + cam.ppm * 0.36);
      void time;
    };

    drawGate(this.track.startX + 2, 'شروع', '#1f5c46');
    drawGate(this.track.finishX - 2, 'پایان', '#7d2a22');

    for (const cx of this.track.checkpointsX) {
      const g = groundPointAt(this.track.runs, cx);
      if (!g) continue;
      const x = this.sx(cx, cam);
      if (x < -40 || x > this.width + 40) continue;
      const y = this.sy(g.y, cam);
      ctx.strokeStyle = '#5a564e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - cam.ppm * 1.6);
      ctx.stroke();
      ctx.fillStyle = '#d9a441';
      ctx.beginPath();
      ctx.moveTo(x, y - cam.ppm * 1.6);
      ctx.lineTo(x + cam.ppm * 0.9, y - cam.ppm * 1.35);
      ctx.lineTo(x, y - cam.ppm * 1.1);
      ctx.closePath();
      ctx.fill();
    }
  }

  // -------------------------------------------------------------- vehicle ----
  private drawVehicle(state: RenderState): void {
    const ctx = this.ctx;
    const { vehicle, camera: cam } = state;
    const body = vehicle.chassis;
    const pos = body.getPosition();
    const angle = body.getAngle();
    const ppm = cam.ppm;

    const ground = groundPointAt(this.track.runs, pos.x);
    if (ground) {
      drawCarShadow(
        ctx,
        this.sx(pos.x, cam),
        this.sy(ground.y, cam),
        vehicle.car.numbers.lengthM * ppm,
        ppm,
      );
    }

    const wheelLocals = vehicle.wheels.map((w) => {
      const wp = w.body.getPosition();
      const local = body.getLocalPoint(wp);
      return { xM: local.x, yM: local.y, radiusM: w.radiusM };
    });

    // Wheels first, then the shell with arch cut-outs.
    for (let i = 0; i < vehicle.wheels.length; i++) {
      const wheel = vehicle.wheels[i]!;
      const wp = wheel.body.getPosition();
      drawWheel(ctx, {
        x: this.sx(wp.x, cam),
        y: this.sy(wp.y, cam),
        radiusPx: wheel.radiusM * ppm,
        angleRad: wheel.body.getAngle(),
        index: i === 0 ? 0 : 1,
        slip: 0,
      });
    }

    ctx.save();
    ctx.translate(this.sx(pos.x, cam), this.sy(pos.y, cam));
    ctx.rotate(-angle);
    drawCarBody(ctx, vehicle.car, ppm, wheelLocals);

    // Wheelspin smoke is drawn at the wheel, not on the body.
    ctx.restore();
  }

  // ------------------------------------------------------------ particles ----
  private drawParticles(state: RenderState, cam: Camera): void {
    const ctx = this.ctx;
    for (const p of state.particles) {
      const t = p.life / p.maxLife;
      if (t <= 0) continue;
      const x = this.sx(p.x, cam);
      const y = this.sy(p.y, cam);
      const r = Math.max(1, p.size * cam.ppm * (1.4 - t * 0.6));
      if (p.kind === 'spark') {
        ctx.fillStyle = `rgba(255, 196, 92, ${t * 0.9})`;
        ctx.fillRect(x - r * 0.5, y - r * 0.5, r, r);
      } else if (p.kind === 'smoke') {
        ctx.fillStyle = `rgba(180, 180, 180, ${t * 0.28})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'mud') {
        ctx.fillStyle = `rgba(92, 70, 45, ${t * 0.7})`;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const sand = this.track.biome === 'desert';
        ctx.fillStyle = sand
          ? `rgba(226, 196, 140, ${t * 0.5})`
          : `rgba(170, 158, 140, ${t * 0.42})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawVignette(palette: BiomePalette): void {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(
      this.width / 2,
      this.height * 0.55,
      this.height * 0.35,
      this.width / 2,
      this.height * 0.55,
      this.height * 0.95,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = palette.ambient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawDebug(state: RenderState, cam: Camera): void {
    const ctx = this.ctx;
    const t = state.vehicle.telemetry;
    const lines = [
      `x ${state.vehicle.x.toFixed(1)} y ${state.vehicle.y.toFixed(1)}`,
      `v ${(t.speedKph / 3.6).toFixed(2)} m/s`,
      `rpm ${Math.round(t.rpm)} gear ${t.gear}`,
      `slip ${t.wheelSlip.toFixed(3)}`,
      `wheels ${t.wheels.map((w) => `${w.grounded ? 'G' : 'A'}${Math.round(w.loadN)}`).join(' ')}`,
    ];
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(8, 8, 210, 18 * lines.length + 10);
    ctx.fillStyle = '#c9f5c0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => ctx.fillText(line, 14, 14 + i * 18));

    for (const wheel of state.vehicle.wheels) {
      const p = wheel.body.getPosition();
      ctx.beginPath();
      ctx.arc(this.sx(p.x, cam), this.sy(p.y, cam), wheel.radiusM * cam.ppm, 0, Math.PI * 2);
      ctx.strokeStyle = wheel.grounded ? '#6ee06e' : '#e06e6e';
      ctx.stroke();
    }
    void faNum;
    void (undefined as unknown as Vec2Like);
    void (undefined as unknown as SurfaceId);
  }
}
