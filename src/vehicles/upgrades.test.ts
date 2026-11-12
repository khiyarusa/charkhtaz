import { describe, expect, it } from 'vitest';
import { getCar } from './profiles';
import { getAnyCar } from './registry';
import {
  emptyUpgrades,
  isUpgradeCompatible,
  partPrice,
  performanceStats,
  sanitizeUpgrades,
  upgradeRefund,
  resolveWith,
} from './upgrades';
import { DEFAULT_CONDITION } from './profiles';

describe('upgrade system', () => {
  it('refuses a clutch upgrade on an automatic car but allows it on a manual', () => {
    expect(isUpgradeCompatible(getCar('prado-150-2021'), 'clutch').ok).toBe(false);
    expect(isUpgradeCompatible(getCar('shahin-1401'), 'clutch').ok).toBe(true);
  });

  it('refuses ratio kits on a CVT car', () => {
    const corolla = getAnyCar('corolla-e210');
    expect(isUpgradeCompatible(corolla, 'transmission').ok).toBe(false);
    expect(sanitizeUpgrades(corolla, { transmission: 3 }).transmission).toBe(0);
    expect(isUpgradeCompatible(getAnyCar('ikco-tara'), 'transmission').ok).toBe(true);
  });

  it('derives displayed power from the tuned torque curve', () => {
    const car = getCar('shahin-1401');
    const stock = performanceStats(car, emptyUpgrades());
    const tuned = performanceStats(car, sanitizeUpgrades(car, { engine: 3 }));
    expect(tuned.powerHp).toBeGreaterThan(stock.powerHp);
    // 178 Nm at 2 500 rpm over 7 127 is ~62 hp; the peak-power point must be
    // higher than the peak-torque point and inside the engine's rev range.
    const peak = car.engine.torqueCurve.reduce(
      (m, p) => Math.max(m, (p.nm * p.rpm) / 7127),
      0,
    );
    expect(Math.abs(stock.powerHp - Math.round(peak))).toBeLessThanOrEqual(1);
  });

  it('refunds half of the installed tier when a part is removed', () => {
    const car = getCar('shahin-1401');
    const price3 = partPrice('engine', 3, car);
    expect(upgradeRefund(car, 'engine', 3)).toBe(Math.round(price3 * 0.5));
    expect(upgradeRefund(car, 'engine', 0)).toBe(0);
  });

  it('sanitizes incompatible and out-of-range levels', () => {
    const prado = getCar('prado-150-2021');
    const levels = sanitizeUpgrades(prado, { engine: 9, clutch: 2, tires: -4, differential: 1 });
    expect(levels.engine).toBe(3);
    expect(levels.clutch).toBe(0);
    expect(levels.tires).toBe(0);
    expect(levels.differential).toBe(1);
  });

  it('raises real torque, grip and price consistently', () => {
    const car = getCar('shahin-1401');
    const stock = performanceStats(car, emptyUpgrades());
    const tuned = sanitizeUpgrades(car, { engine: 3, tires: 3, brakes: 2, weight: 3 });
    const after = performanceStats(car, tuned);
    expect(after.torqueNm).toBeGreaterThan(stock.torqueNm);
    expect(after.grip).toBeGreaterThan(stock.grip);
    expect(after.brakingNm).toBeGreaterThan(stock.brakingNm);
    expect(after.massKg).toBeLessThan(stock.massKg);
    expect(partPrice('engine', 3, car)).toBeGreaterThan(partPrice('engine', 1, car));
  });

  it('resolves the tuned specs into the same physics profile', () => {
    const car = getCar('shahin-1401');
    const stock = resolveWith(car, emptyUpgrades(), DEFAULT_CONDITION);
    const tuned = resolveWith(car, sanitizeUpgrades(car, { engine: 2, transmission: 3, tires: 2 }), DEFAULT_CONDITION);
    const stockTorque = stock.engine.torqueCurve.reduce((m, p) => Math.max(m, p.nm), 0);
    const tunedTorque = tuned.engine.torqueCurve.reduce((m, p) => Math.max(m, p.nm), 0);
    expect(tunedTorque).toBeGreaterThan(stockTorque);
    expect(tuned.gearbox.shiftTimeS).toBeLessThan(stock.gearbox.shiftTimeS);
    expect(tuned.numbers.tireGrip).toBeGreaterThan(stock.numbers.tireGrip);
  });
});
