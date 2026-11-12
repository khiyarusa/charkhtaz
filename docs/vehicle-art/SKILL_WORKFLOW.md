# SKILL WORKFLOW — what was actually read and applied

The brief requires inspecting two skill repositories and *using* the relevant
procedures, not just naming them. This is the record.

## 1. awesome-gamedev-agent-skills

- **Inspected:** repository README and catalog (fetched 2026-11-12,
  Apache-2.0). 66 skills plus a router, organised by engine, discipline, genre
  and workflow.
- **Router outcome for this project:** the repo's engine detection table targets
  Godot, Unity, Unreal, Phaser, PixiJS, three.js, Bevy, pygame, LÖVE and Roblox.
  CHARKHTAZ is a custom Canvas 2D + Planck.js project, so **no engine skill
  applies**; loading a Phaser or Godot skill would have been wrong. The
  engine-agnostic disciplines are the applicable part.
- **Applied (principles already present in the codebase, re-checked against the
  catalog):**
  - `physics-tuning` — fixed 60 Hz step, accumulator, CCD (`bullet`), collision
    layers separated by category/mask. This is exactly the area the art work had
    to avoid disturbing.
  - `performance-optimization` — measure before claiming: frame pacing is
    recorded in `docs/visual-qa/round-3/report.json` rather than asserted.
  - `game-ui-ux` — RTL layout, safe areas, ≥ 44 px touch targets, one panel
    language.
- **Not applied:** every engine-specific skill, and genre templates (platformer,
  roguelike, …) that do not match a side-view racing game.

## 2. ForgeSkills

- **Inspected:** repository README (fetched 2026-11-12, Apache-2.0) and
  `skills/gamedev-reference-reconstruction/SKILL.md` in full.
- **Selected skills and what was taken:**
  - `gamedev-reference-reconstruction` — the six-line contract (target, scale,
    style, budget, camera, acceptance) became `BASELINE.md` plus
    `VEHICLE_ART_SPEC.md`; "read the reference as data" became the per-car
    proportion tables in `research/*.md`; "build at real scale" became metres +
    the `bodyShiftM` axle frame; "measure, don't eyeball" became the roster tests
    and the fleet sheet.
  - `gamedev-visual-iteration` (loop described in the README) — applied as
    `render → compare → rank → fix one cause → re-render`. Three iterations were
    run on the fleet sheet: (1) chassis anchored at the wrong height, (2) detail
    layers leaking outside the shell, (3) flat pillars/seams and lamp housings.
  - `gamedev-verification` (README) — "a success line from the tool that built
    the thing is not evidence": screenshots are captured from the running build,
    not from the drawing code.
- **Not applied:** Blender/3D skills (`gamedev-blender-headless`,
  `gamedev-procedural-modeling`) because the game is strictly 2D; the
  `refmatch` Python tools because no redistributable side-view reference images
  were used (the reference is the measured dimension table), and those tools need
  Python 3.10 + numpy + Pillow plus an image pair.

## 3. Tool inventory checked

| Tool | Available? | Used |
| --- | --- | --- |
| Node 26 / TypeScript / Vite / Vitest | yes | build, tests |
| Playwright + Edge 157 | yes | fleet sheet, in-game capture, multi-touch, pacing |
| Inline SVG rendering via Playwright | yes | brand assets (Round 2), fleet exports |
| ImageMagick / Inkscape / Krita / Aseprite | **not installed** | not used |
| Blender | **not installed** | not used (and not needed: 2D) |
| Python + Pillow | bundled, but the environment's Python was unreliable in this session | not used |

The pipeline therefore stayed inside the repository's existing toolchain
(TypeScript data + Canvas 2D + Playwright QA), which is also what keeps it
offline-first and reproducible in CI.

## 4. What this means for the result

The skills changed the *method* more than the tooling: contract first, measure
the reference as numbers, build in metres, compare renders, fix one cause at a
time, and record the discrepancy. They did not turn Canvas vector art into a
hand-painted sprite family, and the QA report says so.
