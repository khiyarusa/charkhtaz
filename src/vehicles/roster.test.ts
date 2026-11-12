import { describe, expect, it } from 'vitest';
import { ALL_CARS, getAnyCar, isRosterCar } from './registry';
import { emptyUpgrades, performanceStats, sanitizeUpgrades } from './upgrades';
import { resolveCar } from './profiles';

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

  it('every car has a model-specific silhouette and equipment block', () => {
    for (const car of ALL_CARS) {
      expect(car.art.profile, `${car.id} profile`).toBeDefined();
      expect((car.art.profile ?? []).length).toBeGreaterThanOrEqual(6);
      expect(car.art.detail, `${car.id} detail`).toBeDefined();
      expect(car.art.bodyColor).toMatch(/^#[0-9a-f]{6}$/i);
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
