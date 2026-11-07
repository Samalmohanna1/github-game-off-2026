import { describe, expect, it } from 'vitest';
import { FIGURE_GRID } from '@/config';
import { BLOCK_IDS, NEUTRAL_POSE, type CellRect } from '@/data/poses';

function cells(r: CellRect): string[] {
  const out: string[] = [];
  for (let c = r.col; c < r.col + r.cols; c++) {
    for (let row = r.row; row < r.row + r.rows; row++) out.push(`${c},${row}`);
  }
  return out;
}

describe('neutral pose', () => {
  const rects = BLOCK_IDS.map((id) => NEUTRAL_POSE[id]);

  it('has exactly the five blocks', () => {
    expect([...BLOCK_IDS].sort()).toEqual(['armL', 'armR', 'head', 'legs', 'torso']);
    expect(Object.keys(NEUTRAL_POSE).sort()).toEqual([...BLOCK_IDS].sort());
  });

  it('keeps every block inside the pose grid', () => {
    for (const r of rects) {
      expect(r.col).toBeGreaterThanOrEqual(0);
      expect(r.row).toBeGreaterThanOrEqual(0);
      expect(r.col + r.cols).toBeLessThanOrEqual(FIGURE_GRID.cols);
      expect(r.row + r.rows).toBeLessThanOrEqual(FIGURE_GRID.rows);
    }
  });

  it('never overlaps two blocks', () => {
    const all = rects.flatMap(cells);
    expect(new Set(all).size).toBe(all.length);
  });

  it('stands on the floor', () => {
    expect(NEUTRAL_POSE.legs.row + NEUTRAL_POSE.legs.rows).toBe(FIGURE_GRID.rows);
  });

  it('leaves the outer columns free for alt poses', () => {
    const used = rects.flatMap(cells).map((c) => Number(c.split(',')[0]));
    expect(used).not.toContain(0);
    expect(used).not.toContain(FIGURE_GRID.cols - 1);
  });
});
