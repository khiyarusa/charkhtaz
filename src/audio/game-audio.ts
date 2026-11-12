/**
 * CHARKHTAZ procedural game audio.
 *
 * Everything is synthesised at runtime with the Web Audio API: four oscillator
 * layers plus filtered noise for the engine, filtered noise for tyres, skid and
 * wind, and short oscillator/noise one-shots for events. There are no audio
 * files, no network requests and no AudioContext at module-import time.
 *
 * The public surface is `GameAudio` + `AudioTelemetry`; the pure mapping maths
 * lives in `audio-math.ts` and is covered by `audio-math.test.ts`.
 */

import {
  clamp,
  clamp01,
  engineCharacter,
  engineFilterHz,
  engineGainCurve,
  engineLayerFrequencies,
  gearTimbre,
  impactGain as impactCurve,
  masterGainFor,
  rollingSpeedGain,
  safeNumber,
  skidGain as skidCurve,
  surfaceProfile,
  tyreGain as tyreCurve,
  windGain as windCurve,
  type EngineCharacterSpec,
  type VehicleCharacter,
} from './audio-math';

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

/* ------------------------------------------------------------------------- */
/* Mix trims. Chosen so a full-throttle engine + gravel + wind still leaves   */
/* headroom before the master compressor.                                     */
/* ------------------------------------------------------------------------- */

const ENGINE_BUS_LEVEL = 0.5;
const TYRE_BUS_LEVEL = 0.4;
const SKID_BUS_LEVEL = 0.5;
const SFX_BUS_LEVEL = 0.8;

const MAX_ONE_SHOTS = 24;
/** Parameter automation is throttled to this rate; ramps smooth the gaps. */
const PARAM_RATE_HZ = 90;

const ENGINE_TAU = 0.045;
const ENGINE_FILTER_TAU = 0.06;
const TYRE_TAU = 0.07;
const SKID_TAU = 0.05;
const WIND_TAU = 0.2;
const MASTER_TAU = 0.06;

interface EngineNodes {
  sub: OscillatorNode;
  main: OscillatorNode;
  second: OscillatorNode;
  third: OscillatorNode;
  subGain: GainNode;
  mainGain: GainNode;
  secondGain: GainNode;
  thirdGain: GainNode;
  sum: GainNode;
  tone: BiquadFilterNode;
  shaper: WaveShaperNode;
  cut: GainNode;
  bus: GainNode;
  intakeFilter: BiquadFilterNode;
  intakeGain: GainNode;
}

interface TyreNodes {
  bodyFilter: BiquadFilterNode;
  hissFilter: BiquadFilterNode;
  bodyGain: GainNode;
  hissGain: GainNode;
  sum: GainNode;
  bus: GainNode;
  roughnessLfo: OscillatorNode;
  roughnessDepth: GainNode;
}

interface SkidNodes {
  filter: BiquadFilterNode;
  gain: GainNode;
}

interface WindNodes {
  filter: BiquadFilterNode;
  gain: GainNode;
}

interface ToneOptions {
  frequency: number;
  duration: number;
  gain: number;
  when?: number;
  endFrequency?: number;
  type?: OscillatorType;
  filterHz?: number;
}

interface NoiseBurstOptions {
  duration: number;
  gain: number;
  frequency: number;
  when?: number;
  sweepTo?: number;
  type?: BiquadFilterType;
  q?: number;
}

export class GameAudio {
  private ctx: AudioContext | null = null;
  private disposed = false;
  private unlocked = false;

  private muted = false;
  private volume = 0.8;
  private character: VehicleCharacter = 'i4';

  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private sfxBus: GainNode | null = null;

  private engine: EngineNodes | null = null;
  private tyre: TyreNodes | null = null;
  private skid: SkidNodes | null = null;
  private wind: WindNodes | null = null;

  private noiseBuffer: AudioBuffer | null = null;

  /** Every persistent node, for deterministic teardown. */
  private readonly nodes: AudioNode[] = [];
  /** Persistent running sources (oscillators, LFO, noise loop). */
  private readonly sources: AudioScheduledSourceNode[] = [];
  /** In-flight short-lived event sources, capped by MAX_ONE_SHOTS. */
  private readonly oneShots = new Set<AudioScheduledSourceNode>();
  /** Every in-flight one-shot source, including ones evicted by the cap. */
  private readonly oneShotSources = new Set<AudioScheduledSourceNode>();
  /** Filter/gain chain nodes belonging to in-flight one-shots. */
  private readonly oneShotNodes = new Set<AudioNode>();

  private lastState: AudioTelemetry | null = null;
  private paramClock = 1;

  private readonly handleVisibility = (): void => {
    const ctx = this.ctx;
    if (!ctx || this.disposed) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      void ctx.suspend().catch(() => undefined);
    } else if (this.unlocked) {
      void ctx.resume().catch(() => undefined);
    }
  };

  /** True once the graph exists and the context is actually running. */
  get ready(): boolean {
    return !this.disposed && this.ctx !== null && this.ctx.state === 'running';
  }

  /**
   * Creates the AudioContext and graph. Must be called from a user gesture on
   * browsers with autoplay restrictions. Safe to call repeatedly; resolves
   * silently when WebAudio is unavailable (SSR, unit tests, old browsers).
   */
  async unlock(): Promise<void> {
    if (this.disposed) return;
    if (!this.ctx) {
      const Ctor = GameAudio.contextConstructor();
      if (!Ctor) return;
      const ctx = new Ctor({ latencyHint: 'interactive' });
      this.ctx = ctx;
      this.buildGraph(ctx);
      this.unlocked = true;
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this.handleVisibility);
      }
      this.applyVolume(0.15);
    }

    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state !== 'running') {
      try {
        await ctx.resume();
      } catch {
        // Still blocked: the caller can retry unlock() from a gesture.
      }
    }
    if (ctx.state === 'running') {
      this.applyVolume(MASTER_TAU);
      if (this.lastState) {
        this.paramClock = 1;
        this.applyTelemetry(this.lastState);
      }
    }
  }

  /** Mute/unmute with a short fade so the master gain never clicks. */
  setMuted(muted: boolean): void {
    this.muted = muted === true;
    this.applyVolume(MASTER_TAU);
  }

  /** Sets the user volume, 0..1. Values outside the range are clamped. */
  setVolume(volume: number): void {
    this.volume = clamp01(safeNumber(volume, this.volume));
    this.applyVolume(MASTER_TAU);
  }

  /** Selects the engine archetype; safe to call before or after unlock. */
  setVehicleCharacter(kind: 'i4' | 'v6' | 'flat4'): void {
    this.character = kind;
    const ctx = this.ctx;
    const engine = this.engine;
    if (!ctx || !engine) return;
    const spec = engineCharacter(kind);
    const now = ctx.currentTime;
    engine.second.detune.setTargetAtTime(spec.detuneCents, now, 0.08);
    engine.third.detune.setTargetAtTime(-spec.detuneCents, now, 0.08);
    engine.tone.Q.setTargetAtTime(GameAudio.engineQ(spec), now, 0.1);
  }

  /**
   * Per-frame update. Call with the simulation/render delta and the current
   * vehicle telemetry; before unlock() or while suspended this only caches the
   * latest state.
   */
  update(dt: number, state: AudioTelemetry): void {
    if (this.disposed) return;
    this.lastState = { ...state };
    const ctx = this.ctx;
    if (!ctx || !this.unlocked || ctx.state !== 'running') return;

    const step = clamp(safeNumber(dt, 0), 0, 0.5);
    this.paramClock += step;
    if (this.paramClock < 1 / PARAM_RATE_HZ) return;
    this.paramClock = 0;
    this.applyTelemetry(this.lastState);
  }

  /** Gear-change click plus a brief ignition cut. */
  shift(): void {
    const ctx = this.ctx;
    const engine = this.engine;
    if (!ctx || ctx.state !== 'running' || !engine) return;

    const now = ctx.currentTime;
    const cut = engine.cut.gain;
    GameAudio.holdParam(cut, now);
    cut.linearRampToValueAtTime(0.12, now + 0.02);
    cut.setValueAtTime(0.12, now + 0.1);
    cut.linearRampToValueAtTime(1, now + 0.22);

    this.noiseBurst({
      duration: 0.04,
      gain: 0.16,
      frequency: 2200,
      q: 2.2,
      type: 'bandpass',
    });
    this.tone({ frequency: 160, endFrequency: 95, duration: 0.07, gain: 0.1, type: 'triangle' });
  }

  /** Impact thump scaled by severity, 0..1. */
  impact(severity: number): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const s = clamp01(safeNumber(severity, 0));
    if (s <= 0) return;
    const g = impactCurve(s);

    this.tone({
      frequency: 95 + 55 * (1 - s),
      endFrequency: 38,
      duration: 0.16 + 0.22 * s,
      gain: 0.12 + 0.7 * g,
      type: 'sine',
      filterHz: 420,
    });
    this.noiseBurst({
      duration: 0.1 + 0.18 * s,
      gain: 0.1 + 0.45 * g,
      frequency: 1700,
      sweepTo: 220,
      q: 0.7,
      type: 'lowpass',
    });
    if (s > 0.55) {
      this.tone({ frequency: 2500 + 900 * s, duration: 0.12, gain: 0.05, type: 'triangle' });
    }
  }

  /** Three-note checkpoint chime. */
  checkpoint(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const notes = [659.25, 880, 1318.51];
    notes.forEach((frequency, i) => {
      this.tone({
        frequency,
        when: i * 0.11,
        duration: i === 2 ? 0.36 : 0.14,
        gain: i === 2 ? 0.18 : 0.14,
        type: 'triangle',
      });
    });
    this.tone({ frequency: 329.63, duration: 0.3, gain: 0.07, type: 'sine' });
  }

  /** UI feedback: a tick, a confirm rise, or a back fall. */
  ui(kind: 'tap' | 'confirm' | 'back' = 'tap'): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    if (kind === 'confirm') {
      this.tone({ frequency: 880, duration: 0.07, gain: 0.07, type: 'triangle' });
      this.tone({ frequency: 1318.51, when: 0.055, duration: 0.1, gain: 0.06, type: 'triangle' });
      return;
    }
    if (kind === 'back') {
      this.tone({ frequency: 620, duration: 0.07, gain: 0.06, type: 'triangle' });
      this.tone({ frequency: 415.3, when: 0.055, duration: 0.1, gain: 0.055, type: 'triangle' });
      return;
    }
    this.noiseBurst({
      duration: 0.025,
      gain: 0.05,
      frequency: 2600,
      q: 1.4,
      type: 'highpass',
    });
    this.tone({ frequency: 1400, duration: 0.03, gain: 0.035, type: 'sine' });
  }

  /** Original short fanfare for crossing the finish line. */
  finish(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;

    const melody = [523.25, 659.25, 783.99, 1046.5];
    melody.forEach((frequency, i) => {
      this.tone({
        frequency,
        when: i * 0.14,
        duration: i === 3 ? 0.7 : 0.2,
        gain: 0.15,
        type: 'triangle',
      });
    });
    for (const frequency of [1046.5, 1318.51, 1567.98]) {
      this.tone({ frequency, when: 0.64, duration: 1.2, gain: 0.09, type: 'sine' });
    }
    this.tone({ frequency: 130.81, when: 0.6, duration: 1.1, gain: 0.14, type: 'sine' });
    this.noiseBurst({
      when: 0.6,
      duration: 0.9,
      gain: 0.05,
      frequency: 3200,
      q: 0.8,
      type: 'highpass',
    });
  }

  /** Stops every source, disconnects every node and closes the context. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unlocked = false;

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibility);
    }

    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
      try {
        source.disconnect();
      } catch {
        // Already disconnected.
      }
    }
    this.sources.length = 0;

    for (const source of this.oneShotSources) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
      try {
        source.disconnect();
      } catch {
        // Already disconnected.
      }
    }
    this.oneShotSources.clear();
    this.oneShots.clear();

    for (const node of this.oneShotNodes) {
      try {
        node.disconnect();
      } catch {
        // Already disconnected.
      }
    }
    this.oneShotNodes.clear();

    for (const node of this.nodes) {
      try {
        node.disconnect();
      } catch {
        // Already disconnected.
      }
    }
    this.nodes.length = 0;

    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.sfxBus = null;
    this.engine = null;
    this.tyre = null;
    this.skid = null;
    this.wind = null;
    this.noiseBuffer = null;
    this.lastState = null;

    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => undefined);
    }
  }

  /* --------------------------------------------------------------------- */
  /* Graph construction                                                     */
  /* --------------------------------------------------------------------- */

  private buildGraph(ctx: AudioContext): void {
    const master = this.track(ctx.createGain());
    master.gain.value = 0;

    const compressor = this.track(ctx.createDynamicsCompressor());
    compressor.threshold.value = -16;
    compressor.knee.value = 20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.22;

    master.connect(compressor);
    compressor.connect(ctx.destination);

    const sfxBus = this.track(ctx.createGain());
    sfxBus.gain.value = SFX_BUS_LEVEL;
    sfxBus.connect(master);

    const noise = ctx.createBufferSource();
    const buffer = GameAudio.createNoiseBuffer(ctx);
    noise.buffer = buffer;
    noise.loop = true;
    this.noiseBuffer = buffer;

    this.engine = this.buildEngine(ctx, noise, master);
    this.tyre = this.buildTyre(ctx, noise, master);
    this.skid = this.buildSkid(ctx, noise, master);
    this.wind = this.buildWind(ctx, noise, master);

    this.master = master;
    this.compressor = compressor;
    this.sfxBus = sfxBus;

    const now = ctx.currentTime;
    for (const source of [noise, this.engine.sub, this.engine.main, this.engine.second, this.engine.third, this.tyre.roughnessLfo]) {
      source.start(now);
      this.sources.push(source);
    }
  }

  private buildEngine(ctx: AudioContext, noise: AudioBufferSourceNode, master: GainNode): EngineNodes {
    const spec = engineCharacter(this.character);
    const idle = engineLayerFrequencies(800, spec);

    const bus = this.track(ctx.createGain());
    bus.gain.value = ENGINE_BUS_LEVEL;
    bus.connect(master);

    const cut = this.track(ctx.createGain());
    cut.gain.value = 1;
    cut.connect(bus);

    const shaper = this.track(ctx.createWaveShaper());
    const curve = new Float32Array(1024);
    const norm = Math.tanh(1.8);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 1.8) / norm;
    }
    shaper.curve = curve;
    shaper.oversample = '2x';
    shaper.connect(cut);

    const tone = this.track(ctx.createBiquadFilter());
    tone.type = 'lowpass';
    tone.frequency.value = engineFilterHz(0.12, 0, 1, this.character);
    tone.Q.value = GameAudio.engineQ(spec);
    tone.connect(shaper);

    const sum = this.track(ctx.createGain());
    sum.gain.value = 1;
    sum.connect(tone);

    const sub = this.track(ctx.createOscillator());
    sub.type = 'sine';
    sub.frequency.value = idle.sub;
    const subGain = this.track(ctx.createGain());
    subGain.gain.value = 0;
    sub.connect(subGain);
    subGain.connect(sum);

    const main = this.track(ctx.createOscillator());
    main.type = 'sawtooth';
    main.frequency.value = idle.fundamental;
    const mainGain = this.track(ctx.createGain());
    mainGain.gain.value = 0;
    main.connect(mainGain);
    mainGain.connect(sum);

    const second = this.track(ctx.createOscillator());
    second.type = 'square';
    second.frequency.value = idle.second;
    second.detune.value = spec.detuneCents;
    const secondGain = this.track(ctx.createGain());
    secondGain.gain.value = 0;
    second.connect(secondGain);
    secondGain.connect(sum);

    const third = this.track(ctx.createOscillator());
    third.type = 'triangle';
    third.frequency.value = idle.third;
    third.detune.value = -spec.detuneCents;
    const thirdGain = this.track(ctx.createGain());
    thirdGain.gain.value = 0;
    third.connect(thirdGain);
    thirdGain.connect(sum);

    const intakeFilter = this.track(ctx.createBiquadFilter());
    intakeFilter.type = 'bandpass';
    intakeFilter.frequency.value = 1000;
    intakeFilter.Q.value = 0.8;
    const intakeGain = this.track(ctx.createGain());
    intakeGain.gain.value = 0;
    noise.connect(intakeFilter);
    intakeFilter.connect(intakeGain);
    intakeGain.connect(sum);

    return {
      sub,
      main,
      second,
      third,
      subGain,
      mainGain,
      secondGain,
      thirdGain,
      sum,
      tone,
      shaper,
      cut,
      bus,
      intakeFilter,
      intakeGain,
    };
  }

  private buildTyre(ctx: AudioContext, noise: AudioBufferSourceNode, master: GainNode): TyreNodes {
    const bus = this.track(ctx.createGain());
    bus.gain.value = TYRE_BUS_LEVEL;
    bus.connect(master);

    const sum = this.track(ctx.createGain());
    sum.gain.value = 1;
    sum.connect(bus);

    const bodyFilter = this.track(ctx.createBiquadFilter());
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.value = 900;
    bodyFilter.Q.value = 0.7;
    const bodyGain = this.track(ctx.createGain());
    bodyGain.gain.value = 0;
    noise.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(sum);

    const hissFilter = this.track(ctx.createBiquadFilter());
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 2200;
    hissFilter.Q.value = 0.5;
    const hissGain = this.track(ctx.createGain());
    hissGain.gain.value = 0;
    noise.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(sum);

    const roughnessLfo = this.track(ctx.createOscillator());
    roughnessLfo.type = 'sine';
    roughnessLfo.frequency.value = 7;
    const roughnessDepth = this.track(ctx.createGain());
    roughnessDepth.gain.value = 0;
    roughnessLfo.connect(roughnessDepth);
    roughnessDepth.connect(bodyGain.gain);

    return { bodyFilter, hissFilter, bodyGain, hissGain, sum, bus, roughnessLfo, roughnessDepth };
  }

  private buildSkid(ctx: AudioContext, noise: AudioBufferSourceNode, master: GainNode): SkidNodes {
    const filter = this.track(ctx.createBiquadFilter());
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 3.5;
    const gain = this.track(ctx.createGain());
    gain.gain.value = 0;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    return { filter, gain };
  }

  private buildWind(ctx: AudioContext, noise: AudioBufferSourceNode, master: GainNode): WindNodes {
    const filter = this.track(ctx.createBiquadFilter());
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 0.5;
    const gain = this.track(ctx.createGain());
    gain.gain.value = 0;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    return { filter, gain };
  }

  /* --------------------------------------------------------------------- */
  /* Per-frame parameter mapping                                            */
  /* --------------------------------------------------------------------- */

  private applyTelemetry(state: AudioTelemetry): void {
    const ctx = this.ctx;
    const engine = this.engine;
    const tyre = this.tyre;
    const skid = this.skid;
    const wind = this.wind;
    if (!ctx || ctx.state !== 'running' || !engine || !tyre || !skid || !wind) return;

    const now = ctx.currentTime;
    const maxRpm = Math.max(500, safeNumber(state.maxRpm, 6500));
    const rpm = clamp(safeNumber(state.rpm, 0), 0, maxRpm * 1.2);
    const rpmNorm = clamp01(rpm / maxRpm);
    const throttle = clamp01(safeNumber(state.throttle, 0));
    const speed = Math.max(0, safeNumber(state.speedKph, 0));
    const slip = Math.abs(safeNumber(state.wheelSlip, 0));
    const gear = Math.round(safeNumber(state.gear, 1));
    const running = state.engineRunning === true && rpm > 1;
    const surface = surfaceProfile(state.surfaceId);
    const spec = engineCharacter(this.character);
    const timbre = gearTimbre(gear);

    /* Engine ------------------------------------------------------------- */
    const layers = engineLayerFrequencies(rpm, spec);
    const env = engineGainCurve(throttle, rpmNorm, running) * timbre.gain;
    const subLevel = env * spec.subMix * (0.95 - 0.25 * rpmNorm);
    const mainLevel = env * 0.5;
    const secondLevel = env * spec.secondMix * (0.35 + 0.65 * rpmNorm);
    const thirdLevel = env * spec.thirdMix * (0.25 + 0.75 * throttle) * (0.35 + 0.65 * rpmNorm);

    this.ramp(engine.sub.frequency, layers.sub, ENGINE_TAU, now);
    this.ramp(engine.main.frequency, layers.fundamental, ENGINE_TAU, now);
    this.ramp(engine.second.frequency, layers.second, ENGINE_TAU, now);
    this.ramp(engine.third.frequency, layers.third, ENGINE_TAU, now);
    this.ramp(engine.subGain.gain, subLevel, ENGINE_TAU, now);
    this.ramp(engine.mainGain.gain, mainLevel, ENGINE_TAU, now);
    this.ramp(engine.secondGain.gain, secondLevel, ENGINE_TAU, now);
    this.ramp(engine.thirdGain.gain, thirdLevel, ENGINE_TAU, now);
    this.ramp(
      engine.tone.frequency,
      engineFilterHz(rpmNorm, throttle, gear, this.character),
      ENGINE_FILTER_TAU,
      now,
    );
    this.ramp(engine.intakeGain.gain, env * (0.04 + 0.18 * throttle * rpmNorm), ENGINE_TAU, now);
    this.ramp(engine.intakeFilter.frequency, 700 + 2600 * rpmNorm, ENGINE_FILTER_TAU, now);

    /* Tyre rolling ------------------------------------------------------- */
    const speedF = rollingSpeedGain(speed);
    const roll = tyreCurve(speed, surface.id);
    const bodyLevel = roll * (1 - surface.hiss * 0.45);
    const hissLevel = roll * surface.hiss * 0.55;

    this.ramp(tyre.bodyGain.gain, bodyLevel, TYRE_TAU, now);
    this.ramp(tyre.hissGain.gain, hissLevel, TYRE_TAU, now);
    this.ramp(tyre.bodyFilter.frequency, surface.bodyHz * (0.6 + 0.8 * speedF), TYRE_TAU, now);
    this.ramp(tyre.hissFilter.frequency, surface.hissHz * (0.7 + 0.5 * speedF), TYRE_TAU, now);
    this.ramp(tyre.roughnessLfo.frequency, 5 + 9 * surface.roughness + 3 * speedF, TYRE_TAU, now);
    this.ramp(tyre.roughnessDepth.gain, bodyLevel * surface.roughness * 0.55, TYRE_TAU, now);

    /* Skid / wheelspin --------------------------------------------------- */
    const skidLevel = skidCurve(slip, speed);
    this.ramp(skid.gain.gain, skidLevel * SKID_BUS_LEVEL, SKID_TAU, now);
    this.ramp(skid.filter.frequency, surface.skidHz * (0.75 + 0.55 * speedF), SKID_TAU, now);
    this.ramp(skid.filter.Q, 3.2 + 1.6 * clamp01(slip), SKID_TAU, now);

    /* Wind --------------------------------------------------------------- */
    this.ramp(wind.gain.gain, windCurve(speed), WIND_TAU, now);
    this.ramp(wind.filter.frequency, clamp(500 + speed * 14, 450, 5200), WIND_TAU, now);
    this.ramp(wind.filter.Q, 0.45 + 0.25 * speedF, WIND_TAU, now);
  }

  /* --------------------------------------------------------------------- */
  /* Event one-shots                                                        */
  /* --------------------------------------------------------------------- */

  private tone(options: ToneOptions): void {
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || ctx.state !== 'running' || !bus) return;

    const duration = Math.max(0.02, safeNumber(options.duration, 0.1));
    const t0 = ctx.currentTime + Math.max(0, safeNumber(options.when, 0));
    const peak = clamp(safeNumber(options.gain, 0.05), 0.0002, 1);

    const osc = ctx.createOscillator();
    osc.type = options.type ?? 'sine';
    osc.frequency.setValueAtTime(Math.max(20, safeNumber(options.frequency, 220)), t0);
    if (options.endFrequency !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, safeNumber(options.endFrequency, 40)),
        t0 + duration,
      );
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.012, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    const extra: AudioNode[] = [gain];
    let tail: AudioNode = gain;
    if (options.filterHz !== undefined) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = clamp(options.filterHz, 80, 12000);
      gain.connect(filter);
      tail = filter;
      extra.push(filter);
    }
    tail.connect(bus);

    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
    this.trackOneShot(osc, extra);
  }

  private noiseBurst(options: NoiseBurstOptions): void {
    const ctx = this.ctx;
    const buffer = this.noiseBuffer;
    const bus = this.sfxBus;
    if (!ctx || ctx.state !== 'running' || !buffer || !bus) return;

    const duration = Math.max(0.01, safeNumber(options.duration, 0.1));
    const t0 = ctx.currentTime + Math.max(0, safeNumber(options.when, 0));
    const peak = clamp(safeNumber(options.gain, 0.1), 0.0002, 1);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = options.type ?? 'lowpass';
    filter.frequency.setValueAtTime(Math.max(20, safeNumber(options.frequency, 800)), t0);
    if (options.sweepTo !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(20, safeNumber(options.sweepTo, 200)),
        t0 + duration,
      );
    }
    filter.Q.value = clamp(safeNumber(options.q, 0.8), 0.1, 20);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.012, duration * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(bus);

    const maxOffset = Math.max(0, buffer.duration - duration - 0.05);
    source.start(t0, maxOffset > 0 ? Math.random() * maxOffset : 0, duration + 0.02);
    source.stop(t0 + duration + 0.03);
    this.trackOneShot(source, [filter, gain]);
  }

  private trackOneShot(source: AudioScheduledSourceNode, nodes: AudioNode[]): void {
    if (this.oneShots.size >= MAX_ONE_SHOTS) {
      const oldest = this.oneShots.values().next().value;
      if (oldest) {
        this.oneShots.delete(oldest);
        try {
          oldest.stop();
        } catch {
          // Already stopped; onended cleans it up.
        }
      }
    }
    this.oneShots.add(source);
    this.oneShotSources.add(source);
    for (const node of nodes) this.oneShotNodes.add(node);
    source.onended = () => {
      this.oneShots.delete(source);
      this.oneShotSources.delete(source);
      try {
        source.disconnect();
      } catch {
        // Already disconnected.
      }
      for (const node of nodes) {
        this.oneShotNodes.delete(node);
        try {
          node.disconnect();
        } catch {
          // Already disconnected.
        }
      }
    };
  }

  /* --------------------------------------------------------------------- */
  /* Small utilities                                                        */
  /* --------------------------------------------------------------------- */

  private track<T extends AudioNode>(node: T): T {
    this.nodes.push(node);
    return node;
  }

  /** Smoothly approaches a target without stacking a new ramp every frame. */
  private ramp(param: AudioParam, value: number, tau: number, now: number): void {
    param.setTargetAtTime(Number.isFinite(value) ? value : 0, now, Math.max(0.005, tau));
  }

  private applyVolume(tau: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const target = masterGainFor(this.volume, this.muted);
    GameAudio.holdParam(master.gain, now);
    master.gain.linearRampToValueAtTime(target, now + Math.max(0.02, tau));
  }

  private static engineQ(spec: EngineCharacterSpec): number {
    return 0.7 + spec.rasp * 1.6;
  }

  private static holdParam(param: AudioParam, now: number): void {
    const holdable = param as AudioParam & { cancelAndHoldAtTime?: (time: number) => AudioParam };
    if (typeof holdable.cancelAndHoldAtTime === 'function') {
      holdable.cancelAndHoldAtTime(now);
    } else {
      param.cancelScheduledValues(now);
    }
  }

  private static contextConstructor(): typeof AudioContext | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    return w.AudioContext ?? w.webkitAudioContext ?? null;
  }

  /** Two seconds of deterministic white noise, generated once per context. */
  private static createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.max(1, Math.floor(ctx.sampleRate * 2));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x9e3779b9;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = seed / 2147483648 - 1;
    }
    return buffer;
  }
}
