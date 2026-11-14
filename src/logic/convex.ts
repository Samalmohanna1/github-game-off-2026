import type { Point } from '@/logic/perspective';

// Where the line x = at (axis 'x') or y = at (axis 'y') crosses a convex
// polygon: the [low, high] range of the other coordinate, or null if the line
// misses it. Used to clip the UI panels' inner grids to their shape.
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

export interface CornerCuts {
  readonly topLeft?: number;
  readonly topRight?: number;
  readonly bottomRight?: number;
  readonly bottomLeft?: number;
}

// A rectangle with any of its corners cut off at 45 degrees, the angular
// shape of the UI panels and key caps (M10b). Clockwise from the top-left;
// an uncut corner is a single point.
export function chamferedRect(x: number, y: number, width: number, height: number, cuts: CornerCuts = {}): Point[] {
  const { topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0 } = cuts;
  const right = x + width;
  const bottom = y + height;
  const points = [
    { x: x + topLeft, y },
    { x: right - topRight, y },
    { x: right, y: y + topRight },
    { x: right, y: bottom - bottomRight },
    { x: right - bottomRight, y: bottom },
    { x: x + bottomLeft, y: bottom },
    { x, y: bottom - bottomLeft },
    { x, y: y + topLeft },
  ];
  return points.filter((p, i) => {
    const next = points[(i + 1) % points.length]!;
    return p.x !== next.x || p.y !== next.y;
  });
}
