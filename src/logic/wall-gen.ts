import { FIGURE_GRID } from '@/config';
import { ALT_POSES, BLOCK_IDS, NEUTRAL_POSE, type BlockId, type CellRect } from '@/data/poses';
import { pickHoleLane } from '@/logic/lanes';
import { pick, shuffled, type Random } from '@/logic/random';

export type Pose = Readonly<Record<BlockId, CellRect>>;

export interface WallSpec {
  readonly holeLane: number;
  // Every block's target: an alt for the blocks this wall changes, neutral for
  // the rest. The hole is their union (PLAN.md §3).
  readonly targets: Pose;
  // The block each letter moves; letters are case-sensitive, as prompted.
  readonly blockFor: Readonly<Record<string, BlockId>>;
}

export type HoleGrid = readonly (readonly boolean[])[];

const cellKey = (col: number, row: number) => `${col},${row}`;

export function cellsOf(r: CellRect): string[] {
  const cells: string[] = [];
  for (let col = r.col; col < r.col + r.cols; col++) {
    for (let row = r.row; row < r.row + r.rows; row++) cells.push(cellKey(col, row));
  }
  return cells;
}

function inGrid(r: CellRect): boolean {
  return r.col >= 0 && r.row >= 0 && r.col + r.cols <= FIGURE_GRID.cols && r.row + r.rows <= FIGURE_GRID.rows;
}

function isConnected(cells: ReadonlySet<string>): boolean {
  const [start] = cells;
  if (start === undefined) return true;
  const seen = new Set([start]);
  const queue = [start];
  for (let next = queue.pop(); next !== undefined; next = queue.pop()) {
    const [col, row] = next.split(',').map(Number) as [number, number];
    for (const n of [cellKey(col + 1, row), cellKey(col - 1, row), cellKey(col, row + 1), cellKey(col, row - 1)]) {
      if (cells.has(n) && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen.size === cells.size;
}

// A pose is usable when every block is on the grid and no two blocks overlap.
export function isValidPose(pose: Pose): boolean {
  const cells = new Set<string>();
  for (const id of BLOCK_IDS) {
    if (!inGrid(pose[id])) return false;
    for (const cell of cellsOf(pose[id])) {
      if (cells.has(cell)) return false;
      cells.add(cell);
    }
  }
  return true;
}

export function isOnePiece(pose: Pose): boolean {
  return isConnected(new Set(BLOCK_IDS.flatMap((id) => cellsOf(pose[id]))));
}

// Every valid pose in which exactly the `changed` blocks take one of their alts.
export function poseOptions(changed: readonly BlockId[]): Pose[] {
  let poses: Pose[] = [NEUTRAL_POSE];
  for (const id of changed) {
    poses = poses.flatMap((pose) => ALT_POSES[id].map((alt) => ({ ...pose, [id]: alt })));
  }
  return poses.filter(isValidPose);
}

export function generateWall(
  figureLane: number,
  letters: readonly string[],
  holeDistance: readonly [number, number],
  random: Random = Math.random,
): WallSpec {
  if (letters.length > BLOCK_IDS.length) {
    throw new Error(`${letters.length} letters but only ${BLOCK_IDS.length} blocks`);
  }
  // The hole is always one clean piece (M10). A few block sets can't make one
  // (the torso turned on its own parts it from an arm), so the letters go to
  // the first set, in shuffled order, that can.
  for (const changed of subsetsInOrder(shuffled(BLOCK_IDS, random), letters.length)) {
    const targets = pick(poseOptions(changed).filter(isOnePiece), random);
    if (targets === undefined) continue;
    const blockFor: Record<string, BlockId> = {};
    letters.forEach((letter, i) => (blockFor[letter] = changed[i]!));
    return { holeLane: pickHoleLane(figureLane, holeDistance, random), targets, blockFor };
  }
  throw new Error(`No one-piece pose moves ${letters.length} blocks`);
}

// Every k-item subset, keeping the items' order and starting with the first k.
function subsetsInOrder<T>(items: readonly T[], k: number): T[][] {
  if (k === 0) return [[]];
  return items.flatMap((item, i) => subsetsInOrder(items.slice(i + 1), k - 1).map((rest) => [item, ...rest]));
}

// grid[row][col] is true where the hole is.
export function holeGrid(pose: Pose): HoleGrid {
  const grid = Array.from({ length: FIGURE_GRID.rows }, () => Array<boolean>(FIGURE_GRID.cols).fill(false));
  for (const id of BLOCK_IDS) {
    const r = pose[id];
    for (let row = r.row; row < r.row + r.rows; row++) {
      for (let col = r.col; col < r.col + r.cols; col++) grid[row]![col] = true;
    }
  }
  return grid;
}
