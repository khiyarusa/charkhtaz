# CHARKHTAZ v0.2.0 — release notes

## What changed

**Brand.** The product mark is now an original pumpkin emblem: SVG master, light
and monochrome variants, horizontal and stacked lockups (Vazirmatn embedded so
the Persian wordmark keeps its shaping), launcher icons for every Android density,
a new favicon and an animated splash.

**Vehicles.** Eight models, each with its own side silhouette and equipment block:
Saipa Shahin 1.5T, Peugeot 206 Type 2, IKCO Tara, Renault Tondar 90, Toyota
Corolla E210, BMW 320i G20, Toyota Land Cruiser Prado 150, Mazda MX-5 ND. The
renderer draws per-model lamps, grilles, cladding, plates, mirrors, spoilers and
staged damage; wheels are positioned by the physics bodies and carry visible tread.
Published power is now derived from the tuned torque curve and pinned by a test.

**Gameplay.** Career with ten events and chained unlocks; AI opponents with a
difficulty setting; ghost recording and replay with a translucent best run;
obstacle trials scored against a route-specific par with bronze/silver/gold;
a functional eight-category upgrade and tuning system with compatibility rules,
refunds, reset and cosmetics; persistent damage, condition and a repair flow;
procedural audio for engine, tyres, skids, wind, impacts, checkpoints and UI.

**Physics.** Stable suspension (force applied to the chassis, velocity-level bump
stop, droop clamp) replacing an unstable force pair; wheelspin-aware automatic
shift schedule; collision filtering so the body cannot drag on the road or fall
through the world; capped attitude assist; passable obstacle geometry. All six
routes now finish under autonomous control (`src/tracks/completion.test.ts`).

**UI and copy.** Compact speedometer and standings, preview canvases that fit their
panels, a two-tone wordmark that no longer breaks ZWNJ shaping, difficulty and
unequip controls, and a full Persian copy pass.

## Verification

- `npm test`: 77 tests in 12 files, all passing. `tsc --noEmit` and `vite build`
  green.
- Web CI: success.
- Android CI: success (debug APK + unsigned release AAB).
- Live QA: 21 screenshots at 1280×720, three simultaneous touch points
  (throttle 80 %, brake 45 %, clutch 70 %), 59.9 fps median frame rate, zero
  console errors. See `docs/QA-VISUAL.md` and `docs/QA-REGRESSION.md`.

## Known limitations

- 2D only: no steering axis, no lateral dynamics, no yaw.
- Physical Android device QA (three-finger input, safe areas, thermal behaviour)
  is **not** done; only browser multi-touch and CI compilation are verified.
- The APK is debug-signed and the AAB is unsigned. Store submission requires a
  keystore in repository secrets.
- Vehicle artwork is original procedural vector art, not hand-painted sprite
  sheets; model identity rests on silhouette, stance, lamps and trim.
- Commercial release requires trademark and design clearance for the vehicle
  names; that review has not been performed.
- Requirement-by-requirement status, including the `PARTIAL` and `BLOCKED` rows,
  is in `docs/REQUIREMENT-CLOSURE.md`.
