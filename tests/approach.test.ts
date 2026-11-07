import { describe, expect, it } from 'vitest';
import { WALL_START_SCALE } from '@/config';
import { advanceT, easeIn, wallScale } from '@/logic/approach';

const WALL_TIME = 8;
const SAMPLES = Array.from({ length: 21 }, (_, i) => i / 20);

describe('advanceT', () => {
  it('moves linearly with time', () => {
    expect(advanceT(0, 2, WALL_TIME)).toBeCloseTo(0.25);
    expect(advanceT(0.25, 2, WALL_TIME)).toBeCloseTo(0.5);
  });

  it('reaches 1 exactly when the wall time has passed', () => {
    expect(advanceT(0, WALL_TIME, WALL_TIME)).toBe(1);
  });

  it('never goes past 1', () => {
    expect(advanceT(0.9, WALL_TIME, WALL_TIME)).toBe(1);
  });

  it('does not depend on the frame rate', () => {
    let at60 = 0;
    for (let i = 0; i < 240; i++) at60 = advanceT(at60, 1 / 60, WALL_TIME);
    let at30 = 0;
    for (let i = 0; i < 120; i++) at30 = advanceT(at30, 1 / 30, WALL_TIME);
    expect(at60).toBeCloseTo(0.5, 9);
    expect(at30).toBeCloseTo(at60, 9);
  });
});

describe('easeIn', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeIn(0)).toBe(0);
    expect(easeIn(1)).toBe(1);
  });

  it('lags behind linear in between, so the approach speeds up', () => {
    for (const t of SAMPLES.slice(1, -1)) expect(easeIn(t)).toBeLessThan(t);
  });
});

describe('wallScale', () => {
  it('starts far away and ends at full size at the figure', () => {
    expect(wallScale(0)).toBe(WALL_START_SCALE);
    expect(wallScale(1)).toBe(1);
  });

  it('only ever grows', () => {
    for (let i = 1; i < SAMPLES.length; i++) {
      expect(wallScale(SAMPLES[i]!)).toBeGreaterThan(wallScale(SAMPLES[i - 1]!));
    }
  });

  it('grows faster near the figure than far away', () => {
    const firstTenth = wallScale(0.1) - wallScale(0);
    const lastTenth = wallScale(1) - wallScale(0.9);
    expect(lastTenth).toBeGreaterThan(firstTenth);
  });
});
