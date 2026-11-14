import type { Point } from '@/logic/perspective';
import type { Random } from '@/logic/random';

// Torn paper for the background collage: straight cuts broken into steps of
// about `step` px, each point pushed across the edge by up to `jag` px. Pure
// geometry; the objects fill the points.

export interface Tear {
  readonly step: number;
  readonly jag: number;
  // How far a tear's pale core reaches into the paper, px.
  readonly rim: number;
}

// One torn edge from a to b. a is included unmoved and b is left out, so edges
// chain into an outline without doubling corners.
export function tornLine(a: Point, b: Point, step: number, jag: number, random: Random): Point[] {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length === 0) return [a];
  const steps = Math.max(1, Math.round(length / step));
  const normal = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
  return Array.from({ length: steps }, (_, k) => {
    const t = k / steps;
    const offset = k === 0 ? 0 : (random() * 2 - 1) * jag;
    return { x: a.x + (b.x - a.x) * t + normal.x * offset, y: a.y + (b.y - a.y) * t + normal.y * offset };
  });
}

// A piece of paper through `corners` (a convex shape), with the edges listed
// in `torn` torn (edge i runs from corner i to the next) and the rest clean
// cuts. `outer` is the piece's edge. `inner` moves each torn edge `rim` px
// into the piece and tears it again, so filling outer in a pale color and
// inner in the paper's color leaves the uneven pale core of a real tear.
export function tornPiece(
  corners: readonly Point[],
  torn: readonly number[],
  { step, jag, rim }: Tear,
  random: Random,
): { outer: Point[]; inner: Point[] } {
  const center = {
    x: corners.reduce((sum, p) => sum + p.x, 0) / corners.length,
    y: corners.reduce((sum, p) => sum + p.y, 0) / corners.length,
  };
  const outer: Point[] = [];
  const inner: Point[] = [];
  corners.forEach((a, i) => {
    if (!torn.includes(i)) {
      outer.push(a);
      inner.push(a);
      return;
    }
    const b = corners[(i + 1) % corners.length]!;
    const n = inwardNormal(a, b, center);
    const shift = (p: Point): Point => ({ x: p.x + n.x * rim, y: p.y + n.y * rim });
    outer.push(...tornLine(a, b, step, jag, random));
    inner.push(...tornLine(shift(a), shift(b), step, jag, random));
  });
  return { outer, inner };
}

// The unit normal of a to b on the side facing `center`.
function inwardNormal(a: Point, b: Point, center: Point): Point {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const n = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
  const facing = n.x * (center.x - a.x) + n.y * (center.y - a.y);
  return facing >= 0 ? n : { x: -n.x, y: -n.y };
}
