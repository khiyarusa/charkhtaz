# BUILD EVIDENCE · v0.2.0

Local build evidence recorded on 2026-11-12. GitHub Actions results are added
after the push; this file never claims a run that has not happened.

## Local build

```
$ npm run build          # tsc --noEmit && vite build
✓ 39 modules transformed
dist/index.html                   1.77 kB │ gzip:   0.96 kB
dist/assets/index-*.css          30.64 kB │ gzip:   6.86 kB
dist/assets/index-*.js          405.31 kB │ gzip: 106.48 kB
✓ built in 2.50s
```

- TypeScript strict: `tsc --noEmit` exits 0.
- Tests: `vitest run src` → 77 passed (12 files).
- Source maps: disabled for production (the Android WebView does not need them and
  they add ~1 MB).

## Asset checks

| Check | Result |
| --- | --- |
| Fonts bundled locally | 5 Vazirmatn woff2 files in `public/assets/fonts` + OFL licence |
| Runtime CDN references | none (grep for `http://`/`https://` in `src/` returns only documentation URLs) |
| Brand exports | SVG master + 5 PNG sizes + 4 lockups |
| Android launcher icons | regenerated for mdpi…xxxhdpi from the SVG master |
| Secret scan | no keystore, `.env`, token or password in the tree |

## GitHub Actions

| Workflow | Commit | Result | URL |
| --- | --- | --- | --- |
| web | `573a6aa` | success | https://github.com/khiyarusa/charkhtaz/actions/runs/43295955154 |
| android (manual dispatch) | `573a6aa` | success | https://github.com/khiyarusa/charkhtaz/actions/runs/43296258729 |
| web (tag `v0.2.0`) | `a9f84d4` | success | https://github.com/khiyarusa/charkhtaz/actions/runs/43296891238 |
| android + release (tag `v0.2.0`) | `a9f84d4` | success | https://github.com/khiyarusa/charkhtaz/actions/runs/43296900039 |

The Android job ran `npm ci`, `npm test`, `npm run build`, `npx cap sync android`
and `./gradlew assembleDebug bundleRelease`, and uploaded `android-build`
(`app-debug.apk` + unsigned `app-release.aab`).

## Published release

**v0.2.0** — https://github.com/khiyarusa/charkhtaz/releases/tag/v0.2.0

| Asset | Size | SHA-256 | Signing |
| --- | --- | --- | --- |
| `app-debug.apk` | 4 507 634 B | `397e7542b776b765e2d61a724b0029f427be10ba3cc7dd0ef5e68783d1293d3d` | debug-signed, installable |
| `app-release.aab` | 3 350 937 B | `3b370145a5cb6f837f1e6b24b32d89083a4464b6e46366afd280f7cb72a2e4a9` | **unsigned** |

Both archives were downloaded and inspected: the APK contains 463 entries
including `classes*.dex` and the web bundle under `assets/public/` (brand SVGs
included); the AAB contains 466 entries including `BundleConfig.pb` and
`base/manifest/AndroidManifest.xml`. Version: `versionName 0.2.0`,
`versionCode 20`.

## Android

- Workflow: `.github/workflows/android.yml` — triggered by a `v*` tag or manually.
- Produces: debug APK (installable) and an unsigned release AAB.
- **Not produced in this session**: the workstation has no Android SDK/JDK
  toolchain, so `gradlew` was not run locally; the APK/AAB above were built by
  GitHub Actions on Ubuntu with JDK 21 and Android SDK 36.
- Signing: no keystore is committed. A store-ready AAB requires repository
  secrets, which are not configured here.

## What is still required before a store submission

1. Install the published `app-debug.apk` on a physical device (Galaxy A23 or
   equivalent) and verify three-finger pedal input, safe areas and 60/120 Hz
   pacing.
2. Add signing secrets and rebuild a signed AAB.
3. Complete trademark/design clearance for the vehicle names and silhouettes.
4. Choose and add a code/art licence.
