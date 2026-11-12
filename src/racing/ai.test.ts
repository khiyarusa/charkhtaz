import { describe, expect, it } from 'vitest';
import { Vec2, World } from 'planck';
import { TrackBuilder } from '../tracks/builder';
import type { TrackDefinition } from '../tracks/types';
import { Terrain } from '../physics/terrain';
import { Vehicle } from '../physics/vehicle';
import { getCar, resolveCar } from '../vehicles/profiles';
import { AIDriver } from './ai';

function flatTrack(): TrackDefinition {
  const b = new TrackBuilder(0, 0, 'asphalt-dry');
  b.flat(400);
  return b.build({
    id: 'ai-flat',
    nameFa: 'تست',
    nameEn: 'Test',
    regionFa: 'تست',
    descriptionFa: 'test',
    biome: 'urban',
    difficulty: 1,
    seed: 1,
  });
}

function runAI(carId: string, seconds: number) {
  const world = new World({ gravity: Vec2(0, -9.81) });
  const track = flatTrack();
  new Terrain(world, track);
  const car = resolveCar(getCar(carId));
  const vehicle = new Vehicle(world, car, 6, 0);
  const driver = new AIDriver(vehicle, track, { skill: 0.7 });
  for (let i = 0; i < 60 * seconds; i++) {
    const input = driver.update(1 / 60);
    vehicle.update(1 / 60, input);
    world.step(1 / 60);
    vehicle.afterStep(1 / 60);
  }
  return vehicle;
}

describe('AI driver', () => {
  it('drives an automatic car forward without teleporting', () => {
    const vehicle = runAI('prado-150-2021', 8);
    expect(vehicle.x).toBeGreaterThan(25);
    expect(Number.isFinite(vehicle.x)).toBe(true);
    expect(vehicle.telemetry.engineRunning).toBe(true);
  });

  it('operates a manual gearbox and clutch', () => {
    const vehicle = runAI('shahin-1401', 8);
    expect(vehicle.x).toBeGreaterThan(12);
    expect(vehicle.gear).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(vehicle.speedMs)).toBe(true);
  });
});
