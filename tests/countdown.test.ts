import { describe, expect, it } from 'vitest';
import { AUDIO, GREAT_T } from '@/config';
import { Countdown, tickIntervalMs } from '@/logic/countdown';

const FRAME = 16;

// Plays one wall from t = 0 to 1 over wallMs, frame by frame, and returns the
// t of every tick.
function tickTimes(wallMs: number): number[] {
  const countdown = new Countdown();
  const ticks: number[] = [];
  for (let ms = 0; ms <= wallMs; ms += FRAME) {
    const t = ms / wallMs;
    if (countdown.update(t, FRAME) !== null) ticks.push(t);
  }
  return ticks;
}

describe('tickIntervalMs', () => {
  it('stays silent until CLOSE CALL range, which starts past GREAT', () => {
    expect(AUDIO.tick.fromT).toBe(GREAT_T);
    expect(tickIntervalMs(0)).toBeNull();
    expect(tickIntervalMs(GREAT_T - 0.01)).toBeNull();
  });

  it('runs from its slowest at the start of the range to its fastest at t = 1', () => {
    expect(tickIntervalMs(GREAT_T)).toBeCloseTo(AUDIO.tick.startMs);
    expect(tickIntervalMs(1)).toBeCloseTo(AUDIO.tick.endMs);
    expect(tickIntervalMs(1.2)).toBeCloseTo(AUDIO.tick.endMs);
    expect(AUDIO.tick.endMs).toBeLessThan(AUDIO.tick.startMs);
  });
});

describe('Countdown', () => {
  it('never ticks before the range, and ticks the moment t reaches it', () => {
    const ticks = tickTimes(8000);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0]).toBeGreaterThanOrEqual(GREAT_T);
    expect(ticks[0]).toBeLessThan(GREAT_T + FRAME / 8000);
  });

  it('ticks faster and faster as the wall closes in', () => {
    const ticks = tickTimes(8000);
    const gaps = ticks.slice(1).map((t, i) => t - ticks[i]!);
    gaps.slice(1).forEach((gap, i) => expect(gap).toBeLessThanOrEqual(gaps[i]! + FRAME / 8000));
    expect(gaps.at(-1)!).toBeLessThan(gaps[0]!);
  });

  it('counts its ticks, so they alternate tick and tock', () => {
    const countdown = new Countdown();
    const indexes: number[] = [];
    for (let i = 0; i < 200; i++) {
      const tick = countdown.update(0.9, FRAME);
      if (tick !== null) indexes.push(tick);
    }
    expect(indexes.slice(0, 4)).toEqual([0, 1, 2, 3]);
  });

  it('never bursts catch-up ticks after one long frame', () => {
    const countdown = new Countdown();
    expect(countdown.update(0.9, FRAME)).toBe(0);
    expect(countdown.update(0.9, 2000)).toBe(1);
    expect(countdown.update(0.9, FRAME)).toBeNull();
  });
});
