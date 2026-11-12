# CHARKHTAZ v0.3.0 — vehicle-art overhaul

## What changed

**Every car now has its own measured side elevation.** The eight cars were drawn
from published dimensions and per-model design cues instead of category
templates:

| Car | Body | Overhang split | Source confidence |
| --- | --- | --- | --- |
| Saipa Shahin 1.5T (2022 GLX) | 4,460 mm | 0.86 / 0.95 m | split estimated (class analogue) |
| Toyota Prado 150 4.0 V6 (2021 TX-L) | 4,760 mm simulated | 0.87 / 1.10 m | normalised to simulation length |
| BMW 320i G20 (2021 Sport Line) | 4,709 mm | 0.87 / 0.99 m | inferred split ±35 mm |
| Peugeot 206 1.4 (2008 Type 2) | 3,835 mm | 0.71 / 0.68 m | rear published, front derived |
| IKCO Tara 1.6 (2023 automatic) | 4,505 mm | 0.88 / 0.97 m | both published |
| Renault Tondar 90 (2014 E2) | 4,250 mm | 0.78 / 0.84 m | both published |
| Toyota Corolla E210 1.6 (2020 XLI) | 4,630 mm | 0.94 / 0.99 m | both published |
| Mazda MX-5 ND 2.0 (2019) | 3,915 mm | 0.79 / 0.82 m | split estimated ±40 mm |

- **Blueprint system.** `src/vehicles/art/` holds one authored blueprint per car:
  outline in metres, glasshouse, head/tail lamp polygons, grille, door cuts,
  character lines, trim and per-model wheel spec. The body is drawn around the
  real axle midpoint, so asymmetric front/rear overhangs are correct.
- **Layered renderer.** Catmull-Rom outline with corner preservation, clipped
  detail layers (no floating lamps, bumpers or plates), horizon and clear-coat
  reflections, authored glass with reflections/frit, B-pillar, door seams, roof
  highlight, boot crease, lamp housings with projector and LED signature, brake
  light state, per-model rims with tread blocks and calipers.
- **Validation.** Tests enforce eight complete blueprints, overhang sum = body
  length, silhouette spanning ±length/2, glass/lamps/grille inside the body,
  belt/roof bounds and wheel-to-height proportions.

## Verification

- `npm test`: **80 tests in 12 files**, all passing. `tsc --noEmit` and
  `vite build` green (417.5 kB JS, 110.4 kB gzip).
- Fleet sheet at a common world scale: `docs/vehicle-art/exports/fleet-sheet.png`.
- Runtime capture: 27 screenshots in `docs/visual-qa/round-3/`, zero console
  errors, three simultaneous pedal pointers (80/45/70), median frame time
  16.7 ms (59.9 fps).
- Route completion still verified on all six tracks under AI control.

## Known limitations

- The cars are **authored vector illustrations**, not hand-painted sprite art.
  Proportions and model-specific equipment are measured; the material richness of
  painted art is not reached.
- Proportions were checked against published dimensions and derived landmarks,
  **not** against side-view photographs (no redistributable photo references were
  used). No silhouette-IoU comparison against real photos is claimed.
- The four sedans (Shahin, Tara, Tondar, Corolla) are the same body class; at
  gameplay scale they differ by proportion, lamps and colour rather than a
  dramatic silhouette.
- The Prado's simulated length (4,760 mm) is shorter than the published 5,010 mm
  with the spare carrier; the art is normalised to the simulation.
- **NOT TESTED ON PHYSICAL ANDROID.** CI compiles and packages the app; rendering
  on a real phone is unverified.
- No manufacturer logos; trademark/design clearance is not established.
