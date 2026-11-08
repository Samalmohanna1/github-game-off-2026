import { describe, expect, it } from 'vitest';
import { FIGURE_GRID } from '@/config';
import { ALT_POSES, BLOCK_IDS, NEUTRAL_POSE, type BlockId } from '@/data/poses';
import { cellsOf, generateWall, holeGrid, holeOutline, isOnePiece, isValidPose, poseOptions } from '@/logic/wall-gen';
import { seeded } from './seeded';

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);
const DISTANCE = [1, 2] as const;

function subsets<T>(items: readonly T[]): T[][] {
  return items.reduce<T[][]>((all, item) => [...all, ...all.map((s) => [...s, item])], [[]]);
}

describe('poses', () => {
  it('starts from a valid neutral pose', () => {
    expect(isValidPose(NEUTRAL_POSE)).toBe(true);
  });

  it('gives every set of changed blocks at least one valid pose', () => {
    for (const changed of subsets(BLOCK_IDS)) {
      expect(poseOptions(changed).length, changed.join(',')).toBeGreaterThan(0);
    }
  });

  it('only offers poses where every changed block left neutral and others stayed put', () => {
    const changed: BlockId[] = ['head', 'armL'];
    for (const pose of poseOptions(changed)) {
      for (const id of BLOCK_IDS) {
        if (changed.includes(id)) expect(ALT_POSES[id]).toContainEqual(pose[id]);
        else expect(pose[id]).toEqual(NEUTRAL_POSE[id]);
      }
    }
  });

  it('rejects overlapping blocks', () => {
    // A head shifted left sits on a raised left arm.
    expect(isValidPose({ ...NEUTRAL_POSE, head: ALT_POSES.head[0]!, armL: ALT_POSES.armL[0]! })).toBe(false);
  });

  it('tells a one-piece silhouette from one with a gap', () => {
    expect(isOnePiece(NEUTRAL_POSE)).toBe(true);
    // Legs offset right don't touch a torso turned to its left half.
    expect(isOnePiece({ ...NEUTRAL_POSE, torso: ALT_POSES.torso[0]!, legs: ALT_POSES.legs[1]! })).toBe(false);
  });
});

describe('generateWall', () => {
  it('changes one block per letter and leaves the rest neutral', () => {
    for (const seed of SEEDS) {
      const letters = ['a', 'S', 'd'];
      const wall = generateWall(3, letters, DISTANCE, seeded(seed));
      const changed = letters.map((l) => wall.blockFor[l]!);
      expect(new Set(changed).size).toBe(letters.length);
      for (const id of BLOCK_IDS) {
        if (changed.includes(id)) expect(ALT_POSES[id]).toContainEqual(wall.targets[id]);
        else expect(wall.targets[id]).toEqual(NEUTRAL_POSE[id]);
      }
    }
  });

  it('always produces a valid pose, up to five letters', () => {
    for (const seed of SEEDS) {
      const wall = generateWall(3, ['q', 'w', 'e', 'r', 't'], DISTANCE, seeded(seed));
      expect(isValidPose(wall.targets)).toBe(true);
    }
  });

  // M10: the hole is always one clean shape, never broken-up pieces.
  it('always makes a one-piece hole, for every letter count', () => {
    const letters = ['q', 'w', 'e', 'r', 't'];
    for (let count = 1; count <= letters.length; count++) {
      for (const seed of SEEDS) {
        const wall = generateWall(3, letters.slice(0, count), DISTANCE, seeded(seed));
        expect(isOnePiece(wall.targets), `${count} letters, seed ${seed}`).toBe(true);
      }
    }
  });

  it('still lets every block, the torso included, take a letter', () => {
    const moved = new Set<BlockId>();
    for (const seed of SEEDS) {
      for (const id of Object.values(generateWall(3, ['a', 'b', 'c'], DISTANCE, seeded(seed)).blockFor)) moved.add(id);
    }
    expect([...moved].sort()).toEqual([...BLOCK_IDS].sort());
  });

  it('puts the hole the requested number of lanes from the figure', () => {
    for (const seed of SEEDS) {
      const dist = Math.abs(generateWall(0, ['a'], [2, 5], seeded(seed)).holeLane - 0);
      expect(dist).toBeGreaterThanOrEqual(2);
      expect(dist).toBeLessThanOrEqual(5);
    }
  });

  it('refuses more letters than there are blocks', () => {
    expect(() => generateWall(3, ['a', 'b', 'c', 'd', 'e', 'f'], DISTANCE)).toThrow();
  });
});

describe('hole', () => {
  it('is exactly the union of every target block', () => {
    const wall = generateWall(3, ['a', 'b', 'c'], DISTANCE, seeded(7));
    const grid = holeGrid(wall.targets);
    const expected = new Set(BLOCK_IDS.flatMap((id) => cellsOf(wall.targets[id])));
    let count = 0;
    grid.forEach((row, r) =>
      row.forEach((hole, c) => {
        expect(hole).toBe(expected.has(`${c},${r}`));
        if (hole) count++;
      }),
    );
    expect(count).toBe(expected.size);
    expect(grid).toHaveLength(FIGURE_GRID.rows);
  });

  it('outlines a hole on every side except the floor', () => {
    // A single open cell in the bottom-left corner of a 2x2 grid.
    const outline = holeOutline([
      [false, false],
      [true, false],
    ]);
    expect(outline).toEqual(
      expect.arrayContaining([
        { x1: 0, y1: 1, x2: 1, y2: 1 }, // top
        { x1: 0, y1: 1, x2: 0, y2: 2 }, // left
        { x1: 1, y1: 1, x2: 1, y2: 2 }, // right
      ]),
    );
    expect(outline).toHaveLength(3);
  });

  it('draws no edge between two hole cells', () => {
    // Two side-by-side cells on the floor: two tops, the far left, the far right.
    const outline = holeOutline([[true, true]]);
    expect(outline).not.toContainEqual({ x1: 1, y1: 0, x2: 1, y2: 1 });
    expect(outline).toHaveLength(4);
  });
});
