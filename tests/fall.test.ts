import { describe, expect, it } from 'vitest';
import { cycleProgress, fadeEnvelope } from '@/logic/fall';

describe('cycleProgress', () => {
  it('runs from 0 to 1 over the cycle and starts again', () => {
    expect(cycleProgress(0, 1000, 0)).toBe(0);
    expect(cycleProgress(250, 1000, 0)).toBeCloseTo(0.25);
    expect(cycleProgress(1250, 1000, 0)).toBeCloseTo(0.25);
  });

  it('starts partway through by its phase', () => {
    expect(cycleProgress(0, 1000, 0.6)).toBeCloseTo(0.6);
    expect(cycleProgress(500, 1000, 0.6)).toBeCloseTo(0.1);
  });
});

describe('fadeEnvelope', () => {
  it('is invisible at both ends of the cycle, so nothing pops', () => {
    expect(fadeEnvelope(0, 0.2, 0.3)).toBe(0);
    expect(fadeEnvelope(1, 0.2, 0.3)).toBe(0);
  });

  it('is fully visible between the fades', () => {
    expect(fadeEnvelope(0.5, 0.2, 0.3)).toBe(1);
  });

  it('rises through the fade in and falls through the fade out', () => {
    const rising = [0.02, 0.08, 0.14, 0.2].map((p) => fadeEnvelope(p, 0.2, 0.3));
    const falling = [0.7, 0.8, 0.9, 0.98].map((p) => fadeEnvelope(p, 0.2, 0.3));
    rising.forEach((a, i) => i > 0 && expect(a).toBeGreaterThan(rising[i - 1]!));
    falling.forEach((a, i) => i > 0 && expect(a).toBeLessThan(falling[i - 1]!));
  });
});
