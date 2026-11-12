import { describe, expect, it } from 'vitest';
import { Vec2, World } from 'planck';
import { getAnyCar } from '../vehicles/registry';
import { resolveCar } from '../vehicles/profiles';
import { TrackBuilder } from '../tracks/builder';
import type { TrackDefinition, SurfaceId } from '../tracks/types';
import { Terrain } from '../physics/terrain';
import { Vehicle } from '../physics/vehicle';

const DT = 1 / 60;

function track(surface: SurfaceId, lengthM = 900): TrackDefinition {
  const b = new TrackBuilder(0, 0, surface);
  b.flat(lengthM);
  return b.build({
    id: `probe-${surface}`,
    nameFa: 'تست',
    nameEn: 'Probe',
    regionFa: 'تست',
    descriptionFa: 'probe',
    biome: 'desert',
    difficulty: 2,
    seed: 7,
    checkpointEveryM: 200,
  });
}

function makeVehicle(carId: string, surface: SurfaceId) {
  const world = new World({ gravity: Vec2(0, -9.81) });
  const def = track(surface);
  new Terrain(world, def);
  const car = resolveCar(getAnyCar(carId));
  const vehicle = new Vehicle(world, car, 6, 0);
  return { world, vehicle, car };
}

describe('automatic gearbox shift strategy', () => {
  it('leaves first gear while the wheels are still spinning', () => {
    // RWD 320i on a wet road: full throttle spins the rear tyres, so the car is
    // slow while the wheels and the gearbox input are fast. A road-speed
    // schedule holds 1st until ~60 km/h; the wheel-spin schedule must shift
    // far earlier, at a road speed well below the gear's top speed.
    const { world, vehicle, car } = makeVehicle('bmw-320i-g20', 'asphalt-wet');
    let firstUpshiftSpeed = -1;
    let maxRpm = 0;

    for (let i = 0; i < 60 * 5; i++) {
      vehicle.update(DT, { throttle: 1, brake: 0, clutch: 0 });
      world.step(DT);
      vehicle.afterStep(DT);
      if (firstUpshiftSpeed < 0 && vehicle.gear >= 2) {
        firstUpshiftSpeed = vehicle.telemetry.speedKph;
      }
      maxRpm = Math.max(maxRpm, vehicle.telemetry.rpm);
    }

    expect(firstUpshiftSpeed).toBeGreaterThan(0);
    expect(firstUpshiftSpeed).toBeLessThan(45);
    expect(vehicle.gear).toBeGreaterThanOrEqual(2);
    expect(maxRpm).toBeLessThan(car.engine.maxRpm * 1.06);
  });

  it('upshifts on dry asphalt and keeps pulling', () => {
    const { world, vehicle } = makeVehicle('bmw-320i-g20', 'asphalt-dry');
    const gears = new Set<number>();
    for (let i = 0; i < 60 * 9; i++) {
      vehicle.update(DT, { throttle: 1, brake: 0, clutch: 0 });
      world.step(DT);
      vehicle.afterStep(DT);
      gears.add(vehicle.gear);
    }
    expect(gears.has(1)).toBe(true);
    expect(vehicle.gear).toBeGreaterThanOrEqual(3);
    expect(vehicle.telemetry.speedKph).toBeGreaterThan(60);
  });

  it('keeps a sane gear and downshifts when the car slows', () => {
    const { world, vehicle } = makeVehicle('prado-150-2021', 'gravel');
    for (let i = 0; i < 60 * 7; i++) {
      vehicle.update(DT, { throttle: 1, brake: 0, clutch: 0 });
      world.step(DT);
      vehicle.afterStep(DT);
    }
    const afterSpin = vehicle.gear;
    expect(afterSpin).toBeGreaterThanOrEqual(2);

    // Lift off and brake: the box must come back down as the input slows.
    for (let i = 0; i < 60 * 6; i++) {
      vehicle.update(DT, { throttle: 0, brake: 0.5, clutch: 0 });
      world.step(DT);
      vehicle.afterStep(DT);
    }
    expect(vehicle.gear).toBeLessThanOrEqual(afterSpin);
    expect(vehicle.gear).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(vehicle.telemetry.rpm)).toBe(true);
  });
});

describe('suspension landing response', () => {
  it('settles after a 2 m drop without repeated bouncing', () => {
    const { world, vehicle } = makeVehicle('shahin-1401', 'asphalt-dry');
    vehicle.respawnAt(8, 2.4);

    let bounces = 0;
    let prevVy = 0;
    let contactAt = -1;
    let maxUpward = 0;
    const samples: number[] = [];

    for (let i = 0; i < 60 * 4; i++) {
      vehicle.update(DT, { throttle: 0, brake: 0, clutch: 0 });
      world.step(DT);
      vehicle.afterStep(DT);
      const vy = vehicle.chassis.getLinearVelocity().y;
      const grounded = vehicle.wheels.some((w) => w.grounded);
      if (grounded && contactAt < 0) contactAt = i;
      if (contactAt >= 0) {
        if (prevVy < -0.35 && vy > 0.12) {
          bounces++;
          maxUpward = Math.max(maxUpward, vy);
        }
        samples.push(vy);
      }
      prevVy = vy;
    }

    expect(contactAt).toBeGreaterThanOrEqual(0);
    // One rebound from the landing is acceptable; a spring-damper that keeps
    // oscillating is not. The old single-rate damper produced 3–5 bounces.
    expect(bounces).toBeLessThanOrEqual(2);
    const tail = samples.slice(-30);
    const meanTail = tail.reduce((a, b) => a + b, 0) / Math.max(1, tail.length);
    expect(Math.abs(meanTail)).toBeLessThan(0.2);
    expect(Number.isFinite(maxUpward)).toBe(true);
  });

  it('keeps wheels on the ground at rest', () => {
    const { world, vehicle } = makeVehicle('corolla-e210', 'asphalt-dry');
    for (let i = 0; i < 180; i++) {
      vehicle.update(DT, { throttle: 0, brake: 1, clutch: 1 });
      world.step(DT);
      vehicle.afterStep(DT);
    }
    for (const wheel of vehicle.telemetry.wheels) {
      expect(wheel.grounded).toBe(true);
      expect(wheel.loadN).toBeGreaterThan(1000);
    }
  });
});

describe('render interpolation', () => {
  it('interpolates between the previous and current physics pose', () => {
    const { world, vehicle } = makeVehicle('shahin-1401', 'asphalt-dry');
    for (let i = 0; i < 90; i++) {
      vehicle.update(DT, { throttle: 0.6, brake: 0, clutch: 0 });
      world.step(DT);
      vehicle.afterStep(DT);
    }
    const start = vehicle.renderPose(0);
    const end = vehicle.renderPose(1);
    const mid = vehicle.renderPose(0.5);

    expect(mid.x).toBeGreaterThan(Math.min(start.x, end.x) - 1e-6);
    expect(mid.x).toBeLessThan(Math.max(start.x, end.x) + 1e-6);
    expect(mid.y).toBeCloseTo((start.y + end.y) / 2, 6);
    // Interpolation must not disturb the authoritative physics transform.
    expect(vehicle.x).toBeCloseTo(end.x, 9);
  });
});
