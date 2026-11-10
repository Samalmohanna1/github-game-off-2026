import type { Point } from '@/logic/perspective';

// Where the line x = at (axis 'x') or y = at (axis 'y') crosses a convex
// polygon: the [low, high] range of the other coordinate, or null if the line
// misses it. Used to clip the collage's grid lines to their paper.
export function spanAt(polygon: readonly Point[], axis: 'x' | 'y', at: number): [number, number] | null {
  const along = (p: Point) => (axis === 'x' ? p.x : p.y);
  const across = (p: Point) => (axis === 'x' ? p.y : p.x);
  const hits: number[] = [];
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!;
    const lo = Math.min(along(a), along(b));
    const hi = Math.max(along(a), along(b));
    if (lo === hi || at < lo || at > hi) return;
    const t = (at - along(a)) / (along(b) - along(a));
    hits.push(across(a) + t * (across(b) - across(a)));
  });
  return hits.length < 2 ? null : [Math.min(...hits), Math.max(...hits)];
}
