# Visual QA — 2026-11-12

Real browser screenshots, produced by `scripts/screenshot.mjs` against the Vite
dev server and saved in `docs/visual-qa/`.

- Browser: Microsoft Edge (Chromium) via Playwright 1.65, headless.
- Viewport: **1280 × 720**, DPR 1 (landscape phone-class layout).
- Page errors during the run: **0**. Console errors: **0** (favicon 404 fixed).
- Fonts: `document.fonts.check('800 64px Vazirmatn') === true`; the bundled
  woff2 files load from the app origin, not a CDN.

## Screens

| File | State | What it proves |
| --- | --- | --- |
| `01-home.png` | Home | RTL layout, brand system, live car preview, mode cards |
| `02-garage.png` | Garage | Three real cars, stat bars, selection state |
| `03-garage-prado.png` | Garage, Prado selected | Detail panel updates, spec grid |
| `04-tracks.png` | Track select | Six routes, biome chips, difficulty, profile sparklines |
| `05-game-countdown.png` | Countdown | Start gantry, pedals, auto range D, HUD timer |
| `06-game-driving.png` | Driving | Speed 77 km/h, gear, rpm, lane dashes, delineators |
| `07-game-driving-2.png` | Driving | Camera follow, checkpoint flag, stable HUD |
| `08-title.png` | Wordmark crop | Vazirmatn shaping, ZWNJ gap, amber accent |
| `09-pause.png` | Pause | Modal, results tiles, RTL button order |

## Defects found and fixed in this pass

1. **NaN physics on spawn** — a `WheelJoint` with `frequencyHz: 0` divides by
   zero inside Planck's spring solver. Fixed with a negligible non-zero
   frequency and a mass-based custom spring.
2. **Chassis sat on its belly** — Planck sizes a wheel-joint spring from the
   wheel body's mass, far too soft for a car. Replaced with the measured
   spring/damper in `docs/VEHICLE_PHYSICS.md`.
3. **Free axle oscillated 0 ↔ 6 rad/s** — the tyre slip curve's negative slope
   past peak pumped energy into the wheel update. Added a positive damping floor
   and a rolling solution for non-driven wheels.
4. **Brakes lost half their force** — the free-wheel model relaxed the wheel back
   to road speed *after* braking, cancelling it. Rewritten as a contact-patch
   brake force capped by grip; ABS cars cap brake torque at `μNr`.
5. **Automatic stalled during the countdown** — creep torque was folded into
   converter capacity, so idle load exceeded idle torque. Creep is now a
   wheel-side force and the converter is sized for 2 600 rpm stall.
6. **Speedometer hidden under the pedals** — `inset-inline-start` resolves to the
   right in RTL. Speed cluster is now physically bottom-left, `direction: ltr`.
7. **Countdown invisible for the first second** — the label only updated when
   `ceil(countdown)` changed. Initialised to «۳» at scene start.
8. **Time read as a fraction** — the Persian decimal separator looks like a slash
   at HUD size. Race time now uses a period (`۰۵.۴۰`).
9. **Impassable obstacles** — 1 m boulders and a 1.1 m concrete block are walls in
   a side view with no steering. Obstacle heights were reduced to 0.3–0.45 m so
   momentum and throttle can clear them.
10. **Flat, unreadable road** — added lane dashes, shoulder band, sand ripples,
    mud puddles, gravel speckle and 18 m delineator posts.

## Known gaps (not claimed as done)

- Multi-touch was validated with Playwright pointer events, **not on a physical
  Android device**. The emulator/device matrix is still pending.
- No render interpolation; 120 Hz displays will see repeated frames.
- Car silhouettes are recognisable body styles but not yet at the fidelity bar
  in `ART_BIBLE.md` §8.
- Damage is reported numerically but does not yet change handling or visuals.
- No audio, AI opponents, ghost replay, career or obstacle-trial scoring yet.
- Android APK has not been built on this machine (no Android SDK / JDK 21);
  `.github/workflows/android.yml` is the build path.

## Reproduce

```bash
npm ci
npm run dev -- --port 5173
node scripts/screenshot.mjs
```
