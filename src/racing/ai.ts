import type { PedalInputs, Vehicle } from '../physics/vehicle';
import type { TrackDefinition } from '../tracks/types';
import { groundPointAt } from '../tracks/builder';

export interface AIDriverOptions {
  /** 0 = cautious rookie, 1 = fast clean driver. */
  skill: number;
  /** Reaction delay before the driver reacts to a new obstacle, seconds. */
  reactionS?: number;
}

/**
 * Track-following opponent controller.
 *
 * It produces the same continuous pedal inputs as a human and drives the same
 * Vehicle class — no teleporting, no hidden torque, no scripted speed. Skill
 * changes only look-ahead, target speed and how early it brakes.
 */
export class AIDriver {
  private readonly skill: number;
  private readonly reactionS: number;
  private stuckTimer = 0;
  private reverseTimer = 0;
  private shiftCooldown = 0;
  private targetSpeed = 0;
  private lastObstacleDistance = Infinity;

  constructor(
    private readonly vehicle: Vehicle,
    private readonly track: TrackDefinition,
    options: AIDriverOptions,
  ) {
    this.skill = Math.min(1, Math.max(0, options.skill));
    this.reactionS = options.reactionS ?? 0.18;
  }

  update(dt: number): PedalInputs {
    this.shiftCooldown = Math.max(0, this.shiftCooldown - dt);
    const v = this.vehicle;
    const speed = v.speedMs;
    const absSpeed = Math.abs(speed);
    const pos = v.chassis.getPosition();
    const lookahead = 7 + absSpeed * (0.6 + this.skill * 0.7);

    // Road grade ahead.
    const here = groundPointAt(this.track.runs, pos.x);
    const ahead = groundPointAt(this.track.runs, pos.x + lookahead);
    const slope = here && ahead ? (ahead.y - here.y) / lookahead : 0;

    // Gap detection: if the ground disappears ahead, carry speed.
    const gapAhead = !groundPointAt(this.track.runs, pos.x + Math.min(14, lookahead));
    let frictionTarget = 15 + this.skill * 9;
    if (slope > 0.02) frictionTarget *= 1 - Math.min(0.45, slope * 3);
    if (slope < -0.02) frictionTarget *= 1 + Math.min(0.25, -slope * 1.4);
    if (gapAhead) frictionTarget = Math.max(frictionTarget, 16);

    // Obstacles: brake early for anything that is a real step.
    let obstacleNear = Infinity;
    for (const o of this.track.obstacles) {
      const d = o.x - pos.x;
      if (d < 0 || d > 30) continue;
      obstacleNear = Math.min(obstacleNear, d);
      const height = (o.halfHeight ?? 0.1) * 2;
      if (height > 0.35 && d < 12 + absSpeed * 0.5) {
        frictionTarget = Math.min(frictionTarget, 8 + this.skill * 4);
      }
    }
    if (obstacleNear < this.lastObstacleDistance - 2) {
      // New obstacle: a low-skill driver reacts late.
      this.targetSpeed = Math.min(this.targetSpeed, frictionTarget - (1 - this.skill) * 3);
    } else {
      const blend = Math.min(1, dt / Math.max(0.05, this.reactionS));
      this.targetSpeed += (frictionTarget - this.targetSpeed) * blend;
    }
    this.lastObstacleDistance = obstacleNear;

    const target = Math.max(0, this.targetSpeed);
    let throttle = Math.max(0, Math.min(1, 0.55 + (target - absSpeed) * 0.22));
    let brake = absSpeed > target + 1.5 ? Math.min(1, (absSpeed - target) / 7) : 0;

    // Recovery: reverse briefly when wedged, then try again.
    if (absSpeed < 0.7) {
      this.stuckTimer += dt;
    } else {
      this.stuckTimer = 0;
    }
    if (this.stuckTimer > 2.5) {
      this.reverseTimer = 1.3;
      this.stuckTimer = 0;
    }
    if (this.reverseTimer > 0) {
      this.reverseTimer -= dt;
      throttle = 0;
      brake = 0;
    }

    if (!v.telemetry.engineRunning) v.restartEngine();

    let clutch = 0;
    if (v.manual) {
      const gear = v.gear;
      const rpm = v.engineRpm;
      if (this.reverseTimer > 0 && gear !== -1) {
        this.requestGear(-1);
      } else if (this.reverseTimer <= 0) {
        if (gear === 0) this.requestGear(1);
        else if (rpm > 5400 && gear > 0) this.requestGear(gear + 1);
        else if (rpm < 1500 && gear > 1) this.requestGear(gear - 1);
      }
      // Manual gearbox only accepts a shift with the pedal down; the request
      // above is simulation-level, so the pedal itself can stay released.
      clutch = 0;
    }

    if (this.reverseTimer > 0) {
      // Reverse needs actual torque: the gearbox is in R, so throttle drives
      // backwards. Keep a gentle demand.
      throttle = 0.35;
    }

    return { throttle, brake, clutch };
  }

  private requestGear(target: number): void {
    const v = this.vehicle;
    if (!v.manual || this.shiftCooldown > 0) return;
    const maxGear = v.manual.gearbox.spec.gears.length;
    if (target < -1 || target > maxGear) return;
    const wheelOmega = v.wheels[0]?.omegaRadS ?? 0;
    const result = v.manual.gearbox.requestShift(target, 1, v.car.engine.maxRpm, wheelOmega);
    if (result.ok) {
      this.shiftCooldown = Math.max(0.4, v.manual.gearbox.spec.shiftTimeS + 0.15);
    }
  }
}
