# Build evidence

Evidence for what was actually executed, not planned. Dates are UTC, 2026-11-12.

## Repository

- `github.com/khiyarusa/charkhtaz`, default branch `main`.
- Milestone commits: `f5cdc51` (scaffold), `eb6b6e2` (physics), `d05772f`
  (playable slice/UI), `5bde6ee` (icon + CI), `de39d5d` (CI SDK fix).
- Tags: `v0.1.0` (superseded before the Android runner fix), `v0.1.1` (first
  CI-built artifacts), `v0.1.2` (source maps removed), `v0.1.3` (playable
  respawn/shift fixes and climbable obstacles).

## Web CI

| Run | Trigger | Result |
| --- | --- | --- |
| [43250696188](https://github.com/khiyarusa/charkhtaz/actions/runs/43250696188) | push to `main` | **success** — npm ci, 7 tests, typecheck + build |
| [43251095060](https://github.com/khiyarusa/charkhtaz/actions/runs/43251095060) | push to `main` | **success** |

`npm test` → 2 files, 7 tests passing (build identity, manual launch, automatic
idle, braking stability).

## Android CI

| Run | Trigger | Result |
| --- | --- | --- |
| 43250710899 | tag `v0.1.0` | **failure** — `android-actions/setup-android@v3` called `sdkmanager tools`, which no longer exists |
| [43251094909](https://github.com/khiyarusa/charkhtaz/actions/runs/43251094909) | manual dispatch | **success** — all build steps through APK/AAB assembly and artifact upload |
| [43251837928](https://github.com/khiyarusa/charkhtaz/actions/runs/43251837928) | tag `v0.1.1` | **success** — build + GitHub release publish |
| [43255074396](https://github.com/khiyarusa/charkhtaz/actions/runs/43255074396) | tag `v0.1.3` | **success** — build + release with the playable respawn/shift fixes |

Environment in CI: Ubuntu runner, Node 22, Temurin JDK 21, Android SDK
platform 36 / build-tools 36.0.0, Capacitor 8.

### Published assets (v0.1.3)

| Asset | Size | Meaning |
| --- | --- | --- |
| `app-debug.apk` | 4,379,693 bytes | debug-signed, installable |
| `app-release.aab` | 3,239,259 bytes | **unsigned**, not Play-uploadable until signed |

Release: <https://github.com/khiyarusa/charkhtaz/releases/tag/v0.1.3>

The APK was downloaded and opened as a zip. It contains:

```
assets/public/index.html
assets/public/assets/index-ChxOzdcY.js     308,985 bytes
assets/public/assets/index-DJ0u00w2.css     20,710 bytes
assets/public/assets/fonts/Vazirmatn-*.woff2  (5 weights)
AndroidManifest.xml

No `.map` files are present.
```

That is the whole game, offline, including the Persian font. From `v0.1.2`
onwards the 1,019,644-byte JavaScript source map that `v0.1.1` carried is no
longer packaged. `v0.1.3` additionally contains the respawn, gearbox and
obstacle fixes verified by `scripts/smoke-drive.mjs`.

## What the CI does **not** prove

- The APK was **not installed on a physical device or emulator** in this
  environment. No Android SDK or JDK 21 is installed locally; the runner built
  the package, and the APK contents were inspected, but runtime behaviour on
  Android (WebView, touch, lifecycle) is still unverified.
- The AAB is unsigned. Store submission needs a keystore supplied through
  secrets, which are deliberately absent from the repository.
- No screenshot from Android hardware exists yet. All visual evidence is desktop
  Chromium at 1280 × 720 (`docs/QA-VISUAL.md`).
