import { FIGURE_FLOOR_Y, GAME_WIDTH, HORIZON_Y, STAGE_BOTTOM_Y } from '@/config';

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
