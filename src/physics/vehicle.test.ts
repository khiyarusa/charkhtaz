import { describe, expect, it } from 'vitest';
import { Vec2, World } from 'planck';
import { getCar, resolveCar } from '../vehicles/profiles';
import { TrackBuilder } from '../tracks/builder';
import type { TrackDefinition } from '../tracks/types';
import { Terrain } from './terrain';
import { Vehicle } from './vehicle';

const DT = 1 / 60;

function flatTrack(lengthM = 300): TrackDefinition {
  const b = new TrackBuilder(0, 0, 'asphalt-dry');
  b.flat(lengthM);
  return b.build({
    id: 'test-flat',
    nameFa: 'تست',
    nameEn: 'Test',
    regionFa: 'تست',
    descriptionFa: 'test',
    biome: 'urban',
    difficulty: 1,
    seed: 1,
    checkpointEveryM: 100,
  });
}

function makeWorld(carId: string) {
  const world = new World({ gravity: Vec2(0, -9.81) });
  const track = flatTrack();
  new Terrain(world, track);
  const car = resolveCar(getCar(carId));
  const vehicle = new Vehicle(world, car, 5, 0);
  return { world, track, car, vehicle };
}

describe('Vehicle on flat asphalt', () => {
  it('manual car launches and accelerates without exploding', () => {
    const { world, vehicle } = makeWorld('shahin-1401');

    vehicle.update(DT, { throttle: 0, brake: 0, clutch: 1 });
    const shift = vehicle.requestGear(1);
    expect(shift.ok).toBe(true);

    // Realistic launch: bring the revs up first, then release the clutch
    // progressively over ~1.2 s (an abrupt release at idle would stall).
    for (let i = 0; i < 60 * 12; i++) {
      const t = i / 60;
      const throttle = Math.min(1, Math.max(0, (t - 0.1) * 2));
      const clutch = t < 0.8 ? 1 : Math.max(0, 1 - (t - 0.8) / 1.2);
      vehicle.update(DT, { throttle, brake: 0, clutch });
      world.step(DT);
      vehicle.afterStep(DT);
    }

    const tele = vehicle.telemetry;
    expect(Number.isFinite(vehicle.x)).toBe(true);
    expect(Number.isFinite(vehicle.y)).toBe(true);
    expect(tele.speedKph).toBeGreaterThan(20);
    expect(tele.rpm).toBeGreaterThan(700);
    expect(tele.rpm).toBeLessThan(7000);
    expect(tele.gear).toBeGreaterThanOrEqual(1);
    expect(tele.engineRunning).toBe(true);
  });

  it('automatic car creeps and accelerates from standstill', () => {
    const { world, vehicle } = makeWorld('prado-150-2021');
    const startX = vehicle.x;

    for (let i = 0; i < 60 * 8; i++) {
      vehicle.update(DT, { throttle: 0.9, brake: 0, clutch: 0 });
      world.step(DT);
    }

    const tele = vehicle.telemetry;
    expect(vehicle.x - startX).toBeGreaterThan(15);
    expect(tele.speedKph).toBeGreaterThan(10);
    expect(tele.gear).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(tele.rpm)).toBe(true);
  });

  it('automatic keeps idling with the brake held', () => {
    const { world, vehicle } = makeWorld('prado-150-2021');
    for (let i = 0; i < 60 * 6; i++) {
      vehicle.update(DT, { throttle: 0, brake: 1, clutch: 0 });
      world.step(DT);
    }
    const tele = vehicle.telemetry;
    expect(tele.engineRunning).toBe(true);
    expect(tele.rpm).toBeGreaterThan(450);
    expect(tele.rpm).toBeLessThan(1200);
  });

  it('brakes to a near stop and wheels stay finite', () => {
    const { world, vehicle } = makeWorld('bmw-320i-g20');

    for (let i = 0; i < 240; i++) {
      vehicle.update(DT, { throttle: 1, brake: 0, clutch: 0 });
      world.step(DT);
    }
    const cruise = vehicle.telemetry.speedKph;
    expect(cruise).toBeGreaterThan(20);

    for (let i = 0; i < 240; i++) {
      vehicle.update(DT, { throttle: 0, brake: 1, clutch: 0 });
      world.step(DT);
    }

    const stopped = vehicle.telemetry;
    expect(stopped.speedKph).toBeLessThan(cruise * 0.35);
    for (const wheel of stopped.wheels) {
      expect(Number.isFinite(wheel.omegaRadS)).toBe(true);
      expect(Number.isFinite(wheel.loadN)).toBe(true);
    }
    expect(Number.isFinite(stopped.damage)).toBe(true);
  });
});
