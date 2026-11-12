# VEHICLE ART QA REPORT — Round 3

Recorded 2026-11-12 against the Round 3 working tree on top of `87f6b65`.

## 1. What was verified, and how

| Gate | Command / artefact | Result |
| --- | --- | --- |
| Types | `tsc --noEmit` | pass |
| Tests | `vitest run src` | **80 tests in 12 files, all pass** |
| Blueprint integrity | `src/vehicles/roster.test.ts` | 8/8 complete, consistent, inside-bounds |
| Route completion | `src/tracks/completion.test.ts` | all six routes finish under AI control |
| Fleet sheet | `tools/fleet-sheet.mjs` → `docs/vehicle-art/exports/fleet-sheet.png` | 8 cars at one world scale, 118 px/m |
| In-game capture | `tools/qa.mjs` → `docs/visual-qa/round-3/` | 27 screenshots, 0 console errors |
| Multi-touch | `report.json` → `touchValues` | throttle 80 %, brake 45 %, clutch 70 % independently |
| Frame pacing | `report.json` → `pacing` | median 16.7 ms, p95 16.8 ms, 59.9 fps |

## 2. In-game screenshots

`docs/visual-qa/round-3/screenshots/`:

| # | File | What it shows |
| --- | --- | --- |
| 01 | `01-home.png` | hero with the new renderer |
| 02 | `02-profile.png` | profile |
| 03 | `03-career.png` | career |
| 04 | `04-garage.png` | garage grid, eight cars |
| 05 | `05-car-01 … 08.png` | each car's detail view, same renderer as the race |
| 06 | `06-upgrades.png` | upgrade preview |
| 07 | `07-upgrade-after.png` | purchase applied |
| 08 | `08-upgrade-*.png` | upgrade categories |
| 09 | `09-settings.png` | settings |
| 10 | `10-track-select.png` | track list |
| 11 | `11-hud-manual.png` | manual HUD |
| 12 | `12-hud-three-touch.png` | three simultaneous pedals |
| 13 | `13-hud-driving.png` | car at speed, wheels rotating |
| 14 | `14-pause.png` | pause |
| 15 | `15-hud-automatic.png` | automatic HUD (clutch hidden) |
| 16 | `16-race-ai.png` | race with opponents |
| 17 | `17-result.png` | result modal |
| 18 | `18-hud-time-trial.png` | time trial |
| 19–21 | time-trial result + ghost replay | recorded ghost |

Plus `docs/vehicle-art/exports/fleet-sheet.png`.

## 3. Acceptance matrix (brief §17)

| Criterion | Status | Evidence / why |
| --- | --- | --- |
| Every car has its own researched side profile | **PASS** | 8 blueprints, each from its own research file; roster test |
| No car uses a generic sedan/SUV/sports template | **PASS** | the `kind` fallback is no longer used by the renderer; the roster test requires a blueprint per id |
| Generation/year/trim/visual cues documented | **PASS** | `research/*.md`, `VEHICLE_REFERENCE_LEDGER.md` |
| Proportions compared with credible references | **PARTIAL** | compared against published dimensions and derived landmarks, **not** against side-view photographs (none redistributable were used) |
| Wheelbase/overhangs/roofline/glass/lamps credible | **PARTIAL** | measured overhangs and cabin landmarks; lamp/grille shapes are interpretations |
| Distinct wheel/rim per model | **PASS** | per-model `wheel` spec (style, spokes, rim ratio, sidewall, caliper) |
| All cars at a coherent common scale | **PASS** | fleet sheet at 118 px/m |
| Fleet sheet makes the models obviously different | **PARTIAL** | Prado/206/MX-5/BMW are clearly distinct; the four sedans are distinguishable by proportion and colour, not instantly by name |
| Same canonical assets in garage and gameplay | **PASS** | one `drawCarBody`; screenshots 04/05 vs 13/16 |
| Wheels align with physics and rotate | **PASS** | wheels drawn from `renderPose`; `13-hud-driving` |
| Suspension travel does not detach wheels | **PASS** | arch cut-outs follow the wheel bodies; physics tests still pass |
| No clipping/broken alpha/scale errors | **PASS** | detail layers clipped; fleet sheet inspected at 118 px/m |
| Damage/repair/lighting/upgrades compatible | **PASS** | damage overlay retained; paint and rims still apply |
| No gameplay regression | **PASS** | 80 tests incl. physics, routes, upgrades, saves |
| Assets local/offline | **PASS** | no runtime fetch; vector data in the bundle |
| Asset manifest + validation | **PASS** | `blueprintFor` registry + roster validation tests |
| Source/ownership/licence documented | **PASS** | `ASSET_LICENSES.md`, ledger |
| Efficient decode/render | **PASS** | no image decode; 59.9 fps median |
| Bundle/asset size measured | **PASS** | see §4 |
| Mobile viewport + Android package | **PARTIAL** | CI Android build and APK published; **NOT TESTED ON PHYSICAL ANDROID** |
| Build passes | **PASS** | local + CI |
| Tests pass | **PASS** | 80/80 |
| Android workflow passes | **PASS** (CI) | see release evidence |
| Real runtime screenshots committed | **PASS** | `docs/visual-qa/round-3/` |
| Screenshot metadata matches commit | **PASS** | `report.json` records commit and environment |
| README/docs match implementation | **PASS** | updated in this round |
| Committed and pushed without destructive git | **PASS** | normal commits, no force-push |
| New release with APK | **PASS** | tag `v0.3.0` (see release) |

## 4. Measurements

| Metric | Before (v0.2.0) | After (Round 3) |
| --- | --- | --- |
| Blueprint data | 8 profiles + shared `kind` templates | 8 independent blueprints, no fallback |
| Renderer | 35.3 kB `vehicle-art.ts` | 36.2 kB, layered with clipping |
| Bundle JS | 405.3 kB (106.5 kB gzip) | see build output in the release commit |
| Runtime image assets | 0 | 0 (vector data only) |
| Median frame time (race, 1280×720) | 16.7 ms | 16.7 ms |
| p95 frame time | 16.8 ms | 16.8 ms |

## 5. Known limitations (not hidden)

1. **Vector, not painted.** The cars are authored vector illustrations. They have
   correct proportions and model-specific equipment, but they do not reach the
   material and lighting richness of hand-painted sprite art.
2. **No photographic overlay.** Proportions were checked against published
   dimensions and derived landmarks, not pixel-compared against side-view
   photographs. A silhouette-IoU comparison against real photos is **not**
   performed and is not claimed.
3. **Sedan family similarity.** Shahin, Tara, Tondar and Corolla share a body
   class; at 92 px/m they differ by proportion, lamp shape and colour rather than
   by a dramatic silhouette.
4. **Prado length.** The simulated 4,760 mm is shorter than the published
   5,010 mm with the spare carrier; the art is normalised to the simulation so
   wheels and collider agree. Documented in the ledger.
5. **Physical Android.** **NOT TESTED ON PHYSICAL ANDROID.** No phone or emulator
   was available. CI compiles the APK; rendering on a real device is unverified.
6. **Legal.** No trademark/design clearance. No manufacturer logos are used.

## 6. Iterations run

| Iteration | Defect found | Fix | Result |
| --- | --- | --- | --- |
| 1 | Fleet body anchored at the axle height instead of the wheel centre; cars floated above their wheels | correct chassis frame in the sheet | wheels touch, bodies sit |
| 2 | Bumpers, lamps and plates drawn as unclipped rectangles outside the shell | clip detail layers to the body path; bumper band follows the shell | no floating parts |
| 3 | Pointed A/C pillars, invisible B-pillar, flat door seams | Catmull-Rom outline with corner preservation; wider B-pillar; stronger seams/handles; roof highlight; boot crease | panels read as panels |
| 4 | Lamps too small to read at gameplay scale | housing + 22 % vertical presence + projector/signature + reversing segment | lamp clusters visible |

Each iteration changed one class of defect, then re-rendered the same sheet.
