# CHARKHTAZ — Rendering Engine Decision Report

**Project:** CHARKHTAZ (چرخ‌تاز) — Persian-first 2D side-view physics racing & obstacle-trial game
**Target platforms:** Android (Capacitor WebView) + Web · **Stack:** TypeScript (strict), Vite, Planck.js (`planck@^1.5.1`, per `package.json`)
**Research date:** 2026-11-12 (all sources retrieved on this date; npm checks run against registry.npmjs.org on this date)
**Question answered:** Which rendering engine should CHARKHTAZ use — **Phaser AE** (kernel + expansion packs) or **Phaser 4** (npm package `phaser`) — and which exact package + version should be pinned?

---

## 1. Conclusion (recommendation)

**Use Phaser 4. Pin `phaser` at exactly `4.2.1`:**

```json
"dependencies": {
  "phaser": "4.2.1",
  "planck": "^1.5.1"
}
```

`4.2.1` is the actual current stable on npm (`npm view phaser version` → `4.2.1`, `dist-tags.latest`, verified 2026-11-12) — the internal brief's "4.2.1" is confirmed correct, not superseded. Phaser 4 is MIT-licensed, distributed and bundleable entirely from node_modules, targets WebGL 1 (broadest Android WebView compatibility) with a deprecated-but-present Canvas fallback, ships its own TypeScript types, has an official Vite + TypeScript project generator, and has a documented co-use pattern with Planck.js. Phaser AE is technically impressive but fails CHARKHTAZ's hard constraints: it is not open source (PolyForm Shield), is not installable from npm (CLI + phaser.io account distribution), and its kernel is ~4 weeks old with semver-burning by design.

**Overall confidence: high.** Every load-bearing claim below cites a fetched primary source or a registry command run on 2026-11-12. Estimates and unverified items are explicitly marked.

---

## 2. Candidate snapshot — comparison table

| Dimension | **Phaser 4** | **Phaser AE** |
|---|---|---|
| What it is | Open-source 2D WebGL game framework for developers (14+ years of Phaser lineage, rewritten renderer in v4) | Separate engine built from scratch for LLM agents ("AE = Agentic Engine"); powers the Phaser Game Agent; 2D + 3D |
| Latest stable | **4.2.1** (npm `dist-tags.latest`, released 2026-07-09) | Kernel **3.0.0-2** (released 2026-10-26); only 3 kernel releases ever (first: 2026-10-13) |
| Age of current line | v4.0.0 stable since 2026-04-10 (~7 months); lineage since 2013 | Kernel public for ~4 weeks at research time |
| License | **MIT** (npm `license` field) | Kernel: **PolyForm Shield 1.0.0** (source-available) + "additional permission to make and sell games"; not open source. CLI `@phaser-ae/cli` is MIT but "doesn't cover the Phaser AE engine or the expansion packs" |
| npm install | ✅ `npm i phaser@4.2.1` — one runtime dep (`eventemitter3@^5.0.4`), ESM/CJS export map | ❌ `@phaser-ae/kernel` → **404 on npm**. Only `@phaser-ae/cli` (0.8.0) is on npm; engine + packs are downloaded by the CLI from phaser.io after browser account sign-in |
| Renderer | WebGL 1 (+ Canvas fallback, deprecated in v4) | WebGPU-first with WebGL2 fallback (real device tests at startup, one bundle) |
| Minified bundle | 1,375,976 B (`phaser.min.js`); ESM 1,377,611 B; Arcade-only variant 1,266,396 B | Kernel source 2.8 MB; final bundle = kernel + chosen packs (size not published) |
| TypeScript | Ships `types/phaser.d.ts`; official create-app offers Vite + TypeScript | TS-native: kernel + packs arrive as source; bake type-checks with strict TS and types the composed `game` |
| Physics | Arcade (and Matter per docs) built in — optional; ignore them and use Planck.js | Kernel has none; free packs include "Box2D v3 rigid bodies" and the engine's own 2D solver |
| Touch / multitouch | Unified pointer API; `input.activePointers` / `addPointer()` up to 10 pointers; per-object drag events | Multi-pointer `pointers` array (`kind: 'mouse'|'touch'|'pen'`), gestures, `press()` synthetic touch buttons; UI pack has built-in sliders |
| Offline / no CDN at runtime | ✅ Bundled from node_modules; no license server; MIT | Shipped game is "one bundle" (runtime OK per docs), **but** the dev pipeline requires phaser.io account + server downloads; cannot pin in package.json |
| Capacitor / Android WebView | Proven path: official Phaser↔Capacitor tutorial + Capacitor's own Games guide names Phaser; WebGL 1 runs everywhere | Untested at scale; WebGPU absent in many Android WebViews → falls back to WebGL2 (available in modern Android WebView); no Capacitor reports found |
| Cost | Free, full commercial rights | Free tier: 163 packs; **Pro** (~$20/month per search-indexed pricing snippet) unlocks all 358 packs incl. 195 Pro packs |
| Community / docs | "Billions of plays, hundreds of thousands of games"; large forum/Discord; 708 pages of API docs (4.1.0) | "New, and moving fast" (vendor's own words); 26 pages of kernel API docs; docs written "to be read at generation time by a model" |
| Track record | Battle-tested; vendor commits to API stability | 500 games made in Game Agent's first month (June–July 2026); breaking changes frequent by design ("Agents don't care if you burn semver on every deploy") |

---

## 3. Candidate A — Phaser 4 (recommended)

### 3.1 Version verification (registry, run 2026-11-12)

```
$ npm view phaser version          → 4.2.1
$ npm view phaser license          → MIT
$ npm view phaser types            → ./types/phaser.d.ts
$ npm view phaser dist-tags        → { alpha: 4.0.0-alpha.4, beta: 4.0.0-rc.7, latest: 4.2.1 }
$ npm view phaser dependencies     → { eventemitter3: ^5.0.4 }
$ npm view phaser dist.unpackedSize → 112530289   (whole package incl. changelogs, guides, docs)
```

Release dates from `npm view phaser time`: 4.0.0 → **2026-04-10**; 4.1.0 → 2026-04-30; 4.2.0 → 2026-06-19; **4.2.1 → 2026-07-09**. No newer version or prerelease tag exists as of 2026-11-12 (the `alpha`/`beta` tags are stale artifacts of the v4.0 pre-release cycle). The 4.2.1 changelog ("Version 4.2.1 - Giedi - 9th July 2026") is a pure bugfix release (stencil fixes, ESM build fix, ScaleManager parent-resize fix, tween startDelay fix) — [changelog](https://cdn.jsdelivr.net/npm/phaser@4.2.1/changelog/v4/4.2.1/CHANGELOG-v4.2.1.md).

### 3.2 License

- **MIT** (npm `license` field, verified 2026-11-12). The official pricing page's free tier states "Full Phaser 4 framework … Full commercial rights" ([phaser.io/pricing](https://phaser.io/pricing)).
- No runtime license checks, no phoning home in the engine itself. Note: the *official project template* (`npm create @phaserjs/game@latest`) generates a `log.js` telemetry script that "sends basic project info … to a remote server" and can simply be deleted ([source](https://emanueleferonato.com/2026/04/17/getting-started-with-phaser-4-vite-typescript-setup-using-the-official-create-game-app)) — relevant to CHARKHTAZ's offline-first/no-telemetry posture.

### 3.3 Package & bundle size (jsdelivr package listing for phaser@4.2.1, retrieved 2026-11-12)

| File | Size (bytes) |
|---|---|
| `dist/phaser.min.js` (UMD/CJS, minified) | 1,375,976 (~1.31 MiB) |
| `dist/phaser.esm.min.js` (ESM, minified) | 1,377,611 (~1.31 MiB) |
| `dist/phaser-arcade-physics.min.js` | 1,266,396 (~1.21 MiB) |
| `dist/phaser.esm.js` (ESM, unminified) | 8,800,542 |
| `dist/phaser.js` (unminified) | 8,793,523 |

Source: [data.jsdelivr.com/v1/packages/npm/phaser@4.2.1](https://data.jsdelivr.com/v1/packages/npm/phaser@4.2.1). **Estimate (not measured):** gzipped transfer size ≈ 0.35–0.45 MB for the minified build, typical for minified JS.

- Export map (npm `exports`): `import` → `./dist/phaser.esm.js`, `require` → `./dist/phaser.js`, `types` → `./types/phaser.d.ts`. This is a standard Vite-friendly ESM package: `import Phaser from 'phaser'` just works, and the whole engine bundles from node_modules — **no CDN, no license server, fully offline-capable builds**.
- Single runtime dependency: `eventemitter3@^5.0.4`.
- The package also ships in-depth guides ("Phaser 4 Rendering Concepts", "Phaser 4 Shader Guide", "Phaser 4 Pixel Art Guide") and per-version changelogs back to v3.55, plus a v3→v4 `MIGRATION-GUIDE.md` (19,486 B).

### 3.4 TypeScript support

- Ships its own declarations (`types` field → `./types/phaser.d.ts`; docs: "we also provide TypeScript definitions" — [docs.phaser.io](https://docs.phaser.io/)).
- Official project generator: `npm create @phaserjs/game@latest` → Web Bundler → **Vite** → **TypeScript**, with Vite configs that split Phaser into its own chunk ([walkthrough](https://emanueleferonato.com/2026/04/17/getting-started-with-phaser-4-vite-typescript-setup-using-the-official-create-game-app)).
- CHARKHTAZ already uses TypeScript ^7.0.2 + Vite ^8.3.8 (`package.json`), i.e. the exact stack the official template targets.

### 3.5 Renderer & Android WebView compatibility

- Phaser 4 is "a total overhaul of the WebGL rendering engine"; the team deliberately "stuck with WebGL for wider compatibility" (WebGL 1, not WebGL 2) — [Phaser 4 Rendering Concepts](https://cdn.jsdelivr.net/npm/phaser@4.2.1/docs/Phaser%204%20Rendering%20Concepts/Phaser%204%20Rendering%20Concepts.md) (ships inside the npm package).
- The official positioning article: "It's a 2D engine built on **WebGL 1** … WebGL 1 runs _everywhere_. Every phone, every tablet, every locked-down school Chromebook, every ancient Android device" — [phaser.io/news, July 2026](https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update).
- Canvas renderer: "still available, but … considered deprecated. … As WebGL support is effectively baseline today, it makes sense to focus on WebGL over Canvas" (same Rendering Concepts doc). So a Canvas fallback exists as a last resort, but plan for WebGL.
- For Android WebView this is the safest possible profile: WebGL 1 is baseline in Android System WebView (Chromium) for years; Capacitor's docs themselves state "broad support for WebGL and canvas rendering" on mobile ([capacitorjs.com/docs/guides/games](https://capacitorjs.com/docs/guides/games), v8).

### 3.6 Capacitor integration — evidence

1. **Official Phaser tutorial** "Bring your Phaser game to iOS and Android with Capacitor": `npm install @capacitor/core @capacitor/cli` → `npx cap init` → `webDir: "dist"` → `npx cap add android`; game-side guidance covers `type: Phaser.AUTO`, `Scale.FIT`, sizing via `window.innerWidth * devicePixelRatio`, `pointerup`/`drag` touch handling, `viewport-fit=cover` + `safe-area-inset-*`, and `game.device.os.desktop` / `Capacitor.isNativePlatform()` branching — [phaser.io/tutorials](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor).
2. **Capacitor's official Games guide** (v8 docs) recommends Phaser by name: "Phaser is one of the most popular web-based game development engines" — [capacitorjs.com/docs/guides/games](https://capacitorjs.com/docs/guides/games).
3. **Known-issue landscape:** Phaser 3-era forum threads report Android APK issues that are configuration/device-specific — e.g. "Phaser 3 + Capacitor Android APK: White screens, texture rendering failures, and orientation issues" ([phaser.discourse.group, Mar 2026](https://phaser.discourse.group/t/phaser-3-capacitor-android-apk-white-screens-texture-rendering-failures-and-orientation-issues/15571); thread body is JS-gated, gist from its indexed summary: "Game works on web but has major issues on mobile"). **No Phaser-4-specific Capacitor blocker was found** in this research; the classic fixes (devicePixelRatio sizing, Scale.FIT, hardware acceleration, safe-area insets) are exactly what the official tutorial prescribes.

### 3.7 Co-use with Planck.js — the integration pattern

Phaser 4's physics systems (Arcade, and Matter per the docs — [docs.phaser.io/phaser/concepts/physics](https://docs.phaser.io/phaser/concepts/physics)) are optional and simply not enabled; the renderer is physics-agnostic. The established pattern (documented end-to-end in TypeScript by Emanuele Feronato) is:

```ts
// Scene.create(): build the Planck world (no Phaser physics config at all)
this.world = new planck.World(new planck.Vec2(0, GameOptions.gameGravity));

// Scene.update(): step, then sync sprites from bodies
update(): void {
  this.world.step(1 / 60);        // fixed timestep
  this.world.clearForces();
  for (let body = this.world.getBodyList(); body; body = body.getNext()) {
    const ud = body.getUserData();
    ud.sprite.x = toPixels(body.getPosition().x);
    ud.sprite.y = toPixels(body.getPosition().y);
    ud.sprite.rotation = body.getAngle();
  }
}
```

with a meters↔pixels scale (`worldScale: 30` in the example) and `body.setUserData({ sprite })` linking — [source with full code](https://emanueleferonato.com/2022/04/08/html5-physics-driven-concentration-game-prototype-using-phaser-and-planck-js-rewriting-to-typescript-and-adding-images) (Phaser 3-era; the `Scene.create`/`Scene.update`/`setInteractive` APIs shown are unchanged in kind for v4 per current docs). Planck's own docs prescribe the fixed-step discipline: 1/60 s timestep, velocity/position iterations (suggested 8/3), `clearForces()` after stepping, and "don't tie the time step to your frame rate" — [piqnt.com/planck.js docs](https://piqnt.com/planck.js/docs/world/simulation.html). Implementation note for CHARKHTAZ: wrap `world.step` in a fixed-timestep accumulator inside `Scene.update(time, delta)` so the 60 Hz physics is independent of display refresh; feed the three analog sliders (throttle/brake/clutch) into wheel joints / motor targets each step.

### 3.8 Touch & multitouch (the three-slider core mechanic)

- Unified input: "Phaser combines mouse and touch (pointer) events into one single unified API" — [docs.phaser.io/phaser/concepts/input](https://docs.phaser.io/phaser/concepts/input).
- Multitouch is first-class: "By default, Phaser creates 2 pointers (mouse + 1 touch). Configure more at startup or runtime: `input: { activePointers: 4 }` … `this.input.addPointer(3)` // up to 10 total … `this.input.pointer1` … `this.input.pointer10`" — official repo skills reference, [phaserjs/phaser@master](https://raw.githubusercontent.com/phaserjs/phaser/master/skills/input-keyboard-mouse-touch/references/REFERENCE.md). Corroborated by the docs page (`input.activePointers`, `scene.input.addPointer(num)`).
- Drag: `gameObject.setInteractive({ draggable: true })` + `'dragstart'/'drag'/'dragend'` events carrying `(pointer, dragX, dragY)` (same two sources) — exactly the primitive needed for three simultaneous vertical analog sliders (one pointer per slider, pointer ID distinguishes them).
- The official Capacitor tutorial demonstrates the drag pattern on mobile (`setInteractive({ draggable: true }).on('drag', …)`).

### 3.9 Maturity, community, stability

- Vendor's own framing: Phaser 4 is "our open source, battle-tested, 2D WebGL game framework … Phaser games have been played literally billions of times … used for things like Google Doodles", with track record "Billions of plays, hundreds of thousands of games" — [phaser.io/news, July 2026](https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update).
- API stability commitment: "The Phaser 4 API is stable; we have no intention of rocking that boat" (same article).
- Project health: "actively developed for over 11 years … one of the most starred game frameworks on GitHub … maintained by Phaser Studio Inc along with our open source community" — [docs.phaser.io](https://docs.phaser.io/).
- Release cadence fact: 4.0.0 (Apr 10) → 4.2.1 (Jul 9), then no further release as of 2026-11-12 (~4 months quiet). Neutral observation; not a known problem.

### 3.10 Risks (Phaser 4) — all manageable

| Risk | Severity | Mitigation |
|---|---|---|
| v4 stable line is only ~7 months old; v4 is a full renderer rewrite (19.5 KB migration guide exists), so much community content (tutorials, plugins, StackOverflow answers) is still v3-flavored | Medium | Rely on official docs + in-package guides; pin 4.2.1; verify each v3-sourced snippet against v4 docs |
| Canvas renderer deprecated → WebGL required for most v4 features | Low | WebGL 1 is baseline in Android WebView; keep hardware acceleration enabled in the Capacitor Android project; test on low-end devices |
| Full minified bundle ~1.31 MB (~0.4 MB gz, **estimate**) | Low | Acceptable for a game APK/web build; `phaser-arcade-physics` variant is ~110 KB smaller if useful (contents of that variant not further verified) |
| Persian/RTL text shaping in Phaser 4 text objects not verified in this research | Medium (game is Persian-first) | Spike task — see §7 open items |
| 4 months without a patch release (Jul 9 → Nov 12) | Low | Watch the forum/changelog; pin stays reproducible regardless |

---

## 4. Candidate B — Phaser AE (rejected for CHARKHTAZ)

### 4.1 What it is, and release status

Phaser AE is **not** a new version of Phaser. Per the official explainer: "Phaser AE is a completely separate engine that we built from scratch, specifically for LLMs to use … It does 2D _and_ 3D, it's WebGPU-first, and it is not open source … The Game Agent does not generate Phaser code. Not a line of it." — [phaser.io/news, July 2026](https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update). ("AE stands for 'Agentic Engine'".)

Current release status (all fetched 2026-11-12):

- Kernel **3.0.0-2**, released **October 26, 2026**, 2.8 MB, the latest of only **3 kernel releases** (3.0.0-0 on Oct 13, 3.0.0-1 on Oct 18, 3.0.0-2 on Oct 26) — [kernel releases page](https://www.phaser.io/kernel/releases).
- Kernel scope: "53 files, 9,491 lines, 26 modules", 206 exports; API docs are 26 pages vs Phaser 4.1.0's 708 — [kernel page](https://www.phaser.io/kernel). It is explicitly "a game engine built for AI agents … Your agent can read all of it."
- The kernel page markets the CLI path for coding agents (Claude Code, Codex, Cursor…): `npx -y @phaser-ae/cli blank <name> --idea "…"`.

So AE is **stable-numbered but very young**: the public kernel line is 4 weeks old at research time, and the vendor's own side-by-side table lists its track record as "New, and moving fast."

### 4.2 Kernel + expansion-pack architecture

- The kernel runs the game (loop, clock, stage roster, scenes, input, loading, timers, seeded rng, signals/hooks); "everything else plugs in as an expansion pack"; "The kernel never imports a pack" — [kernel page](https://www.phaser.io/kernel).
- **358 packs in 20 families; 163 free, 195 Pro**; "34 new this week" at research time — [packs catalog](https://phaser.io/packs). The kernel page states "163 packs are free. 195 more come with Pro."
- Games are defined by a `manifest.json` listing packs; "The bake composes them into the game's `engine.ts` … The build checks the game with strict TypeScript … then bundles it into one file" ([kernel page](https://www.phaser.io/kernel)).
- Packs relevant to CHARKHTAZ's genre exist and are free: "Side-on world" (side-view 2D world), "Follow camera", "Box2D rigid bodies" (Box2D v3 for 2D — could replace Planck), the engine's own "Rigid-body 2D physics", "2D controls" (keyboard/gamepad/touch, 1–4 players), "On-screen touch controls", the UI pack ("Panels, windows, buttons, toggles, **sliders**, progress bars … 125 icons"), and "Renderer (WebGPU or WebGL2)" — [packs catalog](https://phaser.io/packs).
- A Pro pack example: "Level saga progression" — "This is a Pro pack. Upgrade to Phaser Pro to use it in your games" ([level-saga](https://phaser.io/packs/level-saga)). **Phaser Pro pricing:** search-indexed snippets of [phaser.io/pricing](https://phaser.io/pricing) show "Pro $20 a month" and "8,000 credits a month … All 358 expansion packs, including all 195 Pro packs" — *the direct page fetch only rendered the Phaser Editor tiers (Free / $12 / Custom), so treat the $20 figure as secondary-source, unconfirmed on-page.*

### 4.3 Renderer

- WebGPU-first with a full WebGL2 fallback: the `render-auto` pack "tests the device at startup, runs WebGPU where it works and WebGL2 where it does not, **from one bundle**", with real device tests, a readable failure message, and `game.renderer.prefer('webgl2')` for testing — [render-auto pack](https://phaser.io/packs/render-auto) (free, v3.0.0-3).
- WebGL2-path limitations: "no screen recording, one shadow map rather than cascades, at most eight local lights, and no `skymax` or `watermax`" (same page).
- Android WebView note: WebGPU is not universally available in Android WebViews, so AE games there run on the WebGL2 path; WebGL2 is available in modern Android System WebView. This is workable, but narrower than Phaser 4's WebGL-1 baseline. (General WebView capability claim; not from a Phaser source.)

### 4.4 Touch / multitouch

Strong: the kernel input API exposes `pointers: ReadonlyArray<PointerState>` ("Every pointer the game knows"), `kind: 'mouse' | 'touch' | 'pen'`, `isTouch`, `touchDevice`, gestures (tap/double-tap/long-press/pan/swipe with tunable thresholds), and `press(code, down)` for driving bindings from "on-screen touch buttons" — [kernel input docs 3.0.0-2](https://phaser.io/kernel/docs/3.0.0-2/input). The UI pack ships sliders as data-styled widgets. Three simultaneous analog sliders are squarely in scope.

### 4.5 TypeScript

TS-native: "The kernel and the packs a game uses arrive in its folder as **source code**, each with a page of docs, never as a compiled binary"; the bake "types `game` with each pack's API" and the build "checks the game with strict TypeScript" ([kernel page](https://www.phaser.io/kernel)). However, the API "is shaped for a machine and not for you … The documentation isn't API reference material either — it's a set of task-shaped maps … written to be read at generation time by a model" ([July 2026 article](https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update)).

### 4.6 Distribution, accounts, and offline-first — the disqualifier

Verified facts (npm checks run 2026-11-12; CLI README read via `npm view @phaser-ae/cli readme`):

- `npm view @phaser-ae/kernel` → **404 Not Found**. The engine is **not distributed via npm**. Only the CLI is: `@phaser-ae/cli` **0.8.0**, MIT.
- CLI README: requires **Node.js 20+**, "**A phaser.io account.** The first command that needs it opens your browser so you can sign in and approve Phaser AE", and a coding agent. "The game, the Phaser AE engine and its expansion packs sit in one folder on your disk" — i.e. the CLI **downloads** engine + packs from phaser.io (`api.phaser.io`; it sends an `X-Phaser-AE-Client` telemetry header with every request, and phaser.io "keeps it with its record of each pack and engine download").
- Engine updates come via `phaser-ae update` inside the game folder; publishing/playtesting round-trips through phaser.io; art/audio "crew" bots consume phaser.io credits; uploading your own files (pictures, sound, fonts) is a **Phaser Pro** feature.
- License boundary, quoted from the CLI README: "**MIT, for this CLI. It doesn't cover the Phaser AE engine or the expansion packs the CLI downloads.**"
- Runtime itself: the bake "bundles it into one file" and render-auto ships "one bundle, two backends", so a *built* AE game does not need a runtime CDN (documentation-level evidence; not executed by this research, which has no phaser.io account).

**Consequence for CHARKHTAZ:** the engine cannot be pinned in `package.json`, cannot be installed by CI from npm, and every engine/pack acquisition is an authenticated, server-mediated, telemetry-emitting step. This directly violates the project's offline-first, npm-pinned, reproducible-build constraints (the stated task requirement was "fully bundled from node_modules with no CDN/license-server at runtime" — AE fails the *node_modules* half outright, and its dev pipeline adds an account/license-server dependency Phaser 4 doesn't have).

### 4.7 License terms (PolyForm Shield 1.0.0)

From the [kernel page](https://www.phaser.io/kernel): "The kernel is source-available under the PolyForm Shield License 1.0.0, with an additional permission to make and sell games." The [license text](https://polyformproject.org/licenses/shield/1.0.0/) grants:

- A copyright license "for the software to do everything you might do with the software … for any permitted purpose", a Distribution License (copies may be distributed, including with permitted changes, provided notices are passed along), and a Changes and New Works License.
- **Noncompete:** "Any purpose is a permitted purpose, **except** for providing any product that competes with the software or any product the licensor or any of its affiliates provides using the software." A racing game does not compete with a game engine, so making/selling CHARKHTAZ with AE appears permitted — but it is **not an OSI-approved open-source license**, and distribution of the kernel source inside a public GitHub repo would carry notice obligations.
- "New Products" clause: if the licensor later ships something that competes with your product, you may continue only on pre-existing versions.
- Game code ownership is separate: "Who owns the games I make with the agent? **You do.** … The engine code isn't open-source and is not covered under an MIT license, but your game code can be [open source] if you wish" ([July 2026 article](https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update)).

### 4.8 Maturity risks (AE)

1. **Age:** first public kernel release 2026-10-13 — 4 weeks before this research. Three releases in two weeks; exports grew 187 → 206 between 3.0.0-1 and 3.0.0-2 ([releases page](https://www.phaser.io/kernel/releases)).
2. **Breaking changes by design:** "There was nobody to apologise to because we'd gone and changed the API on them. **Agents don't care if you burn semver on every deploy.**" ([July 2026 article](https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update)). A hand-maintained TypeScript codebase cannot absorb that cadence cheaply.
3. **Community size:** new; the hosted Game Agent went public ~June 2026 with "over 500 games" in its first month (same article). No independent bug tracker, no third-party books/courses, no long-tail of answers.
4. **Vendor concentration & closed source:** "Is Phaser AE open source? No, it isn't. … Will we open source it eventually? Probably, but it isn't a priority." (same article). Bug fixes and roadmap depend on one company.
5. **Workflow mismatch:** AE's toolchain is built around agent-driven, phaser.io-mediated build/publish loops, not a conventional `git clone && npm ci && vite build` repo like CHARKHTAZ's.

---

## 5. License notes (summary)

| | Phaser 4 | Phaser AE |
|---|---|---|
| Engine license | MIT (OSI) | PolyForm Shield 1.0.0 (source-available, non-OSI) + additional permission to make and sell games |
| Commercial use | Unrestricted | Permitted (games explicitly allowed); forbidden only for competing products |
| Redistribution of engine source | Unrestricted (keep notice) | Permitted with license + "Required Notice" propagation |
| Modifications | Unrestricted | Permitted; distribution of modifications follows the same terms |
| Patent grant | MIT (implicit) | Explicit patent license; terminates on patent-infringement claims |
| Game code ownership | Yours (MIT applies to engine only) | Yours, explicitly |
| Practical risk for CHARKHTAZ | None beyond attribution | Engine source vendored in a public repo carries notice obligations; noncompete clause needs legal eyes if CHARKHTAZ ever ships engine-adjacent tooling; no npm provenance |

---

## 6. Final recommendation

**Adopt Phaser 4 and pin it exactly:**

```
npm install phaser@4.2.1
```

```json
"dependencies": {
  "phaser": "4.2.1"
}
```

- Pin **exactly** (`"4.2.1"`, no `^`/`~`): a game engine is a foundational dependency; minor-version renderer changes should be a deliberate, tested upgrade. The `package-lock.json` fixes `eventemitter3` transitively.
- Keep `planck@^1.5.1` for physics; do not enable Arcade/Matter. Follow the §3.7 pattern (fixed-timestep `world.step` accumulator in `Scene.update`, sprite sync from body transforms, meters↔pixels scale).
- Scaffold guidance (optional): the official generator `npm create @phaserjs/game@latest` (Vite + TypeScript) matches this repo's stack; delete its `log.js` telemetry file for offline-first cleanliness.
- Capacitor: follow the official tutorial's mobile recipe (`webDir: "dist"`, `Scale.FIT`, devicePixelRatio sizing, safe-area insets, drag-based touch).

**Why not Phaser AE:** impressive technology (deterministic kernel, WebGPU/WebGL2, free Box2D v3 pack, built-in sliders) but disqualifying mismatches for this project — not open source, not on npm, account-and-server-mediated development, 4-week-old kernel, semver-burning release philosophy, and an API documented for LLM consumption rather than human maintenance. Re-evaluate AE only if CHARKHTAZ later prioritizes agent-generated spin-offs or if AE opens an npm-distributed, open-licensed distribution channel.

**Phaser 3 (tertiary fallback):** not needed — no serious Phaser 4 blocker was found. For the record: the v3 line ends at 3.90.0 (2025-05-23 per npm `time`); it remains battle-tested with the largest tutorial base, but it is the previous line and would inherit an older renderer. Fall back to `phaser@3.90.0` only if a v4-specific blocker (e.g. Persian text rendering, a WebView regression) proves unfixable.

---

## 7. Open items (to verify — not blockers)

1. **Persian/RTL text rendering in Phaser 4** (highest-value spike): confirm Canvas-based Text objects shape Persian correctly in Android WebView, and decide the BitmapText/MSDF strategy for in-world text. No Phaser-specific source was found in this research either way. Suggested check: a 30-minute spike rendering «چرخ‌تاز» + mixed Persian/English strings on a device.
2. **Performance spike:** mid-range Android WebView, ~100–300 sprites + Planck step at 60 Hz fixed timestep; measure frame time.
3. **Phaser Pro exact price** ($20/month figure is from a search-indexed snippet of phaser.io/pricing; the AE section of that page did not render in direct fetches).
4. **Pre-integration forum sweep:** search phaser.discourse.group for "Phaser 4 Capacitor" threads immediately before integration; this research found only Phaser 3-era issue reports (all configuration-class).
5. **Bundle trimming:** measure whether Vite tree-shaking reduces the 1.31 MB ESM bundle in practice, and what the `phaser-arcade-physics` build actually excludes.

---

## 8. Evidence log (all retrieved 2026-11-12)

**Primary — npm registry (commands run in workspace):**
- `npm view phaser version license types dist.unpackedSize dist-tags dependencies main module exports --json` → 4.2.1 / MIT / types / 112,530,289 B / latest=4.2.1 / eventemitter3 ^5.0.4 / export map
- `npm view phaser time --json` → 4.0.0: 2026-04-10 · 4.1.0: 2026-04-30 · 4.2.0: 2026-06-19 · 4.2.1: 2026-07-09 · 3.90.0: 2025-05-23
- `npm view @phaser-ae/kernel` → **E404 Not Found**
- `npm view @phaser-ae/cli version license dist-tags description bin readme --json` → 0.8.0 / MIT / README (account requirement, telemetry, license boundary, folder layout)

**Primary — official Phaser pages (fetched):**
- [Phaser AE kernel](https://www.phaser.io/kernel) — architecture, 358 packs, 163 free/195 Pro, PolyForm Shield + game permission, bake, CLI, WebGL2/WebGPU
- [Kernel releases](https://www.phaser.io/kernel/releases) — kernel 3.0.0-2 (2026-10-26), 3 releases, first 2026-10-13, 2.8 MB
- [Kernel input API 3.0.0-2](https://phaser.io/kernel/docs/3.0.0-2/input) — pointers/gestures/touchDevice/press()
- [Expansion packs catalog](https://phaser.io/packs) — 358 packs, 20 families, 163 free, 34 new this week; Box2D/world-side/rig-follow/controls packs
- [render-auto pack](https://phaser.io/packs/render-auto) — WebGPU→WebGL2 startup tests, one bundle, WebGL2 limitations
- [level-saga pack](https://phaser.io/packs/level-saga) — example Pro pack gating
- [Phaser 4 vs Phaser AE explainer](https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update) — WebGL 1, open source vs not, "battle-tested", semver-burning quote, ownership, track-record table
- [Phaser pricing](https://phaser.io/pricing) — Phaser 4 free with full commercial rights; Editor tiers ($12/mo); *AE Pro figures via search snippet only*
- [Phaser↔Capacitor official tutorial](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor) — full mobile recipe

**Primary — Phaser 4 package contents (fetched):**
- [jsdelivr file listing, phaser@4.2.1](https://data.jsdelivr.com/v1/packages/npm/phaser@4.2.1) — dist sizes (1,375,976 / 1,377,611 / 1,266,396 B), changelog/guides inventory
- [CHANGELOG v4.2.1](https://cdn.jsdelivr.net/npm/phaser@4.2.1/changelog/v4/4.2.1/CHANGELOG-v4.2.1.md) — "Giedi", 2026-07-09, bugfix list
- [Phaser 4 Rendering Concepts](https://cdn.jsdelivr.net/npm/phaser@4.2.1/docs/Phaser%204%20Rendering%20Concepts/Phaser%204%20Rendering%20Concepts.md) — WebGL overhaul, Canvas deprecated, WebGL-for-compatibility choice
- [Phaser repo input skills reference (master)](https://raw.githubusercontent.com/phaserjs/phaser/master/skills/input-keyboard-mouse-touch/references/REFERENCE.md) — multitouch config, pointer1–10, drag events
- [docs.phaser.io](https://docs.phaser.io/) — overview, TS definitions, 11-year history
- [docs.phaser.io physics concepts](https://docs.phaser.io/phaser/concepts/physics) — Arcade + Matter optional systems
- [docs.phaser.io input concepts](https://docs.phaser.io/phaser/concepts/input) — unified pointer API, multi-touch, dragging

**Third-party corroboration (fetched):**
- [Emanuele Feronato: Phaser 4 + Vite + TS via official Create Game App (2026-04-17)](https://emanueleferonato.com/2026/04/17/getting-started-with-phaser-4-vite-typescript-setup-using-the-official-create-game-app) — official tooling; log.js telemetry note
- [Emanuele Feronato: Phaser + Planck.js in TypeScript (2022-04-08)](https://emanueleferonato.com/2022/04/08/html5-physics-driven-concentration-game-prototype-using-phaser-and-planck-js-rewriting-to-typescript-and-adding-images) — full co-use pattern with code
- [Capacitor Games guide (v8)](https://capacitorjs.com/docs/guides/games) — WebGL/canvas support statement, recommends Phaser
- [Planck.js simulation docs](https://piqnt.com/planck.js/docs/world/simulation.html) — fixed timestep, iterations, clearForces
- [PolyForm Shield 1.0.0](https://polyformproject.org/licenses/shield/1.0.0/) — license text
- [Phaser forum: Phaser 3 + Capacitor Android APK issues (Mar 2026)](https://phaser.discourse.group/t/phaser-3-capacitor-android-apk-white-screens-texture-rendering-failures-and-orientation-issues/15571) — thread body JS-gated; summary from search index

**Local project:**
- `package.json` (read 2026-11-12) — TS ^7.0.2, Vite ^8.3.8, vitest ^5.1.0, planck ^1.5.1; no rendering engine installed yet

**Known gaps in this research:** Phaser Pro on-page price unconfirmed; docs.phaser.io page-version labels not explicitly v4-marked (input/physics content corroborated by the v4 repo skills reference and package contents); AE runtime offline behavior verified at documentation level only; Persian text rendering untested.
