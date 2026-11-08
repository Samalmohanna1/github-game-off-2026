import type { Point } from '@/logic/perspective';
import type { Random } from '@/logic/random';

// Torn paper (M10): straight cuts broken into steps of about `step` px, each
// point pushed across the edge by up to `jag` px, so shapes read as paper torn
// by hand. Pure geometry; the objects fill the points.

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

// A closed outline through `corners`, every side torn. The corners stay put.
export function tornOutline(corners: readonly Point[], step: number, jag: number, random: Random): Point[] {
  return corners.flatMap((a, i) => tornLine(a, corners[(i + 1) % corners.length]!, step, jag, random));
}

// A torn rectangle centered on (0, 0).
export function tornRect(width: number, height: number, step: number, jag: number, random: Random): Point[] {
  const w = width / 2;
  const h = height / 2;
  const corners = [
    { x: -w, y: -h },
    { x: w, y: -h },
    { x: w, y: h },
    { x: -w, y: h },
  ];
  return tornOutline(corners, step, jag, random);
}
