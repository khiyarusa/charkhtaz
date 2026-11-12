import type { TrackDefinition, Vec2Like } from '../tracks/types';
import { BIOME_PALETTES, SURFACE_LOOK, type BiomePalette } from './palettes';
import { drawCarBody, drawCarShadow, drawWheel } from './vehicle-art';
import { blueprintFor } from '../vehicles/art';
import type { Vehicle } from '../physics/vehicle';
import type { ResolvedCar } from '../vehicles/profiles';
import type { GhostPose } from '../racing/ghost';
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
  opponents?: readonly Vehicle[];
  camera: Camera;
  particles: readonly Particle[];
  elapsedS: number;
  paused: boolean;
  showDebug: boolean;
  /** 0..1 between the previous and current physics transforms. */
  alpha: number;
  ghost?: { pose: GhostPose; car: ResolvedCar } | null;
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
    for (const opponent of state.opponents ?? []) this.drawVehicleAt(opponent, state, cam);
    if (state.ghost) this.drawGhost(state.ghost, cam);
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
      grad.addColorStop(0.42, palette.skyMid);
      grad.addColorStop(0.72, palette.skyBottom);
      grad.addColorStop(1, palette.haze);
      paletteCache.set(key, grad);
    }
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Sun with a wide atmospheric glow and a tighter core.
    const sunX = this.width * 0.74;
    const sunY = this.height * 0.2;
    const glow = this.ctx.createRadialGradient(
      sunX,
      sunY,
      this.height * 0.02,
      sunX,
      sunY,
      this.height * 0.5,
    );
    glow.addColorStop(0, palette.sunGlow);
    glow.addColorStop(0.45, 'rgba(0,0,0,0)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, this.height * 0.043, 0, Math.PI * 2);
    this.ctx.fillStyle = palette.sun;
    this.ctx.fill();

    // Thin cloud bands, deterministic per biome so the sky does not flicker.
    if (this.track.biome === 'mountain' || this.track.biome === 'forest' || this.track.biome === 'urban') {
      this.ctx.save();
      this.ctx.globalAlpha = 0.1;
      this.ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 317) % 100) / 100 * this.width;
        const cy = this.height * (0.09 + ((i * 41) % 17) / 100);
        const w = this.width * (0.14 + ((i * 13) % 9) / 60);
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, w, this.height * 0.018, 0, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  // ----------------------------------------------------------- background ----
  private drawBackground(palette: BiomePalette, cam: Camera, time: number): void {
    const biome = this.track.biome;
    if (biome === 'urban') {
      this.drawSkyline(palette, cam, 0.08, 0.4, 0.2, 11, 0.4);
      this.drawSkyline(palette, cam, 0.2, 0.52, 0.24, 7, 0.58);
      this.drawSkyline(palette, cam, 0.4, 0.62, 0.17, 3, 0.72);
      this.drawStreetLamps(cam, time);
    } else if (biome === 'forest') {
      this.drawTreeline(palette, cam, 0.08, 0.48, 0.5, '#2b3a33', 2.2, 0.55);
      this.drawTreeline(palette, cam, 0.22, 0.58, 0.7, '#22312a', 1.5, 0.8);
      this.drawTreeline(palette, cam, 0.44, 0.68, 1, '#18241f', 1.1, 1);
    } else {
      const sharp = biome === 'mountain';
      this.drawRidge(palette.farRidge, cam, 0.07, 0.46, sharp ? 95 : 140, sharp ? 96 : 40, 3, 0.9, sharp);
      this.drawRidge(palette.midRidge, cam, 0.2, 0.58, sharp ? 74 : 118, sharp ? 64 : 30, 7, 1, sharp);
      if (biome === 'desert') {
        this.drawDunes(palette, cam);
      } else {
        this.drawRidge(palette.nearRidge, cam, 0.42, 0.7, 58, 42, 13, 1.2, false);
      }
    }

    // Haze band that ties the parallax layers to the road, with a soft fade at
    // the top so no hard horizontal seam is visible mid-screen.
    const haze = this.ctx.createLinearGradient(0, this.height * 0.42, 0, this.height * 0.84);
    haze.addColorStop(0, 'rgba(0,0,0,0)');
    haze.addColorStop(1, palette.haze);
    this.ctx.save();
    this.ctx.globalAlpha = 0.72;
    this.ctx.fillStyle = haze;
    this.ctx.fillRect(0, this.height * 0.42, this.width, this.height * 0.42);
    this.ctx.restore();
    void time;
  }

  private drawStreetLamps(cam: Camera, time: number): void {
    const ctx = this.ctx;
    const spacing = 190;
    const offset = cam.x * cam.ppm * 0.4;
    const start = Math.floor(offset / spacing) - 1;
    for (let i = 0; i < Math.ceil(this.width / spacing) + 3; i++) {
      const index = start + i;
      const x = index * spacing - offset;
      const baseY = this.height * 0.63;
      ctx.strokeStyle = 'rgba(60, 64, 68, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, baseY - 54);
      ctx.quadraticCurveTo(x, baseY - 64, x + 18, baseY - 64);
      ctx.stroke();
      const lit = 0.18 + 0.1 * Math.sin(time * 0.6 + index);
      const g = ctx.createRadialGradient(x + 20, baseY - 62, 0, x + 20, baseY - 62, 16);
      g.addColorStop(0, `rgba(255, 214, 150, ${lit})`);
      g.addColorStop(1, 'rgba(255, 214, 150, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + 20, baseY - 62, 16, 0, Math.PI * 2);
      ctx.fill();
    }
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
    snowy = false,
  ): void {
    const ctx = this.ctx;
    const baseY = this.height * baseRatio;
    const offset = cam.x * cam.ppm * parallax;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    const step = 22;
    const peaks: { x: number; y: number }[] = [];
    for (let px = 0; px <= this.width + step; px += step) {
      const worldX = px + offset;
      const n =
        this.ridgeValue(worldX, seed, wavelength) * 0.68 +
        this.ridgeValue(worldX * 2.3, seed + 4, wavelength * 0.45) * 0.32 * detail;
      const y = baseY - n * amplitude;
      peaks.push({ x: px, y });
      ctx.lineTo(px, y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Snow caps and rock facets on the sharp mountain layers.
    if (snowy) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, this.height);
      for (const p of peaks) ctx.lineTo(p.x, p.y);
      ctx.lineTo(this.width, this.height);
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i < peaks.length; i += 3) {
        const p = peaks[i]!;
        const next = peaks[Math.min(peaks.length - 1, i + 3)]!;
        if (peaks[i - 1] && p.y > peaks[i - 1]!.y) continue;
        const depth = amplitude * 0.22;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 1);
        ctx.lineTo(next.x, next.y - 1);
        ctx.lineTo((p.x + next.x) / 2, p.y + depth);
        ctx.closePath();
        ctx.fillStyle = 'rgba(236, 240, 244, 0.35)';
        ctx.fill();
      }
      ctx.restore();
    }

    // Fade the base of the ridge into the haze.
    const fade = ctx.createLinearGradient(0, baseY - amplitude * 0.15, 0, baseY + this.height * 0.12);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, baseY - amplitude * 0.15, this.width, this.height * 0.24);
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
    const h = 30 * scale;
    ctx.fillStyle = '#20221f';
    ctx.fillRect(x - 1.3 * scale, baseY - h * 0.62, 2.6 * scale, h * 0.62);
    ctx.fillStyle = color;
    if (variant % 3 === 0) {
      // Conifer: three stacked tiers.
      for (let tier = 0; tier < 3; tier++) {
        const tierY = baseY - h * (0.35 + tier * 0.22);
        const half = (9 - tier * 2.2) * scale;
        ctx.beginPath();
        ctx.moveTo(x, tierY - h * 0.3);
        ctx.lineTo(x + half, tierY);
        ctx.lineTo(x - half, tierY);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      const blobs = 4;
      for (let i = 0; i < blobs; i++) {
        const bx = x + (i - 1.5) * 4.2 * scale;
        const by = baseY - h * (0.72 + (i % 2) * 0.12);
        ctx.beginPath();
        ctx.arc(bx, by, (7.5 - Math.abs(i - 1.5)) * scale, 0, Math.PI * 2);
        ctx.fill();
      }
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
    alpha = 1,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    const offset = cam.x * cam.ppm * parallax;
    const baseY = this.height * baseRatio;
    const spacing = spacingM * 46 * scale;
    const start = Math.floor(offset / spacing) - 1;
    const count = Math.ceil(this.width / spacing) + 3;
    for (let i = 0; i < count; i++) {
      const index = start + i;
      const px = index * spacing - offset;
      const r = hash01(index * 131 + 17);
      this.drawTree(px, baseY + r * 4, 0.7 + r * 0.9, color, Math.floor(r * 7));
    }
    // Mist at the foot of the treeline.
    const mist = ctx.createLinearGradient(0, baseY - this.height * 0.03, 0, baseY + this.height * 0.06);
    mist.addColorStop(0, 'rgba(0,0,0,0)');
    mist.addColorStop(1, palette.haze);
    ctx.fillStyle = mist;
    ctx.fillRect(0, baseY - this.height * 0.03, this.width, this.height * 0.09);
    ctx.restore();
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
      // Windows: sparse, dim lit cells rather than a bright grid.
      ctx.fillStyle = 'rgba(255, 214, 140, 0.12)';
      for (let wy = baseY - h + 10; wy < baseY - 12; wy += 18) {
        for (let wx = x + 7; wx < x + w - 7; wx += 15) {
          if (hash01(Math.round(wx * 3 + wy * 7)) > 0.78) {
            ctx.fillRect(wx, wy, 2.5, 3.5);
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
      const visible = run.points.filter((p) => p.x >= leftM - 6 && p.x <= rightM + 6);
      if (visible.length < 2) continue;
      const look = SURFACE_LOOK[run.surface];
      const bottom = this.height + 40;
      const first = visible[0]!;
      const last = visible[visible.length - 1]!;

      // Ambient occlusion above the ground seats the road in the scene.
      const ao = ctx.createLinearGradient(0, this.sy(first.y, cam) - cam.ppm * 1.1, 0, this.sy(first.y, cam));
      ao.addColorStop(0, 'rgba(0,0,0,0)');
      ao.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = ao;
      ctx.fillRect(0, this.sy(first.y, cam) - cam.ppm * 1.1, this.width, cam.ppm * 1.1);

      // Body of the ground with strata.
      ctx.beginPath();
      ctx.moveTo(this.sx(first.x, cam), this.sy(first.y, cam));
      for (const p of visible) ctx.lineTo(this.sx(p.x, cam), this.sy(p.y, cam));
      ctx.lineTo(this.sx(last.x, cam), bottom);
      ctx.lineTo(this.sx(first.x, cam), bottom);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, this.sy(first.y, cam), 0, bottom);
      grad.addColorStop(0, look.fill);
      grad.addColorStop(0.28, look.deep);
      grad.addColorStop(1, '#101010');
      ctx.fillStyle = grad;
      ctx.fill();

      // Parallel strata lines give the cut earth some depth.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.sx(first.x, cam), this.sy(first.y, cam));
      for (const p of visible) ctx.lineTo(this.sx(p.x, cam), this.sy(p.y, cam));
      ctx.lineTo(this.sx(last.x, cam), bottom);
      ctx.lineTo(this.sx(first.x, cam), bottom);
      ctx.closePath();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        for (let k = 0; k < visible.length; k++) {
          const p = visible[k]!;
          const x = this.sx(p.x, cam);
          const y = this.sy(p.y, cam) + cam.ppm * 0.32 * i + Math.sin(p.x * 0.7 + i) * 2;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Crown: a thin, bright surface line so the tyre contact reads.
      ctx.beginPath();
      ctx.moveTo(this.sx(first.x, cam), this.sy(first.y, cam));
      for (const p of visible) ctx.lineTo(this.sx(p.x, cam), this.sy(p.y, cam));
      ctx.strokeStyle = look.top;
      ctx.lineWidth = Math.max(2, cam.ppm * 0.055);
      ctx.lineJoin = 'round';
      ctx.stroke();

      this.drawSurfaceDetail(run.surface, visible, cam);

      // Surface grain: deterministic dashes, limited to the visible span.
      ctx.strokeStyle = look.grain;
      ctx.globalAlpha = look.loose ? 0.5 : 0.22;
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

      // Dark edge under the crown, which is what makes the road look solid.
      ctx.beginPath();
      for (let i = 0; i < visible.length; i++) {
        const p = visible[i]!;
        const px = this.sx(p.x, cam);
        const py = this.sy(p.y, cam) + cam.ppm * 0.16;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.lineWidth = Math.max(1.5, cam.ppm * 0.06);
      ctx.stroke();
    }
  }

  /** Lane paint, ripples, puddles, stones and grain that make each surface read. */
  private drawSurfaceDetail(
    surface: SurfaceId,
    visible: { x: number; y: number }[],
    cam: Camera,
  ): void {
    const ctx = this.ctx;
    const asphalt = surface.startsWith('asphalt');
    const first = visible[0]!;

    const pathAt = (offsetM: number): void => {
      ctx.beginPath();
      visible.forEach((p, i) => {
        const x = this.sx(p.x, cam);
        const y = this.sy(p.y, cam) + cam.ppm * offsetM;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    };

    if (asphalt) {
      // Aggregate: fine speckle just under the crown.
      for (let i = 0; i < visible.length; i += 1) {
        const p = visible[i]!;
        const r = hash01(Math.round(p.x * 37) + (surface === 'asphalt-wet' ? 11 : 3));
        if (r < 0.55) continue;
        const x = this.sx(p.x, cam);
        const y = this.sy(p.y, cam) + cam.ppm * (0.05 + r * 0.12);
        ctx.fillStyle = r > 0.82 ? 'rgba(226, 226, 220, 0.16)' : 'rgba(0,0,0,0.22)';
        ctx.fillRect(x, y, 1 + r * 2, 1);
      }

      // Longitudinal tar seams every ~9 m.
      ctx.strokeStyle = 'rgba(10, 10, 12, 0.35)';
      ctx.lineWidth = Math.max(1, cam.ppm * 0.02);
      const seamStart = Math.floor(first.x / 9) * 9;
      for (let xM = seamStart; xM < first.x + (this.width / cam.ppm) + 9; xM += 9) {
        const g = groundPointAt(this.track.runs, xM);
        if (!g) continue;
        const px = this.sx(xM, cam);
        const py = this.sy(g.y, cam);
        ctx.beginPath();
        ctx.moveTo(px, py + 2);
        ctx.lineTo(px + 3, py + cam.ppm * 0.16);
        ctx.stroke();
      }

      // Edge line at the crown, then lane dashes a little below it.
      pathAt(0.035);
      ctx.strokeStyle = surface === 'asphalt-wet'
        ? 'rgba(226, 238, 246, 0.5)'
        : 'rgba(242, 238, 224, 0.45)';
      ctx.lineWidth = Math.max(1.5, cam.ppm * 0.035);
      ctx.setLineDash([cam.ppm * 0.55, cam.ppm * 0.75]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (surface === 'asphalt-wet') {
        // Standing water: sky reflection plus a specular streak.
        for (let i = 0; i < visible.length; i += 3) {
          const p = visible[i]!;
          const r = hash01(Math.round(p.x * 13) + 7);
          if (r < 0.55) continue;
          const x = this.sx(p.x, cam);
          const y = this.sy(p.y, cam) + cam.ppm * 0.09;
          ctx.beginPath();
          ctx.ellipse(x, y, cam.ppm * (0.25 + r * 0.5), cam.ppm * 0.035, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(198, 222, 236, 0.18)';
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(x - cam.ppm * 0.1, y - cam.ppm * 0.01, cam.ppm * 0.12, cam.ppm * 0.012, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fill();
        }
      }
      return;
    }

    if (surface === 'sand') {
      // Ripple crests: nested arcs along the surface.
      for (let i = 0; i < visible.length; i += 2) {
        const p = visible[i]!;
        const r = hash01(Math.round(p.x * 7));
        const x = this.sx(p.x, cam);
        const y = this.sy(p.y, cam) + cam.ppm * (0.1 + r * 0.18);
        ctx.beginPath();
        ctx.ellipse(x, y, cam.ppm * (0.3 + r * 0.35), cam.ppm * (0.05 + r * 0.03), 0, 0.1, Math.PI - 0.1);
        ctx.strokeStyle = r > 0.55 ? 'rgba(255, 240, 205, 0.3)' : 'rgba(120, 92, 55, 0.18)';
        ctx.lineWidth = Math.max(1, cam.ppm * 0.014);
        ctx.stroke();
      }
      return;
    }

    if (surface === 'mud') {
      // Wet sheen and standing puddles.
      for (let i = 0; i < visible.length; i += 3) {
        const p = visible[i]!;
        const r = hash01(Math.round(p.x * 13) + 5);
        if (r < 0.4) continue;
        const x = this.sx(p.x, cam);
        const y = this.sy(p.y, cam) + cam.ppm * (0.06 + r * 0.1);
        ctx.beginPath();
        ctx.ellipse(x, y, cam.ppm * (0.35 + r * 0.45), cam.ppm * (0.04 + r * 0.03), 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(24, 20, 14, 0.45)';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - cam.ppm * 0.05, y - cam.ppm * 0.01, cam.ppm * (0.12 + r * 0.1), cam.ppm * 0.012, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 200, 210, 0.14)';
        ctx.fill();
      }
      return;
    }

    if (surface === 'gravel' || surface === 'rock' || surface === 'dirt') {
      // Loose stones with a lit top edge and a shadow.
      for (let i = 0; i < visible.length; i += 1) {
        const p = visible[i]!;
        const r = hash01(Math.round(p.x * 31 + surface.length));
        if (r < 0.5) continue;
        const x = this.sx(p.x, cam);
        const y = this.sy(p.y, cam) + cam.ppm * (0.04 + r * 0.14);
        const size = Math.max(1, cam.ppm * (0.02 + r * 0.035));
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.7, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = surface === 'dirt' ? 'rgba(58, 44, 30, 0.55)' : 'rgba(160, 154, 142, 0.5)';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - size * 0.25, y - size * 0.3, size * 0.5, size * 0.3, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fill();
      }
      if (surface === 'rock') {
        // Strata and fractures.
        ctx.strokeStyle = 'rgba(20, 18, 16, 0.3)';
        ctx.lineWidth = Math.max(1, cam.ppm * 0.018);
        for (let i = 0; i < visible.length; i += 4) {
          const p = visible[i]!;
          const x = this.sx(p.x, cam);
          const y = this.sy(p.y, cam);
          ctx.beginPath();
          ctx.moveTo(x, y + cam.ppm * 0.05);
          ctx.lineTo(x + cam.ppm * 0.2, y + cam.ppm * 0.12);
          ctx.lineTo(x + cam.ppm * 0.32, y + cam.ppm * 0.08);
          ctx.stroke();
        }
      }
      return;
    }

    if (surface === 'wood') {
      // Plank joints with nails.
      const start = Math.floor(first.x / 1.6) * 1.6;
      for (let xM = start; xM < first.x + this.width / cam.ppm + 1.6; xM += 1.6) {
        const g = groundPointAt(this.track.runs, xM);
        if (!g) continue;
        const px = this.sx(xM, cam);
        const py = this.sy(g.y, cam);
        ctx.strokeStyle = 'rgba(40, 26, 14, 0.55)';
        ctx.lineWidth = Math.max(1, cam.ppm * 0.02);
        ctx.beginPath();
        ctx.moveTo(px, py + 1);
        ctx.lineTo(px + 2, py + cam.ppm * 0.14);
        ctx.stroke();
        ctx.fillStyle = 'rgba(210, 205, 195, 0.4)';
        ctx.fillRect(px + 2, py + cam.ppm * 0.05, 1.5, 1.5);
      }
      return;
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
    this.drawVehicleAt(state.vehicle, state, state.camera);
  }

  private drawVehicleAt(vehicle: Vehicle, state: RenderState, cam: Camera): void {
    const ctx = this.ctx;
    const pose = vehicle.renderPose(state.alpha);
    const ppm = cam.ppm;
    const tele = vehicle.telemetry;

    const ground = groundPointAt(this.track.runs, pose.x);
    if (ground) {
      const wheelOffsets = pose.wheels.map((w) => (w.x - pose.x) * ppm);
      drawCarShadow(
        ctx,
        this.sx(pose.x, cam),
        this.sy(ground.y, cam),
        vehicle.car.numbers.lengthM * ppm,
        ppm,
        wheelOffsets,
      );
    }

    const cos = Math.cos(-pose.angle);
    const sin = Math.sin(-pose.angle);
    const wheelLocals = pose.wheels.map((w) => {
      const dx = w.x - pose.x;
      const dy = w.y - pose.y;
      return {
        xM: dx * cos - dy * sin,
        yM: dx * sin + dy * cos,
        radiusM: vehicle.car.numbers.wheelRadiusM,
      };
    });

    for (let i = 0; i < pose.wheels.length; i++) {
      const w = pose.wheels[i]!;
      const teleWheel = tele.wheels[i];
      drawWheel(ctx, {
        x: this.sx(w.x, cam),
        y: this.sy(w.y, cam),
        radiusPx: vehicle.car.numbers.wheelRadiusM * ppm,
        angleRad: w.angle,
        index: i === 0 ? 0 : 1,
        slip: teleWheel?.slip ?? 0,
        rimStyle: vehicle.car.cosmetics.rims === 'stock'
          ? vehicle.car.profile.art.rimStyle
          : vehicle.car.cosmetics.rims === 'sport'
            ? 'rugged'
            : 'mesh',
        blueprint: blueprintFor(vehicle.car.profile.id).wheel,
        braking: tele.brake > 0.15,
      });
    }

    ctx.save();
    ctx.translate(this.sx(pose.x, cam), this.sy(pose.y, cam));
    ctx.rotate(-pose.angle);
    drawCarBody(ctx, vehicle.car, ppm, wheelLocals, tele.damage, {
      brake: tele.brake,
      damage: tele.damage,
      lights: false,
    });
    ctx.restore();
  }

  private drawGhost(ghost: { pose: GhostPose; car: ResolvedCar }, cam: Camera): void {
    const ctx = this.ctx;
    const ppm = cam.ppm;
    const pose = ghost.pose;
    const cos = Math.cos(-pose.angle);
    const sin = Math.sin(-pose.angle);
    const wheelLocals = [
      { xM: -ghost.car.numbers.wheelbaseM / 2, yM: -0.27, radiusM: ghost.car.numbers.wheelRadiusM },
      { xM: ghost.car.numbers.wheelbaseM / 2, yM: -0.27, radiusM: ghost.car.numbers.wheelRadiusM },
    ].map((w) => ({
      ...w,
      xM: w.xM * cos - w.yM * sin,
      yM: w.xM * sin + w.yM * cos,
    }));

    ctx.save();
    ctx.globalAlpha = 0.32;
    for (let i = 0; i < 2; i++) {
      const local = wheelLocals[i]!;
      const wx = pose.x + local.xM;
      const wy = pose.y + local.yM;
      drawWheel(ctx, {
        x: this.sx(wx, cam),
        y: this.sy(wy, cam),
        radiusPx: ghost.car.numbers.wheelRadiusM * ppm,
        angleRad: i === 0 ? pose.frontWheelAngle : pose.rearWheelAngle,
        index: i === 0 ? 0 : 1,
        slip: 0,
        rimStyle: ghost.car.profile.art.rimStyle,
        blueprint: blueprintFor(ghost.car.profile.id).wheel,
      });
    }
    ctx.translate(this.sx(pose.x, cam), this.sy(pose.y, cam));
    ctx.rotate(-pose.angle);
    ctx.filter = 'saturate(0.2) brightness(1.6)';
    drawCarBody(ctx, ghost.car, ppm, wheelLocals, 0, { lights: true });
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
