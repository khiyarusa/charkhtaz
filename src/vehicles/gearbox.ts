import type { GearIndex, GearboxSpec, ShiftResult } from './types';

/**
 * Manual gearbox: neutral / reverse / forward ratios, clutch interlock,
 * timed shifts, and mechanical over-rev warnings on aggressive downshifts.
 *
 * `ratio()` returns the SIGNED total ratio (gear × finalDrive). Reverse is
 * negative, so ω_gearboxInput = ω_wheel × ratio keeps the engine spinning
 * forward while the wheels spin backward.
 */
export class GearboxModel {
  readonly spec: GearboxSpec;
  private gear: GearIndex = 0;
  private pendingGear: GearIndex | null = null;
  private shiftTimerS = 0;

  constructor(spec: GearboxSpec) {
    this.spec = spec;
  }

  get currentGear(): GearIndex {
    return this.gear;
  }

  get isShifting(): boolean {
    return this.pendingGear !== null;
  }

  /** Signed total ratio of the current gear (0 in neutral, negative in reverse). */
  ratio(): number {
    return this.ratioFor(this.gear);
  }

  /** Signed total ratio for a hypothetical gear. */
  ratioFor(gear: GearIndex): number {
    if (gear === 0) return 0;
    const raw = gear === -1 ? -this.spec.reverse : this.spec.gears[gear - 1] ?? 0;
    return raw * this.spec.finalDrive;
  }

  /** Engine rpm the clutch would synchronize to in `gear` at the given wheel speed. */
  predictedEngineRpm(gear: GearIndex, wheelOmegaRadS: number): number {
    return Math.abs(wheelOmegaRadS * this.ratioFor(gear)) * (60 / (2 * Math.PI));
  }

  /**
   * Request a manual shift.
   *
   * The clutch interlock refuses shifts without enough pedal travel — the
   * player must actually operate the clutch. A downshift that would drag the
   * engine past redline is still allowed (the driver can money-shift), but is
   * reported with an `overrev` warning; the engine model accumulates damage.
   */
  requestShift(
    target: GearIndex,
    clutchPedal: number,
    engineMaxRpm: number,
    wheelOmegaRadS: number,
  ): ShiftResult {
    if (target === this.gear) return { ok: true };
    if (target < -1 || target > this.spec.gears.length) {
      return { ok: false, reason: 'invalid' };
    }
    if (this.isShifting) return { ok: false, reason: 'busy' };
    if (clutchPedal < this.spec.clutchThreshold) {
      return { ok: false, reason: 'clutch' };
    }

    let warning: ShiftResult['warning'];
    if (target !== 0) {
      const predicted = this.predictedEngineRpm(target, wheelOmegaRadS);
      if (predicted > engineMaxRpm) warning = 'overrev';
    }
    this.pendingGear = target;
    this.shiftTimerS = this.spec.shiftTimeS;
    return { ok: true, warning };
  }

  /** Advance the shift timer; the new gear engages when it completes. */
  step(dt: number): void {
    if (this.pendingGear !== null) {
      this.shiftTimerS -= dt;
      if (this.shiftTimerS <= 0) {
        this.gear = this.pendingGear;
        this.pendingGear = null;
      }
    }
  }

  /** Direct gear override for save-game restore and test setup. */
  forceGear(gear: GearIndex): void {
    if (gear < -1 || gear > this.spec.gears.length) return;
    this.gear = gear;
    this.pendingGear = null;
  }
}
