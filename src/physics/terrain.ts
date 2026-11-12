import { Chain, Circle, Box, Edge, Polygon, Vec2, type Body, type World } from 'planck';
import { groundPointAt } from '../tracks/builder';
import type { GroundRun, ObstacleDef, ObstacleKind, TrackDefinition } from '../tracks/types';
import { SURFACE_SPECS } from '../vehicles/profiles';
import type { SurfaceSpec } from '../vehicles/types';

export interface GroundFixtureData {
  type: 'ground';
  surface: SurfaceSpec;
}

export interface ObstacleFixtureData {
  type: 'obstacle';
  kind: ObstacleKind;
  surface: SurfaceSpec;
}

export type FixtureData = GroundFixtureData | ObstacleFixtureData;

export function fixtureSurface(fixture: {
  getUserData: () => unknown;
}): SurfaceSpec | null {
  const data = fixture.getUserData() as FixtureData | null | undefined;
  if (!data) return null;
  if (data.type === 'ground' || data.type === 'obstacle') return data.surface;
  return null;
}

const ROCK_SURFACE = SURFACE_SPECS['rock']!;
const WOOD_SURFACE = SURFACE_SPECS['wood']!;

function surfaceFor(id: string): SurfaceSpec {
  return SURFACE_SPECS[id] ?? SURFACE_SPECS['asphalt-dry']!;
}

/** Builds the static collision world for a track from its authoring data. */
export class Terrain {
  readonly bodies: Body[] = [];
  constructor(
    private readonly world: World,
    readonly def: TrackDefinition,
  ) {
    for (const run of def.runs) {
      this.createRun(run);
    }
    for (const obstacle of def.obstacles) {
      this.createObstacle(obstacle);
    }
  }

  /** Ground surface at x (null in a gap). */
  groundAt(x: number) {
    return groundPointAt(this.def.runs, x);
  }

  private createRun(run: GroundRun): void {
    if (run.points.length < 2) return;
    const body = this.world.createBody({ type: 'static' });
    const surface = surfaceFor(run.surface);
    const vertices = run.points.map((p) => Vec2(p.x, p.y));
    const shape =
      vertices.length === 2 ? new Edge(vertices[0]!, vertices[1]!) : new Chain(vertices, false);
    body.createFixture(shape, {
      friction: surface.friction,
      restitution: 0,
      filterCategoryBits: 0x0001,
      filterMaskBits: 0xffff,
      userData: { type: 'ground', surface } satisfies GroundFixtureData,
    });
    this.bodies.push(body);
  }

  private createObstacle(o: ObstacleDef): void {
    const angle = ((o.angleDeg ?? 0) * Math.PI) / 180;
    const body = this.world.createBody({
      type: 'static',
      position: Vec2(o.x, o.y ?? 0),
      angle,
    });
    const surface = o.kind === 'plank-bridge' ? WOOD_SURFACE : ROCK_SURFACE;
    const options = {
      friction: surface.friction,
      restitution: 0.02,
      filterCategoryBits: 0x0008,
      filterMaskBits: 0xffff,
      userData: { type: 'obstacle', kind: o.kind, surface } satisfies ObstacleFixtureData,
    };

    switch (o.kind) {
      case 'log':
        body.createFixture(new Circle(o.halfHeight), options);
        break;
      case 'rock': {
        // Convex, slightly irregular boulder — collision silhouette matches art.
        const n = 7;
        const verts: Vec2[] = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const wobble = 0.82 + 0.18 * Math.cos(a * 3 + 0.7);
          verts.push(Vec2(Math.cos(a) * o.halfWidth * wobble, Math.sin(a) * o.halfHeight * wobble));
        }
        body.createFixture(new Polygon(verts), options);
        break;
      }
      case 'tire-stack': {
        body.createFixture(new Box(o.halfWidth, o.halfHeight), options);
        body.createFixture(new Box(o.halfWidth * 0.62, o.halfHeight * 0.42), options);
        break;
      }
      case 'plank-bridge':
        body.createFixture(new Box(o.halfWidth, o.halfHeight), options);
        break;
      default: {
        // Blocks and barricades get chamfered top edges so a tyre can ride up
        // instead of hitting a vertical wall. Without this the car can never
        // pass a kerb taller than a few centimetres, because the wheel is
        // horizontally tied to the chassis by the wheel joint.
        const w = o.halfWidth;
        const h = o.halfHeight;
        const chamfer = Math.min(h * 0.55, w * 0.7);
        body.createFixture(
          new Polygon([
            Vec2(-w, -h),
            Vec2(w, -h),
            Vec2(w, h - chamfer),
            Vec2(w - chamfer, h),
            Vec2(-w + chamfer, h),
            Vec2(-w, h - chamfer),
          ]),
          options,
        );
        break;
      }
    }
    this.bodies.push(body);
  }
}
