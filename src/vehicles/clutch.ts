import { clamp, clamp01 } from '../core/math';
import type { ClutchSpec } from './types';

/**
 * Clutch model with a progressive friction (bite) zone.
 *
 * Pedal convention: 0 = released (fully engaged), 1 = fully pressed
 * (disengaged). Between `biteStart` and `biteEnd` the available torque
 * capacity decays smoothly — the "bite point" drivers learn to modulate.
 *
 * Transmitted torque is treated as a viscous coupling that saturates at the
 * current capacity (Coulomb clamp). The drivetrain solves the viscous zone
 * implicitly, which keeps clutch lock-up stable at simulation rate.
 */
export class ClutchModel {
  readonly spec: ClutchSpec;

  constructor(spec: ClutchSpec) {
    this.spec = spec;
  }

  /** Fraction of full torque capacity available at a pedal position (0..1). */
  engagement(pedal: number): number {
    const p = clamp01(pedal);
    if (p <= this.spec.biteStart) return 1;
    if (p >= this.spec.biteEnd) return 0;
    const t = (p - this.spec.biteStart) / (this.spec.biteEnd - this.spec.biteStart);
    // smoothstep: progressive bite feel
    return 1 - t * t * (3 - 2 * t);
  }

  /** Torque capacity at a pedal position (Nm, ≥ 0). */
  capacityNm(pedal: number): number {
    return this.engagement(pedal) * this.spec.maxTorqueNm;
  }

  /**
   * Torque transmitted to the gearbox input shaft (Nm).
   * Positive when the engine leads (drives the wheels); negative when the
   * wheels lead (engine braking / drag). Saturates at the current capacity.
   */
  transmittedTorqueNm(deltaOmegaRadS: number, pedal: number): number {
    const cap = this.capacityNm(pedal);
    if (cap <= 0) return 0;
    return clamp((cap * deltaOmegaRadS) / this.spec.lockSlipRadS, -cap, cap);
  }
}
