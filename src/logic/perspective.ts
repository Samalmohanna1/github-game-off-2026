import { FIGURE_FLOOR_Y, FLOOR, GAME_WIDTH, HORIZON_Y, STAGE_BOTTOM_Y, WALL_START_SCALE } from '@/config';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export const VANISHING_POINT: Point = { x: GAME_WIDTH / 2, y: HORIZON_Y };

// With a single vanishing point, a depth is just a scale toward it: scale 1 is
// the figure's plane, below 1 is farther away, above 1 is nearer the camera.
export function project(p: Point, scale: number): Point {
  return {
    x: VANISHING_POINT.x + scale * (p.x - VANISHING_POINT.x),
    y: VANISHING_POINT.y + scale * (p.y - VANISHING_POINT.y),
  };
}

// The depth whose floor line sits at screen height y.
export function scaleAtFloorY(y: number): number {
  return (y - HORIZON_Y) / (FIGURE_FLOOR_Y - HORIZON_Y);
}

// The nearest visible plane: its floor line is the bottom edge of the stage.
export const STAGE_FRONT_SCALE = scaleAtFloorY(STAGE_BOTTOM_Y);

// Sized so the floor's edges meet the stage's bottom corners at STAGE_FRONT_SCALE.
export const FLOOR_HALF_WIDTH = GAME_WIDTH / 2 / STAGE_FRONT_SCALE;

export function floorEdge(side: -1 | 1): Point {
  return { x: VANISHING_POINT.x + side * FLOOR_HALF_WIDTH, y: FIGURE_FLOOR_Y };
}

// The floor's tile rows: seams across the floor, evenly spaced in depth
// (1/scale), cut so the figure's plane runs through the middle of a row.
// Seam k sits at depth 1 + (k + 1/2) * FLOOR.tileDepth.
const seamDepth = (k: number) => 1 + (k + 0.5) * FLOOR.tileDepth;

// The row the figure stands in, as the scales of its back and front seams:
// in each lane, the figure stands centered on this tile.
export const FIGURE_TILE = { back: 1 / seamDepth(0), front: 1 / seamDepth(-1) } as const;

// Every cross seam between the floor's far end (WALL_START_SCALE) and the
// stage front, far to near.
export function crossSeamScales(): number[] {
  const scales: number[] = [];
  const farDepth = 1 / WALL_START_SCALE;
  for (let k = Math.floor((farDepth - 1) / FLOOR.tileDepth - 0.5); seamDepth(k) > 1 / STAGE_FRONT_SCALE; k--) {
    if (seamDepth(k) < farDepth) scales.push(1 / seamDepth(k));
  }
  return scales;
}
