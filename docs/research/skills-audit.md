# Skills Audit — awesome-gamedev-agent-skills & ForgeSkills

- **Date:** 2026-11-12 (all web sources retrieved this date; local repo facts checked this date)
- **Scope:** What is actually usable for CHARKHTAZ — Persian-first 2D side-view physics racing & obstacle-trial game, TypeScript (strict) + Vite + Planck.js, sprite-based 2D art, Android via Capacitor + Web, offline-first, rendering engine still undecided.
- **Method:** Web reads of both repos' README, LICENSE, INSTALLATION, router, and the named skills' `SKILL.md` bodies. Local reads of `package.json` and `AGENTS.md`. **Nothing was installed, no git commands were run, no global state was touched.**
- **Evidence tiers used below:** `[S]` = skill body read in full (primary source); `[C]` = README/catalog-level description only; `[L]` = local repo fact.

---

## 1. Verdict (high confidence)

Both libraries are **usable and worth using**, for different layers:

- **Repo 1 (awesome-gamedev-agent-skills)** contributes the **engine-neutral discipline layer**: 11+ portable playbooks (physics tuning, input architecture, camera, game feel, save systems, assets, UI/UX, audio, performance, level design, AI) whose *concepts* transfer directly to a TypeScript + Planck.js codebase, though all code samples are GDScript/C#/Python and must be translated. Its engine skills only matter once a renderer is chosen (Phaser 4.2 or PixiJS 8.22 pins). **There is no Planck.js skill and no racing genre skill** — those gaps stay ours to fill.
- **Repo 2 (ForgeSkills)** contributes the **process/QA and measurement layer**: evidence-gated verification, layered testing, debugging discipline, art-direction + measured visual iteration, impact/VFX timings, and an audio wiring manifest. Roughly **10 of its 28 skills apply to a 2D sprite workflow**; the Blender/3D asset-production chain does not.
- **Licenses:** both Apache-2.0 — permissive, compatible with this project, including committing skill folders into our repo (attribution required on redistribution).
- **Install:** repo 1's reported command is **verified verbatim**; the CLI needs Node ≥ 22.20 (local machine runs **v24.20.0** `[L]` — compatible). Default installs are **project-local**; global only via opt-in flags. Repo 2 is a plain file copy; its measurement tools additionally need Python 3.10+ / Pillow / numpy.

---

## 2. Repo 1 — gamedev-skills/awesome-gamedev-agent-skills

Source: <https://github.com/gamedev-skills/awesome-gamedev-agent-skills> (README, retrieved 2026-11-12)

### 2.1 What it is

"77 game-dev skills for your AI coding agent — install once, and a router loads the right skill for whatever you're building." Each skill is a plain `SKILL.md` folder in the Agent Skills open standard (the format Anthropic launched as Claude Skills), loaded natively by Claude Code, Cursor, Windsurf, Cline, Codex, Gemini CLI, Copilot, Kiro and others. Skills are version-pinned to stated engine releases and checked by a validator. Maintainer: Abhishek Barali.

### 2.2 Install — verified

- **Exact command (verified verbatim in README "Quick start" and `docs/INSTALLATION.md`):**
  ```
  npx skills add gamedev-skills/awesome-gamedev-agent-skills
  ```
- **Flags:** `--list` (preview without installing), `-g` (install for every project), `-a <agent>` (target one tool, e.g. `-a cursor`), `--skill <name>` (subset), e.g. `--skill godot-tilemap --skill platformer`. Companions: `npx skills list / update / remove`. Source: [INSTALLATION.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/docs/INSTALLATION.md).
- **Alternative:** Claude Code plugin marketplace (`claude plugin marketplace add …`, `claude plugin install gamedev@awesome-gamedev-agent-skills`), including smaller bundles (router + one engine group).
- **Manual copy:** copy a skill's `<name>/` folder into the agent's skills directory (`.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.cline/skills/`, `.kiro/skills/`, …). "Skill names are unique across this repository, so installing every skill into one flat directory is safe." The `router/` folder is itself a skill and should be copied alongside.
- **Node requirement:** README: "The CLI needs Node.js 22.20 or later." Independently corroborated by the `skills` CLI's npm page: "Requires Node.js 22.20 or later" (<https://www.npmjs.com/package/skills>). Local machine: Node **v24.20.0** `[L]` — satisfies it. Note: our `package.json` declares no `engines` field `[L]`, so nothing in-repo constrains this either way.
- **Global vs project:** the npm page states "Skills are installed to the current project by default; add `-g` to make them available across projects." `npx` itself runs the CLI from npm's cache without a persistent global install. The CLI collects anonymous telemetry (disable with `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1`) — dev-time only, no runtime/CDN implication for the game.

### 2.3 License

- **Apache-2.0** — README badge + License section: "Apache-2.0. See `NOTICE` for attribution and trademark notes." LICENSE file read in full: standard Apache 2.0, copyright "2026 Abhishek Barali and the awesome-gamedev-agent-skills contributors". Sources: [LICENSE](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/LICENSE), README.

### 2.4 The Router

The `router/` folder is a dispatcher skill. Algorithm ([router/SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/router/SKILL.md), read in full):

1. **Detect engine** from project fingerprints — exactly one engine. Signals: `project.godot` → Godot; `*.uproject` → Unreal; `Assets/` + `ProjectSettings/ProjectVersion.txt` → Unity; `Cargo.toml` with `bevy`; **`package.json` dep `phaser` → Phaser; dep `pixi.js` → PixiJS; dep `three` → three.js**; `conf.lua`/`love.*` → LÖVE; `import pygame` → pygame; `*.rbxl(x)`/Rojo → Roblox.
2. **Classify task** from phrasing → disciplines (additive) + at most one genre + workflows.
3. **Load the minimal set**, composed engine → discipline → genre → workflow; re-route on pivot.

**Critical fit fact for CHARKHTAZ:** our `package.json` currently has exactly one runtime dependency, `planck ^1.5.1` `[L]` — **Planck.js is not among the router's detectable engines**, and no `phaser`/`pixi.js`/`three` dep exists yet, so the router will find *no engine* until a rendering dependency is added. Its fallback is: check plain-text engine mentions, else ask one question, else "**default to Godot**" — a wrong default for us. Mitigation: load disciplines directly (they work standalone — the router itself routes "how should I design save slots?" straight to `save-systems` with no engine), and add the renderer dep before relying on engine routing.

### 2.5 Catalog (77 skills, 9 categories)

Engines (49, each version-pinned): Godot 16 (Godot 4.7) · Unity 8 (Unity 6.3 LTS) · Unreal 6 (UE 5.8) · Ebitengine 1 (v2.10.5, Go 1.25+) · **Web 6 (Phaser 4.2 · PixiJS 8.22 · three.js r186)** · Other 12 (Bevy 0.20, pygame-ce 2.5.8, LÖVE 11.5, Defold 1.14.0, Roblox ×7).
Disciplines (15, cross-engine): `create-game-assets`, `game-ai`, `ai-behavior-trees-utility-ai`, `procedural-gen`, `dialogue-systems`, `save-systems`, `audio-design`, `shader-programming`, `physics-tuning`, `level-design`, `input-systems`, `game-feel`, `game-ui-ux`, `camera-systems`, `performance-optimization`.
Genres (9): platformer, roguelike, rpg, fps-shooter, tower-defense, card-game, visual-novel, survival-crafting, puzzle — **no racing/trial genre**.
Workflows (4): game-jam, prototype-fast, steam-publish, itch-publish.

Minor doc inconsistency (noted, not load-bearing): README says 77 skills; `docs/INSTALLATION.md` still says "the router plus all 68" — the INSTALLATION count appears stale. Catalog arithmetic (49+15+9+4 = 77) matches the README.

### 2.6 Phaser 4 vs "Phaser AE" — clarification

The repo's web-engine skills target **classic Phaser, pinned to Phaser 4.2** (`phaser-core`, `phaser-arcade-physics`) — not "Phaser AE". Per Phaser's own article "Phaser 4 vs Phaser AE" (<https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update>, retrieved 2026-11-12):

- **Phaser 4** — "our open source, battle-tested, 2D WebGL game framework. You write JavaScript or TypeScript with it, by hand (or with your AI coding assistant of your choice). It is for developers."
- **Phaser AE** — "a completely separate engine that we built from scratch, specifically for LLMs to use. It is what powers the Phaser Game Agent. It does 2D _and_ 3D, it's WebGPU-first, and it is not open source." The Game Agent "does not generate Phaser code. Not a line of it."

**Implication:** for a hand-written TypeScript + Planck.js codebase like ours, Phaser 4 is the relevant line; Phaser AE is a closed, agent-driven product with a different API and is **not covered by these skills and not applicable**. Neither repo mentions Phaser AE at all.

### 2.7 The 11 named skills — what each actually gives us

| Skill | Evidence | Engine-agnostic? | Value for CHARKHTAZ | Adaptation needed |
| --- | --- | --- | --- | --- |
| `physics-tuning` | `[S]` | Yes — "Engine-neutral physics tuning with Godot checks: fixed timestep and interpolation, CCD against tunnelling, damping, solver iterations and collision layer matrices." | Directly matches our convention (AGENTS.md: meters, fixed 60 Hz timestep with accumulator and render interpolation). Covers jitter diagnosis, tunnelling rule of thumb ("speed / ticks_per_second < thinnest wall, or CCD"), mass ratios ≤ ~1:10 for stable stacks/joints, sleeping, layer matrix as named data, frame-rate-independence probe. | Code is Godot 4.7 / Unity 6.3; translate to Planck.js (Box2D-family: `setContinuousPhysics`, damping, `m_velocityIterations`). Their tunnel/rate probes port to a Vitest-driven headless sim. |
| `input-systems` | `[S]` | Yes — "Engine-neutral input architecture with Godot InputMap code: named actions, stick deadzones, buffered presses and rebinding with conflict checks." | Core for our three analog sliders: named actions over raw reads, **radial deadzone + separate response curve** (exponent) — exactly the math an analog throttle/brake/clutch ramp needs; press buffering in game time (freezes during pause/hit-stop); rebinding with conflict audit; "Touch routes through the same actions." Reference file `references/buffering-and-accessibility.md` covers touch controls and an accessibility checklist. | Godot InputMap snippets → TS pointer/touch events (multi-touch, independent pointer IDs per AGENTS.md). |
| `game-feel` | `[S]` | Yes — "Engine-agnostic techniques; snippets in GDScript (Godot 4.x) and C# (Unity 6) with pseudocode." | Trauma-decay screen shake (trauma², noise-driven, camera offset only), hit-stop with real-time restore, squash & stretch with BACK/ELASTIC overshoot, **importance-tiered feedback bundles** (small/medium/large presets). "5–8 tiny responses firing together within ~100 ms." Pitfalls list includes accessibility ("reduce screen shake" option). | Implement trauma/hit-stop in our loop; sprites make squash & stretch trivial. |
| `camera-systems` | `[S]` | Yes (Godot/Cinemachine mappings given) | Side-view follow: deadzone + eased look-ahead, **frame-rate-independent smoothing `1 - exp(-rate * dt)`** (with the measured warning that fixed `lerp(a,b,0.1)` is FPS-dependent), clamp the *view* not the centre, follow the interpolated transform, shake offset composes on top. | Map to the chosen renderer's camera (Phaser Camera / Pixi stage transform). |
| `save-systems` | `[S]` | Yes — "Engine-neutral save and load… atomic writes and versioned migration." | Save data not objects; integer `version` from first release; JSON-first; **atomic write (temp + `.bak` + rename)**; stepwise migration chain ("Keep every migration forever"); throttled autosave in its own slot; headless round-trip + corruption test. The JSON gotcha (numbers load as floats; big ids lose digits) applies to `JSON.parse` in JS too. | Godot `FileAccess` code → Capacitor filesystem / IndexedDB / localStorage adapter for Android + Web. |
| `create-game-assets` | `[S]` | Yes | 10-step asset pipeline: inspect → lock technical frame (dimensions, world scale, palette, filtering) → art bible → **asset manifest (size, pivot, collision role, source, license, approval status)** → approve one hero target → produce families → normalize deterministically → engine-native import → validate in context → record provenance. Bundled raster QA scripts (`asset_report.py` size/alpha/color-count checks, `build_preview_sheet.py` contact sheets; Python 3.10+ + Pillow). `references/raster-pipeline.md` covers sprites, animation strips, tiles, backgrounds, UI art. | Engine import step maps to our Vite asset pipeline + `src/assets/` manifests (AGENTS.md already mandates data-driven assets). |
| `game-ui-ux` | `[C]` | Yes (discipline) | "Cross-engine HUD/menus: anchors, resolution scaling, safe areas, focus navigation." Safe areas + resolution scaling matter for Android via Capacitor. | **RTL/Persian/bidi is not covered** — our Persian-first RTL UI rules remain in-house (AGENTS.md already owns this). |
| `audio-design` | `[C]` | Yes (discipline) | "Buses/mixing, adaptive music, SFX, ducking." Maps to `src/audio/` engine/tire/effect buses. | Pairs with Web Audio; examples lean Godot/Unity. |
| `performance-optimization` | `[C]` | Yes (discipline) | "Profile-first: frame budget, CPU/GPU triage, draw calls, pooling, GC, asset budgets." **GC discipline is directly relevant to a JS/TS Android target**; sprite batching/atlases for draw calls. | Body not read in this audit; verify JS-specific depth before relying on it. |
| `level-design` | `[C]` | Yes (discipline) | "Whitebox/blockout structure, tile/grid layout, pacing." Obstacle-trial tracks are exactly blockout-then-pacing work. | Body not read. |
| `game-ai` | `[C]` | Yes (discipline) | "NPC decision-making: FSMs, behavior trees, steering, pathfinding." Relevant to `src/racing/` (AGENTS.md assigns "AI, ghost replay" there) — ghost replay and any opponent vehicles. | Body not read; `ai-behavior-trees-utility-ai` exists as a deeper follow-on if needed. |

Also notable: `prototype-fast` (workflow) — "Greybox a playable vertical slice quickly; cut scope; validate the fun" — fits the current build phase.

---

## 3. Repo 2 — sekaikx/ForgeSkills

Source: <https://github.com/sekaikx/ForgeSkills> (README, retrieved 2026-11-12)

### 3.1 What it is

28 skills "for agents that write code, drive Blender, and ship game assets. Each one is a procedure with a gate: what to do, in what order, what to measure, and what counts as done." Core loop: `measure → build → render → compare → fix one thing → repeat`. Three standing rules: measure don't eyeball; one variable per iteration; evidence or silence. Description text totals ~1,714 tokens across all 28 (routing text); bodies load only when chosen.

**Honest status (their own README, worth weighting):** the workflow skills, Blender pitfalls and comparison/texture tools are exercised; **"everything Godot and Unity… Treat them as a spec until you run them"**; the hero demo character failed its own gate (silhouette IoU 0.46 vs required 0.85, kept deliberately); techniques trace to 16 analyzed transcripts plus "engineering" additions. Not in the library: dialogue, multiplayer, save systems, store pages, music composition.

### 3.2 Install

- "A skill is a folder with a `SKILL.md`. **Installation is a copy. No build, no package manager.**" — `git clone`, then copy `skills/gamedev-*` into the agent skills dir: project (`.claude/skills/`, `.agents/skills/`, `.cursor/skills/`) or personal (`~/.claude/skills/`, …). Restart the session if the dir was created after start.
- **Tooling path:** skill bodies call `tools/refmatch/...` and `tools/texture/...` **from the repo root** — "If the skills live elsewhere, symlink `tools/` or keep a checkout beside the project… **Skip this and the procedures still read. The measurement steps need the scripts.**" (Windows junction example given.)
- **Requirements:** the skills themselves need nothing; `tools/refmatch/*`, `tex_to_maps.py`, `tile_seam_check.py` need **Python 3.10+, Pillow, numpy**; `tools/blender/*` need **Blender 4.2+/5.x**; Godot/Unity skills need the engine only when run (`pip install -r requirements.txt` for tooling).

### 3.3 License

- **Apache-2.0** — README License section; [LICENSE](https://github.com/sekaikx/ForgeSkills/blob/main/LICENSE) read in full (standard Apache 2.0 text). Hygiene note: its copyright appendix line is the unfilled template ("Copyright [yyyy] [name of copyright owner]") — the grant is still standard Apache-2.0.

### 3.4 The 10 named gamedev-* skills — 2D sprite workflow verdicts

| Skill | Evidence | Verdict for 2D sprites | Grounds (from the skill's own text) |
| --- | --- | --- | --- |
| `gamedev-art-direction` | `[S]` | **APPLY (adapted)** | "Engine-agnostic. Measurement via tools/refmatch and tools/texture (Python)." One-page art bible (shape language, value structure, palette roles, detail hierarchy, readability) + cheapest-first unification pass + measurable checks. The palette check (`palette_report.py`, mean ΔE ≤ 12) runs on **any screenshot** — works for our 2D frames. Value-read check (greyscale screenshot; interactables separable by value) is pure 2D gold. 3D-only axes (roughness/metal ranges, LUT/fog) get dropped or translated; texel-density tiering becomes sprite px-per-metre consistency at gameplay scale. |
| `gamedev-reference-reconstruction` | `[S]` | **SKIP the pipeline; SALVAGE the measurement loop** | Explicitly 3D: "Rebuild a reference image as a **real 3D asset**…"; "Blender 4.x/5.x and Godot 4.x bindings included"; blockout scripts are Blender. But its discipline — declare a contract (TARGET/SCALE/STYLE/CAMERA/ACCEPT), measure the reference as data, discrepancy ledger, "never declare success off an exit code" — and the `tools/refmatch` image comparisons (silhouette IoU, band profile, palette ΔE) are image-based and reusable for **matching generated sprites to approved reference art**. |
| `gamedev-visual-iteration` | `[S]` | **APPLY** | "Engine-agnostic. Tooling in tools/refmatch/ (Pillow + numpy). Works with Blender, Godot, Unity renders." The loop (LOOK → MEASURE → RANK → PICK one → DIAGNOSE by layer → FIX → RE-RENDER → RECORD), metrics-by-artifact-class table, band-profile reading, and the ledger all run on our game screenshots/sprite renders. |
| `gamedev-game-testing` | `[S]` | **APPLY** | "Engine-agnostic. Godot 4.x headless, Blender Python, Python + Pillow/numpy." Four layers: pure logic → state machines → headless integration → visual regression. Maps 1:1 onto our stack: Vitest for layers 1–2 (AGENTS.md already mandates Vitest for physics/controls/save), headless browser for layer 3, screenshot comparison into `docs/visual-qa/` for layer 4. Examples are GDScript/Python — translate the *shape* of the tests. |
| `gamedev-verification` | `[S]` | **APPLY — strongly** | "Engine-agnostic. Examples for Godot 4.x, Unity 6, Blender 4.x/5.x." Four evidence levels (exit 0 → artifact exists → loads/parses → behaviour observed and measured), the false-success catalogue ("'Script executed successfully'… the output may be an empty scene"), mandatory `NOT VERIFIED` line in every report. This is the done-gate discipline AGENTS.md rule 7 ("every claim needs evidence") wants operationalized. |
| `gamedev-debugging` | `[S]` | **APPLY** | "Engine-agnostic; Blender Python, Godot 4.x, Unity 6." Reproduce (smallest repro + LAST KNOWN GOOD), read the whole error, temporal/spatial bisect, instrument (print counts not existence), classic suspects (stale cache, units, off-by-one, div-by-zero, encoding — all TS-relevant), one-sentence cause test, permanent regression test. Skip the Blender/Godot/Unity-specific trap lists. |
| `gamedev-performance` | `[S]` | **PARTIAL** | "Engine-agnostic budgeting method; no engine-specific profiler steps." Use: budget-first (ms allocation with 10–15% headroom), GPU-vs-CPU-bound triage, **measure the worst frame not the average**, texture-memory budgets, detail budgeting by screen size, asset-library allowance. Skip: LOD/decimation/mesh-merging/occlusion-culling sections (3D geometry). For JS-specific GC/pooling, repo 1's `performance-optimization` is the better fit — use both, split by topic. |
| `gamedev-animation` | `[S]` | **SKIP (3D) — salvage two ideas** | "Blender 4.2+/5.x (armatures, constraints, NLA). Clips export to Godot/Unity via glTF." Rigs/skinning/retargeting are mesh workflows. Salvage: the timing tables (walk 0.9–1.2 s, run 0.6–0.8 s, jump beats, hit reactions 0.15–0.30 s) as sprite-frame timing references, and the anti-slide rule `speed = 2·stride / cycle` — the exact math that keeps **wheel rotation synced to ground speed** in a side-view racer. |
| `gamedev-vfx-impact` | `[S]` | **APPLY** | "Engine-agnostic timings (unmeasured in any engine); the one code sample is GDScript." The ~250 ms impact timeline (biggest visual in first 60 ms), hit-stop durations by weight class (light 35–50 ms … never > ~150 ms), shake parameters (2–5 px medium, 6–12 Hz, exponential decay, biased along hit normal, always offer a reduce/disable setting), layering budgets, **flipbook VFX from sprite sheets** (grid-slice, UV-offset playback, non-uniform timing curve — literally a 2D technique), pre-fractured chunk rules for destruction. Complements repo 1's `game-feel` (feel = technique library; vfx-impact = ms-budgeted timeline). |
| `gamedev-audio-wire` | `[S]` | **APPLY** | "Engine-agnostic. Uses the project's existing audio bus. No middleware assumed." Events-before-files (no sound without an existing gameplay signal), **manifest with one row per file: `FILE | EVENT ID | SOURCE URL | LICENSE | CHANGES | LOOP`** ("'Free' is not a license"), three-layer hits (transient/body/tail) starting on the gameplay frame, state music only on state changes, mute test, final gate. The license manifest matches our offline-first, no-CDN, sources-recorded discipline exactly (cf. `docs/VEHICLE_DATA_SOURCES.md` practice). |

Not read in this audit (README/index-level only): `gamedev-locomotion` ("Floaty, slippery, or late movement when the animation is already fine" — plausibly relevant to vehicle feel; flagged as pending), `gamedev-camera` (likely overlaps repo 1's `camera-systems`), `gamedev-orchestrator` (staged build contract — possibly useful as a meta-process for the autonomous build), `gamedev-visual-artifacts` (mostly 3D rendering symptoms), `gamedev-gameplay-systems` (enemies/combat/inventory — not our game).

---

## 4. Per-workstream recommendations (mapped to AGENTS.md modules)

| Workstream (module) | Use (repo 1) | Use (repo 2) | Notes |
| --- | --- | --- | --- |
| Physics — Planck world, 60 Hz accumulator, interpolation (`src/physics/`) | **`physics-tuning`** | `gamedev-debugging`, `gamedev-verification` | Translate Godot/Unity knobs to Planck (Box2D family); adopt the tunnel test + rate-probe ideas as Vitest headless sims. |
| Controls — three analog sliders, multi-touch (`src/controls/`) | **`input-systems`** | — | Response curves + deadzones for 0..1 slider values; touch routed through named actions; buffering in game time. |
| Camera — side-view follow, bounds (`src/tracks/` camera bounds) | **`camera-systems`** | (`gamedev-camera` unread) | `1 - exp(-rate·dt)` smoothing; clamp view not centre; compose shake offset last. |
| Game feel / juice (cross-cutting) | **`game-feel`** | **`gamedev-vfx-impact`** | Feel = technique library; vfx-impact = ms-budgeted timeline + flipbook sprite-sheet VFX. |
| Vehicles — data-driven profiles (`src/vehicles/`) | — | `gamedev-animation` (timing tables + anti-slide formula only) | Real-vehicle spec discipline already ours (AGENTS.md rule 5). |
| Tracks & obstacles (`src/tracks/`, `src/obstacles/`) | `level-design` | — | Whitebox → pacing; body unread `[C]`. |
| Racing — AI, ghost replay (`src/racing/`) | `game-ai` (+ `ai-behavior-trees-utility-ai` if opponents grow) | — | Body unread `[C]`. |
| Career & save (`src/career/`, `src/save/`) | **`save-systems`** | — | Versioned migration + atomic writes + round-trip test; adapter for Capacitor/IndexedDB. |
| UI — Persian RTL HUD/menus (`src/ui/`) | `game-ui-ux` | — | Safe areas + scaling useful; **RTL/bidi is a gap — keep in-house rules authoritative**. |
| Audio (`src/audio/`) | `audio-design` | **`gamedev-audio-wire`** | audio-wire's license manifest adopted from day one; audio-design for buses/mixing concepts. |
| Assets — sprites, manifests (`src/assets/`) | **`create-game-assets`** | **`gamedev-art-direction`**, **`gamedev-visual-iteration`** (+ refmatch tools) | Manifest + provenance + families + raster QA; art bible + measured cohesion checks on screenshots. |
| Performance — Android target (cross) | `performance-optimization` | `gamedev-performance` (budget part) | JS GC/pooling from repo 1; budget-first + worst-frame method from repo 2; skip 3D LOD sections. |
| QA — the whole build (cross) | — | **`gamedev-verification`**, **`gamedev-game-testing`**, `gamedev-debugging` | Maps to Vitest + headless runs + `docs/visual-qa/` screenshots; operationalizes AGENTS.md rule 7. |
| Rendering-engine decision (pending) | `phaser-core` (Phaser 4.2) **or** `pixijs-rendering` (PixiJS 8.22) | — | **Not** Phaser AE (closed-source, agent-driven, different API — §2.6). Skip `phaser-arcade-physics`: Planck is the single physics authority (AGENTS.md). |
| Process (this autonomous build) | `prototype-fast` | (`gamedev-orchestrator` unread) | Vertical-slice discipline for the current phase. |

---

## 5. Skip-list

**Repo 1 — skip (63 of 77 skills):**
- All Godot (16), Unity (8), Unreal (6), Ebitengine (1), other-engines (12: Bevy, pygame-ce, LÖVE, Defold, Roblox ×7) — wrong engines.
- `threejs-scene-setup`, `threejs-gltf-loading`, `threejs-materials-lighting` — 3D; AGENTS.md forbids 3D.
- `phaser-arcade-physics` — we run Planck as the one physics authority; Arcade Physics would compete with it.
- Genres (all 9) — none is a racing/obstacle-trial template; `platformer` is the nearest cousin but teaches jump forgiveness we don't need.
- `dialogue-systems` — no dialogue in scope.
- `shader-programming` — optional later (2D WebGL effects under Phaser/Pixi); not now.
- Workflows `game-jam`, `steam-publish`, `itch-publish` — not our targets; **no Google Play / Capacitor shipping skill exists in either repo** (gap).

**Repo 2 — skip (majority of the 28):**
- 3D/Blender asset chain: `gamedev-blender-headless`, `gamedev-procedural-modeling`, `gamedev-modular-kit`, `gamedev-texture-authoring` (PBR maps), `gamedev-animation` (rigs/skinning), `gamedev-lighting`, `gamedev-foliage`, `gamedev-world-from-data`.
- Engine pipelines: `gamedev-godot-pipeline`, `gamedev-godot-visual-polish`, `gamedev-unity-pipeline` — wrong engines, and self-declared "written, not executed."
- Out-of-scope design: `gamedev-concept-lab`, `gamedev-concept-judge` (the game is chosen), `gamedev-boss-encounter`, `gamedev-gameplay-systems` (combat/inventory/spawning).
- Low-fit: `gamedev-visual-artifacts` (3D render symptoms), `gamedev-reference-reconstruction` as a pipeline (salvage its measurement loop only), `gamedev-locomotion`/`gamedev-camera`/`gamedev-orchestrator` (unread — see pending).

---

## 6. License constraints for this project

- Both repos are **Apache-2.0** (repo 1 LICENSE © 2026 Abhishek Barali et al. + `NOTICE` file; repo 2 standard LICENSE). Permissive: use, copy, modify, sublicense; **conditions on redistribution**: include the license, retain copyright/attribution notices, state changes to modified files.
- **Practical effect:** installing skills project-locally for agent use is unrestricted. If we **commit skill folders into our public repo** (github.com/khiyarusa/charkhtaz), that is redistribution — keep the Apache-2.0 LICENSE text and attribution with the vendored copies (e.g. `docs/research/` or a `skills/` dir with a NOTICE). Our own game code is unaffected — no copyleft, no linking obligations.
- Repo 1's `NOTICE` carries trademark notes: engine names (Godot, Unity, Phaser…) are their owners' marks; our descriptive use is fine, the license grants no trademark rights.
- Repo 2's LICENSE copyright line is unfilled boilerplate — attribution therefore effectively defaults to the repo URL; note it if vendoring.
- The `skills` CLI itself is MIT (Vercel Labs) — separate from skill content; npx use requires no license action from us.
- Asset/audio *content* licenses are a separate question — `gamedev-audio-wire`'s manifest and `create-game-assets`' provenance rules exist precisely to track that.

---

## 7. Gaps & risks (what these libraries will NOT solve)

1. **No Planck.js skill** — router cannot detect it; fallback defaults to Godot (wrong). Disciplines carry the load; engine-API knowledge stays ours.
2. **No racing/trial genre skill** — vehicle handling, torque paths, transmission/clutch feel are untouched by either repo.
3. **No RTL/Persian/bidi UI coverage** — `game-ui-ux` handles anchors/safe areas/scaling only.
4. **No Capacitor / Google Play shipping workflow** — steam/itch only.
5. **All code samples are GDScript / C# / Python** — every snippet needs TS translation; the *concepts* port cleanly (verified for the 6 repo-1 and 10 repo-2 skills read in full).
6. **Repo 2's engine content is self-declared unexecuted**; its 3D tooling is irrelevant to us; measurement tools need a Python 3.10+ + Pillow + numpy environment (only for measurement steps — "the procedures still read" without it).
7. **Version pins drift:** repo 1 pins Phaser 4.2 / PixiJS 8.22 — re-check against whatever versions we adopt; skills are written "from primary docs, version-pinned to a stated engine release."
8. Docs staleness: repo 1's INSTALLATION.md says "68" skills vs README's 77.
9. `npx skills` CLI telemetry (dev-time; disable with `DISABLE_TELEMETRY=1`).

---

## 8. Pending items (not verified in this audit)

- Repo 1 bodies not read (catalog-level evidence only): `game-ui-ux`, `audio-design`, `performance-optimization`, `level-design`, `game-ai`, `shader-programming`, `ai-behavior-trees-utility-ai`, `prototype-fast`. Read before relying on depth.
- Repo 1 reference files not read: `references/raster-pipeline.md` (sprites/import), `references/buffering-and-accessibility.md` (touch controls), `references/timestep-and-ccd.md`, `references/versioning-and-migration.md`.
- Repo 2 bodies not read: `gamedev-locomotion` (vehicle-feel candidate), `gamedev-camera`, `gamedev-orchestrator`, `gamedev-visual-artifacts`; also `docs/LIMITATIONS.md`, `docs/TEST_RESULTS.md`.
- Neither library's tooling was executed (research-only constraint). The `skills` CLI's exact write targets for this AutoClaw/zwork environment were not tested — if install is approved later, verify where it writes before running it.
- Repo 1's site mirror (gamedev-skills.github.io/awesome-gamedev-agent-skills) not checked for newer per-skill detail.

## 9. Recommended next steps

1. **On renderer decision:** install project-local — either `npx skills add gamedev-skills/awesome-gamedev-agent-skills --skill <engine-skill> --skill physics-tuning …` (subset) or manual copy of `router/` + `skills/disciplines/*` + the chosen engine skill; nothing global.
2. **Adopt repo 2's verification discipline now** (no install needed — it's a working standard): evidence levels + mandatory `NOT VERIFIED` line for every done-claim; wire layer-1/2 tests into the existing Vitest setup.
3. **Pilot pairing:** `physics-tuning` + `input-systems` checklists against the slider/vehicle work; `game-feel` + `gamedev-vfx-impact` for landing/hit feedback; `create-game-assets` manifest + `gamedev-audio-wire` manifest for the asset/audio pipelines from day one.
4. **Stand up the Python measurement env** (3.10+, Pillow, numpy) when sprite iteration begins, and use `tools/refmatch` on game screenshots.
5. **Fill in-house:** racing-genre conventions, RTL UI rules, Capacitor/Play shipping checklist.

---

## Sources (all retrieved 2026-11-12)

- Repo 1 README: <https://github.com/gamedev-skills/awesome-gamedev-agent-skills>
- Repo 1 INSTALLATION: <https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/docs/INSTALLATION.md>
- Repo 1 router: <https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/router/SKILL.md>
- Repo 1 LICENSE: <https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/LICENSE>
- Repo 1 skill bodies: `skills/disciplines/{physics-tuning,input-systems,game-feel,camera-systems,save-systems,create-game-assets}/SKILL.md` (under the same repo URL)
- `skills` CLI (npm, Vercel Labs, MIT): <https://www.npmjs.com/package/skills>
- Phaser 4 vs Phaser AE: <https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update>
- Repo 2 README: <https://github.com/sekaikx/ForgeSkills>
- Repo 2 docs index: <https://github.com/sekaikx/ForgeSkills/blob/main/docs/README.md>
- Repo 2 LICENSE: <https://github.com/sekaikx/ForgeSkills/blob/main/LICENSE>
- Repo 2 skill bodies: `skills/gamedev-{art-direction,reference-reconstruction,visual-iteration,game-testing,verification,debugging,performance,animation,vfx-impact,audio-wire}/SKILL.md` (under the same repo URL)
- Local: `package.json`, `AGENTS.md` (CHARKHTAZ repo, read 2026-11-12); `node --version` → v24.20.0.
