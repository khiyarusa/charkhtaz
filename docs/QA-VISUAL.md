# QA · VISUAL · v0.2.0

All screenshots are real captures of the running build. No mockups, no edited
images. Capture harness: `tools/qa.mjs` (UI, race, AI, touch, pacing) and
`tools/ghost-shot.mjs` (real ghost recording and replay).

## Run metadata

| Field | Value |
| --- | --- |
| Build | working tree at the v0.2.0 commit |
| URL | `http://localhost:5173/` (Vite dev server) |
| Browser | Microsoft Edge 157 headless (Chromium 157) |
| Viewport | 1280 × 720, DPR 1 |
| Console errors | 0 |
| Screenshot dir | `docs/visual-qa/v0.2.0/screenshots/` |
| Report | `docs/visual-qa/v0.2.0/report.json` |

## Screenshot set

| # | File | State |
| --- | --- | --- |
| 1 | `01-home.png` | home, hero, next career event, selected car |
| 2 | `02-profile.png` | driver profile, XP, achievements, collection |
| 3 | `03-career.png` | career map, one event completed with a silver medal |
| 4 | `04-garage.png` | garage grid, all eight cars |
| 5 | `05-car-01 … 08.png` | each car's detail page with its own preview |
| 6 | `06-upgrades.png` | upgrade screen, engine tab, live preview, stock comparison |
| 7 | `07-upgrade-after.png` | after buying tier 1: credits changed, deltas shown |
| 8 | `08-upgrade-{tires,suspension,differential,clutch}.png` | one screen per category |
| 9 | `09-settings.png` | pedals, difficulty, audio, motion, debug |
| 10 | `10-track-select.png` | quick-race track list with sparklines |
| 11 | `11-hud-manual.png` | manual HUD, three pedals, countdown |
| 12 | `12-hud-three-touch.png` | three simultaneous pointers on the pedals |
| 13 | `13-hud-driving.png` | manual car moving, gear 1, speed and rpm live |
| 14 | `14-pause.png` | pause modal |
| 15 | `15-hud-automatic.png` | automatic car, clutch correctly hidden |
| 16 | `16-race-ai.png` | race with opponents and standings |
| 17 | `17-result.png` | results: win, time, position, reward, achievements |
| 18 | `18-hud-time-trial.png` | time trial HUD |
| 19 | `19-time-trial-result.png` | time trial result after a recorded run |
| 20 | `20-ghost-replay.png` | translucent ghost ahead of the player |
| 21 | `21-ghost-replay-late.png` | ghost later in the same run |

## Defects found and fixed in this pass

| Defect | Evidence | Fix |
| --- | --- | --- |
| Keyboard pedals never moved the car (holding W only stopped the spring) | HUD showed gear N and 0 km/h with W held | digital keys now ramp the pedal at 4.5–7 units/s |
| Speedometer text overflowed its ring and clipped at the left edge | `11-hud-manual` in the previous run | compact speed panel: ring + unit/gear/rpm column, max-width, safe-area bottom |
| Standings rows clipped their gap column | `09-race-ai` in the previous run | grid with `minmax(0,1fr)`, ellipsis, min/max width |
| Garage detail canvas was 900 px wide inside a 595 px panel | `05-garage` in the previous run | preview canvas fits both axes, `width:100%` in CSS |
| Hero wordmark showed a wide gap inside چرخ‌تاز | `01-home` in the previous run | single text run with a gradient clip instead of two spans |
| Tail lamp floated above the boot on low cars | car detail screenshots | lamps anchored to the silhouette's nose/tail height |
| Car hovered visually (bright road band under the tyres) | `11-hud-manual` | thinner crown line, darker road edge, per-tyre contact shadow |
| Car art used generic `sedan/suv/sport` templates for the first three cars | roster test failed on `art.profile` | all eight cars now carry their own silhouette and equipment block |
| Pumpkin mark looked like stock clip-art | brand review | flat five-lobe emblem with negative grooves, stem/leaf and road baseline |
| Body box caught kerbs before the wheels could climb them | route probe stalled at every obstacle | raised, narrower body collider; chamfered block colliders; obstacle heights capped |
| Cars fell through the terrain when inverted | route probe showed y = −1000 m | body collides with the ground again, so an inverted car rests on its roof |
| Cars spun freely in the air and landed on the roof | AI route probe, pitch 3.4 → 7.4 rad | capped PD attitude assist while fewer than two wheels are grounded |
| Automatic held first gear under wheelspin | physics trace | shift schedule reads driven-wheel speed and adds a wheelspin escape |

## Iterations

Every screen above was captured at least twice: once before the fix pass and once
after. The final pass was run after the last physics change, so the HUD, results
and ghost screenshots all show the shipped behaviour.

Two visual reviews of the brand mark were rejected before the current emblem was
accepted (a gradient clip-art pumpkin and an over-scalloped silhouette). The
accepted mark was checked at 512, 96 and 32 px.

## Known visual limitations

- At 1280×720 the car is ~330 px long, so very fine trim (badges, small grille
  slats) is only a few pixels. Model identity rests on silhouette, lamps, grille
  style and stance rather than on decals.
- Environment art is procedural. Biomes are distinguishable and surface detail is
  readable, but they are not hand-painted backgrounds.
- Physical Android rendering (device font metrics, safe areas, 120 Hz panels) is
  **not** verified in this release.
