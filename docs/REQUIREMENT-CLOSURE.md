# REQUIREMENT CLOSURE · v0.2.0

Status vocabulary: **PASS** (implemented and evidenced), **PARTIAL** (works, but a
named piece is missing), **BLOCKED** (external blocker; fallback described).

| # | Workstream | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Pumpkin brand/logo | PASS | `public/brand/*.svg`, icon PNGs, splash, header/hero, `ART_BIBLE.md`, brand review at 512/96/32 px |
| 2 | Vehicle visual overhaul | PARTIAL | 8 model-specific silhouettes + equipment blocks, per-model lamps/grille/cladding; procedural art, not hand-painted sprite sheets |
| 3 | Vehicle roster expansion | PASS | 8 cars in `registry.ts`, data + sources in `VEHICLE_DATA_SOURCES.md`, `roster.test.ts` |
| 4 | Graphics bug fixing | PASS | defect table in `QA-VISUAL.md` with before/after evidence |
| 5 | Environment art | PASS | 4 biomes, 8 surfaces with distinct treatments, parallax, contact shadows; shots 01/10/16/18 |
| 6 | Human Persian copy | PARTIAL | full string inventory reviewed, `PERSIAN_COPY_GUIDE.md` + `COPY-AUDIT.md`; no independent native-speaker sign-off in this environment |
| 7 | Dynamic UI | PASS | all screens navigate; transitions, reduced-motion setting; shots 01–21 |
| 8 | Player profile | PASS | persisted name, XP/level, achievements, records, collection |
| 9 | Upgrade/tuning system | PASS | 8 categories, buy/install/remove/reset, compatibility, cosmetics, physics-derived stats; `upgrades.test.ts` |
| 10 | Upgrade economy | PASS | prices, refunds, rewards, anti-duplication by run id; `economy.test.ts` |
| 11 | Three pedal controls | PARTIAL | three independent sliders, multi-touch verified in browser (80/45/70); physical Android device not tested |
| 12 | AI opponents | PASS | `racing/ai.ts`, 2–3 opponents, standings, difficulty setting, finish order; `ai.test.ts` |
| 13 | Ghost replay | PASS | record/store/replay/interpolate, 331-frame ghost, `20-ghost-replay.png` |
| 14 | Career | PASS | 10 events, chained unlocks, medals, rewards, persistent progress |
| 15 | Obstacle scoring | PASS | par-based score, resets/damage/gates penalties, bronze/silver/gold thresholds, stored best |
| 16 | Audio | PASS | procedural engine/tyre/skid/wind/UI/impact/checkpoint/finish; volume + mute; `audio/*.test.ts` |
| 17 | Damage | PASS | staged visuals, grip/throttle penalty, persistent condition, repair flow, respawn penalty |
| 18 | Automatic transmission | PASS | wheel-derived shift schedule + wheelspin escape; regression test shifts below 45 km/h |
| 19 | Suspension | PASS | force-on-chassis solve, progressive rate, travel limits; 2 m drop settles, ≤ 2 rebounds |
| 20 | Render interpolation | PASS | `renderPose(alpha)`, camera on the same pose; interpolation test |
| 21 | Android performance | BLOCKED | no Android toolchain or device here; browser pacing 59.9 fps median recorded instead |
| 22 | Save migrations | PASS | v1/v2 → v3, corrupt-save recovery, ghost and claimed-run sanitising; `storage.test.ts` |
| 23 | CI/CD | PASS | web and android workflows green on `573a6aa` and on tag `v0.2.0`; artifacts uploaded (`BUILD-EVIDENCE.md`) |
| 24 | Visual QA | PASS | 21 screenshots at 1280×720, two review cycles, defect/fix table |
| 25 | Repository release | PASS | commit `a9f84d4`, tag `v0.2.0`, release with debug APK + unsigned AAB, sizes and SHA-256 recorded |

## Notes on the PARTIAL rows

- **Vehicle art (2):** the renderer is a parametric, per-model vector system. Each
  car has a unique silhouette and equipment, but this is not a hand-illustrated
  sprite family with per-model decals. Claiming otherwise would be false.
- **Persian copy (6):** every player-facing string was inventoried and rewritten,
  and the guide documents voice and terminology. A separate native-speaker review
  was not available here, so the "native-quality" claim is not made.
- **Three pedals (11):** the mechanic and multi-touch work in Chromium with three
  simultaneous touch points. Device-level verification is explicitly pending.
- **Android performance (21):** only browser pacing is measured; the APK exists,
  but no phone or emulator was available to run it.
