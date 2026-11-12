/** Shared types for the vehicle dynamics layer. */

/**
 * Pedal inputs, all continuous 0..1, produced by the three vertical sliders.
 *
 * Clutch convention: 0 = pedal released (clutch ENGAGED, torque flows),
 * 1 = pedal fully pressed (clutch DISENGAGED, no torque).
 */
export interface PedalInput {
  throttle: number;
  brake: number;
  /** Clutch pedal depression 0..1 (manual vehicles only). */
  clutch: number;
}

export interface TorquePoint {
  rpm: number;
  nm: number;
}

export interface EngineSpec {
  /** Idle target in rpm. */
  idleRpm: number;
  /** Engine stops below this rpm (must be < idleRpm). */
  stallRpm: number;
  /** Fuel cut / redline in rpm. Mechanical over-rev can still exceed this. */
  maxRpm: number;
  /** Effective rotating inertia of engine + flywheel + clutch disc, kg·m². */
  inertia: number;
  /** Wide-open-throttle torque curve points, ascending by rpm. */
  torqueCurve: readonly TorquePoint[];
  /** Pumping/brake torque coefficient at closed throttle, Nm per rad/s. */
  engineBrakeCoef: number;
  /** Constant internal friction torque, Nm. */
  constFrictionNm: number;
  /** Idle fueling torque (holds idle against friction), Nm. */
  idleTorqueNm: number;
  /** Idle fuel fades out this many rpm above idleRpm. */
  idleFadeRpm: number;
  /** Throttle input smoothing time constant, seconds. */
  throttleTau: number;
  /** Damage accumulation rate per second, weighted by relative over-rev. */
  overrevDamageRate: number;
  /** Damage starts only above maxRpm × this factor (limiter-buzz grace). */
  overrevGrace: number;
}

export interface ClutchSpec {
  /** Torque capacity when fully engaged, Nm (should exceed engine peak torque). */
  maxTorqueNm: number;
  /** Pedal position where the friction zone starts (below = fully engaged). */
  biteStart: number;
  /** Pedal position at/above which the clutch is fully disengaged. */
  biteEnd: number;
  /** |Δω| (rad/s) over which the clutch locks progressively below capacity. */
  lockSlipRadS: number;
}

export interface GearboxSpec {
  /** Forward gear ratios, gear 1 first. */
  gears: readonly number[];
  /** Reverse ratio (positive magnitude; the sign is handled internally). */
  reverse: number;
  finalDrive: number;
  /** Time to complete a shift with the torque path open, seconds. */
  shiftTimeS: number;
  /** Minimum clutch pedal depression (0..1) required to shift a manual box. */
  clutchThreshold: number;
  /** Driveline efficiency (gearbox + differential), 0..1. */
  drivelineEfficiency: number;
}

/** Surface contact properties used by the tire model. */
export interface SurfaceSpec {
  id: string;
  /** Peak friction coefficient of this surface. */
  friction: number;
  /** Rolling resistance coefficient (force ≈ coef × normal load). */
  rollingResistance: number;
}

/**
 * Torque-converter automatic transmission parameters.
 *
 * The converter is modelled as a fluid coupling whose pump torque grows with
 * engine speed squared; below `lockupSpeedRatio` the stator multiplies torque
 * by up to `converterStallRatio`. Above `converterLockRpm` the lock-up clutch
 * closes and the engine is rigidly tied to the gearbox input.
 */
export interface AutoSpec {
  /** Engine rpm at which a full-throttle upshift is commanded. */
  upshiftRpm: number;
  /** Engine rpm below which a downshift is commanded. */
  downshiftRpm: number;
  /** Throttle above which a kickdown to the next lower gear is allowed. */
  kickdownThrottle: number;
  /** Engine rpm below which kickdown may drop a gear. */
  kickdownRpm: number;
  /** Time to complete a ratio change, seconds. */
  shiftTimeS: number;
  /** Fraction of engine torque cut while the ratio change is in progress. */
  torqueCut: number;
  /** Stall torque multiplication of the converter (≈1.7–2.0). */
  converterStallRatio: number;
  /** Engine rpm above which the lock-up clutch may close. */
  converterLockRpm: number;
  /** Creep torque delivered to the wheels at closed throttle, Nm. */
  creepTorqueNm: number;
}

/** Gear selector state: -1 reverse, 0 neutral, 1..N forward. */
export type GearIndex = number;

export interface ShiftResult {
  ok: boolean;
  reason?: 'invalid' | 'clutch' | 'busy';
  /** Set when the shift is accepted but will mechanically over-rev the engine. */
  warning?: 'overrev';
}
