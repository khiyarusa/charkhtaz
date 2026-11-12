/** Track data model. All distances in metres, y up, x forward. */

export type SurfaceId =
  | 'asphalt-dry'
  | 'asphalt-wet'
  | 'dirt'
  | 'gravel'
  | 'sand'
  | 'mud'
  | 'rock'
  | 'wood';

export type Biome = 'mountain' | 'desert' | 'forest' | 'urban';

export interface Vec2Like {
  x: number;
  y: number;
}

export interface GroundPoint extends Vec2Like {
  surface: SurfaceId;
}

export type ObstacleKind =
  | 'rock'
  | 'log'
  | 'ramp'
  | 'tire-stack'
  | 'plank-bridge'
  | 'concrete-block';

export interface ObstacleDef {
  kind: ObstacleKind;
  /** World x of the obstacle centre. */
  x: number;
  /** World y of the obstacle centre (defaults to ground at x). */
  y?: number;
  /** Half-width in metres (rock radius, log radius, ramp run/2…). */
  halfWidth: number;
  /** Half-height in metres. */
  halfHeight: number;
  /** Rotation in degrees (ramps, tilted blocks). */
  angleDeg?: number;
  /** Breakable obstacles fall apart above this impact impulse (N·s). */
  breakImpulse?: number;
}

export interface DecorationDef {
  kind: 'rock' | 'shrub' | 'tree' | 'sign' | 'pole' | 'bush' | 'grass' | 'crack';
  x: number;
  y: number;
  scale: number;
  variant: number;
}

export interface TrackDefinition {
  id: string;
  nameFa: string;
  nameEn: string;
  regionFa: string;
  descriptionFa: string;
  biome: Biome;
  difficulty: 1 | 2 | 3 | 4 | 5;
  seed: number;
  /** Contiguous ground runs, ordered by x. Gaps between runs are jumps. */
  runs: GroundRun[];
  obstacles: ObstacleDef[];
  decorations: DecorationDef[];
  checkpointsX: number[];
  startX: number;
  finishX: number;
  lengthM: number;
  /** Visual world bounds used to frame the camera. */
  boundsTopM: number;
  boundsBottomM: number;
}

export interface GroundRun {
  surface: SurfaceId;
  points: Vec2Like[];
}
