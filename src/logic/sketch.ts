import type { Point } from '@/logic/perspective';

// The pencil look of every outline (M10): a line cut into steps of about
// `step` px, each point nudged by up to `jitter` px. The nudge comes from a
// hash of the point's position (relative to `anchor`), not a random sequence,
// so redrawing gives the same wobble, and two lines sharing an end meet.

// A repeatable value in [-1, 1] for a point and a seed.
function wobble(x: number, y: number, seed: number): number {
  let h = Math.imul(Math.round(x * 4), 0x27d4eb2d) ^ Math.imul(Math.round(y * 4), 0x165667b1);
  h ^= Math.imul(seed + 1, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 0x7fffffff - 1;
}

export function sketch(
  points: readonly Point[],
  closed: boolean,
  step: number,
  jitter: number,
  seed = 0,
  anchor: Point = { x: 0, y: 0 },
): Point[] {
  const nudge = (p: Point): Point => ({
    x: p.x + jitter * wobble(p.x - anchor.x, p.y - anchor.y, seed),
    y: p.y + jitter * wobble(p.x - anchor.x, p.y - anchor.y, seed + 1),
  });
  const out: Point[] = [];
  const edges = closed ? points.length : points.length - 1;
  for (let i = 0; i < edges; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    const steps = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      out.push(nudge({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }));
    }
  }
  if (!closed && points.length > 0) out.push(nudge(points[points.length - 1]!));
  return out;
}
