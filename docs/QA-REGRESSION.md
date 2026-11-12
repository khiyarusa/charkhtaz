# QA · REGRESSION · v0.2.0

Evidence recorded on 2026-11-12 against the v0.2.0 working tree.

## Automated tests

`npm test` (Vitest) — **77 tests in 12 files, all passing**. `tsc --noEmit` and
`vite build` are green.

| Suite | File | Covers |
| --- | --- | --- |
| Vehicle physics | `src/physics/vehicle.test.ts` | manual launch without explosion, automatic creep, idle with brake held, braking and finite wheel state |
| Shift strategy, landings, interpolation | `src/game/render-interpolation.test.ts` | wheelspin upshift below 45 km/h road speed, dry upshifts, downshift when slowing, 2 m drop settles with ≤ 2 rebounds, wheels loaded at rest, pose interpolation |
| Route completion | `src/tracks/completion.test.ts` | all six routes finish under autonomous control; no car ever falls out of the world |
| Roster and assets | `src/vehicles/roster.test.ts` | eight unique cars, own silhouette + equipment block, coherent dimensions/powertrain, published power ±1 hp, peak torque ±2 N·m, tuned profiles stay drivable |
| Upgrades | `src/vehicles/upgrades.test.ts` | clutch refused on automatics, ratio kit refused on CVT, sanitising, resolved torque/grip/brakes/mass, derived power, refunds |
| Economy and career | `src/career/economy.test.ts` | reward formula, no duplicate claim per run id, achievements, medal thresholds, par-based trial scoring |
| Ghost | `src/racing/ghost.test.ts` | encode/decode round trip, corrupt frames dropped, interpolation, no physics coupling |
| AI | `src/racing/ai.test.ts` | controller output is continuous, recovers when stuck, produces pedal inputs only |
| Save | `src/save/storage.test.ts` | v1/v2 → v3 migration, corrupt payload recovery, defaults, ghosts and claimed runs |
| Audio | `src/audio/audio-math.test.ts`, `game-audio.test.ts` | engine/tyre mapping maths, telemetry smoothing, no NaN, lifecycle |
| Build identity | `src/core/build-info.test.ts` | version and build id formatting |

Not covered by automated tests (by design, verified manually): visual layout,
Persian shaping, real touch hardware.

## Browser verification

| Check | Result | Evidence |
| --- | --- | --- |
| Three simultaneous pointers | throttle 80 %, brake 45 %, clutch 70 % independently | `report.json` → `touchValues` |
| Release and spring return | all three back to 0 % | `report.json` → `releaseValues` |
| Keyboard driving | 17–21 km/h, gear ۱, 4 300–6 100 rpm | `report.json` → `driving` |
| Automatic hides the clutch | `.pedal--clutch` not visible with the Prado | `report.json` → `clutchVisible: false` |
| AI race | 3 opponents in the standings, race finished | `16-race-ai.png`, `17-result.png` |
| Ghost | 331 recorded frames, best 42.13 s, ghost rendered | `20-ghost-replay.png`, `ghost-shot.mjs` output |
| Console errors | 0 across the whole run | `report.json` → `errors` |

## Performance (browser)

Measured with `requestAnimationFrame` for 4 s during a live AI race, 1280×720,
DPR 1, headless Edge 157 on a desktop CPU:

| Metric | Value |
| --- | --- |
| Frames | 240 |
| Median frame time | 16.7 ms |
| p95 frame time | 16.8 ms |
| Worst frame | 17.0 ms |
| Median FPS | 59.9 |

Interpretation: the loop holds vsync with no long frames in this environment. It
is **not** a phone measurement; thermal behaviour and Android WebView performance
are unmeasured.

Bundle size (production): 405 kB JS (106 kB gzip), 31 kB CSS (6.9 kB gzip), no
source maps.

## Android

Not rebuilt in this environment (no Android SDK on the machine). The workflow was
inspected and left unchanged; the last published Android artifact remains the
v0.1.3 release. Physical-device multi-touch and performance remain **pending**.
