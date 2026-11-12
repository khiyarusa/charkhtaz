# AGENTS.md — working rules for CHARKHTAZ

Every agent (human or AI) working in this repository follows these rules.
The full V1 product specification is `docs/SPEC-V1.md`.

## Identity

- Product: چرخ‌تاز / CHARKHTAZ — Persian-first 2D side-view physics racing & obstacle-trial game.
- Canonical repository: https://github.com/khiyarusa/charkhtaz (default branch `main`).
- The old **FARMAN** project (`khiyarusa/farman`) is a separate, retired project. **Never modify, reference, or reuse it.**

## Non-negotiables

1. **2D only.** Side-view 2D rigid-body physics. No 3D engines, no 3D models, no claims of lateral cornering or yaw dynamics.
2. **Three vertical analogue sliders** — گاز / ترمز / کلاچ — are the core control mechanic. Never replace them with tap buttons. Continuous 0..1 values, multi-touch with independent pointer IDs, spring return feeding the simulation.
3. **Persian-first UI.** Genuine RTL, bundled Vazirmatn (no font CDN), correct shaping, digits, punctuation and bidi.
4. **Offline-first.** No runtime CDN for engine, physics, fonts, assets or audio.
5. **Real vehicles.** Real model names plus researched year/trim specs with sources recorded in `docs/VEHICLE_DATA_SOURCES.md`. Estimates must be marked as estimates.
6. **No secrets in the repo.** Never commit tokens, keystores, passwords or `.env` files. Never print tokens in logs, docs or screenshots.
7. **Honest documentation.** Never mark planned work as implemented. Every claim needs evidence: a test, a measurement, or a committed screenshot.
8. **Git safety.** No force-push, no history rewrites, no bypassing branch protection. Focused conventional commits, push regular milestones.

## Conventions

- TypeScript strict mode; `npm run build` and `npm test` must stay green on `main`.
- World units are **meters**; fixed-timestep physics at 60 Hz with accumulator and render interpolation.
- One physics authority (Planck). Torque reaches the wheels through exactly one documented path (see `docs/VEHICLE_PHYSICS.md`).
- Vehicles, tracks, obstacles and surfaces are **data-driven** — typed TS data modules or JSON, no magic numbers inside systems.
- Physics, controls and save logic carry Vitest tests; visual changes carry screenshots under `docs/visual-qa/`.
- UI strings: Persian (fa) primary; English only for proper model/brand names and technical notation. Code identifiers and comments: English.
- Commit style: `feat|fix|docs|test|chore|assets(scope): summary`.

## Module ownership

| Path | Owns |
| --- | --- |
| `src/core/` | lifecycle, game state, events, configuration, timing |
| `src/physics/` | Planck world, fixed step, contacts, collision filters |
| `src/vehicles/` | profiles, engine, clutch, transmission, tires, suspension, brakes, damage |
| `src/controls/` | three-slider input, multi-touch, gear selector, control settings |
| `src/tracks/` | track data, surfaces, checkpoints, camera bounds |
| `src/obstacles/` | physical obstacle classes |
| `src/racing/` | race state, positions, scoring, AI, ghost replay |
| `src/career/` | progression, events, unlocks |
| `src/ui/` | Persian RTL screens, HUD, design system |
| `src/audio/` | engine/tire/effect buses |
| `src/assets/` | loading manifests, validation |
| `src/save/` | versioned persistence + migrations |

Only one agent edits a shared module (physics core, project config, CI) at a
time; the lead integrates and reviews every merge.
