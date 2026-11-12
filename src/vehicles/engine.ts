import { clamp01 } from '../core/math';
import type { EngineSpec, TorquePoint } from './types';

/**
 * Piecewise-linear torque curve lookup with end clamping.
 * Points must be sorted by ascending rpm.
 */
export function sampleTorque(curve: readonly TorquePoint[], rpm: number): number {
  const first = curve[0];
  if (!first) return 0;
  const last = curve[curve.length - 1];
  if (!last) return 0;
  if (rpm <= first.rpm) return first.nm;
  if (rpm >= last.rpm) return last.nm;
  for (let i = 1; i < curve.length; i++) {
    const p = curve[i]!;
    if (rpm <= p.rpm) {
      const prev = curve[i - 1]!;
      const t = (rpm - prev.rpm) / (p.rpm - prev.rpm);
      return prev.nm + (p.nm - prev.nm) * t;
    }
  }
  return last.nm; // unreachable for sorted input
}

/**
 * Engine model: torque curve, throttle lag, internal friction, idle fueling,
 * rev limiter (fuel cut), stall, bump-start and mechanical over-rev damage.
 *
 * The engine integrates its own angular speed given the external load torque
 * (the clutch reaction). Torque that exceeds the limiter is cut as fuel, but
 * being dragged over redline by the drivetrain still overspeeds the engine
 * and accumulates damage — the physics stays honest.
 */
export class EngineModel {
  readonly spec: EngineSpec;
  private rpm: number;
  private throttleFiltered = 0;
  private running: boolean;
  private damageAcc = 0;

  constructor(spec: EngineSpec, initialRpm?: number) {
    this.spec = spec;
    this.rpm = initialRpm ?? spec.idleRpm;
    this.running = this.rpm >= spec.stallRpm;
  }

  get currentRpm(): number {
    return this.rpm;
  }

  get isRunning(): boolean {
    return this.running;
  }

  /** Filtered throttle 0..1 actually reaching the engine. */
  get throttle(): number {
    return this.throttleFiltered;
  }

  /** Accumulated mechanical damage from over-rev (0 = healthy). */
  get damage(): number {
    return this.damageAcc;
  }

  /** Restart (starter motor / reset). */
  restart(): void {
    this.rpm = this.spec.idleRpm;
    this.running = true;
    this.throttleFiltered = 0;
  }

  /** Direct rpm override for save-game restore and test setup. */
  forceRpm(rpm: number): void {
    this.rpm = Math.max(0, rpm);
    this.running = this.rpm >= this.spec.stallRpm;
  }

  /** Wide-open-throttle torque at an arbitrary rpm (Nm). */
  wotTorqueNm(rpm: number): number {
    return sampleTorque(this.spec.torqueCurve, rpm);
  }

  /** Idle fueling torque with fade above the idle band (Nm, ≥ 0). */
  private idleFuelNm(): number {
    const band = this.spec.idleRpm + this.spec.idleFadeRpm;
    if (this.running && this.rpm < band) {
      const fade = clamp01((band - this.rpm) / this.spec.idleFadeRpm);
      return this.spec.idleTorqueNm * fade;
    }
    return 0;
  }

  /** Indicated (gross) output torque at the current state (Nm). */
  indicatedTorqueNm(): number {
    if (!this.running) return 0;
    const fuelCut = this.rpm >= this.spec.maxRpm ? 0 : 1;
    const wot = this.wotTorqueNm(this.rpm) * this.throttleFiltered;
    return fuelCut * Math.max(wot, this.idleFuelNm());
  }

  /** Internal friction torque opposing rotation (Nm, ≥ 0 magnitude). */
  frictionTorqueNm(): number {
    const w = (this.rpm * 2 * Math.PI) / 60;
    const pumping = this.spec.engineBrakeCoef * w * (1 - this.throttleFiltered);
    return pumping + this.spec.constFrictionNm;
  }

  /**
   * Advance one step.
   *
   * @param externalLoadNm torque the clutch takes from the engine
   *   (positive slows the engine; negative drags it up, e.g. wheels
   *   driving the engine — enables bump-start).
   */
  step(dt: number, throttleTarget: number, externalLoadNm: number): void {
    const tau = Math.max(this.spec.throttleTau, 1e-6);
    const a = 1 - Math.exp(-dt / tau);
    this.throttleFiltered += (clamp01(throttleTarget) - this.throttleFiltered) * a;

    if (!this.running) {
      // Dead engine: friction and clutch load only. A clutch driven by the
      // wheels can spin it back up (bump start) once past the catch rpm.
      const net = -this.frictionTorqueNm() - externalLoadNm;
      this.rpm = Math.max(0, this.rpm + this.rpmDelta(net, dt));
      if (this.rpm > this.spec.stallRpm + 100) {
        this.running = true;
      }
      return;
    }

    const net =
      this.indicatedTorqueNm() - this.frictionTorqueNm() - externalLoadNm;
    this.rpm = Math.max(0, this.rpm + this.rpmDelta(net, dt));

    // Mechanical over-rev: fuel cut cannot prevent being dragged past
    // redline by the drivetrain; damage accumulates above the grace band.
    const damageThreshold = this.spec.maxRpm * this.spec.overrevGrace;
    if (this.rpm > damageThreshold) {
      const over = (this.rpm - damageThreshold) / this.spec.maxRpm;
      this.damageAcc += over * this.spec.overrevDamageRate * dt;
    }

    if (this.rpm < this.spec.stallRpm) {
      this.running = false;
    }
  }

  private rpmDelta(netTorqueNm: number, dt: number): number {
    return (netTorqueNm / this.spec.inertia) * dt * (60 / (2 * Math.PI));
  }
}
