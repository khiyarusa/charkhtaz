import { describe, expect, it } from 'vitest';
import {
  clamp,
  clamp01,
  damp,
  engineCharacter,
  engineFilterHz,
  engineFiringHz,
  engineGainCurve,
  engineLayerFrequencies,
  gearTimbre,
  impactGain,
  masterGainFor,
  rollingSpeedGain,
  safeNumber,
  skidGain,
  surfaceProfile,
  tyreGain,
  windGain,
} from './audio-math';

describe('engine frequency mapping', () => {
  it('uses four-stroke firing order (N/2 pulses per revolution)', () => {
    // 3000 rpm / 60 = 50 rev/s; an inline-four fires twice per revolution.
    expect(engineFiringHz(3000, 4)).toBeCloseTo(100, 6);
    expect(engineFiringHz(3000, 6)).toBeCloseTo(150, 6);
    expect(engineFiringHz(6000, 4)).toBeCloseTo(200, 6);
  });

  it('clamps nonsensical rpm and cylinder counts', () => {
    expect(engineFiringHz(-5000, 4)).toBe(0);
    expect(engineFiringHz(Number.NaN, 4)).toBe(0);
    expect(engineFiringHz(3000, 0)).toBeCloseTo(25, 6);
    expect(engineFiringHz(3000, Number.POSITIVE_INFINITY)).toBeCloseTo(100, 6);
  });

  it('builds four ordered oscillator layers around the firing frequency', () => {
    const i4 = engineCharacter('i4');
    const layers = engineLayerFrequencies(6000, i4);
    expect(layers.fundamental).toBeCloseTo(200, 6);
    expect(layers.sub).toBeCloseTo(100, 6);
    expect(layers.second).toBeCloseTo(404, 6);
    expect(layers.third).toBeCloseTo(602, 6);
    expect(layers.sub).toBeLessThan(layers.fundamental);
    expect(layers.second).toBeGreaterThan(layers.fundamental);
    expect(layers.third).toBeGreaterThan(layers.second);
  });

  it('keeps layers finite at zero rpm', () => {
    const layers = engineLayerFrequencies(0, engineCharacter('flat4'));
    expect(layers.fundamental).toBeGreaterThanOrEqual(12);
    expect(layers.sub).toBeGreaterThan(0);
    for (const value of Object.values(layers)) expect(Number.isFinite(value)).toBe(true);
  });
});

describe('engine character', () => {
  it('defines distinct i4, v6 and flat-four archetypes', () => {
    const i4 = engineCharacter('i4');
    const v6 = engineCharacter('v6');
    const flat4 = engineCharacter('flat4');
    expect(i4.cylinders).toBe(4);
    expect(v6.cylinders).toBe(6);
    expect(flat4.cylinders).toBe(4);
    expect(v6.secondMix).not.toBe(i4.secondMix);
    expect(flat4.subMix).toBeGreaterThan(i4.subMix);
    expect(flat4.detuneCents).toBeGreaterThan(i4.detuneCents);
    expect(v6.rasp).toBeLessThan(flat4.rasp);
  });

  it('falls back to i4 for unknown or missing characters', () => {
    expect(engineCharacter(undefined).kind).toBe('i4');
    expect(engineCharacter('rotary').kind).toBe('i4');
    expect(engineCharacter(null).kind).toBe('i4');
  });

  it('opens the engine filter with rpm, throttle and gear', () => {
    const low = engineFilterHz(0.05, 0, 1, 'i4');
    const high = engineFilterHz(0.95, 1, 5, 'i4');
    expect(high).toBeGreaterThan(low * 3);
    expect(engineFilterHz(0.7, 0.8, 4, 'i4')).toBeGreaterThan(engineFilterHz(0.7, 0.8, 1, 'i4'));
    expect(engineFilterHz(0.7, 0, 3, 'v6')).toBeGreaterThan(engineFilterHz(0.7, 0, 3, 'i4'));
    expect(engineFilterHz(0.7, 0, 3, 'flat4')).toBeLessThan(engineFilterHz(0.7, 0, 3, 'i4'));
  });

  it('bounds the filter cutoff even for out-of-range telemetry', () => {
    expect(engineFilterHz(99, 99, 99, 'v6')).toBeLessThanOrEqual(9000);
    expect(engineFilterHz(-5, Number.NaN, -3, 'i4')).toBeGreaterThanOrEqual(180);
    expect(Number.isFinite(engineFilterHz(Number.NaN, Number.NaN, Number.NaN, 'i4'))).toBe(true);
  });
});

describe('engine gain and gear timbre', () => {
  it('is silent with the engine off and audible at idle', () => {
    expect(engineGainCurve(0, 0.1, false)).toBe(0);
    expect(engineGainCurve(1, 0.9, false)).toBe(0);
    expect(engineGainCurve(0, 0.1, true)).toBeGreaterThan(0.1);
  });

  it('rises with throttle and revs and stays within 0..1', () => {
    const idle = engineGainCurve(0, 0.1, true);
    const half = engineGainCurve(0.5, 0.5, true);
    const full = engineGainCurve(1, 1, true);
    expect(half).toBeGreaterThan(idle);
    expect(full).toBeGreaterThan(half);
    expect(full).toBeLessThanOrEqual(1);
    expect(engineGainCurve(5, 5, true)).toBeLessThanOrEqual(1);
    expect(engineGainCurve(-5, -5, true)).toBeGreaterThanOrEqual(0);
  });

  it('makes first gear darker than top gear, with neutral darker still', () => {
    expect(gearTimbre(1).brightness).toBeLessThan(gearTimbre(3).brightness);
    expect(gearTimbre(3).brightness).toBeLessThan(gearTimbre(6).brightness);
    expect(gearTimbre(0).brightness).toBeLessThan(gearTimbre(1).brightness);
    expect(gearTimbre(-1).gain).toBeLessThan(1);
  });

  it('handles unknown gears without NaN', () => {
    for (const gear of [Number.NaN, 99, -99]) {
      const t = gearTimbre(gear);
      expect(Number.isFinite(t.brightness)).toBe(true);
      expect(Number.isFinite(t.gain)).toBe(true);
      expect(t.brightness).toBeGreaterThan(0);
    }
  });
});

describe('surface profiles', () => {
  const ids = ['asphalt-dry', 'asphalt-wet', 'dirt', 'gravel', 'sand', 'mud', 'rock', 'wood'];

  it('covers every surface in the track data model', () => {
    for (const id of ids) {
      const p = surfaceProfile(id);
      expect(p.id).toBe(id);
      expect(p.level).toBeGreaterThan(0);
      expect(p.bodyHz).toBeGreaterThan(0);
      expect(p.hissHz).toBeGreaterThan(0);
      expect(p.hiss).toBeGreaterThanOrEqual(0);
      expect(p.hiss).toBeLessThanOrEqual(1);
      expect(p.roughness).toBeGreaterThanOrEqual(0);
      expect(p.roughness).toBeLessThanOrEqual(1);
      expect(p.skidHz).toBeGreaterThan(0);
    }
  });

  it('gives loose surfaces their characteristic spectral balance', () => {
    // Mud is a low thud; asphalt is brighter; wet asphalt adds hiss.
    expect(surfaceProfile('mud').bodyHz).toBeLessThan(surfaceProfile('asphalt-dry').bodyHz);
    expect(surfaceProfile('sand').bodyHz).toBeLessThan(surfaceProfile('gravel').bodyHz);
    expect(surfaceProfile('asphalt-wet').hiss).toBeGreaterThan(surfaceProfile('asphalt-dry').hiss);
    expect(surfaceProfile('gravel').roughness).toBeGreaterThan(surfaceProfile('asphalt-dry').roughness);
    expect(surfaceProfile('rock').level).toBeGreaterThan(surfaceProfile('sand').level);
    expect(surfaceProfile('rock').skidHz).toBeGreaterThan(surfaceProfile('mud').skidHz);
  });

  it('falls back to dry asphalt for unknown ids', () => {
    expect(surfaceProfile('lava').id).toBe('asphalt-dry');
    expect(surfaceProfile(undefined).id).toBe('asphalt-dry');
    expect(surfaceProfile(null).id).toBe('asphalt-dry');
    expect(surfaceProfile('asphalt-slick').id).toBe('asphalt-dry');
  });
});

describe('tyre, skid and wind gains', () => {
  it('silences rolling noise at standstill and rises with speed', () => {
    expect(tyreGain(0, 'asphalt-dry')).toBe(0);
    expect(tyreGain(30, 'asphalt-dry')).toBeGreaterThan(0);
    expect(tyreGain(100, 'asphalt-dry')).toBeGreaterThan(tyreGain(30, 'asphalt-dry'));
    expect(tyreGain(500, 'asphalt-dry')).toBeLessThanOrEqual(1);
  });

  it('scales rolling noise by surface', () => {
    expect(tyreGain(100, 'mud')).toBeGreaterThan(tyreGain(100, 'sand'));
    expect(tyreGain(100, 'rock')).toBeGreaterThan(tyreGain(100, 'asphalt-dry'));
    expect(tyreGain(0, 'mud')).toBe(0);
  });

  it('maps rolling speed monotonically onto 0..1', () => {
    expect(rollingSpeedGain(0)).toBe(0);
    expect(rollingSpeedGain(65)).toBeGreaterThan(rollingSpeedGain(20));
    expect(rollingSpeedGain(130)).toBeCloseTo(1, 6);
    expect(rollingSpeedGain(400)).toBe(1);
  });

  it('only produces skid above the grip threshold', () => {
    expect(skidGain(0, 80)).toBe(0);
    expect(skidGain(0.05, 80)).toBe(0);
    expect(skidGain(0.2, 80)).toBeGreaterThan(0);
    expect(skidGain(0.8, 80)).toBeGreaterThan(skidGain(0.3, 80));
  });

  it('keeps a stationary burnout audible but speed-dependent', () => {
    const stationary = skidGain(0.9, 0);
    const fast = skidGain(0.9, 90);
    expect(stationary).toBeGreaterThan(0);
    expect(fast).toBeGreaterThan(stationary);
    expect(skidGain(99, 999)).toBe(1);
    expect(skidGain(-0.9, 60)).toBeCloseTo(skidGain(0.9, 60), 6);
  });

  it('fades wind in above walking pace and caps it', () => {
    expect(windGain(0)).toBe(0);
    expect(windGain(10)).toBe(0);
    expect(windGain(100)).toBeGreaterThan(0);
    expect(windGain(200)).toBeGreaterThan(windGain(100));
    expect(windGain(200)).toBeCloseTo(0.26, 6);
    expect(windGain(500)).toBeCloseTo(0.26, 6);
  });
});

describe('mix and event gains', () => {
  it('maps impact severity monotonically onto 0..1', () => {
    expect(impactGain(0)).toBe(0);
    expect(impactGain(0.5)).toBeGreaterThan(0.3);
    expect(impactGain(0.5)).toBeLessThan(0.6);
    expect(impactGain(1)).toBe(1);
    expect(impactGain(5)).toBe(1);
    expect(impactGain(-2)).toBe(0);
  });

  it('applies mute and perceptual volume to the master gain', () => {
    expect(masterGainFor(0.8, true)).toBe(0);
    expect(masterGainFor(0, false)).toBe(0);
    expect(masterGainFor(0.5, false)).toBeCloseTo(0.379, 3);
    expect(masterGainFor(1, false)).toBe(1);
    expect(masterGainFor(3, false)).toBe(1);
    expect(masterGainFor(-1, false)).toBe(0);
  });
});

describe('numeric safety and smoothing', () => {
  it('clamps and sanitises values', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(Number.NaN, 0, 1)).toBe(0);
    expect(clamp01(0.4)).toBeCloseTo(0.4, 6);
    expect(safeNumber(Number.NaN, 7)).toBe(7);
    expect(safeNumber(Number.POSITIVE_INFINITY, 7)).toBe(7);
    expect(safeNumber(3, 7)).toBe(3);
  });

  it('approaches a target exponentially', () => {
    let value = 0;
    for (let i = 0; i < 600; i++) value = damp(value, 1, 0.1, 1 / 60);
    expect(value).toBeCloseTo(1, 3);
    expect(damp(0.25, 1, 0.1, 0)).toBe(0.25);
    expect(damp(0.25, 1, 0, 1 / 60)).toBe(1);
  });

  it('is frame-rate independent', () => {
    const oneStep = damp(0, 1, 0.1, 1 / 60);
    const twoSteps = damp(damp(0, 1, 0.1, 1 / 120), 1, 0.1, 1 / 120);
    expect(twoSteps).toBeCloseTo(oneStep, 4);
  });
});
