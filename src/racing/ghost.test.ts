import { describe, expect, it } from 'vitest';
import { GhostRecorder, decodeGhost, encodeGhost, sampleGhost, type GhostFrame } from './ghost';

const frame = (t: number, x: number, angle = 0): GhostFrame => ({
  t,
  x,
  y: 1,
  angle,
  frontWheelAngle: 0.1,
  rearWheelAngle: 0.2,
});

describe('ghost capture and replay', () => {
  it('records at the configured interval and encodes compactly', () => {
    const rec = new GhostRecorder(0.1);
    const source = { x: 0, y: 1, angle: 0, wheels: [{ angleRad: 0.1 }, { angleRad: 0.2 }] };
    rec.sample(0, source);
    source.x = 5;
    rec.sample(0.05, source);
    source.x = 10;
    rec.sample(0.1, source);
    expect(rec.length).toBe(2);
    const encoded = rec.finish();
    expect(encoded).toHaveLength(2);
    expect(encoded[0]).toHaveLength(6);
    expect(decodeGhost(encoded)).toHaveLength(2);
  });

  it('round-trips through encode/decode', () => {
    const frames = [frame(0, 0), frame(0.5, 7.25, 0.2), frame(1, 14.5, -0.1)];
    const decoded = decodeGhost(encodeGhost(frames));
    expect(decoded).toHaveLength(3);
    expect(decoded[1]!.x).toBeCloseTo(7.25, 2);
    expect(decoded[2]!.angle).toBeCloseTo(-0.1, 3);
  });

  it('interpolates the pose between samples and clamps outside the run', () => {
    const frames = [frame(0, 0), frame(1, 10)];
    const mid = sampleGhost(frames, 0.5);
    expect(mid).not.toBeNull();
    expect(mid!.x).toBeCloseTo(5, 4);
    expect(sampleGhost(frames, -1)).toBeNull();
    expect(sampleGhost(frames, 2)).toBeNull();
  });

  it('interpolates wheel angles across the ±π seam', () => {
    const frames: GhostFrame[] = [
      { ...frame(0, 0), frontWheelAngle: 3.1 },
      { ...frame(1, 1), frontWheelAngle: -3.1 },
    ];
    const mid = sampleGhost(frames, 0.5);
    expect(mid).not.toBeNull();
    expect(Math.abs(mid!.frontWheelAngle)).toBeGreaterThan(3.0);
  });
});
