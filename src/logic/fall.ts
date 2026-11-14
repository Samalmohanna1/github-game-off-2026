// The grid stage's falling squares and floor streaks (M10b review 3) each run
// a fixed cycle: these place one in its cycle and say how visible it is.

// How far through its cycle of `ms` a thing is at `time`, 0-1, starting
// `phase` of the way through.
export function cycleProgress(time: number, ms: number, phase: number): number {
  const p = (time / ms + phase) % 1;
  return p < 0 ? p + 1 : p;
}

// Its opacity at progress p: rising smoothly over the first `fadeIn` of the
// cycle, full in the middle, and falling smoothly over the last `fadeOut`, so
// it never pops in or out.
export function fadeEnvelope(p: number, fadeIn: number, fadeOut: number): number {
  const smooth = (x: number) => {
    const t = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  };
  return Math.min(smooth(p / fadeIn), smooth((1 - p) / fadeOut));
}
