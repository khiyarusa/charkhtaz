import { Vec2, World } from 'planck';
import { clamp, clamp01 } from '../core/math';
import { Vehicle } from '../physics/vehicle';
import type { PedalInputs } from '../physics/vehicle';
import { Terrain } from '../physics/terrain';
import type { ResolvedCar } from '../vehicles/profiles';
import type { TrackDefinition } from '../tracks/types';
import { groundPointAt } from '../tracks/builder';
import { Renderer, type Camera, type Particle } from '../render/renderer';

export type GameMode = 'race' | 'time' | 'practice';

export interface RaceResult {
  mode: GameMode;
  timeS: number;
  topSpeedKph: number;
  damage: number;
  checkpointsHit: number;
  totalCheckpoints: number;
  penaltiesS: number;
  trackId: string;
  carId: string;
}

export interface SceneCallbacks {
  onFinish?: (result: RaceResult) => void;
  onCheckpoint?: (hit: number, total: number) => void;
  onCountdown?: (value: number) => void;
  onRespawn?: (reason: string) => void;
}

const FIXED_DT = 1 / 60;
const MAX_STEPS = 6;
const COUNTDOWN_S = 3;
const RESPAWN_PENALTY_S = 3;

/**
 * One driving session: Planck world, terrain, the player's car, camera,
 * effects, timing and recovery. Rendering is delegated to Renderer; the HUD
 * reads the public telemetry each frame.
 */
export class GameScene {
  readonly world: World;
  readonly terrain: Terrain;
  readonly vehicle: Vehicle;
  readonly renderer: Renderer;
  readonly track: TrackDefinition;
  readonly mode: GameMode;

  readonly camera: Camera;
  countdown = COUNTDOWN_S;
  elapsedS = 0;
  paused = false;
  finished = false;
  showDebug = false;
  result: RaceResult | null = null;

  private accumulator = 0;
  private lastImpact = 0;
  private particles: Particle[] = [];
  private checkpointIndex = 0;
  private lastCheckpointX: number;
  private topSpeedKph = 0;
  private penaltiesS = 0;
  private stuckTimer = 0;
  private flippedTimer = 0;
  private readonly callbacks: SceneCallbacks;
  private readonly basePpm: number;

  constructor(
    canvas: HTMLCanvasElement,
    car: ResolvedCar,
    track: TrackDefinition,
    mode: GameMode,
    callbacks: SceneCallbacks = {},
  ) {
    this.track = track;
    this.mode = mode;
    this.callbacks = callbacks;
    this.world = new World({ gravity: Vec2(0, -9.81) });
    this.terrain = new Terrain(this.world, track);

    const ground = groundPointAt(track.runs, track.startX + 6);
    const startY = ground?.y ?? 0;
    this.vehicle = new Vehicle(this.world, car, track.startX + 6, startY);
    this.lastCheckpointX = track.startX + 6;
    this.renderer = new Renderer(canvas, track);

    const rect = canvas.getBoundingClientRect();
    this.basePpm = clamp(rect.height / 12.5, 34, 68);
    this.camera = {
      x: this.vehicle.x,
      y: this.vehicle.y + 1,
      ppm: this.basePpm,
      shakeX: 0,
      shakeY: 0,
    };

    // Settle the car onto its springs before the countdown.
    for (let i = 0; i < 30; i++) {
      this.vehicle.update(FIXED_DT, { throttle: 0, brake: 1, clutch: 1 });
      this.world.step(FIXED_DT);
    }
  }

  resize(): void {
    this.renderer.resize();
  }

  get totalCheckpoints(): number {
    return this.track.checkpointsX.length;
  }

  get checkpointsHit(): number {
    return this.checkpointIndex;
  }

  /** Advance with real elapsed time; physics runs on a fixed accumulator. */
  update(dt: number, input: PedalInputs, pedalSpring: (dt: number) => void): void {
    const frameDt = Math.min(dt, 0.1);
    pedalSpring(frameDt);

    if (this.paused || this.finished) {
      this.updateCamera(frameDt, false);
      this.renderer.resize();
      return;
    }

    const counting = this.countdown > 0;
    if (counting) {
      const before = Math.ceil(this.countdown);
      this.countdown = Math.max(0, this.countdown - frameDt);
      const after = Math.ceil(this.countdown);
      if (after !== before) this.callbacks.onCountdown?.(after);
      if (this.countdown === 0) this.callbacks.onCountdown?.(0);
    }

    const effective: PedalInputs = counting
      ? {
          throttle: 0,
          brake: 1,
          clutch: this.vehicle.manual ? 1 : 0,
        }
      : input;

    this.accumulator += frameDt;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_STEPS) {
      this.vehicle.update(FIXED_DT, effective);
      this.world.step(FIXED_DT);
      this.vehicle.afterStep(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps++;
    }
    if (steps === MAX_STEPS) this.accumulator = 0;

    if (!counting) this.elapsedS += frameDt;

    const tele = this.vehicle.telemetry;
    this.topSpeedKph = Math.max(this.topSpeedKph, tele.speedKph);
    this.lastImpact = Math.max(0, this.lastImpact - frameDt * 2.2);
    this.lastImpact = Math.max(this.lastImpact, this.vehicle.impactLevel);

    this.updateParticles(frameDt, tele.wheels);
    this.updateCamera(frameDt, true);
    this.checkProgress(frameDt, tele.speedKph);
  }

  draw(): void {
    this.renderer.draw({
      vehicle: this.vehicle,
      camera: this.camera,
      particles: this.particles,
      elapsedS: this.elapsedS,
      paused: this.paused,
      showDebug: this.showDebug,
    });
  }

  requestGear(gear: number) {
    return this.vehicle.requestGear(gear);
  }

  togglePause(): boolean {
    this.paused = !this.paused;
    return this.paused;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  respawn(reason = 'بازگشت به آخرین ایست') : void {
    const x = Math.max(this.lastCheckpointX, this.vehicle.x - 6);
    const ground = groundPointAt(this.track.runs, x) ??
      groundPointAt(this.track.runs, this.track.startX + 6);
    if (!ground) return;
    this.vehicle.respawnAt(x, ground.y);
    this.vehicle.restartEngine();
    if (this.vehicle.manual) {
      this.vehicle.manual.gearbox.forceGear(1);
      this.vehicle.manual.engine.restart();
    }
    this.penaltiesS += RESPAWN_PENALTY_S;
    this.stuckTimer = 0;
    this.flippedTimer = 0;
    this.callbacks.onRespawn?.(reason);
  }

  private checkProgress(frameDt: number, speedKph: number): void {
    const x = this.vehicle.x;

    while (
      this.checkpointIndex < this.totalCheckpoints &&
      x >= (this.track.checkpointsX[this.checkpointIndex] ?? Infinity)
    ) {
      this.checkpointIndex++;
      this.lastCheckpointX = x;
      this.callbacks.onCheckpoint?.(this.checkpointIndex, this.totalCheckpoints);
    }

    if (x >= this.track.finishX && !this.finished) {
      this.finish();
      return;
    }

    if (this.vehicle.y < this.track.boundsBottomM - 6) {
      this.respawn('سقوط در گودال');
      return;
    }

    if (Math.abs(this.vehicle.telemetry.pitchRad) > 2.4) {
      this.flippedTimer += frameDt;
      if (this.flippedTimer > 2.2) this.respawn('واژگونی');
    } else {
      this.flippedTimer = 0;
    }

    if (speedKph < 2 && this.countdown === 0) {
      this.stuckTimer += frameDt;
      if (this.stuckTimer > 12 && this.vehicle.telemetry.throttle > 0.5) {
        this.respawn('گیر کردن');
      }
    } else {
      this.stuckTimer = 0;
    }
  }

  private finish(): void {
    this.finished = true;
    this.result = {
      mode: this.mode,
      timeS: this.elapsedS + this.penaltiesS,
      topSpeedKph: this.topSpeedKph,
      damage: this.vehicle.telemetry.damage,
      checkpointsHit: this.checkpointIndex,
      totalCheckpoints: this.totalCheckpoints,
      penaltiesS: this.penaltiesS,
      trackId: this.track.id,
      carId: this.vehicle.car.profile.id,
    };
    this.callbacks.onFinish?.(this.result);
  }

  private updateCamera(dt: number, live: boolean): void {
    const tele = this.vehicle.telemetry;
    const speed = this.vehicle.speedMs;
    const lookahead = clamp(speed * 0.55, -4, 9);
    const targetX = this.vehicle.x + lookahead;
    const targetY = this.vehicle.y + 1.1;
    const k = live ? 1 - Math.exp(-dt * 3.1) : 0;
    this.camera.x += (targetX - this.camera.x) * k;
    this.camera.y += (targetY - this.camera.y) * (1 - Math.exp(-dt * 2.4));

    const zoomTarget = this.basePpm * (1 - clamp(speed / 260, 0, 0.12));
    this.camera.ppm += (zoomTarget - this.camera.ppm) * (1 - Math.exp(-dt * 2));

    const shake = Math.min(1, this.lastImpact) * 9;
    this.camera.shakeX = (Math.random() - 0.5) * shake;
    this.camera.shakeY = (Math.random() - 0.5) * shake;
    this.lastImpact *= Math.exp(-dt * 5.5);
    void tele;
  }

  private updateParticles(
    dt: number,
    wheels: readonly { grounded: boolean; slip: number; surfaceId: string }[],
  ): void {
    // Advance and retire.
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 0.6 * dt;
      p.vx *= 1 - 1.6 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.particles.length > 240) this.particles.splice(0, this.particles.length - 240);

    if (this.paused || this.countdown > 0) return;

    const speed = Math.abs(this.vehicle.speedMs);
    for (const wheel of this.vehicle.wheels) {
      if (!wheel.grounded) continue;
      const p = wheel.body.getPosition();
      const spin = Math.abs(wheel.omegaRadS * wheel.radiusM - this.vehicle.speedMs);
      if (spin > 1.6 && speed > 1 && Math.random() < 0.7) {
        const surface = wheel.surface.id;
        const kind =
          surface === 'mud' || surface === 'dirt'
            ? 'mud'
            : surface === 'sand' || surface === 'gravel'
              ? 'dust'
              : 'smoke';
        this.particles.push({
          x: p.x - 0.2,
          y: p.y - wheel.radiusM * 0.8,
          vx: -this.vehicle.speedMs * 0.15 + (Math.random() - 0.5) * 1.4,
          vy: 0.6 + Math.random() * 1.2,
          life: 0.6 + Math.random() * 0.5,
          maxLife: 1.1,
          size: 0.12 + Math.random() * 0.2,
          kind,
        });
      }
    }

    // Exhaust puffs from the rear when the engine is loaded.
    const tele = this.vehicle.telemetry;
    if (tele.throttle > 0.25 && tele.rpm > 1400 && Math.random() < 0.25) {
      const rear = this.vehicle.chassis.getWorldPoint(
        Vec2(-this.vehicle.car.numbers.lengthM * 0.48, -0.1),
      );
      this.particles.push({
        x: rear.x,
        y: rear.y,
        vx: -0.8 - Math.random(),
        vy: 0.3 + Math.random() * 0.4,
        life: 0.45,
        maxLife: 0.45,
        size: 0.08,
        kind: 'smoke',
      });
    }

    if (this.lastImpact > 0.5 && Math.random() < 0.5) {
      const front = this.vehicle.chassis.getWorldPoint(
        Vec2(this.vehicle.car.numbers.lengthM * 0.48, 0.1),
      );
      this.particles.push({
        x: front.x,
        y: front.y,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2,
        life: 0.3,
        maxLife: 0.3,
        size: 0.05,
        kind: 'spark',
      });
    }

    void wheels;
  }
}
