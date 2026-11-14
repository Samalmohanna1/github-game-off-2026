// The grid stage's fixed composition (GridVoid), after the mockup: lit cells
// on the back wall's grid, squares falling in front of it, and streaks of
// light running down the floor below the seam. Placed by hand, clear of the
// wall's path down the middle, so it frames the play without crowding it.
// Screen px and ms, except cells, which count the back wall's grid squares:
// columns from the middle (column 0 is centered on it), rows up from the seam.

export type SquareTone = 'dim' | 'mid' | 'bright';

export interface WallCell {
  readonly column: number;
  readonly row: number;
  readonly tone: SquareTone;
}

// A square that falls down its column toward the seam over `ms`, fading in at
// the top and out as it nears the seam, then falls again; `phase` (0-1) is how
// far through its fall it starts, so they fall out of step.
export interface FallingSquare {
  readonly x: number;
  readonly size: number;
  readonly tone: SquareTone;
  readonly ms: number;
  readonly phase: number;
  readonly reflect?: boolean; // shows on the glossy floor below the seam
}

// A streak of light that runs down the floor from the seam, `travel` px over
// `ms`, fading as it goes.
export interface FloorStreak {
  readonly x: number;
  readonly width: number;
  readonly height: number;
  readonly travel: number;
  readonly ms: number;
  readonly phase: number;
}

export const WALL_CELLS: readonly WallCell[] = [
  { column: -10, row: 1, tone: 'dim' },
  { column: -8, row: 2, tone: 'dim' },
  { column: -7, row: 0, tone: 'mid' },
  { column: -12, row: 0, tone: 'dim' },
  { column: 6, row: 1, tone: 'dim' },
  { column: 8, row: 0, tone: 'mid' },
  { column: 9, row: 2, tone: 'dim' },
  { column: 11, row: 1, tone: 'dim' },
];

// Bigger squares are nearer, so they fall a little faster.
export const FALLING_SQUARES: readonly FallingSquare[] = [
  { x: 300, size: 20, tone: 'mid', ms: 6200, phase: 0.55, reflect: true },
  { x: 92, size: 15, tone: 'mid', ms: 7000, phase: 0.2 },
  { x: 38, size: 11, tone: 'dim', ms: 8400, phase: 0.7 },
  { x: 206, size: 5, tone: 'bright', ms: 9600, phase: 0.35 },
  { x: 396, size: 4, tone: 'bright', ms: 9200, phase: 0.85 },
  { x: 340, size: 12, tone: 'dim', ms: 7800, phase: 0.1, reflect: true },
  { x: 676, size: 16, tone: 'mid', ms: 6800, phase: 0.4 },
  { x: 566, size: 9, tone: 'dim', ms: 8800, phase: 0.65 },
  { x: 1004, size: 19, tone: 'mid', ms: 6400, phase: 0.05, reflect: true },
  { x: 952, size: 5, tone: 'bright', ms: 9400, phase: 0.5 },
  { x: 1160, size: 5, tone: 'bright', ms: 9000, phase: 0.15 },
  { x: 1216, size: 14, tone: 'mid', ms: 7200, phase: 0.75 },
  { x: 1100, size: 16, tone: 'dim', ms: 7000, phase: 0.3, reflect: true },
  { x: 900, size: 11, tone: 'dim', ms: 8200, phase: 0.9 },
];

export const FLOOR_STREAKS: readonly FloorStreak[] = [
  { x: 112, width: 18, height: 74, travel: 90, ms: 5200, phase: 0.2 },
  { x: 262, width: 11, height: 44, travel: 70, ms: 4600, phase: 0.65 },
  { x: 1046, width: 10, height: 38, travel: 70, ms: 4800, phase: 0.4 },
  { x: 1174, width: 16, height: 64, travel: 90, ms: 5400, phase: 0.85 },
];
