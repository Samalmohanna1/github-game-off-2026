import { describe, expect, it } from 'vitest';
import {
  coverFit,
  cropOf,
  frameEdges,
  holeEdges,
  holeRects,
  solidRects,
  type Rect,
  type WallLayout,
} from '@/logic/wall-shape';

// A small wall: 100 wide, 60 tall, with a 3 × 3 grid of 10 px cells whose
// left edge is at x 40 and whose rows run from y 30 down to the floor at 60.
const LAYOUT: WallLayout = { left: 0, right: 100, top: 0, floor: 60, gridLeft: 40, gridTop: 30, cell: 10 };

// An upside-down T: a one-cell stem on a three-cell base that meets the floor.
const T = [
  [false, true, false],
  [false, true, false],
  [true, true, true],
];

const area = (rects: readonly Rect[]) => rects.reduce((sum, r) => sum + r.width * r.height, 0);
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe('solid and hole rects', () => {
  const solid = solidRects(T, LAYOUT);
  const hole = holeRects(T, LAYOUT);

  it('tile the whole wall between them, with no overlaps', () => {
    expect(area(solid) + area(hole)).toBe(100 * 60);
    const all = [...solid, ...hole];
    all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)));
  });

  it('cut the hole exactly where the grid says', () => {
    expect(area(hole)).toBe(5 * 100);
    expect(hole).toContainEqual({ x: 40, y: 50, width: 30, height: 10 });
  });

  it('stack rows with the same spans into one rect', () => {
    // The stem's two rows share their spans, so each side is one rect.
    expect(hole).toContainEqual({ x: 50, y: 30, width: 10, height: 20 });
    expect(solid).toContainEqual({ x: 0, y: 30, width: 50, height: 20 });
  });

  it('leave a wall with no hole whole', () => {
    const none = [[false, false, false]];
    expect(holeRects(none, LAYOUT)).toEqual([]);
    expect(area(solidRects(none, LAYOUT))).toBe(100 * 40);
  });
});

describe('holeEdges', () => {
  const edges = holeEdges(T, LAYOUT);

  it('outlines the hole on every side but the floor', () => {
    // The T's outline is 12 cell sides long; the 3 along the floor are open.
    expect(edges).toHaveLength(9);
    expect(edges.some((s) => s.y1 === LAYOUT.floor && s.y2 === LAYOUT.floor)).toBe(false);
  });

  it('runs every edge along the grid, one cell long', () => {
    for (const s of edges) expect(Math.abs(s.x2 - s.x1) + Math.abs(s.y2 - s.y1)).toBe(LAYOUT.cell);
  });

  it('outlines a hole at the grid edge against the wall beside it', () => {
    const atEdge = holeEdges([[true, false, false]], { ...LAYOUT, gridTop: 50 });
    expect(atEdge).toContainEqual({ x1: 40, y1: 50, x2: 40, y2: 60 });
  });
});

describe('frameEdges', () => {
  it('frames the sides and top, leaving the foot on the runway', () => {
    const edges = frameEdges(LAYOUT);
    expect(edges).toHaveLength(3);
    expect(edges.some((s) => s.y1 === LAYOUT.floor && s.y2 === LAYOUT.floor)).toBe(false);
  });
});

describe('coverFit and cropOf', () => {
  const box = { x: -50, y: -20, width: 100, height: 40 };

  it('covers the box with no gaps, centered', () => {
    for (const [w, h] of [
      [200, 200],
      [400, 100],
      [50, 10],
    ] as const) {
      const fit = coverFit(w, h, box);
      expect(fit.x).toBeLessThanOrEqual(box.x);
      expect(fit.y).toBeLessThanOrEqual(box.y);
      expect(fit.x + w * fit.scale).toBeGreaterThanOrEqual(box.x + box.width - 1e-9);
      expect(fit.y + h * fit.scale).toBeGreaterThanOrEqual(box.y + box.height - 1e-9);
      expect(fit.x + (w * fit.scale) / 2).toBeCloseTo(0);
      expect(fit.y + (h * fit.scale) / 2).toBeCloseTo(0);
    }
  });

  it('crops each piece from the image where it lands', () => {
    const fit = coverFit(200, 200, box);
    // Scaled to 100 wide, so the box's top-left is 30 px into the image's height.
    expect(cropOf(box, fit)).toEqual({ x: 0, y: 60, width: 200, height: 80 });
  });

  it('keeps neighboring pieces edge to edge in the image', () => {
    const fit = coverFit(300, 120, box);
    const a = cropOf({ x: -50, y: -20, width: 37, height: 40 }, fit);
    const b = cropOf({ x: -13, y: -20, width: 63, height: 40 }, fit);
    expect(a.x + a.width).toBeCloseTo(b.x, 9);
  });
});
