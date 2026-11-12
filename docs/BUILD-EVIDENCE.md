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

## Android

- Workflow: `.github/workflows/android.yml` — triggered by a `v*` tag or manually.
- Produces: debug APK (installable) and an unsigned release AAB.
- **Not produced in this session**: the workstation has no Android SDK/JDK
  toolchain, so `gradlew` was not run locally.
- Signing: no keystore is committed. A store-ready AAB requires repository
  secrets, which are not configured here.

## What is still required before a store submission

1. Run the Android workflow and install the APK on a physical device (Galaxy A23
   or equivalent).
2. Verify three-finger pedal input, safe areas, font metrics and 60/120 Hz pacing
   on that device.
3. Add signing secrets and rebuild a signed AAB.
4. Complete trademark/design clearance for the vehicle names and silhouettes.
5. Choose and add a code/art licence.
