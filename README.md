# چرخ‌تاز · CHARKHTAZ

**RACE · SHIFT · CONQUER**

A Persian-first, offline, **2D side-view physics racing and obstacle-trial**
game for Android (Capacitor) and the web. Real production cars, a custom
vehicle-dynamics layer on top of Planck.js, and three vertical analogue pedals —
throttle, brake and clutch — as the core control mechanic.

Canonical repository: `github.com/khiyarusa/charkhtaz` · branch `main`.

> **Status: playable vertical slice, not V1-complete.** The driving simulation,
> six authored routes, four biomes, three cars, the three-slider control system,
> Persian RTL UI, save system and Android shell are implemented and verified.
> Audio, AI opponents, ghost replay, career progression and obstacle-trial
> scoring are **not** implemented yet. See [Status](#status) for evidence.

## Quick start

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # Vitest: vehicle physics + build identity
npm run build      # typecheck + production bundle
```

Android shell:

```bash
npm run build
npx cap sync android
# then open android/ in Android Studio, or let CI build it
```

## Controls

| Input | Action |
| --- | --- |
| Drag a vertical slider **up** | more throttle / brake / clutch |
| Release a slider | spring return, fed into the simulation |
| `W` / `S` | throttle / brake (desktop QA) |
| `C` | clutch |
| `1`–`5`, `0` | select gear / neutral (manual needs clutch) |
| `R` | respawn at last checkpoint (+3 s) |
| `E` | restart engine |
| `Esc` | pause |

Manual cars start in neutral. Pull the clutch slider up, select 1st, then release
the clutch progressively; an abrupt release at low rpm will stall the engine.
Automatic cars use R / N / D and a torque-converter model with lock-up.

## What is in this build

- **Physics** — Planck.js rigid bodies: chassis + two independently simulated
  wheel bodies, wheel joints, mass-based spring/damper suspension with bump and
  droop stops, contact-patch tyre forces, weight transfer, jumps and landings.
  Fixed 60 Hz step with a bounded accumulator.
- **Powertrains** — manual engine/clutch/gearbox with a bite curve, clutch
  interlock and mechanical over-rev; torque-converter automatic with lock-up,
  throttle-aware shifting and kickdown. One documented torque path.
- **Surfaces** — dry/wet asphalt, dirt, gravel, sand, mud, rock, wood; friction
  and rolling resistance differ and change braking and traction.
- **Cars** — Saipa Shahin 1.5T, Toyota Prado 150 4.0 V6, BMW 320i G20. Data and
  confidence are recorded in [`docs/VEHICLE_DATA_SOURCES.md`](docs/VEHICLE_DATA_SOURCES.md).
- **Routes** — six data-driven tracks across mountain, desert, forest and urban
  biomes, with gaps, ramps, whoops, boulders, logs, tyre stacks and planks.
- **Controls** — three independent vertical analogue sliders with per-pointer
  capture, configurable spring return, handedness, size, opacity and sensitivity.
- **UI** — genuine RTL Persian interface with locally bundled Vazirmatn, garage
  with live car previews, track select with profile sparklines, HUD, pause and
  results. Persian digits throughout.
- **Save** — versioned localStorage schema with legacy migration and corrupt-save
  recovery. Settings and per-track best times persist offline.

## Status

| Area | State | Evidence |
| --- | --- | --- |
| Vehicle physics | Implemented, tested | `src/physics/vehicle.test.ts` (4 tests) |
| Manual + automatic drivetrains | Implemented, tested | same suite + `docs/VEHICLE_PHYSICS.md` |
| Three analogue sliders | Implemented | `src/controls/pedals.ts` |
| Persian RTL UI | Implemented | `docs/visual-qa/01-home.png` … `09-pause.png` |
| Tracks / biomes / obstacles | 6 routes, 4 biomes | `src/tracks/definitions.ts` |
| Save + migration | Implemented | `src/save/storage.ts` |
| Android package | CI-built debug APK + unsigned AAB, published | [v0.1.2 release](https://github.com/khiyarusa/charkhtaz/releases/tag/v0.1.2) · [evidence](docs/BUILD-EVIDENCE.md) |
| Audio | **Not started** | — |
| AI opponents | **Not started** | — |
| Ghost / time-trial replay | **Not started** | — |
| Career / obstacle-trial scoring | **Not started** | — |
| Device multi-touch QA | **Pending** | desktop pointer test only |
| Release signing | **Pending** | debug APK only; keystore is not in the repo |

Visual QA findings and the defects fixed in the last pass are in
[`docs/QA-VISUAL.md`](docs/QA-VISUAL.md).

## Architecture

```
src/
  core/        math, RNG, formatting, build identity
  physics/     Planck terrain + vehicle assembly (chassis, wheels, suspension)
  vehicles/    engine, clutch, gearbox, tyre, manual & automatic drivetrains, car data
  tracks/      track types, authoring builder, six route definitions
  controls/    three vertical analogue sliders
  render/      canvas renderer, biome palettes, procedural vehicle art
  game/        fixed-step scene, timing, checkpoints, respawn, effects
  ui/          Persian RTL screens, HUD, design system
  save/        versioned persistence + migration
```

- World units are metres; the renderer is the only place pixels exist.
- Planck is the single physics authority; the joint motor is disabled and
  drivetrain torque reaches the ground through the documented tyre model only.
- Tracks are data; terrain collision and terrain art come from the same polyline.

## CI

Latest green runs: [web CI](https://github.com/khiyarusa/charkhtaz/actions) ·
[Android release](https://github.com/khiyarusa/charkhtaz/releases/tag/v0.1.2).

| Workflow | Trigger | Does |
| --- | --- | --- |
| `.github/workflows/web.yml` | push / PR | `npm ci`, tests, typecheck + build, uploads `dist` |
| `.github/workflows/android.yml` | tag `v*` / manual | builds debug APK + unsigned release AAB, attaches to the GitHub release |

The debug APK is installable. The AAB is **unsigned** on purpose: signing keys
must never be committed. Add a keystore through repository secrets to produce a
store-ready build.

## Documentation

- [`docs/SPEC-V1.md`](docs/SPEC-V1.md) — product specification
- [`docs/VEHICLE_PHYSICS.md`](docs/VEHICLE_PHYSICS.md) — simulation authority
- [`docs/VEHICLE_DATA_SOURCES.md`](docs/VEHICLE_DATA_SOURCES.md) — data provenance
- [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md) — art direction and asset rules
- [`docs/QA-VISUAL.md`](docs/QA-VISUAL.md) — screenshot evidence and known gaps
- [`docs/BUILD-EVIDENCE.md`](docs/BUILD-EVIDENCE.md) — CI runs, APK inspection, limits
- [`docs/research/engine-decision.md`](docs/research/engine-decision.md) — engine choice + implementation note
- [`AGENTS.md`](AGENTS.md) — working rules for contributors and agents

## Non-negotiables

1. True 2D only. No 3D engines, models or physics.
2. Three vertical analogue sliders are the control mechanic; never replace them
   with tap buttons.
3. Persian-first, real RTL, locally bundled Vazirmatn, no runtime CDN.
4. Offline-first: no remote assets, fonts or scripts at runtime.
5. Real model names with recorded sources; estimates are labelled as estimates.
6. No secrets, keystores or tokens in the repository. No force-push.

## License

Not decided yet. The code is public for review; do not redistribute until a
license is added. Vehicle names are factual identifiers; no manufacturer
endorsement is implied and no logos are reproduced.
