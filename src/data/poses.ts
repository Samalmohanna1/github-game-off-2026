export type BlockId = 'head' | 'torso' | 'armL' | 'armR' | 'legs';

export const BLOCK_IDS: readonly BlockId[] = ['head', 'torso', 'armL', 'armR', 'legs'];

export interface CellRect {
  readonly col: number;
  readonly row: number;
  readonly cols: number;
  readonly rows: number;
}

// Cells on FIGURE_GRID with row 0 at the top. armL is the arm on the screen's
// left. Columns 0 and 5 stay free so alt poses can reach out sideways.
export const NEUTRAL_POSE: Readonly<Record<BlockId, CellRect>> = {
  head: { col: 2, row: 0, cols: 2, rows: 2 },
  torso: { col: 2, row: 2, cols: 2, rows: 3 },
  armL: { col: 1, row: 2, cols: 1, rows: 3 },
  armR: { col: 4, row: 2, cols: 1, rows: 3 },
  legs: { col: 2, row: 5, cols: 2, rows: 3 },
};

// Some alts clash (a head shifted left overlaps a raised left arm), so
// wall-gen only uses combinations with no overlap, and prefers ones whose
// silhouette is a single piece.
export const ALT_POSES: Readonly<Record<BlockId, readonly CellRect[]>> = {
  head: [
    { col: 1, row: 0, cols: 2, rows: 2 }, // shifted left
    { col: 3, row: 0, cols: 2, rows: 2 }, // shifted right
  ],
  torso: [
    { col: 2, row: 2, cols: 1, rows: 3 }, // turned, left half
    { col: 3, row: 2, cols: 1, rows: 3 }, // turned, right half
  ],
  armL: [
    { col: 1, row: 0, cols: 1, rows: 3 }, // raised
    { col: 0, row: 2, cols: 2, rows: 1 }, // out
  ],
  armR: [
    { col: 4, row: 0, cols: 1, rows: 3 }, // raised
    { col: 4, row: 2, cols: 2, rows: 1 }, // out
  ],
  legs: [
    { col: 1, row: 5, cols: 2, rows: 3 }, // offset left
    { col: 3, row: 5, cols: 2, rows: 3 }, // offset right
    { col: 2, row: 5, cols: 1, rows: 3 }, // narrowed
  ],
};
