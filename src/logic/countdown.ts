import { AUDIO } from '@/config';

// The countdown tick (PLAN.md §10, M9): silent until the wall reaches CLOSE
// CALL range, then ticking faster and faster as t nears 1.

// Time to the next tick at progress t, or null while the clock is silent.
export function tickIntervalMs(t: number): number | null {
  const { fromT, startMs, endMs } = AUDIO.tick;
  if (t < fromT) return null;
  const progress = Math.min(1, (t - fromT) / (1 - fromT));
  return startMs + (endMs - startMs) * progress;
}

// One per wall. Ticks the moment t reaches the range, then every interval.
export class Countdown {
  private untilNext = 0;
  private ticks = 0;

  // The tick's index (even ticks, odd tocks) when one is due, otherwise null.
  update(t: number, dtMs: number): number | null {
    const interval = tickIntervalMs(t);
    if (interval === null) return null;
    this.untilNext -= dtMs;
    if (this.untilNext > 0) return null;
    // Restarting the wait, rather than adding to it, means a long frame
    // never sends a burst of catch-up ticks.
    this.untilNext = interval;
    return this.ticks++;
  }
}
