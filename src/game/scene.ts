import { Vec2, World } from 'planck';
import { clamp, clamp01 } from '../core/math';
import { Vehicle } from '../physics/vehicle';
import type { PedalInputs } from '../physics/vehicle';
import { Terrain } from '../physics/terrain';
import type { ResolvedCar } from '../vehicles/profiles';
import type { TrackDefinition } from '../tracks/types';
import { groundPointAt } from '../tracks/builder';
import { Renderer, type Camera, type Particle, type RenderState } from '../render/renderer';
import { AIDriver } from '../racing/ai';
import { GhostRecorder, decodeGhost, encodeGhost, sampleGhost, type GhostFrame } from '../racing/ghost';
import type { Medal } from '../save/storage';
import { medalForScore, medalForTime, medalThresholds, trialParSeconds, trialScore } from '../career/career';

export type GameMode = 'race' | 'time' | 'trial' | 'practice';

export interface OpponentSpec {
  car: ResolvedCar;
  /** 0 cautious … 1 fast. */
  skill: number;
  /** Metres behind the player's grid slot. */
  offsetM: number;
  labelFa: string;
}

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
  position: number;
  totalRacers: number;
  medal: Medal | null;
  score: number | null;
  runId: string;
  ghost?: number[][];
}

export interface SceneEvent {
  type: 'shift' | 'impact' | 'checkpoint' | 'finish' | 'respawn';
  value?: number;
}

export interface SceneCallbacks {
  onFinish?: (result: RaceResult) => void;
  onCheckpoint?: (hit: number, total: number) => void;
  onCountdown?: (value: number) => void;
  onRespawn?: (reason: string) => void;
  onEvent?: (event: SceneEvent) => void;
}

interface OpponentRuntime {
  vehicle: Vehicle;
  driver: AIDriver;
  finishTime: number | null;
  labelFa: string;
}

const FIXED_DT = 1 / 60;
const MAX_STEPS = 6;
const COUNTDOWN_S = 3;
const RESPAWN_PENALTY_S = 3;

export class GameScene {
  readonly world: World;
  readonly terrain: Terrain;
  readonly vehicle: Vehicle;
  readonly renderer: Renderer;
  readonly track: TrackDefinition;
  readonly mode: GameMode;
  readonly opponents: OpponentRuntime[] = [];
  readonly camera: Camera;

  countdown = COUNTDOWN_S;
  elapsedS = 0;
  paused = false;
  finished = false;
  showDebug = false;
  result: RaceResult | null = null;
  alpha = 0;

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
  private readonly ghostRecorder: GhostRecorder | null;
  private readonly ghostFrames: GhostFrame[];
  private ghostPose: ReturnType<typeof sampleGhost> = null;
  private lastGear = 0;
  private finishOrder: string[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    car: ResolvedCar,
    track: TrackDefinition,
    mode: GameMode,
    callbacks: SceneCallbacks = {},
    opponents: readonly OpponentSpec[] = [],
    ghostFramesRaw: readonly number[][] = [],
  ) {
    this.track = track;
    this.mode = mode;
    this.callbacks = callbacks;
    this.world = new World({ gravity: Vec2(0, -9.81) });
    this.terrain = new Terrain(this.world, track);

    const spawnX = track.startX + 6;
    const ground = groundPointAt(track.runs, spawnX);
    const startY = ground?.y ?? 0;
    this.vehicle = new Vehicle(this.world, car, spawnX, startY);
    this.lastCheckpointX = spawnX;
    this.renderer = new Renderer(canvas, track);
    this.ghostFrames = mode === 'time' ? decodeGhost(ghostFramesRaw) : [];
    this.ghostRecorder = mode === 'time' ? new GhostRecorder() : null;

    for (const spec of opponents) {
      const x = spawnX - Math.max(3, spec.offsetM);
      const g = groundPointAt(track.runs, x) ?? ground;
      const vehicle = new Vehicle(this.world, spec.car, x, g?.y ?? startY);
      this.opponents.push({
        vehicle,
        driver: new AIDriver(vehicle, track, { skill: spec.skill }),
        finishTime: null,
        labelFa: spec.labelFa,
      });
    }

    const rect = canvas.getBoundingClientRect();
    // A larger scale makes the model-specific bodywork readable on a phone.
    this.basePpm = clamp(rect.height / 9.8, 48, 88);
    this.camera = {
      x: this.vehicle.x,
      y: this.vehicle.y + 1,
      ppm: this.basePpm,
      shakeX: 0,
      shakeY: 0,
    };

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

  get ghostPoseForRender(): ReturnType<typeof sampleGhost> {
    return this.ghostPose;
  }

  get racePosition(): number {
    return this.standings.findIndex((s) => s.player) + 1;
  }

  get standings(): { player: boolean; labelFa: string; x: number; finished: boolean; gapM: number }[] {
    const rows = [
      { player: true, labelFa: 'شما', x: this.vehicle.x, finished: this.finished, gapM: 0 },
      ...this.opponents.map((o) => ({
        player: false,
        labelFa: o.labelFa,
        x: o.vehicle.x,
        finished: o.finishTime !== null,
        gapM: 0,
      })),
    ];
    rows.sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return b.x - a.x;
    });
    const leader = rows[0]?.x ?? 0;
    for (const row of rows) row.gapM = Math.max(0, leader - row.x);
    return rows;
  }

  update(dt: number, input: PedalInputs, pedalSpring: (dt: number) => void): void {
    const frameDt = Math.min(dt, 0.1);
    pedalSpring(frameDt);

    if (this.paused || this.finished) {
      this.updateCamera(frameDt, false, this.vehicle.renderPose(1));
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
      ? { throttle: 0, brake: 1, clutch: this.vehicle.manual ? 1 : 0 }
      : input;
    const aiInput: PedalInputs = { throttle: 0, brake: 1, clutch: this.vehicle.manual ? 1 : 0 };

    this.accumulator += frameDt;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_STEPS) {
      this.vehicle.update(FIXED_DT, effective);
      for (const opponent of this.opponents) {
        const oppInput = counting ? aiInput : opponent.driver.update(FIXED_DT);
        opponent.vehicle.update(FIXED_DT, oppInput);
        opponent.vehicle.setDamagePenalty(opponent.vehicle.telemetry.damage);
        if (opponent.finishTime === null && opponent.vehicle.x >= this.track.finishX) {
          opponent.finishTime = this.elapsedS;
          this.finishOrder.push(opponent.labelFa);
        }
      }
      this.world.step(FIXED_DT);
      this.vehicle.afterStep(FIXED_DT);
      for (const opponent of this.opponents) opponent.vehicle.afterStep(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps++;

      const gear = this.vehicle.gear;
      if (gear !== this.lastGear) {
        if (this.lastGear !== 0 || gear !== 0) this.callbacks.onEvent?.({ type: 'shift', value: gear });
        this.lastGear = gear;
      }
    }
    if (steps === MAX_STEPS) this.accumulator = 0;
    this.alpha = clamp01(this.accumulator / FIXED_DT);

    if (!counting) this.elapsedS += frameDt;

    const tele = this.vehicle.telemetry;
    this.vehicle.setDamagePenalty(tele.damage);
    this.topSpeedKph = Math.max(this.topSpeedKph, tele.speedKph);
    this.lastImpact = Math.max(0, this.lastImpact - frameDt * 2.2);
    this.lastImpact = Math.max(this.lastImpact, this.vehicle.impactLevel);

    if (this.ghostRecorder && !counting) {
      this.ghostRecorder.sample(this.elapsedS, {
        x: this.vehicle.x,
        y: this.vehicle.y,
        angle: this.vehicle.chassis.getAngle(),
        wheels: this.vehicle.wheels.map((w) => ({ angleRad: w.body.getAngle() })),
      });
    }
    if (this.ghostFrames.length > 0) {
      this.ghostPose = sampleGhost(this.ghostFrames, this.elapsedS);
    }

    this.updateParticles(frameDt);
    // The camera follows the same interpolated pose as the car, so a 120 Hz
    // display does not get a camera that steps at 60 Hz while the sprite glides.
    this.updateCamera(frameDt, true, this.vehicle.renderPose(this.alpha));
    this.checkProgress(frameDt, tele.speedKph);
  }

  draw(): void {
    const state: RenderState = {
      vehicle: this.vehicle,
      opponents: this.opponents.map((o) => o.vehicle),
      camera: this.camera,
      particles: this.particles,
      elapsedS: this.elapsedS,
      paused: this.paused,
      showDebug: this.showDebug,
      alpha: this.alpha,
      ghost: this.ghostPose
        ? { pose: this.ghostPose, car: this.vehicle.car }
        : null,
    };
    this.renderer.draw(state);
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

  respawn(reason = 'بازگشت به آخرین ایست'): void {
    const x = this.lastCheckpointX;
    const ground = groundPointAt(this.track.runs, x) ??
      groundPointAt(this.track.runs, this.track.startX + 6);
    if (!ground) return;
    this.vehicle.respawnAt(x, ground.y);
    this.vehicle.restartEngine();
    if (this.vehicle.manual) {
      this.vehicle.manual.gearbox.forceGear(1);
      this.vehicle.manual.engine.restart();
    } else {
      this.vehicle.auto?.selectRange(1);
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
      this.callbacks.onEvent?.({ type: 'checkpoint' });
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
    const playerTime = this.elapsedS + this.penaltiesS;
    let ahead = 0;
    for (const o of this.opponents) {
      if (o.finishTime !== null && o.finishTime < playerTime) ahead++;
      else if (o.finishTime === null && o.vehicle.x >= this.track.finishX) ahead++;
    }
    const thresholds = medalThresholds(this.track.lengthM, this.track.difficulty);
    const damage = this.vehicle.telemetry.damage;
    const par = trialParSeconds(this.track.lengthM, this.track.difficulty);
    const score = this.mode === 'trial'
      ? trialScore({
          timeS: playerTime,
          penaltiesS: this.penaltiesS,
          damage,
          parS: par,
          checkpointsHit: this.checkpointIndex,
          totalCheckpoints: this.totalCheckpoints,
        })
      : null;
    const medal = this.mode === 'trial'
      ? medalForScore(score ?? 0)
      : this.mode === 'practice'
        ? null
        : medalForTime(playerTime, thresholds);

    this.result = {
      mode: this.mode,
      timeS: playerTime,
      topSpeedKph: this.topSpeedKph,
      damage,
      checkpointsHit: this.checkpointIndex,
      totalCheckpoints: this.totalCheckpoints,
      penaltiesS: this.penaltiesS,
      trackId: this.track.id,
      carId: this.vehicle.car.profile.id,
      position: this.opponents.length > 0 ? Math.min(this.opponents.length + 1, ahead + 1) : 1,
      totalRacers: this.opponents.length + 1,
      medal,
      score,
      runId: `${this.track.id}:${this.mode}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`,
      ghost: this.ghostRecorder ? this.ghostRecorder.finish() : undefined,
    };
    this.callbacks.onEvent?.({ type: 'finish' });
    this.callbacks.onFinish?.(this.result);
  }

  private updateCamera(dt: number, live: boolean, pose: { x: number; y: number }): void {
    const speed = this.vehicle.speedMs;
    const lookahead = clamp(speed * 0.55, -4, 9);
    const targetX = pose.x + lookahead;
    const targetY = pose.y + 1.1;
    const k = live ? 1 - Math.exp(-dt * 3.1) : 0;
    this.camera.x += (targetX - this.camera.x) * k;
    this.camera.y += (targetY - this.camera.y) * (1 - Math.exp(-dt * 2.4));

    const zoomTarget = this.basePpm * (1 - clamp(speed / 260, 0, 0.12));
    this.camera.ppm += (zoomTarget - this.camera.ppm) * (1 - Math.exp(-dt * 2));

    const shake = Math.min(1, this.lastImpact) * 9;
    this.camera.shakeX = (Math.random() - 0.5) * shake;
    this.camera.shakeY = (Math.random() - 0.5) * shake;
    this.lastImpact *= Math.exp(-dt * 5.5);
  }

  private updateParticles(dt: number): void {
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
  }

  /** Encoded ghost to persist after a best time. */
  ghostData(): number[][] | undefined {
    if (!this.ghostRecorder) return undefined;
    const frames = this.ghostRecorder.finish();
    return frames.length > 1 ? encodeGhost(decodeGhost(frames)) : undefined;
  }
}
