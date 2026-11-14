// The grid stage's fixed composition (GridVoid), after the mockup: lit cells
// on the back wall's grid, squares floating in front of it, and light pillars
// standing on the floor near the seam. Placed by hand, clear of the HUD in
// the top corners and of the wall's path down the middle, so it frames the
// play without crowding it. Screen px, except cells, which count the back
// wall's grid squares: columns from the middle (column 0 is centered on it),
// rows up from the seam.

export type SquareTone = 'dim' | 'mid' | 'bright';

export interface WallCell {
  readonly column: number;
  readonly row: number;
  readonly tone: SquareTone;
}

export interface FloatingSquare {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly tone: SquareTone;
  readonly reflect?: boolean; // shows on the glossy floor below the seam
}

// A column of light standing on the floor, its foot `below` px under the seam.
export interface Pillar {
  readonly x: number;
  readonly below: number;
  readonly width: number;
  readonly height: number;
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

export const FLOATING_SQUARES: readonly FloatingSquare[] = [
  { x: 300, y: 150, size: 20, tone: 'mid', reflect: true },
  { x: 92, y: 196, size: 15, tone: 'mid' },
  { x: 38, y: 240, size: 11, tone: 'dim' },
  { x: 206, y: 226, size: 5, tone: 'bright' },
  { x: 396, y: 134, size: 4, tone: 'bright' },
  { x: 340, y: 236, size: 12, tone: 'dim', reflect: true },
  { x: 676, y: 76, size: 16, tone: 'mid' },
  { x: 712, y: 108, size: 4, tone: 'bright' },
  { x: 566, y: 98, size: 9, tone: 'dim' },
  { x: 1004, y: 168, size: 19, tone: 'mid', reflect: true },
  { x: 952, y: 204, size: 5, tone: 'bright' },
  { x: 1160, y: 178, size: 5, tone: 'bright' },
  { x: 1216, y: 228, size: 14, tone: 'mid' },
  { x: 1100, y: 244, size: 16, tone: 'dim', reflect: true },
  { x: 900, y: 128, size: 11, tone: 'dim' },
];

export const PILLARS: readonly Pillar[] = [
  { x: 112, below: 34, width: 18, height: 74 },
  { x: 262, below: 14, width: 11, height: 44 },
  { x: 1046, below: 12, width: 10, height: 38 },
  { x: 1174, below: 30, width: 16, height: 64 },
];
