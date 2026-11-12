/**
 * Vehicle art blueprints.
 *
 * A blueprint is the authored, model-specific side elevation of one car. It is
 * the single source of truth for the body, glazing, lamps, trim and wheels in
 * every screen (garage cards, detail, upgrade preview, race, opponents, ghost).
 *
 * Coordinates:
 *   u — metres along the body, 0 at the body centre, +u toward the nose.
 *       The nose sits at +lengthM/2 and the tail at −lengthM/2.
 *   v — fraction of body height, 0 at the sill, 1 at the roof.
 *
 * Real cars do not have equal front and rear overhangs, so the body is *not*
 * centred between the axles. `bodyShiftM()` converts the blueprint into the
 * chassis frame, whose origin is the axle midpoint.
 */

export interface Pt {
  u: number;
  v: number;
}

export type RimStyle = 'mesh' | 'spoke' | 'rugged' | 'multi' | 'aero' | 'steel';

export interface WheelBlueprint {
  /** Rim face radius as a fraction of the tyre radius. */
  rimRatio: number;
  spokes: number;
  style: RimStyle;
  /** Caliper paint; stock cars get a muted colour. */
  caliper: string;
  /** Sidewall band as a fraction of the tyre radius. */
  sidewall: number;
  /** Small sidewall lettering arc. */
  lettering?: boolean;
}

export interface LampSpec {
  /** Lens polygon (body coordinates). */
  lens: Pt[];
  /** Projector / reflector centre. */
  projector?: Pt;
  /** LED or filament signature drawn as a stroke. */
  signature?: Pt[];
  /** Amber indicator patch. */
  indicator?: Pt[];
}

export interface TrimSpec {
  roofRails?: { u0: number; u1: number; height: number };
  cladding?: boolean;
  sideStep?: { u0: number; u1: number };
  spoiler?: 'lip' | 'wing';
  chrome?: boolean;
  antenna?: { u: number; fin: boolean };
  /** Black plastic arch trim, fraction of wheel radius. */
  archTrim?: number;
  /** Fuel filler flap. */
  fuelFlap?: { u: number; v: number };
}

export interface DoorSpec {
  /** Door cut lines, each from belt to rocker. */
  seams: { u: number; top: number; bottom: number; slope: number }[];
  handles: { u: number; v: number }[];
}

export interface CarBlueprint {
  id: string;

  /** Front overhang: nose to front axle, metres. */
  frontOverhangM: number;
  /** Rear overhang: rear axle to tail, metres. */
  rearOverhangM: number;

  /** Body silhouette from tail to nose; the renderer closes it along the rocker. */
  outline: Pt[];
  /** Main window opening. */
  glass: Pt[];
  /** Optional rear quarter light. */
  quarterGlass?: Pt[];

  head: LampSpec;
  tail: LampSpec;
  grille: Pt[];

  doors: DoorSpec;

  /** Character lines pressed into the panels (dark undercut + light catch). */
  characterLines: { points: Pt[]; strength: number }[];

  trim: TrimSpec;
  wheel: WheelBlueprint;

  /** What must stay recognisable at gameplay size; used by the art QA checklist. */
  identity: string[];
}

export interface CarDimensions {
  lengthM: number;
  wheelbaseM: number;
  heightM: number;
}

/** Body-frame shift: the chassis origin is the axle midpoint. */
export function bodyShiftM(bp: CarBlueprint): number {
  return (bp.frontOverhangM - bp.rearOverhangM) / 2;
}

/** Overhangs and wheelbase must add up to the body length. */
export function blueprintIsConsistent(
  bp: CarBlueprint,
  dims: CarDimensions,
  toleranceM = 0.08,
): boolean {
  const sum = dims.wheelbaseM + bp.frontOverhangM + bp.rearOverhangM;
  return Math.abs(sum - dims.lengthM) <= toleranceM;
}

/** Wheel centres in body coordinates (metres). */
export function axlePoints(bp: CarBlueprint, dims: CarDimensions): { front: number; rear: number } {
  return {
    front: dims.lengthM / 2 - bp.frontOverhangM,
    rear: -dims.lengthM / 2 + bp.rearOverhangM,
  };
}
