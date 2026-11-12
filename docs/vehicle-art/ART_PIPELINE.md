# ART PIPELINE — vehicle blueprints

How a car gets from research to the screen, and how to change one safely.

## 1. Source of truth

```
docs/vehicle-art/research/<car>.md      measured proportions, identity checklist
        ↓
src/vehicles/art/blueprints.ts          authored u/v geometry per car
src/vehicles/art/types.ts               contract (outline, glass, lamps, trim, wheel)
src/vehicles/art/index.ts               registry: blueprintFor(id)
        ↓
src/render/vehicle-art.ts               layered renderer (body, glass, detail, wheel)
        ↓
src/render/renderer.ts                  race / opponents / ghost
src/ui/app.ts                           hero, garage cards, detail, upgrade preview
```

There is **one** drawing implementation. The garage and the race cannot drift
apart because both call the same `drawCarBody` / `drawWheel` with the same
blueprint.

## 2. Adding or changing a car

1. Read `research/<car>.md`; confirm length, wheelbase, height and the front/rear
   overhang split. If the split is estimated, say so in the ledger.
2. Author the blueprint:
   - `outline` from tail to nose, in metres, spanning ±length/2;
   - `glass`, optional `quarterGlass`;
   - `head.lens`, `tail.lens`, `grille` polygons;
   - door seams and handles, one or two character lines;
   - trim flags and the wheel spec.
3. Run `npx vitest run src/vehicles/roster.test.ts`. It enforces:
   - overhangs + wheelbase = body length;
   - outline reaches ±length/2;
   - glass/lamps/grille inside the silhouette;
   - belt above 0.40 v, roof above 0.95 v;
   - wheel diameter 33–55 % of body height;
   - at least four identity notes.
4. Render the fleet sheet and inspect it:

   ```bash
   npm run dev                       # in another shell
   node tools/fleet-sheet.mjs docs/vehicle-art/exports/fleet-sheet.png 118
   ```

5. Capture the in-game views:

   ```bash
   node tools/qa.mjs docs/visual-qa/round-3/screenshots 1280 720
   ```

   This drives the real build: garage for all eight cars, upgrades, HUD, race,
   result, ghost. See `docs/visual-qa/round-3/report.json`.

## 3. Geometry conventions that bite

- `u` is **metres**, not normalised. The renderer multiplies by `ppm` after
  applying `bodyShiftM`.
- `v = 0` is the sill anchor at tyre contact + 35 mm, `v = 1` is the roof. Research
  files use a different sill height; convert with
  `v = (z − 0.035) / (heightM − 0.04)`.
- The outline must close along the rocker; the renderer adds the rocker line and
  the arch cut-outs.
- Lamps and grille are clipped to the shell, so their polygons may cross the
  outline slightly without leaking.

## 4. Validation and QA

| Gate | Command | What it proves |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | blueprint/renderer contract holds |
| Blueprint integrity | `npx vitest run src/vehicles/roster.test.ts` | 8 complete, consistent blueprints |
| Full suite | `npm test` | physics, upgrades, career, saves, routes still pass |
| Fleet sheet | `node tools/fleet-sheet.mjs …` | all cars at one world scale, side by side |
| In-game capture | `node tools/qa.mjs …` | the same art in garage and race, no console errors |
| Performance | `report.json` → `pacing` | frame time with the new renderer |

## 5. Asset policy

- The blueprint is the shipped asset: TypeScript data plus renderer code. There is
  no raster atlas to load, decode or keep in sync, and nothing is fetched at
  runtime.
- The fleet sheet and screenshots under `docs/vehicle-art/exports/` and
  `docs/visual-qa/` are QA evidence, not runtime assets.
- No reference photograph is committed. Sources are recorded as URLs in
  `research/*.md` and summarised in `VEHICLE_REFERENCE_LEDGER.md`.
- If a future revision moves to raster sprites, this document and
  `docs/ASSET_LICENSES.md` must be updated first; the blueprint stays the source
  of truth for proportions and anchors.

## 6. Performance notes

- Each car is drawn with canvas paths; there is no image decode at startup.
- The renderer caches no per-car bitmaps, so memory stays flat as the roster
  grows.
- Measured on the QA run (1280×720, DPR 1, headless Edge 157): median frame
  16.7 ms, p95 16.8 ms during a race with three AI opponents.
- If the roster grows well beyond eight cars, consider pre-rendering each
  blueprint to an offscreen canvas once per paint variant; the anchors in this
  document are what such a cache would need.
