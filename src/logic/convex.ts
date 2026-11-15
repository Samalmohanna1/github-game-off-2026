import type { Point } from '@/logic/perspective';

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

// The key caps' shape (M10b review), shared by the buttons and the dark cards
// (M11 review 2): the top-left and bottom-right corners cut by `cut`, the
// other two square. `grow` pushes every edge out by that much with the cuts
// kept parallel, for a closed edge drawn under the shape: an edge pushed out
// by g lengthens a 45-degree cut by g * (2 - sqrt 2).
export function keyCapRect(x: number, y: number, width: number, height: number, cut: number, grow = 0): Point[] {
  const grown = cut + grow * (2 - Math.SQRT2);
  return chamferedRect(x - grow, y - grow, width + 2 * grow, height + 2 * grow, { topLeft: grown, bottomRight: grown });
}
