import type { COLORS } from '@/config';
import type { Point } from '@/logic/perspective';

// The background collage (M10 review 4): torn and cut paper at the outer
// edges of the stage, after the review's reference image. Drawn back to front
// over the cream stage, in screen px. Everything inward of the floor's verges
// and the wall's path is left plain, so nothing competes with play; the HUD
// sits on the two pale sheets in the top corners.

type CollageColor = keyof typeof COLORS;

export interface Grid {
  readonly spacing: number; // px
  readonly lineWidth: number; // px
  readonly color: CollageColor;
  readonly alpha: number;
}

// A flat piece of paper through `corners` (convex). Edge i runs from corner i
// to the next; the edges listed in `torn` are torn, the rest clean cuts. A
// grid is clipped to the corners, so a gridded sheet's own edges stay clean.
export interface Sheet {
  readonly kind: 'sheet';
  readonly color: CollageColor;
  readonly corners: readonly Point[];
  readonly torn?: readonly number[];
  readonly grid?: Grid;
}

export interface Disc {
  readonly kind: 'disc';
  readonly color: CollageColor;
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export type CollagePiece = Sheet | Disc;

export const COLLAGE: readonly CollagePiece[] = [
  // Left edge: a sage disc and a gridded forest shard, a pale sheet under
  // SCORE, and the stage's own paper torn back over their lower half.
  { kind: 'disc', color: 'collageSage', x: 185, y: 330, r: 215 },
  {
    kind: 'sheet',
    color: 'collageForest',
    corners: [
      { x: 0, y: 165 },
      { x: 255, y: 350 },
      { x: 0, y: 445 },
    ],
    grid: { spacing: 12, lineWidth: 1, color: 'collageForestGrid', alpha: 0.55 },
  },
  {
    kind: 'sheet',
    color: 'collagePaper',
    corners: [
      { x: 0, y: 0 },
      { x: 225, y: 0 },
      { x: 200, y: 150 },
      { x: 0, y: 172 },
    ],
    torn: [1, 2],
  },
  {
    kind: 'sheet',
    color: 'stage',
    corners: [
      { x: 0, y: 428 },
      { x: 380, y: 300 },
      { x: 380, y: 720 },
      { x: 0, y: 720 },
    ],
    torn: [0],
  },
  // Right edge: a sage sliver and a forest sheet torn across the top, a
  // gridded sheet, a pale sheet under WALL, stone and charcoal shards, and
  // the stage's paper torn back over them.
  {
    kind: 'sheet',
    color: 'collageSage',
    corners: [
      { x: 790, y: 0 },
      { x: 880, y: 0 },
      { x: 815, y: 150 },
    ],
  },
  {
    kind: 'sheet',
    color: 'stage',
    corners: [
      { x: 870, y: 90 },
      { x: 1280, y: 0 },
      { x: 1280, y: 380 },
      { x: 870, y: 380 },
    ],
    grid: { spacing: 30, lineWidth: 1, color: 'collageGrid', alpha: 0.3 },
  },
  {
    kind: 'sheet',
    color: 'collageForest',
    corners: [
      { x: 840, y: 0 },
      { x: 1215, y: 0 },
      { x: 915, y: 205 },
      { x: 870, y: 225 },
    ],
    torn: [1],
  },
  {
    kind: 'sheet',
    color: 'collagePaper',
    corners: [
      { x: 1105, y: 0 },
      { x: 1280, y: 0 },
      { x: 1280, y: 168 },
      { x: 1092, y: 180 },
    ],
    torn: [2, 3],
  },
  {
    kind: 'sheet',
    color: 'collageStone',
    corners: [
      { x: 975, y: 335 },
      { x: 1280, y: 188 },
      { x: 1280, y: 440 },
      { x: 990, y: 440 },
    ],
    torn: [0],
  },
  {
    kind: 'sheet',
    color: 'collageCharcoal',
    corners: [
      { x: 1055, y: 352 },
      { x: 1280, y: 265 },
      { x: 1280, y: 540 },
      { x: 1085, y: 500 },
    ],
  },
  {
    kind: 'sheet',
    color: 'stage',
    corners: [
      { x: 900, y: 300 },
      { x: 1280, y: 470 },
      { x: 1280, y: 720 },
      { x: 900, y: 720 },
    ],
    torn: [0],
  },
];
