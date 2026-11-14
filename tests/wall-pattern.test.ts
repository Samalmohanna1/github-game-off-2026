import { describe, expect, it } from 'vitest';
import { WALL_PATTERN } from '@/config';
import { MOTIFS, makePattern } from '@/logic/wall-pattern';
import { WALL_PANEL } from '@/logic/wall-shape';
import { seeded } from './seeded';

const { width, height } = WALL_PANEL;
const patterns = Array.from({ length: 60 }, (_, seed) => makePattern(width, height, 5, WALL_PATTERN, seeded(seed + 1)));

describe('makePattern', () => {
  it('covers the whole wall with square tiles, centered', () => {
    for (const p of patterns) {
      expect(WALL_PATTERN.rows).toContain(p.rows);
      expect(p.size * p.rows).toBeCloseTo(height);
      expect(p.left).toBeLessThanOrEqual(0);
      expect(p.left + p.cols * p.size).toBeGreaterThanOrEqual(width - 1e-9);
      expect(-p.left).toBeCloseTo(p.left + p.cols * p.size - width);
      expect(p.tiles).toHaveLength(p.cols * p.rows);
      expect(new Set(p.tiles.map((t) => `${t.col},${t.row}`)).size).toBe(p.tiles.length);
    }
  });

  it('inks every tile in a color other than its ground, from the scheme', () => {
    for (const p of patterns) {
      for (const t of p.tiles) {
        expect([0, 1]).toContain(t.ground);
        expect(t.ink).not.toBe(t.ground);
        expect(t.ink).toBeGreaterThanOrEqual(0);
        expect(t.ink).toBeLessThan(5);
      }
    }
  });

  it('gives each wall only a few motifs, and leaves some tiles bare', () => {
    let bare = 0;
    for (const p of patterns) {
      const used = new Set(p.tiles.flatMap((t) => (t.motif === null ? [] : [t.motif])));
      expect(used.size).toBeLessThanOrEqual(WALL_PATTERN.motifsPerWall);
      for (const m of used) expect(MOTIFS).toContain(m);
      bare += p.tiles.filter((t) => t.motif === null).length;
    }
    expect(bare).toBeGreaterThan(0);
  });

  it('uses the accent color sparingly', () => {
    const tiles = patterns.flatMap((p) => p.tiles);
    const accented = tiles.filter((t) => t.ink === 4).length;
    expect(accented).toBeGreaterThan(0);
    expect(accented / tiles.length).toBeLessThan(0.15);
  });

  it('draws a different pattern each time, and the same one from the same seed', () => {
    const a = makePattern(width, height, 5, WALL_PATTERN, seeded(7));
    expect(makePattern(width, height, 5, WALL_PATTERN, seeded(7))).toEqual(a);
    expect(makePattern(width, height, 5, WALL_PATTERN, seeded(8))).not.toEqual(a);
  });
});
