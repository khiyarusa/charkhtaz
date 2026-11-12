# VEHICLE ART — BASELINE (Round 3)

Recorded at the start of the Round 3 vehicle-art overhaul, 2026-11-12.

## Repository state

| Item | Value |
| --- | --- |
| Starting commit | `87f6b65` (`assets(qa): refresh the home screenshot from the shipped build`) |
| Branch | `main`, clean working tree |
| Release tag | `v0.2.0` → `a9f84d4` (three commits behind `main`; the extra commits are documentation and a screenshot only) |
| Previous tags | `v0.1.0 … v0.1.3` |
| Build/test baseline | `tsc --noEmit` clean, 77 tests in 12 files passing, `vite build` 405 kB JS / 31 kB CSS |

`main` and `v0.2.0` were compared commit by commit. The tag points at `a9f84d4`;
exactly two commits follow it on `main`: `6760deb` (docs: CI runs, release
assets, checksums) and `87f6b65` (refresh home screenshot). Neither changes
application code, so `87f6b65` is the newest coherent state and preserves every
released v0.2.0 feature. Round 3 builds on `87f6b65`.

## Active roster (from source, not docs)

`src/vehicles/registry.ts` merges `CAR_PROFILES` (3) and `EXTRA_CARS` (5):

| # | id | Model | Year / trim | Layout · gearbox |
| --- | --- | --- | --- | --- |
| 1 | `shahin-1401` | Saipa Shahin 1.5T | 2022 · GLX | FWD · 5MT |
| 2 | `prado-150-2021` | Toyota Land Cruiser Prado 150 4.0 V6 | 2021 · TX-L | AWD · 6AT |
| 3 | `bmw-320i-g20` | BMW 320i G20 | 2021 · Sport Line | RWD · 8AT |
| 4 | `peugeot-206` | Peugeot 206 1.4 | 2008 · Type 2 | FWD · 5MT |
| 5 | `ikco-tara` | IKCO Tara 1.6 | 2023 · automatic | FWD · 6AT |
| 6 | `tondar-90` | Renault Tondar 90 | 2014 · E2 | FWD · 5MT |
| 7 | `corolla-e210` | Toyota Corolla E210 1.6 | 2020 · XLI | FWD · CVT |
| 8 | `mx5-nd` | Mazda MX-5 ND 2.0 | 2019 · Skyactiv-G | RWD · 6MT |

The roster is authoritative. The v0.1 README's "three cars" statement is stale and
must be corrected, not preserved.

## Current art architecture

- `src/render/vehicle-art.ts` (35 kB) draws the whole car with Canvas 2D
  primitives: `drawCarBody()` traces a normalised side profile (`u` along the
  car, `v` from sill to roof), punches wheel arches with an even-odd fill, then
  layers paint, glass, doors, lamps, bumpers, plate, cladding and damage.
  `drawWheel()` draws tyre, tread blocks, disc, caliper and rim.
- Each car stores `art.profile` (a 15–16 point outline) and `art.detail` (lamp,
  grille, tail, roof rails, cladding, side step, spoiler, chrome, antenna) in
  `src/vehicles/profiles.ts` / `extra-cars.ts`.
- `CarArt.kind` (`sedan` / `suv` / `sport`) still supplies fallback profiles and
  default equipment. This is the last generic path: any car without its own
  profile silently falls back to a category template.
- Call sites: `src/render/renderer.ts` (race, opponents, ghost) and
  `src/ui/app.ts` (`paintCarPreview` for hero, garage cards, detail, upgrades).
  Both use the same functions, so garage and gameplay currently share geometry.
- Wheels are positioned from the Planck wheel bodies (`renderPose(alpha)`), never
  from fixed offsets.

## Known art limitations (the reason for Round 3)

1. Proportions are eyeballed per profile, not derived from measured overhangs,
   roof position and glass extents. Wheelbase is physical but the body around it
   is approximate.
2. One outline + a few flags per car cannot express model-specific glasshouses,
   character lines, lamp geometry or bumpers. Several cars read as variations of
   the same sedan.
3. Materials are simple two-stop gradients. No clear-coat, no reflection band
   tied to the light direction, no material separation between paint, glass,
   chrome and plastic.
4. Wheels share three rim styles; they are not model-specific.
5. The fallback `kind` profiles remain in the code path.
6. No asset manifest, no validation of anchors/aspect, no fleet comparison sheet.

## Protected systems (must not regress)

Physics (`src/physics/*`), drivetrain (`src/vehicles/{engine,clutch,gearbox,tire,
drivetrain,auto}.ts`), controls (`src/controls/pedals.ts`), scene/timing
(`src/game/scene.ts`), AI and ghost (`src/racing/*`), career/economy
(`src/career/*`), audio (`src/audio/*`), save schema (`src/save/storage.ts`),
upgrade rules (`src/vehicles/upgrades.ts`), route data. Round 3 changes vehicle
art data and the art renderer only; physics anchors stay authoritative.

## Stage plan and gates

| Stage | Output | Gate |
| --- | --- | --- |
| A | this document | evidence-based baseline, no gameplay change |
| B | `VEHICLE_REFERENCE_LEDGER.md`, `VEHICLE_ART_SPEC.md`, research notes | every car covered |
| C | first car (BMW 320i) re-authored and integrated | convincingly model-specific at gameplay size |
| D | all eight cars | fleet sheet at common scale |
| E | runtime integration, obsolete paths removed | every screen uses the same definition |
| F | QA, tests, CI, release | acceptance matrix |

## Risks

- Model fidelity depends on reference quality; Iranian-market trims have thinner
  public documentation. Unknown details will be labelled as interpretations.
- Canvas vector art has a quality ceiling below hand-painted raster. The chosen
  method and its limits are documented rather than overstated.
- The art overhaul must not disturb the physics anchors; any wheel/arch mismatch
  is fixed in art space, not by moving wheel bodies.

## Build/test baseline (before any change)

```
tsc --noEmit        clean
vitest run src      77 passed / 12 files
vite build          405.29 kB JS (106.47 kB gzip), 30.77 kB CSS
```
