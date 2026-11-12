import type { CarBlueprint, Pt } from './types';

/**
 * Authored side elevations for the active roster.
 *
 * Proportions are derived from the research in
 * `docs/vehicle-art/VEHICLE_REFERENCE_LEDGER.md` and
 * `docs/vehicle-art/research/*.md`:
 *
 *   u — metres from the body centre; nose at +length/2, tail at −length/2.
 *   v — fraction of body height measured from the renderer's sill anchor,
 *       v = (z_metres − 0.035) / (heightM − 0.04).
 *
 * Overhangs are published for the Tara, Tondar, Corolla, BMW, 206 and MX-5.
 * The Shahin split is a class-analogue estimate; the Prado is normalised to the
 * simulation length because the published 5,010 mm includes the spare carrier.
 * Cabin landmarks come from the measured beltline, roof and screen positions in
 * each research file.
 *
 * Each entry is independent geometry — there is no shared body template.
 */

const p = (u: number, v: number): Pt => ({ u, v });

/* ------------------------------------------------------------------ Shahin */
export const shahin: CarBlueprint = {
  id: 'shahin-1401',
  frontOverhangM: 0.86,
  rearOverhangM: 0.95,
  outline: [
    p(-2.23, 0.3), p(-2.225, 0.48), p(-2.17, 0.57), p(-1.98, 0.6),
    p(-1.72, 0.615), p(-1.38, 0.632), p(-0.95, 0.9), p(-0.58, 0.972),
    p(-0.1, 1.0), p(0.3, 0.992), p(0.513, 0.955), p(1.07, 0.69),
    p(1.45, 0.665), p(1.85, 0.63), p(2.1, 0.585), p(2.2, 0.52),
    p(2.228, 0.42), p(2.22, 0.24),
  ],
  glass: [
    p(-1.38, 0.68), p(-0.98, 0.878), p(-0.58, 0.944), p(-0.1, 0.971),
    p(0.3, 0.961), p(0.51, 0.925), p(1.05, 0.694),
  ],
  head: {
    lens: [p(1.86, 0.45), p(2.19, 0.52), p(2.21, 0.43), p(1.88, 0.39)],
    projector: p(2.05, 0.47),
    signature: [p(1.9, 0.48), p(2.12, 0.51)],
  },
  tail: {
    lens: [p(-2.215, 0.48), p(-2.03, 0.515), p(-2.02, 0.42), p(-2.2, 0.39)],
    signature: [p(-2.18, 0.465), p(-2.06, 0.482)],
  },
  grille: [p(2.12, 0.32), p(2.21, 0.32), p(2.21, 0.41), p(2.12, 0.41)],
  doors: {
    seams: [
      { u: 1.05, top: 0.7, bottom: 0.1, slope: 0.02 },
      { u: -0.42, top: 0.7, bottom: 0.1, slope: 0.01 },
      { u: -1.45, top: 0.64, bottom: 0.12, slope: 0.03 },
    ],
    handles: [p(0.05, 0.65), p(-0.95, 0.66)],
  },
  characterLines: [
    { points: [p(-1.95, 0.5), p(-0.6, 0.53), p(0.9, 0.54), p(2.02, 0.5)], strength: 0.8 },
  ],
  trim: { antenna: { u: -0.95, fin: true }, fuelFlap: { u: -1.75, v: 0.52 } },
  wheel: { rimRatio: 0.62, spokes: 7, style: 'multi', caliper: '#5a5f63', sidewall: 0.6 },
  identity: [
    'tall glasshouse with a near-vertical C-pillar and short boot',
    'high beltline (≈0.68 v) with a rising shoulder crease',
    'compact sedan proportions: 4,460 mm long on a 2,650 mm wheelbase',
    'body-colour mirrors and slim body-colour door handles',
    'seven-spoke 15-inch alloy on 185/65 R15',
  ],
};

/* --------------------------------------------------------------- Prado 150 */
export const prado: CarBlueprint = {
  id: 'prado-150-2021',
  frontOverhangM: 0.87,
  rearOverhangM: 1.1,
  outline: [
    p(-2.38, 0.3), p(-2.375, 0.56), p(-2.33, 0.75), p(-2.22, 0.87),
    p(-2.0, 0.935), p(-1.785, 0.955), p(-0.95, 0.988), p(-0.3, 1.0),
    p(0.4, 0.994), p(0.762, 0.962), p(1.0, 0.86), p(1.43, 0.62),
    p(1.75, 0.595), p(2.1, 0.575), p(2.3, 0.55), p(2.37, 0.5),
    p(2.375, 0.42), p(2.36, 0.3), p(2.34, 0.2),
  ],
  glass: [
    p(-1.785, 0.62), p(-1.4, 0.87), p(-0.95, 0.93), p(-0.3, 0.955),
    p(0.4, 0.947), p(0.762, 0.925), p(1.0, 0.815), p(1.4, 0.63),
  ],
  quarterGlass: [p(-2.1, 0.64), p(-1.95, 0.84), p(-1.62, 0.915), p(-1.5, 0.915), p(-1.5, 0.64)],
  head: {
    lens: [p(1.95, 0.5), p(2.3, 0.575), p(2.34, 0.49), p(2.0, 0.45)],
    projector: p(2.14, 0.52),
    signature: [p(2.0, 0.535), p(2.27, 0.56)],
  },
  tail: {
    lens: [p(-2.36, 0.56), p(-2.2, 0.62), p(-2.18, 0.5), p(-2.34, 0.45)],
    signature: [p(-2.33, 0.545), p(-2.22, 0.585)],
  },
  grille: [p(2.1, 0.4), p(2.3, 0.42), p(2.32, 0.53), p(2.12, 0.52)],
  doors: {
    seams: [
      { u: 1.43, top: 0.62, bottom: 0.12, slope: 0.02 },
      { u: -0.08, top: 0.62, bottom: 0.12, slope: 0.01 },
      { u: -1.2, top: 0.62, bottom: 0.12, slope: 0.02 },
      { u: -2.16, top: 0.62, bottom: 0.16, slope: 0.0 },
    ],
    handles: [p(0.55, 0.55), p(-0.62, 0.55)],
  },
  characterLines: [
    { points: [p(-2.3, 0.52), p(-0.8, 0.55), p(0.9, 0.57), p(2.24, 0.53)], strength: 0.6 },
  ],
  trim: {
    roofRails: { u0: -2.0, u1: 0.45, height: 0.035 },
    cladding: true,
    sideStep: { u0: -1.45, u1: 1.0 },
    chrome: true,
    archTrim: 0.18,
    fuelFlap: { u: -1.7, v: 0.5 },
  },
  wheel: { rimRatio: 0.6, spokes: 6, style: 'rugged', caliper: '#3c3f42', sidewall: 0.68 },
  identity: [
    'upright, near-vertical windscreen and a long flat roof',
    'tall glasshouse split by a thick C-pillar with a rear quarter light',
    'roof rails, black arch cladding and a running board',
    'high bonnet line (≈0.55 v) and a deep chrome-framed grille',
    '265/65 R17 on a six-spoke rugged alloy with a tall sidewall',
  ],
};

/* ------------------------------------------------------------- BMW 320i G20 */
export const bmw320i: CarBlueprint = {
  id: 'bmw-320i-g20',
  frontOverhangM: 0.87,
  rearOverhangM: 0.988,
  outline: [
    p(-2.3545, 0.3), p(-2.35, 0.46), p(-2.3, 0.55), p(-2.15, 0.585),
    p(-1.95, 0.6), p(-1.483, 0.615), p(-1.0, 0.862), p(-0.565, 0.968),
    p(-0.1, 1.0), p(0.25, 0.99), p(0.541, 0.955), p(0.9, 0.8),
    p(1.154, 0.7), p(1.5, 0.665), p(2.0, 0.6), p(2.25, 0.57),
    p(2.33, 0.52), p(2.3545, 0.42), p(2.34, 0.24),
  ],
  glass: [
    p(-1.483, 0.7), p(-1.39, 0.735), p(-1.3, 0.765), p(-1.0, 0.878),
    p(-0.565, 0.952), p(-0.1, 0.982), p(0.25, 0.972), p(0.541, 0.94),
    p(1.13, 0.712),
  ],
  head: {
    lens: [p(2.06, 0.47), p(2.33, 0.52), p(2.35, 0.43), p(2.1, 0.4)],
    projector: p(2.2, 0.455),
    signature: [p(2.12, 0.49), p(2.3, 0.51)],
  },
  tail: {
    lens: [p(-2.35, 0.47), p(-2.12, 0.515), p(-2.1, 0.42), p(-2.33, 0.38)],
    signature: [p(-2.3, 0.485), p(-2.16, 0.505)],
  },
  grille: [p(2.22, 0.31), p(2.34, 0.33), p(2.34, 0.43), p(2.22, 0.42)],
  doors: {
    seams: [
      { u: 1.1, top: 0.7, bottom: 0.1, slope: 0.02 },
      { u: -0.55, top: 0.7, bottom: 0.1, slope: 0.01 },
      { u: -1.5, top: 0.66, bottom: 0.12, slope: 0.03 },
    ],
    handles: [p(0.15, 0.65), p(-1.0, 0.65)],
  },
  characterLines: [
    { points: [p(-2.1, 0.55), p(-0.9, 0.585), p(0.6, 0.605), p(2.15, 0.56)], strength: 1 },
    { points: [p(-1.9, 0.42), p(0.2, 0.44), p(1.9, 0.46)], strength: 0.45 },
  ],
  trim: { antenna: { u: -0.9, fin: true }, fuelFlap: { u: -1.75, v: 0.52 } },
  wheel: { rimRatio: 0.66, spokes: 10, style: 'multi', caliper: '#6b7076', sidewall: 0.48 },
  identity: [
    'Hofmeister kink at the base of the rear window',
    'long bonnet and cab-rearward stance, screen base behind the front axle',
    'sharp shoulder line from the tail lamp to the headlamp',
    'slim horizontal headlamp and wide kidney-grille edge at the nose',
    '18-inch V-spoke style 780 bicolour alloys on 225/45 R18',
  ],
};

/* ---------------------------------------------------------------- Peugeot 206 */
export const peugeot206: CarBlueprint = {
  id: 'peugeot-206',
  frontOverhangM: 0.712,
  rearOverhangM: 0.678,
  outline: [
    p(-1.9175, 0.3), p(-1.912, 0.5), p(-1.87, 0.64), p(-1.78, 0.76),
    p(-1.6, 0.86), p(-1.35, 0.925), p(-0.95, 0.965), p(-0.62, 1.0),
    p(-0.1, 1.0), p(0.3, 0.985), p(0.6, 0.9), p(0.92, 0.7),
    p(1.2, 0.665), p(1.6, 0.62), p(1.83, 0.56), p(1.9, 0.48),
    p(1.916, 0.38), p(1.91, 0.24),
  ],
  glass: [
    p(-1.6, 0.676), p(-1.42, 0.86), p(-0.95, 0.945), p(-0.62, 0.972),
    p(-0.1, 0.975), p(0.3, 0.955), p(0.6, 0.872), p(0.9, 0.692),
  ],
  head: {
    lens: [p(1.66, 0.45), p(1.78, 0.53), p(1.87, 0.49), p(1.86, 0.39), p(1.72, 0.37)],
    projector: p(1.77, 0.45),
  },
  tail: {
    lens: [p(-1.85, 0.51), p(-1.74, 0.57), p(-1.72, 0.47), p(-1.84, 0.43)],
    signature: [p(-1.83, 0.51), p(-1.75, 0.54)],
  },
  grille: [p(1.82, 0.33), p(1.9, 0.34), p(1.9, 0.41), p(1.82, 0.41)],
  doors: {
    seams: [
      { u: 0.9, top: 0.68, bottom: 0.1, slope: 0.02 },
      { u: -1.25, top: 0.66, bottom: 0.12, slope: 0.02 },
    ],
    handles: [p(0.05, 0.64)],
  },
  characterLines: [
    { points: [p(-1.6, 0.53), p(-0.4, 0.56), p(0.9, 0.57), p(1.76, 0.52)], strength: 0.7 },
  ],
  trim: { antenna: { u: -1.15, fin: false }, archTrim: 0.12, fuelFlap: { u: -1.55, v: 0.54 } },
  wheel: { rimRatio: 0.6, spokes: 5, style: 'multi', caliper: '#4a4d50', sidewall: 0.62 },
  identity: [
    'three-door hatchback roofline with a near-vertical tailgate',
    'very short rear overhang (680 mm) and a long front door',
    'round headlamp in a teardrop housing, visible from the side',
    'upright windscreen and a tall, narrow glasshouse',
    '14-inch five-spoke wheel with a tall 65-series sidewall',
  ],
};

/* ------------------------------------------------------------------- Tara */
export const tara: CarBlueprint = {
  id: 'ikco-tara',
  frontOverhangM: 0.878,
  rearOverhangM: 0.975,
  outline: [
    p(-2.2525, 0.28), p(-2.248, 0.48), p(-2.19, 0.57), p(-2.0, 0.605),
    p(-1.7, 0.62), p(-1.4, 0.635), p(-1.0, 0.885), p(-0.586, 0.966),
    p(-0.1, 0.998), p(0.3, 0.99), p(0.518, 0.955), p(0.9, 0.78),
    p(1.1, 0.69), p(1.45, 0.665), p(1.85, 0.63), p(2.1, 0.59),
    p(2.2, 0.53), p(2.248, 0.43), p(2.24, 0.24),
  ],
  glass: [
    p(-1.4, 0.68), p(-1.0, 0.872), p(-0.586, 0.94), p(-0.1, 0.97),
    p(0.3, 0.96), p(0.518, 0.925), p(1.09, 0.694),
  ],
  head: {
    lens: [p(1.88, 0.45), p(2.2, 0.51), p(2.22, 0.42), p(1.9, 0.38)],
    projector: p(2.06, 0.45),
    signature: [p(1.92, 0.47), p(2.14, 0.5)],
  },
  tail: {
    lens: [p(-2.24, 0.48), p(-2.05, 0.52), p(-2.04, 0.42), p(-2.22, 0.38)],
    signature: [p(-2.21, 0.46), p(-2.08, 0.49)],
  },
  grille: [p(2.13, 0.32), p(2.22, 0.33), p(2.22, 0.42), p(2.13, 0.41)],
  doors: {
    seams: [
      { u: 1.1, top: 0.7, bottom: 0.1, slope: 0.02 },
      { u: -0.4, top: 0.7, bottom: 0.1, slope: 0.01 },
      { u: -1.42, top: 0.64, bottom: 0.12, slope: 0.03 },
    ],
    handles: [p(0.08, 0.65), p(-0.92, 0.66)],
  },
  characterLines: [
    { points: [p(-2.05, 0.5), p(-0.7, 0.54), p(0.8, 0.55), p(2.05, 0.5)], strength: 0.8 },
  ],
  trim: { chrome: true, antenna: { u: -0.9, fin: true }, fuelFlap: { u: -1.72, v: 0.52 } },
  wheel: { rimRatio: 0.64, spokes: 8, style: 'multi', caliper: '#5d6165', sidewall: 0.55 },
  identity: [
    'compact Iranian sedan with a tall, upright cabin',
    'chrome window surround and a straight beltline at ≈0.68 v',
    'wide, slim headlamp meeting a narrow grille',
    'four-door body with a short rear deck',
    '16-inch eight-spoke alloy on 205/55 R16',
  ],
};

/* --------------------------------------------------------------- Tondar 90 */
export const tondar90: CarBlueprint = {
  id: 'tondar-90',
  frontOverhangM: 0.777,
  rearOverhangM: 0.843,
  outline: [
    p(-2.125, 0.3), p(-2.12, 0.51), p(-2.07, 0.61), p(-1.88, 0.64),
    p(-1.52, 0.653), p(-1.32, 0.665), p(-0.9, 0.9), p(-0.595, 0.97),
    p(-0.15, 0.998), p(0.25, 0.99), p(0.425, 0.958), p(0.8, 0.79),
    p(0.935, 0.7), p(1.3, 0.675), p(1.75, 0.64), p(2.03, 0.59),
    p(2.1, 0.53), p(2.122, 0.43), p(2.118, 0.26),
  ],
  glass: [
    p(-1.32, 0.679), p(-0.9, 0.882), p(-0.595, 0.944), p(-0.15, 0.97),
    p(0.25, 0.962), p(0.425, 0.93), p(0.92, 0.702),
  ],
  head: {
    lens: [p(1.8, 0.46), p(2.07, 0.52), p(2.09, 0.43), p(1.82, 0.39)],
    projector: p(1.95, 0.46),
  },
  tail: {
    lens: [p(-2.11, 0.5), p(-1.94, 0.54), p(-1.93, 0.44), p(-2.09, 0.4)],
    signature: [p(-2.08, 0.48), p(-1.96, 0.51)],
  },
  grille: [p(1.95, 0.34), p(2.08, 0.35), p(2.08, 0.43), p(1.95, 0.42)],
  doors: {
    seams: [
      { u: 0.95, top: 0.7, bottom: 0.1, slope: 0.02 },
      { u: -0.42, top: 0.7, bottom: 0.1, slope: 0.01 },
      { u: -1.4, top: 0.665, bottom: 0.12, slope: 0.03 },
    ],
    handles: [p(0.02, 0.65), p(-0.92, 0.66)],
  },
  characterLines: [
    { points: [p(-1.95, 0.5), p(-0.6, 0.53), p(0.7, 0.54), p(1.95, 0.5)], strength: 0.6 },
  ],
  trim: { antenna: { u: -1.05, fin: false }, fuelFlap: { u: -1.7, v: 0.54 } },
  wheel: { rimRatio: 0.56, spokes: 5, style: 'steel', caliper: '#4c4f52', sidewall: 0.66 },
  identity: [
    'tall, boxy saloon silhouette with a high roofline',
    'long rear door and a near-vertical C-pillar',
    'simple, wide headlamp and a slim grille',
    'steel wheels with covers on the E2 trim',
    'four-door body with a large glasshouse',
  ],
};

/* ------------------------------------------------------------ Corolla E210 */
export const corollaE210: CarBlueprint = {
  id: 'corolla-e210',
  frontOverhangM: 0.935,
  rearOverhangM: 0.995,
  outline: [
    p(-2.315, 0.3), p(-2.31, 0.49), p(-2.25, 0.58), p(-2.03, 0.61),
    p(-1.72, 0.625), p(-1.551, 0.64), p(-1.05, 0.87), p(-0.671, 0.962),
    p(-0.06, 0.998), p(0.35, 0.985), p(0.579, 0.95), p(0.95, 0.78),
    p(1.25, 0.7), p(1.55, 0.675), p(1.95, 0.63), p(2.2, 0.59),
    p(2.29, 0.53), p(2.312, 0.43), p(2.3, 0.24),
  ],
  glass: [
    p(-1.551, 0.692), p(-1.05, 0.856), p(-0.671, 0.94), p(-0.06, 0.972),
    p(0.35, 0.958), p(0.579, 0.918), p(1.22, 0.712),
  ],
  head: {
    lens: [p(1.94, 0.47), p(2.27, 0.53), p(2.29, 0.44), p(1.98, 0.41)],
    projector: p(2.12, 0.48),
    signature: [p(1.98, 0.49), p(2.22, 0.52)],
  },
  tail: {
    lens: [p(-2.3, 0.49), p(-2.1, 0.54), p(-2.09, 0.44), p(-2.28, 0.4)],
    signature: [p(-2.26, 0.49), p(-2.14, 0.52)],
  },
  grille: [p(2.16, 0.34), p(2.28, 0.35), p(2.28, 0.45), p(2.16, 0.44)],
  doors: {
    seams: [
      { u: 1.2, top: 0.69, bottom: 0.1, slope: 0.02 },
      { u: -0.42, top: 0.69, bottom: 0.1, slope: 0.01 },
      { u: -1.45, top: 0.65, bottom: 0.12, slope: 0.03 },
    ],
    handles: [p(0.12, 0.64), p(-0.95, 0.65)],
  },
  characterLines: [
    { points: [p(-2.1, 0.53), p(-0.9, 0.57), p(0.7, 0.59), p(2.15, 0.55)], strength: 0.95 },
  ],
  trim: { chrome: true, antenna: { u: -0.85, fin: true }, fuelFlap: { u: -1.75, v: 0.52 } },
  wheel: { rimRatio: 0.64, spokes: 8, style: 'multi', caliper: '#5b5f63', sidewall: 0.55 },
  identity: [
    'fastback roofline falling into a short rear deck',
    'slender C-pillar and a high rear shoulder',
    'long, slim headlamp above a strong bumper crease',
    'prominent shoulder line from tail lamp to headlamp',
    '16-inch eight-spoke alloy on 205/55 R16',
  ],
};

/* ----------------------------------------------------------------- MX-5 ND */
export const mx5nd: CarBlueprint = {
  id: 'mx5-nd',
  frontOverhangM: 0.785,
  rearOverhangM: 0.82,
  outline: [
    p(-1.9575, 0.34), p(-1.952, 0.53), p(-1.895, 0.64), p(-1.74, 0.68),
    p(-1.4, 0.7), p(-1.312, 0.72), p(-1.05, 0.9), p(-0.548, 0.98),
    p(-0.2, 1.0), p(0.15, 0.99), p(0.352, 0.955), p(0.6, 0.84),
    p(0.861, 0.7), p(1.2, 0.67), p(1.6, 0.63), p(1.83, 0.58),
    p(1.92, 0.52), p(1.952, 0.45), p(1.945, 0.3),
  ],
  glass: [
    p(-1.312, 0.674), p(-1.05, 0.878), p(-0.548, 0.955), p(-0.2, 0.975),
    p(0.15, 0.968), p(0.352, 0.93), p(0.83, 0.712),
  ],
  head: {
    lens: [p(1.7, 0.45), p(1.9, 0.53), p(1.94, 0.46), p(1.74, 0.39)],
    projector: p(1.82, 0.46),
    signature: [p(1.74, 0.47), p(1.88, 0.51)],
  },
  tail: {
    lens: [p(-1.93, 0.5), p(-1.78, 0.54), p(-1.77, 0.46), p(-1.92, 0.42)],
    signature: [p(-1.9, 0.49), p(-1.8, 0.52)],
  },
  grille: [p(1.8, 0.28), p(1.93, 0.3), p(1.93, 0.38), p(1.8, 0.38)],
  doors: {
    seams: [{ u: 0.83, top: 0.68, bottom: 0.14, slope: 0.03 }, { u: -1.3, top: 0.66, bottom: 0.14, slope: 0.04 }],
    handles: [p(-0.05, 0.64)],
  },
  characterLines: [
    { points: [p(-1.7, 0.53), p(-0.6, 0.57), p(0.6, 0.58), p(1.75, 0.53)], strength: 1 },
    { points: [p(-1.2, 0.38), p(0.0, 0.4), p(1.2, 0.42)], strength: 0.4 },
  ],
  trim: { spoiler: 'lip', antenna: { u: -1.0, fin: false }, fuelFlap: { u: -1.55, v: 0.54 } },
  wheel: { rimRatio: 0.68, spokes: 10, style: 'multi', caliper: '#5b2b26', sidewall: 0.42 },
  identity: [
    'low, wide roadster with a short rear deck and a long bonnet',
    'cab-rearward glasshouse and a fast, curved windscreen',
    'rear wheel-arch blister over a short rear overhang',
    'deep front grille opening and a slim swept headlamp',
    '17-inch ten-spoke alloy on 205/45 R17',
  ],
};

export const BLUEPRINTS: readonly CarBlueprint[] = [
  shahin,
  prado,
  bmw320i,
  peugeot206,
  tara,
  tondar90,
  corollaE210,
  mx5nd,
];
