import { clamp, rpmToRadS } from '../core/math';
import { ClutchModel } from './clutch';
import { EngineModel } from './engine';
import { GearboxModel } from './gearbox';
import { stepWheelWithBrake } from './tire';
import type { ClutchSpec, EngineSpec, GearboxSpec, SurfaceSpec } from './types';

/**
 * Per driven-wheel state, mutated in place each step.
 *
 * The caller owns chassis speed and suspension loads; the drivetrain owns
 * engine, clutch, gearbox and the wheel angular speeds of driven wheels.
 */
export interface DrivenWheelState {
  /** Wheel angular speed (rad/s). Updated in place by the drivetrain. */
  omegaRadS: number;
  /** Normal load on this wheel this step (N); 0 when airborne. */
  loadN: number;
  /** Contact surface (any surface with loadN = 0 when airborne). */
  surface: SurfaceSpec;
  /** Tire grip multiplier of the fitted tire (default 1). */
  tireGrip?: number;
  /** Output: longitudinal ground force at this wheel this step (N). */
  forceN: number;
}

export interface DriveOutput {
  /** Torque applied to each driven wheel in the final substep (Nm, debug/HUD). */
  wheelTorqueNm: number;
  engineRpm: number;
  gear: number;
  /** Engine speed minus gearbox input speed at the last substep (rad/s). */
  clutchSlipRadS: number;
  /** True when the clutch is inside its progressive lock zone. */
  clutchLocked: boolean;
  engineRunning: boolean;
  /** True exactly on the step the engine stalled. */
  engineStalled: boolean;
  /** Sum of driven-wheel longitudinal forces (N). */
  tractionForceN: number;
}

export interface DrivetrainOptions {
  wheelRadiusM: number;
  /** Rotational inertia per driven wheel (kg·m²). */
  wheelInertia: number;
  /** Engine + clutch + wheel sub-steps per call (default 8). */
  substeps?: number;
}

/**
 * Manual drivetrain: engine → clutch → gearbox → open differential → wheels.
 *
 * ONE torque authority: the engine produces torque, the clutch couples it to
 * the wheels through the signed gearbox ratio, and the reaction loads the
 * engine. Nothing else drives the wheels.
 *
 * Numerics: engine, clutch and driven wheels are integrated together at
 * `substeps` × the call rate. Inside the clutch's progressive zone the
 * coupling is solved implicitly (stable lock-up); beyond it the torque
 * saturates at the current capacity (Coulomb sliding). The wheels use the
 * semi-implicit tire update, so the stiff low-speed slip coupling remains
 * stable at ordinary frame rates.
 */
export class ManualDrivetrain {
  readonly engine: EngineModel;
  readonly clutch: ClutchModel;
  readonly gearbox: GearboxModel;
  private readonly wheelRadiusM: number;
  private readonly wheelInertia: number;
  private readonly substeps: number;
  private tractionForceN = 0;

  constructor(
    engineSpec: EngineSpec,
    clutchSpec: ClutchSpec,
    gearboxSpec: GearboxSpec,
    options: DrivetrainOptions,
  ) {
    this.engine = new EngineModel(engineSpec);
    this.clutch = new ClutchModel(clutchSpec);
    this.gearbox = new GearboxModel(gearboxSpec);
    this.wheelRadiusM = options.wheelRadiusM;
    this.wheelInertia = options.wheelInertia;
    this.substeps = Math.max(1, Math.floor(options.substeps ?? 8));
  }

  /**
   * Advance one fixed step.
   *
   * @param vehicleSpeedMs chassis longitudinal speed (m/s), used for slip.
   * @param wheels driven-wheel states; `omegaRadS`/`forceN` are updated.
   */
  step(
    dt: number,
    throttle: number,
    clutchPedal: number,
    vehicleSpeedMs: number,
    wheels: DrivenWheelState[],
    brakeTorquesNm?: readonly number[],
  ): DriveOutput {
    this.gearbox.step(dt);
    const wasRunning = this.engine.isRunning;
    const n = Math.max(1, wheels.length);
    const h = dt / this.substeps;
    const eff = this.gearbox.spec.drivelineEfficiency;
    const ratio = this.gearbox.ratio();
    const cap = this.clutch.capacityNm(clutchPedal);
    const kv = cap > 0 ? cap / this.clutch.spec.lockSlipRadS : 0;
    const Je = this.engine.spec.inertia;

    let wheelTorque = 0;
    let slip = 0;
    let locked = false;

    for (let i = 0; i < this.substeps; i++) {
      const engineOmega = rpmToRadS(this.engine.currentRpm);
      const Te = this.engine.indicatedTorqueNm() - this.engine.frictionTorqueNm();

      let meanOmega = 0;
      for (const w of wheels) meanOmega += w.omegaRadS;
      meanOmega /= n;

      let tc = 0;
      if (ratio !== 0 && cap > 0) {
        const omegaGb = meanOmega * ratio;
        // Driven axle reflected to the gearbox input shaft.
        const jAxle = (this.wheelInertia * n) / (ratio * ratio);
        // Tire reaction from the previous substep, reflected to the input.
        let reaction = 0;
        for (const w of wheels) reaction += -w.forceN * this.wheelRadiusM;
        const tLoad = reaction / ratio;

        const s = engineOmega - omegaGb;
        // Implicit viscous solve, then Coulomb saturation.
        const d = 1 + h * kv * (1 / Je + 1 / jAxle);
        const sNext = (s + h * (Te / Je - tLoad / jAxle)) / d;
        tc = clamp(kv * sNext, -cap, cap);
        slip = s;
        locked = Math.abs(s) < this.clutch.spec.lockSlipRadS;
      }

      this.engine.step(h, throttle, tc);
      wheelTorque = ratio === 0 ? 0 : (tc * ratio * eff) / n;

      let traction = 0;
      for (let wi = 0; wi < wheels.length; wi++) {
        const w = wheels[wi]!;
        const brake = brakeTorquesNm?.[wi] ?? 0;
        const r = stepWheelWithBrake(
          w.omegaRadS,
          wheelTorque,
          brake,
          w.loadN,
          w.surface,
          this.wheelRadiusM,
          this.wheelInertia,
          vehicleSpeedMs,
          h,
          w.tireGrip ?? 1,
        );
        w.omegaRadS = r.omegaRadS;
        w.forceN = r.forceN;
        traction += r.forceN;
      }
      this.tractionForceN = traction;
    }

    return {
      wheelTorqueNm: wheelTorque,
      engineRpm: this.engine.currentRpm,
      gear: this.gearbox.currentGear,
      clutchSlipRadS: slip,
      clutchLocked: locked,
      engineRunning: this.engine.isRunning,
      engineStalled: wasRunning && !this.engine.isRunning,
      tractionForceN: this.tractionForceN,
    };
  }

  /** Last computed total driven-wheel force (N). */
  get lastTractionForceN(): number {
    return this.tractionForceN;
  }
}
