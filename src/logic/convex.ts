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
