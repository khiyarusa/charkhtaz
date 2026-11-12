# AUDIO — CHARKHTAZ procedural sound

Status: **implemented** in `src/audio/` (November 2026). This document describes
the shipped synthesis system, its public API, the telemetry mapping, the mix and
the limits of what has actually been verified.

There are **no audio files** in this system. Every sound is generated at runtime
with the Web Audio API; nothing is fetched from a CDN or bundled as a sample.

---

## 1. Goals and constraints

- Offline-first: no samples, no network requests, no external audio libraries.
- Lazy: no `AudioContext` is constructed at import time, so SSR, Node and unit
  tests can import the module safely.
- Cheap: a fixed graph is built once; per-frame work only writes `AudioParam`
  values. No per-frame node creation.
- Honest 2D: the mix is speed/rpm driven. There is no 3D positional audio,
  Doppler, HRTF or lateral cornering claim.
- Distinct cars: three engine archetypes (`i4`, `v6`, `flat4`) change cylinder
  count, firing frequency, layer mix, filter brightness, detune and rasp.

---

## 2. Files

| File | Purpose |
| --- | --- |
| `src/audio/audio-math.ts` | Pure mapping helpers: rpm→frequency, gain curves, surface profiles, gear timbre, smoothing, numeric safety. No DOM/WebAudio. |
| `src/audio/audio-math.test.ts` | 26 Vitest assertions over the pure mapping. |
| `src/audio/game-audio.ts` | `GameAudio` class: lazy context, graph, parameter ramps, one-shots, visibility handling, teardown. |
| `src/audio/game-audio.test.ts` | 4 lifecycle tests against a fake WebAudio graph (no audible render). |
| `src/audio/index.ts` | Public re-exports. |

---

## 3. Public API

```ts
export interface AudioTelemetry {
  rpm: number;
  maxRpm: number;
  throttle: number;
  speedKph: number;
  wheelSlip: number;
  surfaceId: string;
  engineRunning: boolean;
  gear: number;
}

export class GameAudio {
  constructor();
  get ready(): boolean;
  unlock(): Promise<void>;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  update(dt: number, state: AudioTelemetry): void;
  shift(): void;
  impact(severity: number): void;
  checkpoint(): void;
  ui(kind?: 'tap' | 'confirm' | 'back'): void;
  finish(): void;
  dispose(): void;

  /** Optional extension: choose the engine archetype for the current car. */
  setVehicleCharacter(kind: 'i4' | 'v6' | 'flat4'): void;
}
```

`setVehicleCharacter` is the only addition beyond the required surface. It is
safe before or after `unlock()`.

Semantics:

- `ready` is `true` only while the context exists and its state is `running`.
  It becomes `false` temporarily when the page is hidden and permanently after
  `dispose()`.
- `unlock()` is idempotent. It must be called from a user gesture on browsers
  with autoplay restrictions. If WebAudio is unavailable (SSR, test, ancient
  browser) it resolves without creating anything; check `ready`.
- `update()` before `unlock()` only caches telemetry; it never throws.
- `dispose()` is final and idempotent. A disposed instance will not create a new
  context.

---

## 4. Signal graph

```text
 engine sub   (sine, 0.5×f)  ─┐
 engine main  (saw,  1.0×f)  ─┤
 engine 2nd   (square, 2.02×f)├─► sum ─► low-pass ─► tanh shaper ─► cut ─► engine bus ─┐
 engine 3rd   (tri,  3.01×f) ─┘                                                       │
 noise ─► intake band-pass ─► intake gain ─────────────────────────────────────────────┤
                                                                                       │
 noise ─► tyre body low-pass ─► body gain ─┐                                          │
 noise ─► tyre hiss high-pass ─► hiss gain ─┴─► tyre sum ─► tyre bus ──────────────────┤
 noise ─► skid band-pass ─► skid gain ─────────────────────────────────────────────────┤
 noise ─► wind low-pass ─► wind gain ──────────────────────────────────────────────────┤
 event one-shots ─────────────────────────────► sfx bus ───────────────────────────────┤
                                                                                       ▼
                                                                      master gain ─► compressor ─► destination
```

- One deterministic 2-second mono noise buffer feeds the intake, tyre body,
  tyre hiss, skid and wind filters. It is generated once per context by a
  linear congruential generator, so there is no asset and no network request.
- A slow sine LFO (5–17 Hz) modulates the tyre body gain for gravel/sand/mud
  roughness. Depth is zero on smooth asphalt.
- The `cut` gain is exclusive to `shift()`; per-frame engine updates never touch
  it, so the ignition cut cannot fight the normal envelope.

Persistent node count measured in headless Chrome: **30 tracked nodes** (plus the
shared noise source), with **6 persistent running sources** (four engine
oscillators, the roughness LFO and the noise loop). No nodes are created in
`update()`.

---

## 5. Telemetry → sound mapping

| Telemetry | Mapping | Destination |
| --- | --- | --- |
| `rpm` | Four-stroke firing frequency `rpm / 60 × cylinders / 2`; drives all four oscillator frequencies, layer mix and filter cutoff. | engine oscillators, low-pass |
| `maxRpm` | Normalises rpm to 0..1 for filter, layer mix and intake. Clamped to at least 500. | engine |
| `throttle` | Engine envelope (`0.14 + 0.12·rev + 0.74·throttle·(0.45 + 0.55·rev)`), intake noise, filter opening. | engine bus level |
| `speedKph` | Tyre rolling level and filter scaling, wind level/cutoff, skid speed trim. | tyre, wind, skid |
| `wheelSlip` | Absolute slip ratio; below 0.10 is grip, 0.80 is full slide. Speed only trims the layer, so a stationary burnout is still audible. | skid band-pass |
| `surfaceId` | Selects body/hiss filters, level, roughness LFO depth and skid centre. Unknown ids fall back to dry asphalt. | tyre, skid |
| `engineRunning` | `false` fades the whole engine layer to zero; tyre, wind and events continue. | engine |
| `gear` | Per-gear filter brightness (first gear darker, top gear brighter); neutral is darker and slightly quieter. | engine filter/timbre |

### 5.1 Engine layers

| Layer | Waveform | Frequency | Character role |
| --- | --- | --- | --- |
| Sub | sine | 0.5 × firing | Crank-order rumble; strongest on the flat-four. |
| Main | sawtooth | 1.0 × firing | Core exhaust note; carries the harmonics that small speakers reproduce. |
| Second | square | 2.02 × firing | Mechanical edge; detuned for beating. |
| Third | triangle | 3.01 × firing | Upper texture, opens with throttle and revs. |

### 5.2 Vehicle characters

| Character | Cylinders | Sub mix | 2nd mix | 3rd mix | Filter scale | Detune | Rasp |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `i4` (default) | 4 | 0.55 | 0.34 | 0.18 | 1.00 | 6 ct | 0.35 |
| `v6` | 6 | 0.40 | 0.50 | 0.28 | 1.12 | 4 ct | 0.22 |
| `flat4` | 4 | 0.75 | 0.28 | 0.14 | 0.86 | 14 ct | 0.60 |

The character also sets the engine low-pass resonance (`0.7 + 1.6·rasp`). The
lead chooses the archetype from the researched engine layout of each car; this
module does not contain vehicle data and does not claim a measured per-model
timbre.

---

## 6. Surfaces

All surface ids in `src/tracks/types.ts` are covered.

| Surface | Level | Body cutoff | Hiss cutoff | Hiss mix | Roughness | Skid centre |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `asphalt-dry` | 0.55 | 900 Hz | 2400 Hz | 0.18 | 0.05 | 1500 Hz |
| `asphalt-wet` | 0.62 | 1100 Hz | 1800 Hz | 0.45 | 0.08 | 1200 Hz |
| `dirt` | 0.70 | 500 Hz | 1600 Hz | 0.30 | 0.35 | 900 Hz |
| `gravel` | 0.82 | 650 Hz | 2200 Hz | 0.45 | 0.60 | 700 Hz |
| `sand` | 0.50 | 320 Hz | 1200 Hz | 0.22 | 0.45 | 500 Hz |
| `mud` | 0.72 | 240 Hz | 900 Hz | 0.12 | 0.55 | 420 Hz |
| `rock` | 0.90 | 950 Hz | 2600 Hz | 0.35 | 0.70 | 1100 Hz |
| `wood` | 0.60 | 700 Hz | 1700 Hz | 0.25 | 0.50 | 950 Hz |

At runtime the body cutoff is multiplied by `0.6 + 0.8·speedFactor`, the hiss
cutoff by `0.7 + 0.5·speedFactor`, and the roughness LFO depth by the current
body level. A surface change is smoothed with a ~70 ms parameter ramp rather
than a hard switch. There is one surface profile at a time; simultaneous
wheel-on-different-surfaces blending is not implemented.

---

## 7. Events

| Call | Sound design | Duration |
| --- | --- | --- |
| `shift()` | Ignition cut to 0.12 for ~120 ms, band-pass click at 2.2 kHz and a short 160→95 Hz thump. | ~0.25 s |
| `impact(severity)` | Severity 0..1. Low sine 95–150→38 Hz, low-pass noise crunch, plus a quiet metallic ping above 0.55. | 0.16–0.42 s |
| `checkpoint()` | Original three-note chime (E5, A5, E6) over a soft E4 root. | ~0.5 s |
| `ui('tap')` | 25 ms high-pass tick plus a 1.4 kHz sine blip. | ~0.04 s |
| `ui('confirm')` | Two rising triangle notes (A5→E6). | ~0.16 s |
| `ui('back')` | Two falling triangle notes (D#5→G#4). | ~0.16 s |
| `finish()` | Original C-major fanfare (C5, E5, G5, C6), a sustained C6/E6/G6 chord, a C3 bass note and a short high shimmer. | ~1.9 s |

All event voices are short-lived `OscillatorNode`/`AudioBufferSourceNode`
one-shots. At most **24** are tracked concurrently; the oldest is stopped when
the cap is reached. Each source and its filter/gain chain is disconnected on
`ended`, and all remaining chains are disconnected by `dispose()`.

---

## 8. Mix

Linear amplitude trims (dB = 20·log10):

| Stage | Trim | Approx. dB | Notes |
| --- | ---: | ---: | --- |
| Master (default volume 0.8) | 0.731 | −2.7 dB | `volume^1.4`, mute forces 0 with a 60 ms ramp. |
| Compressor | — | — | Threshold −16 dB, knee 20, ratio 4, attack 3 ms, release 220 ms. Safety net, not a mastering chain. |
| Engine bus | 0.50 | −6.0 dB | Four layer gains sum to roughly 1.4 at full load before the bus. |
| Tyre bus | 0.40 | −8.0 dB | Body + hiss. |
| Skid | 0.50 | −6.0 dB | Applied to the skid gain; no separate bus node. |
| Wind | 1.00 | 0 dB | The curve itself caps at 0.26 (−11.7 dB). |
| SFX bus | 0.80 | −1.9 dB | All event one-shots. |

The engine bus is deliberately the loudest continuous layer; tyre and wind stay
under it so the rpm/throttle relationship remains readable. The compressor
catches the worst case (full-throttle gravel + skid + impact), and the master
ramp prevents clicks on mute/volume changes.

---

## 9. Lifecycle and browser behaviour

1. Import: no side effects, no context.
2. `unlock()`: create `AudioContext` (`latencyHint: 'interactive'`), build the
   fixed graph, attach the visibility listener, resume, fade in the master.
3. `update(dt, state)`: cache telemetry; if running, write ramps at most
   ~90 Hz. `setTargetAtTime` smooths between writes, so frame rate does not
   change the sound.
4. Hidden tab: `suspend()`. Visible again: `resume()` if the instance was
   unlocked. `ready` is false while suspended.
5. `dispose()`: stop and disconnect every persistent source, stop/disconnect
   all one-shots and their chains, disconnect all persistent nodes, remove the
   visibility listener, close the context, clear references.

iOS Safari is handled with the `webkitAudioContext` fallback and
`cancelAndHoldAtTime` feature detection. The first `unlock()` still has to come
from a real gesture; calling it from a timer will usually leave the context
suspended.

---

## 10. Integration

```ts
import { GameAudio, type AudioTelemetry } from './audio';

const audio = new GameAudio();

// Once, from a pointer/touch/key gesture:
button.addEventListener('pointerdown', () => void audio.unlock(), { once: true });

// Restore the settings screen values.
audio.setVolume(settings.audioVolume); // 0..1
audio.setMuted(!settings.audio);

// On car selection:
audio.setVehicleCharacter('i4'); // or 'v6' / 'flat4'

// Every rendered frame (cheap; before unlock it only caches):
const state: AudioTelemetry = {
  rpm: telemetry.rpm,
  maxRpm: car.engine.maxRpm,
  throttle: telemetry.throttle,
  speedKph: telemetry.speedKph,
  wheelSlip: telemetry.wheelSlip,
  surfaceId: telemetry.wheels[0]?.surfaceId ?? 'asphalt-dry',
  engineRunning: telemetry.engineRunning,
  gear: telemetry.gear,
};
audio.update(dt, state);

// Game events:
audio.shift();                 // on a successful gear change
audio.impact(severity);        // 0..1 from the physics contact impulse
audio.checkpoint();            // checkpoint / split
audio.ui('tap');               // buttons: 'tap' | 'confirm' | 'back'
audio.finish();                // crossing the finish line
```

Integration notes:

- Do not call `unlock()` per frame; call it once from a gesture and guard with
  `ready` only if you need to distinguish blocked audio.
- Do not suspend/resume the context yourself; the visibility listener owns that.
- Call `dispose()` when leaving the gameplay scene if the lead creates a new
  `GameAudio` per session. Reusing one instance is also supported.
- The module does not persist settings; the settings screen owns the save value
  and calls `setVolume`/`setMuted`.
- `surfaceId` can be the driven/grounded wheel's surface. A single id is used
  for the whole car; per-wheel stereo mixing is not implemented.

---

## 11. Verification

Run:

```bash
npx vitest run src/audio
```

Last recorded result (November 2026):

```text
src/audio/audio-math.test.ts   26 tests passed
src/audio/game-audio.test.ts    4 tests passed
Test Files  2 passed (2)
Tests      30 passed (30)
```

What the tests cover:

- Four-stroke firing frequency, cylinder clamping, layer ordering, zero-rpm
  finiteness.
- Character distinctness and fallback to `i4`.
- Engine gain monotonicity, silence when off, filter response to rpm/throttle/
  gear/character.
- Gear brightness and NaN safety.
- All eight surface profiles, spectral differences and unknown-id fallback.
- Tyre/skid/wind curves, impact and master gain mapping, mute, clamps.
- Exponential smoothing and frame-rate independence.
- Graph lifecycle against a fake context: no context before unlock, 30 tracked
  nodes, every public event, one-shot cap, idempotent dispose, all nodes
  disconnected, context closed.

Additional runtime smoke test: the real graph was loaded in headless Chrome via
Vite with an autoplay exemption. `ready` went `false → true`, the context state
was `running`, 30 persistent nodes and 11 in-flight one-shots were observed,
all event methods ran without console/page errors, and `dispose()` returned
`ready === false`. This was a graph/lifecycle smoke test, **not** a listening
test and not a loudness measurement.

Not verified yet:

- Subjective timbre and mix on phone speakers, headphones and the Android
  WebView.
- iOS Safari autoplay/interruption edge cases on a physical device.
- Long-session CPU and memory under repeated scene changes.
- LUFS/loudness compliance; only a safety compressor is used.

---

## 12. Limitations and next steps

- **Mono mix.** No panning, Doppler, occlusion or 3D position. This is a 2D
  side-view game; no lateral/yaw audio claim is made.
- **One surface at a time.** Fast surface transitions are smoothed, but the
  left and right wheels cannot play different surfaces simultaneously.
- **Archetypes, not dyno recordings.** `i4`/`v6`/`flat4` approximate firing
  character. A future car with a different engine layout needs a new character
  entry in `audio-math.ts` (and tests), not a new audio file.
- **No engine start/stop, backfire, rev-limiter or damage layer.** Engine off
  simply fades out. `impact()` covers collisions and landings; there is no
  separate landing thump or clutch engagement sound.
- **No acceleration-based overrun.** The telemetry contract has no acceleration
  field, so deceleration is inferred from falling rpm/throttle rather than a
  dedicated overrun/backfire model.
- **No music, reverb or convolution ambience.** Wind is a filtered noise layer;
  there is no track-specific environment reverb.
- **No loudness normalisation.** Bus trims are fixed linear values; tune them
  after real device listening.
- **Autoplay policy.** The context is created only in `unlock()`; browsers that
  require a gesture will stay suspended if the caller ignores this.

Reasonable next steps, in order: device listening and bus re-balancing; a
per-car character map from the researched vehicle data; landing/clutch
one-shots; optional stereo panning for skid and impacts; loudness measurement.

---

## 13. Licence and originality

All audio in this module is **original synthesis written for CHARKHTAZ**:

- No recordings, samples, loops, soundfonts, impulse responses or ripped game
  audio are used.
- No external audio library, CDN or network request is involved.
- The noise bed is generated at runtime by a deterministic LCG in
  `game-audio.ts`.
- The engine layers, surface filters, event motifs and the finish fanfare are
  original designs authored for this repository.

There are no third-party attribution requirements for the audio itself. The
repository's own licence governs the source code; if a root `LICENSE` file is
added later, this section should reference it explicitly.

---

## 14. Tuning map

If the mix or character needs adjustment, these are the only places to change:

| What | Where |
| --- | --- |
| Firing frequency, layer mix, filter curve, gear brightness | `src/audio/audio-math.ts` |
| Surface level/filter/roughness/skid centre | `SURFACE_PROFILES` in `src/audio/audio-math.ts` |
| Engine archetypes | `CHARACTER_SPECS` in `src/audio/audio-math.ts` |
| Bus trims, ramp time constants, one-shot gains | `src/audio/game-audio.ts` |
| Event melodies and envelopes | `checkpoint()`, `finish()`, `ui()`, `impact()`, `shift()` |
| Integration defaults (volume, character) | caller (settings/car selection) |

Keep `audio-math.test.ts` in sync with any curve change; the tests pin the
monotonicity and surface relationships that make the mix readable.
