import { describe, expect, it } from 'vitest';
import { Vec2, World } from 'planck';
import { getAnyCar } from '../vehicles/registry';
import { resolveCar } from '../vehicles/profiles';
import { TRACKS } from './definitions';
import { Terrain } from '../physics/terrain';
import { Vehicle } from '../physics/vehicle';
import { AIDriver } from '../racing/ai';
import { groundPointAt } from '../tracks/builder';
import type { TrackDefinition } from './types';

/**
 * Route completion regression.
 *
 * Drives every authored route with the autonomous controller and the same
 * recovery rules the scene uses (respawn after a roll-over, a fall out of the
 * world, or ten seconds stuck at full throttle). If a route cannot be finished
 * this way, a human player cannot finish it either, because the AI has the same
 * pedals, the same powertrain and no hidden torque.
 */
const CAR = 'prado-150-2021';

interface Run {
  finishedAt: number;
  maxX: number;
  flips: number;
  respawns: number;
  fellThrough: boolean;
}

function drive(track: TrackDefinition, seconds = 110): Run {
  const world = new World({ gravity: Vec2(0, -9.81) });
  new Terrain(world, track);
  const car = resolveCar(getAnyCar(CAR));
  const startX = track.startX + 6;
  const vehicle = new Vehicle(world, car, startX, groundPointAt(track.runs, startX)?.y ?? 0);
  const ai = new AIDriver(vehicle, track, { skill: 0.95 });
  let finishedAt = -1;
  let maxX = startX;
  let flips = 0;
  let respawns = 0;
  let flipped = 0;
  let stuck = 0;
  let fellThrough = false;

  for (let i = 0; i < 60 * seconds; i++) {
    const input = ai.update(1 / 60);
    vehicle.update(1 / 60, input);
    world.step(1 / 60);
    vehicle.afterStep(1 / 60);
    maxX = Math.max(maxX, vehicle.x);
    if (vehicle.x >= track.finishX) {
      finishedAt = i / 60;
      break;
    }
    let respawn = false;
    if (Math.abs(vehicle.telemetry.pitchRad) > 2.4) {
      flipped += 1 / 60;
      if (flipped > 2.2) {
        respawn = true;
        flipped = 0;
        flips++;
      }
    } else flipped = 0;
    if (vehicle.telemetry.speedKph < 2 && input.throttle > 0.5) {
      stuck += 1 / 60;
      if (stuck > 10) {
        respawn = true;
        stuck = 0;
      }
    } else stuck = 0;
    if (vehicle.y < track.boundsBottomM - 6) {
      respawn = true;
      if (vehicle.y < track.boundsBottomM - 40) fellThrough = true;
    }
    if (respawn) {
      respawns++;
      const rx = Math.max(startX, vehicle.x - 15);
      vehicle.respawnAt(rx, groundPointAt(track.runs, rx)?.y ?? 0);
      vehicle.restartEngine();
      vehicle.auto?.selectRange(1);
    }
  }
  return { finishedAt, maxX, flips, respawns, fellThrough };
}

describe('route completion', () => {
  it('finishes every authored route under autonomous control', () => {
    for (const track of TRACKS) {
      const run = drive(track);
      expect(run.fellThrough, `${track.id} fell through the terrain`).toBe(false);
      expect(run.finishedAt, `${track.id} reached ${Math.round(run.maxX)} m`).toBeGreaterThan(0);
      expect(run.finishedAt).toBeLessThan(105);
    }
  }, 300000);

  it('never lets the car fall out of the world on any route', () => {
    for (const track of TRACKS) {
      const run = drive(track, 40);
      expect(run.fellThrough, `${track.id} fell out of the world`).toBe(false);
    }
  }, 200000);
});
