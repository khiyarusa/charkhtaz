import type { SurfaceSpec } from './types';

/** Pacejka-style longitudinal slip-curve constants. */
const B = 10;
const C = 1.65;

/**
 * Normalized longitudinal tire force curve f(κ):
 * f(0) = 0, peak exactly 1.0 near κ ≈ 0.14, sliding value ≈ 0.52,
 * odd symmetry. For C < 2 the peak is exactly sin(π/2) = 1.
 */
export function slipCurve(slipRatio: number): number {
  return Math.sin(C * Math.atan(B * slipRatio));
}

/** Slope df/dκ of the slip curve (used for semi-implicit integration). */
export function curveSlope(slipRatio: number): number {
  const x = Math.atan(B * slipRatio);
  return (C * B * Math.cos(C * x)) / (1 + B * slipRatio * B * slipRatio);
}

/**
 * Longitudinal contact force (N). Magnitude never exceeds
 * tireGrip × surface.friction × load.
 */
export function longitudinalForceN(
  slipRatio: number,
  loadN: number,
  surface: SurfaceSpec,
  tireGrip = 1,
): number {
  return tireGrip * surface.friction * loadN * slipCurve(slipRatio);
}

/**
 * Wheel slip ratio κ = (ωR − v) / max(|v|, minSpeed).
 * The speed floor keeps κ finite at standstill (launch and brake lock).
 */
export function slipRatio(
  wheelOmegaRadS: number,
  wheelRadiusM: number,
  vehicleSpeedMs: number,
  minSpeedMs = 0.5,
): number {
  const denom = Math.max(Math.abs(vehicleSpeedMs), minSpeedMs);
  return (wheelOmegaRadS * wheelRadiusM - vehicleSpeedMs) / denom;
}

export interface WheelStepResult {
  omegaRadS: number;
  forceN: number;
}

/**
 * Stable per-step wheel angular update under the longitudinal tire model.
 *
 * Semi-implicit: the tire force's reaction to this step's wheel-speed change
 * is folded into the denominator. This keeps the very stiff low-speed
 * coupling (ωR vs v) stable at 60–480 Hz without sub-millisecond steps.
 */
export function stepWheelOmega(
  wheelOmegaRadS: number,
  driveTorqueNm: number,
  loadN: number,
  surface: SurfaceSpec,
  wheelRadiusM: number,
  wheelInertia: number,
  vehicleSpeedMs: number,
  dt: number,
  tireGrip = 1,
): WheelStepResult {
  const kappa = slipRatio(wheelOmegaRadS, wheelRadiusM, vehicleSpeedMs);
  const forceN = longitudinalForceN(kappa, loadN, surface, tireGrip);

  // d(F·R)/dω at the current slip — Nm per rad/s of damping.
  // Past the peak of the slip curve the true slope turns negative; using it
  // would pump energy into the wheel update, so the linearisation is floored
  // at a small positive value. This keeps the stiff low-speed coupling
  // (wheel speed vs. road speed) convergent instead of oscillating.
  const denomSpeed = Math.max(Math.abs(vehicleSpeedMs), 0.5);
  const slope = Math.max(Math.abs(curveSlope(kappa)), 0.45);
  const dampingNm =
    slope *
    tireGrip *
    surface.friction *
    Math.max(loadN, 0) *
    (wheelRadiusM / denomSpeed) *
    wheelRadiusM;

  const omega =
    wheelOmegaRadS +
    (dt * (driveTorqueNm - forceN * wheelRadiusM)) /
      (wheelInertia + dt * dampingNm);

  return { omegaRadS: omega, forceN };
}

/**
 * Wheel update including a service brake.
 *
 * Brake torque always opposes rotation. If the wheel would be dragged through
 * zero by the brake it locks: angular speed is clamped to 0 and the tire force
 * becomes the sliding-friction value for κ = −1 instead of the near-zero force
 * of an unloaded, stationary wheel. This is what makes a non-ABS car skid on
 * loose surfaces while an ABS car keeps the wheel rolling near peak slip.
 */
export function stepWheelWithBrake(
  wheelOmegaRadS: number,
  driveTorqueNm: number,
  brakeTorqueNm: number,
  loadN: number,
  surface: SurfaceSpec,
  wheelRadiusM: number,
  wheelInertia: number,
  vehicleSpeedMs: number,
  dt: number,
  tireGrip = 1,
): WheelStepResult {
  const dir = Math.sign(wheelOmegaRadS);
  const brake = Math.max(0, brakeTorqueNm);
  const torque = driveTorqueNm - dir * brake;
  const result = stepWheelOmega(
    wheelOmegaRadS,
    torque,
    loadN,
    surface,
    wheelRadiusM,
    wheelInertia,
    vehicleSpeedMs,
    dt,
    tireGrip,
  );

  let omega = result.omegaRadS;
  if (dir !== 0 && Math.sign(omega) !== dir) {
    omega = 0;
  }

  // A locked wheel slides at κ ≈ −1, which is a *large* braking force, not 0.
  const forceN =
    omega === 0 && Math.abs(vehicleSpeedMs) > 0.2
      ? longitudinalForceN(
          slipRatio(0, wheelRadiusM, vehicleSpeedMs),
          loadN,
          surface,
          tireGrip,
        )
      : result.forceN;

  return { omegaRadS: omega, forceN };
}


/**
 * Free-rolling (non-driven) wheel update.
 *
 * A free wheel is held at the road speed by friction (no drive torque), so it
 * is solved as pure rolling. Braking is a contact-patch force capped by the
 * same friction limit; when the brake asks for more than the tyre can hold the
 * wheel locks and the tyre produces sliding force. This avoids integrating the
 * very stiff wheel/road coupling explicitly while keeping the force physical.
 */
export function stepFreeWheel(
  wheelOmegaRadS: number,
  brakeTorqueNm: number,
  loadN: number,
  surface: SurfaceSpec,
  wheelRadiusM: number,
  _wheelInertia: number,
  vehicleSpeedMs: number,
  _dt: number,
  tireGrip = 1,
): WheelStepResult {
  const gripLimit = tireGrip * surface.friction * Math.max(loadN, 0);
  const brakeForce = brakeTorqueNm / wheelRadiusM;

  // Stopped and the brake can hold it: no force, no rotation.
  if (Math.abs(vehicleSpeedMs) < 0.12 && brakeForce < gripLimit) {
    return { omegaRadS: 0, forceN: 0 };
  }

  // Locked: brake demand exceeds available grip.
  if (brakeForce >= gripLimit && gripLimit > 0) {
    const kappa = slipRatio(0, wheelRadiusM, vehicleSpeedMs);
    return {
      omegaRadS: 0,
      forceN: longitudinalForceN(kappa, loadN, surface, tireGrip),
    };
  }

  // Rolling: wheel speed follows the road; the brake force opposes motion.
  const forceN = -Math.sign(vehicleSpeedMs) * brakeForce;
  return { omegaRadS: vehicleSpeedMs / wheelRadiusM, forceN };
}
