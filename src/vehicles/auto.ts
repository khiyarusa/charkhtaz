import { clamp, rpmToRadS } from '../core/math';
import { EngineModel } from './engine';
import { GearboxModel } from './gearbox';
import { stepWheelWithBrake } from './tire';
import type { AutoSpec, EngineSpec, GearboxSpec } from './types';
import type { DriveOutput, DrivenWheelState } from './drivetrain';

export interface AutoOptions {
  wheelRadiusM: number;
  /** Rotational inertia per driven wheel, kg·m². */
  wheelInertia: number;
  /** Published/estimated top speed of the car, used to bound short-shifts. */
  topSpeedKph?: number;
  /** Engine + converter + wheel sub-steps per call (default 8). */
  substeps?: number;
}

/**
 * Torque-converter automatic transmission.
 *
 * One torque authority, same as the manual box: engine torque reaches the
 * wheels only through the converter → gearbox → differential path.
 *
 * Converter model: pump torque rises with engine speed squared and collapses
 * as the speed ratio approaches 1 (a fluid coupling cannot transmit torque at
 * zero slip). Below `lockupSpeedRatio` the stator multiplies turbine torque by
 * up to `converterStallRatio`. Above `converterLockRpm` and beyond 85 % speed
 * ratio the lock-up clutch closes and the coupling becomes rigid. The ratio is
 * chosen by a throttle-aware schedule, not scripted speeds.
 */
export class AutoDrivetrain {
  readonly engine: EngineModel;
  readonly gearbox: GearboxModel;
  readonly spec: AutoSpec;
  private readonly wheelRadiusM: number;
  private readonly wheelInertia: number;
  private readonly topSpeedKph: number;
  private readonly substeps: number;
  /** Pump torque coefficient, Nm per (rad/s)². */
  private readonly pumpC: number;
  private shiftCooldownS = 0;
  /** Time since the last completed ratio change, seconds. */
  private timeInGearS = 0;
  private tractionForceN = 0;
  /** Mean driven-wheel speed from the last step (rad/s), for shift prediction. */
  private meanWheelOmega = 0;
  /** Last measured driven-wheel slip ratio (0 = rolling, 1 = fully spinning). */
  private wheelSlip = 0;

  constructor(
    engineSpec: EngineSpec,
    gearboxSpec: GearboxSpec,
    autoSpec: AutoSpec,
    options: AutoOptions,
    initialGear = 1,
  ) {
    this.engine = new EngineModel(engineSpec);
    this.gearbox = new GearboxModel(gearboxSpec);
    this.gearbox.forceGear(initialGear);
    this.spec = autoSpec;
    this.wheelRadiusM = options.wheelRadiusM;
    this.wheelInertia = options.wheelInertia;
    this.topSpeedKph = options.topSpeedKph ?? 200;
    this.substeps = Math.max(1, Math.floor(options.substeps ?? 8));

    const peakNm = engineSpec.torqueCurve.reduce((m, p) => Math.max(m, p.nm), 0);
    // Converter sized from the engine's own peak torque so a torquey V6
    // stalls lower. 2 600 rpm is the reference stall speed; the pump torque
    // must stay below idle torque at idle or the engine would stall against
    // its own converter with the brake held.
    const stallOmega = rpmToRadS(2600);
    this.pumpC = peakNm / (stallOmega * stallOmega);
  }

  /** Current gear (−1 R, 0 N, 1..N). */
  get gear(): number {
    return this.gearbox.currentGear;
  }

  get lastTractionForceN(): number {
    return this.tractionForceN;
  }

  /**
   * Advance one fixed step.
   *
   * @param wheels driven-wheel states; `omegaRadS`/`forceN` are updated.
   * @param brakeTorquesNm service-brake torque per driven wheel, Nm.
   */
  step(
    dt: number,
    throttle: number,
    vehicleSpeedMs: number,
    wheels: DrivenWheelState[],
    brakeTorquesNm?: readonly number[],
  ): DriveOutput {
    this.gearbox.step(dt);
    this.shiftCooldownS = Math.max(0, this.shiftCooldownS - dt);

    const wasRunning = this.engine.isRunning;
    const n = Math.max(1, wheels.length);
    const h = dt / this.substeps;
    const eff = this.gearbox.spec.drivelineEfficiency;
    const ratio = this.gearbox.ratio();
    const Je = this.engine.spec.inertia;
    const shiftCut = this.gearbox.isShifting ? 1 - this.spec.torqueCut : 1;

    let wheelTorque = 0;
    let slip = 0;
    let locked = false;
    let lastRpm = this.engine.currentRpm;

    for (let i = 0; i < this.substeps; i++) {
      const engineOmega = rpmToRadS(this.engine.currentRpm);
      const Te = this.engine.indicatedTorqueNm() - this.engine.frictionTorqueNm();

      let meanOmega = 0;
      for (const w of wheels) meanOmega += w.omegaRadS;
      meanOmega /= n;

      let turbineTorque = 0;
      if (ratio !== 0) {
        const omegaTurbine = meanOmega * ratio;
        const s = engineOmega - omegaTurbine;
        const speedRatio = clamp(omegaTurbine / Math.max(engineOmega, 1), -1, 1);

        // Lock-up clutch: rigid above the lock rpm with a closed converter.
        locked = this.engine.currentRpm > this.spec.converterLockRpm && speedRatio > 0.85;
        const kv = locked
          ? 4000
          : Math.max(0.25, 2 * this.pumpC * Math.max(engineOmega, 30));

        const omegaPump = Math.max(engineOmega, 0);
        const pumpMax = Math.max(18, this.pumpC * omegaPump * omegaPump);
        const cap = locked ? 4000 : Math.min(1.6 * pumpMax, 1600);

        const jAxle = (this.wheelInertia * n) / (ratio * ratio);
        let reaction = 0;
        for (const w of wheels) reaction += -w.forceN * this.wheelRadiusM;
        const tLoad = reaction / ratio;

        const d = 1 + h * kv * (1 / Je + 1 / jAxle);
        const sNext = (s + h * (Te / Je - tLoad / jAxle)) / d;
        const pumpTorque = clamp(kv * sNext, -cap, cap);

        // Stator torque multiplication fades out as the coupling speed ratio
        // approaches 1. Locked-up converters transmit 1:1.
        const multiplication = locked
          ? 1
          : 1 + (this.spec.converterStallRatio - 1) * Math.max(0, 1 - speedRatio / 0.85);
        turbineTorque = pumpTorque * multiplication;
        slip = s;

        this.engine.step(h, throttle, pumpTorque);
      } else {
        this.engine.step(h, throttle, 0);
      }

      wheelTorque =
        ratio === 0 ? 0 : (turbineTorque * ratio * eff * shiftCut) / n;
      // Creep: the converter pushes the car at closed throttle in a forward
      // range. It is a wheel-side force, not extra pump capacity.
      if (
        ratio > 0 &&
        throttle < 0.06 &&
        Math.abs(vehicleSpeedMs) < 2.2
      ) {
        wheelTorque += this.spec.creepTorqueNm / n;
      }
      lastRpm = this.engine.currentRpm;

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
      this.meanWheelOmega = meanOmega;

      const wheelSpeed = Math.abs(meanOmega) * this.wheelRadiusM;
      const groundSpeed = Math.abs(vehicleSpeedMs);
      this.wheelSlip = Math.max(0, (wheelSpeed - groundSpeed) / Math.max(1.5, groundSpeed));
    }

    this.updateShiftSchedule(throttle, vehicleSpeedMs);
    this.timeInGearS += dt;

    return {
      wheelTorqueNm: wheelTorque,
      engineRpm: lastRpm,
      gear: this.gearbox.currentGear,
      clutchSlipRadS: slip,
      clutchLocked: locked,
      engineRunning: this.engine.isRunning,
      engineStalled: wasRunning && !this.engine.isRunning,
      tractionForceN: this.tractionForceN,
    };
  }

  /**
   * Throttle-aware ratio schedule with kickdown and wheelspin escape.
   *
   * The schedule reads the real gearbox input speed (driven-wheel omega × the
   * signed total ratio), not the car's road speed. The distinction matters when
   * the driven wheels spin: the engine is at the limiter and the gearbox input
   * is already fast while the car is barely moving, so a road-speed schedule
   * holds first gear far too long. Converter slip, wheel slip and the engine
   * limiter are all considered, and every shift is checked against the engine
   * speed it would produce in the target gear.
   */
  private updateShiftSchedule(throttle: number, vehicleSpeedMs: number): void {
    const gear = this.gearbox.currentGear;
    if (gear <= 0 || this.gearbox.isShifting || this.shiftCooldownS > 0) return;

    const rps = 60 / (2 * Math.PI);
    const ratio = Math.abs(this.gearbox.ratio());
    if (ratio === 0) return;

    const wheelRpm = Math.abs(this.meanWheelOmega) * ratio * rps;
    const roadRpm = (Math.abs(vehicleSpeedMs) / this.wheelRadiusM) * ratio * rps;
    // The driven wheels are the gearbox's real input; the road speed is only a
    // floor for the case where the tyre model is still catching up.
    const turbineRpm = Math.max(wheelRpm, roadRpm * 0.96);
    const engineRpm = this.engine.currentRpm;
    const converterSlipRpm = Math.max(0, engineRpm - turbineRpm);
    const maxRpm = this.engine.spec.maxRpm;
    const maxGear = this.gearbox.spec.gears.length;
    const roadSpeedKph = Math.abs(vehicleSpeedMs) * 3.6;

    const upThreshold = this.spec.upshiftRpm - (1 - throttle) * 900;
    const canUpshift = gear < maxGear && this.timeInGearS > 0.55;
    const predictedUpRpm = canUpshift
      ? this.gearbox.predictedEngineRpm(gear + 1, this.meanWheelOmega)
      : Infinity;

    // 1. Normal schedule: the input shaft has reached its shift point and the
    //    next gear will not drop the engine below its usable band.
    if (canUpshift && turbineRpm > upThreshold && predictedUpRpm > 1100) {
      this.request(gear + 1);
      return;
    }

    // 2. Wheelspin escape: the engine is screaming while the car is slow. A
    //    short-shift cuts torque multiplication at the wheel and lets the tyre
    //    hook up again.
    if (
      canUpshift &&
      this.wheelSlip > 0.3 &&
      engineRpm > this.spec.upshiftRpm * 0.84 &&
      roadSpeedKph < this.carTopSpeedKph() * 0.7
    ) {
      this.request(gear + 1);
      return;
    }

    // 3. Limiter protection with a slipping converter (deep mud, steep climb).
    if (
      canUpshift &&
      engineRpm > maxRpm * 0.97 &&
      converterSlipRpm > 500 &&
      predictedUpRpm > 900
    ) {
      this.request(gear + 1);
      return;
    }

    const predictedDownRpm = this.gearbox.predictedEngineRpm(gear - 1, this.meanWheelOmega);
    const downIsSafe = predictedDownRpm < maxRpm * 0.92;

    // 4. Kickdown: a firm pedal at low input speed drops one ratio.
    if (
      throttle > this.spec.kickdownThrottle &&
      turbineRpm < this.spec.kickdownRpm &&
      gear > 1 &&
      downIsSafe
    ) {
      this.request(gear - 1);
      return;
    }

    // 5. Coast / climb-downshift.
    if (gear > 1 && turbineRpm < this.spec.downshiftRpm && downIsSafe && this.wheelSlip < 0.35) {
      this.request(gear - 1);
    }
  }

  private carTopSpeedKph(): number {
    return this.topSpeedKph;
  }

  private request(target: number): void {
    const result = this.gearbox.requestShift(
      target,
      1,
      this.engine.spec.maxRpm,
      this.meanWheelOmega,
    );
    if (result.ok) {
      this.shiftCooldownS = Math.max(0.35, this.spec.shiftTimeS * 1.6);
      this.timeInGearS = 0;
    }
  }

  /** Driver selector: R (−1), N (0), D (1). */
  selectRange(range: -1 | 0 | 1): void {
    this.gearbox.forceGear(range === 1 ? 1 : range);
    this.shiftCooldownS = 0.5;
    this.timeInGearS = 0;
  }
}
