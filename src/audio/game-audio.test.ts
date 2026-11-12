/**
 * Lifecycle smoke test for GameAudio using a minimal fake WebAudio graph.
 *
 * This does not render audio; it proves that the graph can be built, driven
 * with telemetry, exercised through every public event, and torn down without
 * leaking connections. The audible mapping is covered by audio-math.test.ts.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GameAudio, type AudioTelemetry } from './game-audio';

class FakeParam {
  value: number;
  writes = 0;

  constructor(value: number) {
    this.value = value;
  }

  setValueAtTime(value: number, _time?: number): this {
    this.value = value;
    this.writes++;
    return this;
  }

  linearRampToValueAtTime(value: number, _time?: number): this {
    this.value = value;
    this.writes++;
    return this;
  }

  exponentialRampToValueAtTime(value: number, _time?: number): this {
    this.value = value;
    this.writes++;
    return this;
  }

  setTargetAtTime(value: number, _time?: number, _tau?: number): this {
    this.value = value;
    this.writes++;
    return this;
  }

  cancelScheduledValues(_time?: number): this {
    this.writes++;
    return this;
  }

  cancelAndHoldAtTime(_time?: number): this {
    this.writes++;
    return this;
  }
}

let nextNodeId = 0;

class FakeNode {
  readonly id = nextNodeId++;
  disconnected = false;
  readonly connections: FakeNode[] = [];

  connect<T extends FakeNode>(destination: T): T {
    this.connections.push(destination);
    return destination;
  }

  disconnect(): void {
    this.disconnected = true;
    this.connections.length = 0;
  }
}

class FakeGain extends FakeNode {
  readonly gain = new FakeParam(1);
}

class FakeBiquad extends FakeNode {
  type = 'lowpass';
  readonly frequency = new FakeParam(350);
  readonly Q = new FakeParam(1);
}

class FakeShaper extends FakeNode {
  curve: Float32Array | null = null;
  oversample = 'none';
}

class FakeCompressor extends FakeNode {
  readonly threshold = new FakeParam(-24);
  readonly knee = new FakeParam(30);
  readonly ratio = new FakeParam(12);
  readonly attack = new FakeParam(0.003);
  readonly release = new FakeParam(0.25);
}

class FakeBuffer {
  readonly duration: number;
  private readonly data: Float32Array;

  constructor(length: number, sampleRate: number) {
    this.duration = length / sampleRate;
    this.data = new Float32Array(length);
  }

  getChannelData(): Float32Array {
    return this.data;
  }
}

class FakeSource extends FakeNode {
  buffer: FakeBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  started = false;
  stopped = false;

  start(_when?: number, _offset?: number, _duration?: number): void {
    this.started = true;
  }

  stop(_when?: number): void {
    this.stopped = true;
  }
}

class FakeOscillator extends FakeSource {
  type: OscillatorType = 'sine';
  readonly frequency = new FakeParam(440);
  readonly detune = new FakeParam(0);
}

class FakeAudioContext {
  static created: FakeAudioContext[] = [];

  state: AudioContextState = 'running';
  currentTime = 0;
  sampleRate = 48000;
  readonly destination = new FakeNode();
  readonly nodes: FakeNode[] = [];
  closeCalls = 0;

  constructor(_options?: unknown) {
    FakeAudioContext.created.push(this);
  }

  private track<T extends FakeNode>(node: T): T {
    this.nodes.push(node);
    return node;
  }

  createGain(): FakeGain {
    return this.track(new FakeGain());
  }

  createDynamicsCompressor(): FakeCompressor {
    return this.track(new FakeCompressor());
  }

  createBufferSource(): FakeSource {
    return this.track(new FakeSource());
  }

  createOscillator(): FakeOscillator {
    return this.track(new FakeOscillator());
  }

  createBiquadFilter(): FakeBiquad {
    return this.track(new FakeBiquad());
  }

  createWaveShaper(): FakeShaper {
    return this.track(new FakeShaper());
  }

  createBuffer(_channels: number, length: number, sampleRate: number): FakeBuffer {
    return new FakeBuffer(length, sampleRate);
  }

  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.state = 'closed';
    this.closeCalls++;
    return Promise.resolve();
  }
}

const scope = globalThis as unknown as { window?: { AudioContext?: typeof AudioContext } };

const TELEMETRY: AudioTelemetry = {
  rpm: 3200,
  maxRpm: 6800,
  throttle: 0.75,
  speedKph: 90,
  wheelSlip: 0.25,
  surfaceId: 'gravel',
  engineRunning: true,
  gear: 3,
};

beforeEach(() => {
  FakeAudioContext.created.length = 0;
  scope.window = { AudioContext: FakeAudioContext as unknown as typeof AudioContext };
});

afterEach(() => {
  delete scope.window;
});

describe('GameAudio lifecycle', () => {
  it('does not create a context before unlock and stays inert', async () => {
    const audio = new GameAudio();
    expect(audio.ready).toBe(false);
    expect(() => audio.update(1 / 60, TELEMETRY)).not.toThrow();
    audio.impact(1);
    audio.checkpoint();
    audio.ui();
    audio.finish();
    expect(FakeAudioContext.created).toHaveLength(0);

    await audio.unlock();
    expect(FakeAudioContext.created).toHaveLength(1);
    expect(audio.ready).toBe(true);

    const ctx = FakeAudioContext.created[0]!;
    expect(ctx.nodes.length).toBeGreaterThan(20);
    expect(ctx.nodes.length).toBeLessThan(60);

    audio.dispose();
    expect(audio.ready).toBe(false);
    expect(ctx.state).toBe('closed');
    expect(ctx.closeCalls).toBe(1);
    expect(ctx.nodes.every((node) => node.disconnected)).toBe(true);
  });

  it('drives the graph, all events and vehicle character changes', async () => {
    const audio = new GameAudio();
    audio.setVolume(0.6);
    audio.setMuted(true);
    audio.setMuted(false);
    audio.setVehicleCharacter('v6');
    await audio.unlock();

    const ctx = FakeAudioContext.created[0]!;
    audio.setVehicleCharacter('flat4');
    audio.update(1 / 60, TELEMETRY);
    audio.update(1 / 60, { ...TELEMETRY, engineRunning: false, surfaceId: 'mud', gear: 0 });
    audio.update(1 / 60, { ...TELEMETRY, surfaceId: 'sand', wheelSlip: 0.9 });

    audio.shift();
    audio.impact(0.9);
    audio.checkpoint();
    audio.ui('confirm');
    audio.ui('back');
    audio.ui();
    audio.finish();

    const oscillators = ctx.nodes.filter((node): node is FakeOscillator => node instanceof FakeOscillator);
    expect(oscillators.length).toBeGreaterThanOrEqual(10);
    expect(oscillators.some((osc) => osc.frequency.writes > 0)).toBe(true);

    audio.dispose();
    expect(ctx.nodes.every((node) => node.disconnected)).toBe(true);
  });

  it('bounds the number of concurrently tracked one-shots', async () => {
    const audio = new GameAudio();
    await audio.unlock();

    for (let i = 0; i < 80; i++) audio.impact(0.6);
    const internal = audio as unknown as { oneShots: Set<unknown>; oneShotSources: Set<unknown> };
    expect(internal.oneShots.size).toBeLessThanOrEqual(24);
    // Each impact at 0.6 schedules a thump, a noise burst and a metal ping.
    expect(internal.oneShotSources.size).toBe(80 * 3);
    audio.dispose();
  });

  it('is idempotent on dispose and cannot resurrect a disposed instance', async () => {
    const audio = new GameAudio();
    await audio.unlock();
    audio.dispose();
    expect(() => audio.dispose()).not.toThrow();
    await audio.unlock();
    expect(audio.ready).toBe(false);
    expect(FakeAudioContext.created).toHaveLength(1);
  });
});
