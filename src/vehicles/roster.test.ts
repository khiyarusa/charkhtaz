import { describe, expect, it } from 'vitest';
import { ALL_CARS, getAnyCar, isRosterCar } from './registry';
import { emptyUpgrades, performanceStats, sanitizeUpgrades } from './upgrades';
import { resolveCar } from './profiles';
import { BLUEPRINTS, blueprintFor, hasBlueprint } from './art';
import { blueprintIsConsistent, bodyShiftM, type Pt } from './art/types';

/**
 * Roster and asset-manifest validation. These are the checks that stop a new
 * car from shipping with a generic body, a missing powertrain or numbers that
 * disagree with the published figures the garage displays.
 */
describe('vehicle roster', () => {
  it('ships at least eight distinct, complete vehicles', () => {
    expect(ALL_CARS.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(ALL_CARS.map((c) => c.id));
    expect(ids.size).toBe(ALL_CARS.length);
    for (const car of ALL_CARS) {
      expect(car.brandFa.length).toBeGreaterThan(0);
      expect(car.modelFa.length).toBeGreaterThan(0);
      expect(car.year).toBeGreaterThan(1990);
      expect(car.trim.length).toBeGreaterThan(0);
      expect(car.descriptionFa.length).toBeGreaterThan(40);
      expect(car.specs.sourceNoteFa.length).toBeGreaterThan(20);
      expect(car.priceCredits).toBeGreaterThanOrEqual(0);
      expect(isRosterCar(car.id)).toBe(true);
    }
  });

  it('every car has a complete model-specific art blueprint', () => {
    expect(BLUEPRINTS.length).toBe(ALL_CARS.length);
    for (const car of ALL_CARS) {
      expect(hasBlueprint(car.id), `${car.id} blueprint`).toBe(true);
      const bp = blueprintFor(car.id);
      expect(bp.id).toBe(car.id);
      expect(bp.outline.length, `${car.id} outline points`).toBeGreaterThanOrEqual(14);
      expect(bp.glass.length, `${car.id} glass points`).toBeGreaterThanOrEqual(5);
      expect(bp.head.lens.length).toBeGreaterThanOrEqual(4);
      expect(bp.tail.lens.length).toBeGreaterThanOrEqual(4);
      expect(bp.grille.length).toBeGreaterThanOrEqual(3);
      expect(bp.identity.length, `${car.id} identity checklist`).toBeGreaterThanOrEqual(4);
      expect(bp.doors.seams.length, `${car.id} door cuts`).toBeGreaterThanOrEqual(1);
      expect(bp.doors.handles.length).toBeGreaterThanOrEqual(1);
      expect(bp.wheel.spokes).toBeGreaterThanOrEqual(5);
      expect(bp.wheel.rimRatio).toBeGreaterThan(0.5);
      expect(bp.wheel.rimRatio).toBeLessThan(0.75);
      expect(bp.wheel.sidewall).toBeGreaterThan(0.3);
    }
  });

  it('blueprint proportions close on the published dimensions', () => {
    for (const car of ALL_CARS) {
      const bp = blueprintFor(car.id);
      const dims = {
        lengthM: car.numbers.lengthM,
        wheelbaseM: car.numbers.wheelbaseM,
        heightM: car.numbers.heightM,
      };
      // Overhangs + wheelbase must equal the body length the physics uses.
      expect(blueprintIsConsistent(bp, dims), `${car.id} overhang sum`).toBe(true);
      // The silhouette must span the full body length.
      const minU = Math.min(...bp.outline.map((q) => q.u));
      const maxU = Math.max(...bp.outline.map((q) => q.u));
      expect(Math.abs(minU + dims.lengthM / 2), `${car.id} tail`).toBeLessThan(0.02);
      expect(Math.abs(maxU - dims.lengthM / 2), `${car.id} nose`).toBeLessThan(0.02);
      // Body shift stays small and physical.
      expect(Math.abs(bodyShiftM(bp))).toBeLessThan(0.2);
      // Roofline reaches v ≈ 1 and the sill sits at the body bottom.
      expect(Math.max(...bp.outline.map((q) => q.v))).toBeGreaterThan(0.95);
      expect(Math.min(...bp.outline.map((q) => q.v))).toBeLessThan(0.36);
    }
  });

  it('glass, lamps and grille sit inside the painted silhouette', () => {
    const inside = (poly: readonly Pt[], outline: readonly Pt[]): boolean => {
      const minU = Math.min(...outline.map((q) => q.u));
      const maxU = Math.max(...outline.map((q) => q.u));
      const minV = Math.min(...outline.map((q) => q.v));
      const maxV = Math.max(...outline.map((q) => q.v));
      return poly.every((q) => q.u >= minU - 0.02 && q.u <= maxU + 0.02 && q.v >= minV - 0.02 && q.v <= maxV + 0.02);
    };
    for (const car of ALL_CARS) {
      const bp = blueprintFor(car.id);
      expect(inside(bp.glass, bp.outline), `${car.id} glass bounds`).toBe(true);
      expect(inside(bp.head.lens, bp.outline), `${car.id} head lamp bounds`).toBe(true);
      expect(inside(bp.tail.lens, bp.outline), `${car.id} tail lamp bounds`).toBe(true);
      expect(inside(bp.grille, bp.outline), `${car.id} grille bounds`).toBe(true);
      // Glass must sit above the belt and inside the body height.
      const glassMin = Math.min(...bp.glass.map((q) => q.v));
      const glassMax = Math.max(...bp.glass.map((q) => q.v));
      expect(glassMin).toBeGreaterThan(0.4);
      expect(glassMax).toBeLessThan(1.0);
    }
  });

  it('wheels sit under their arches and the rig is physically plausible', () => {
    for (const car of ALL_CARS) {
      const bp = blueprintFor(car.id);
      const dims = car.numbers;
      const front = dims.lengthM / 2 - bp.frontOverhangM;
      const rear = -dims.lengthM / 2 + bp.rearOverhangM;
      expect(front - rear).toBeCloseTo(dims.wheelbaseM, 2);
      // Wheel diameter must be a believable fraction of the body height.
      const ratio = (dims.wheelRadiusM * 2) / dims.heightM;
      expect(ratio).toBeGreaterThan(0.33);
      expect(ratio).toBeLessThan(0.55);
    }
  });

  it('powertrain, gearbox and drivetrain data are coherent', () => {
    for (const car of ALL_CARS) {
      const n = car.numbers;
      expect(n.massKg, `${car.id} mass`).toBeGreaterThan(700);
      expect(n.wheelbaseM, `${car.id} wheelbase`).toBeLessThan(n.lengthM);
      expect(n.wheelbaseM, `${car.id} wheelbase`).toBeGreaterThan(n.lengthM * 0.45);
      expect(n.wheelRadiusM).toBeGreaterThan(0.25);
      expect(n.wheelRadiusM).toBeLessThan(0.45);
      expect(n.tireGrip).toBeGreaterThan(0.6);
      expect(n.suspensionFrequencyHz).toBeGreaterThan(1);
      expect(car.gearbox.gears.length).toBeGreaterThanOrEqual(4);
      expect(car.gearbox.finalDrive).toBeGreaterThan(2);

      if (car.transmission === 'manual') {
        expect(car.clutch, `${car.id} clutch`).not.toBeNull();
        expect(car.auto, `${car.id} auto`).toBeNull();
        expect(car.gearbox.clutchThreshold).toBeGreaterThan(0.3);
      } else {
        expect(car.auto, `${car.id} auto`).not.toBeNull();
        expect(car.clutch).toBeNull();
        expect(car.auto!.upshiftRpm).toBeGreaterThan(car.auto!.downshiftRpm);
      }

      const peakTorque = car.engine.torqueCurve.reduce((m, p) => Math.max(m, p.nm), 0);
      expect(Math.abs(peakTorque - car.specs.torqueNm), `${car.id} torque`).toBeLessThanOrEqual(2);
      expect(car.engine.maxRpm).toBeGreaterThan(car.engine.idleRpm);
      expect(car.engine.stallRpm).toBeLessThan(car.engine.idleRpm);
    }
  });

  it('displayed power matches the published figure within one horsepower', () => {
    for (const car of ALL_CARS) {
      const stats = performanceStats(car, emptyUpgrades());
      expect(Math.abs(stats.powerHp - car.specs.powerHp), `${car.id} power`).toBeLessThanOrEqual(1);
    }
  });

  it('resolving upgrades keeps the same physics contract', () => {
    for (const car of ALL_CARS) {
      const levels = sanitizeUpgrades(car, {
        engine: 3,
        tires: 3,
        suspension: 2,
        brakes: 3,
        weight: 3,
        differential: 2,
        transmission: 2,
        clutch: 2,
      });
      const resolved = resolveCar(car, levels);
      expect(Number.isFinite(resolved.engine.maxRpm)).toBe(true);
      expect(resolved.engine.torqueCurve.length).toBe(car.engine.torqueCurve.length);
      expect(resolved.gearbox.gears.length).toBe(car.gearbox.gears.length);
      expect(resolved.numbers.massKg).toBeLessThan(car.numbers.massKg + 1);
      expect(resolved.numbers.tireGrip).toBeGreaterThan(car.numbers.tireGrip);
      // A tuned car must still be drivable: shift time stays positive.
      expect(resolved.gearbox.shiftTimeS).toBeGreaterThan(0.05);
    }
  });

  it('exposes display helpers for every car', () => {
    const car = getAnyCar('peugeot-206');
    expect(car.modelFa).toContain('۲۰۶');
    expect(() => getAnyCar('does-not-exist')).toThrow();
  });
});
