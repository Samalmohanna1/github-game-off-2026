import { describe, expect, it } from 'vitest';
import { CELL_SIZE, FIGURE_FLOOR_Y, FIGURE_HEIGHT, FIGURE_WIDTH, LANE_COUNT } from '@/config';
import { laneCenterX } from '@/logic/lanes';
import { VANISHING_POINT } from '@/logic/perspective';
import {
  WALL_PANEL,
  coverFit,
  cropOf,
  frameEdges,
  gridLines,
  holeEdges,
  holeRects,
  solidRects,
  wallLayout,
  type Rect,
  type WallLayout,
} from '@/logic/wall-shape';

// At scale 1 the wall's space is the screen moved by the vanishing point.
describe('wallLayout', () => {
  it('stands the pose grid on the figure floor, centered on the lane, as the figure stands', () => {
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const layout = wallLayout(lane);
      expect(VANISHING_POINT.y + layout.floor).toBe(FIGURE_FLOOR_Y);
      expect(layout.floor - layout.gridTop).toBe(FIGURE_HEIGHT);
      expect(VANISHING_POINT.x + layout.gridLeft + FIGURE_WIDTH / 2).toBeCloseTo(laneCenterX(lane));
      expect(layout.cell).toBe(CELL_SIZE);
    }
  });

  it('keeps the grid inside the panel in every lane', () => {
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const layout = wallLayout(lane);
      expect(layout.gridLeft).toBeGreaterThanOrEqual(WALL_PANEL.x);
      expect(layout.gridLeft + FIGURE_WIDTH).toBeLessThanOrEqual(WALL_PANEL.x + WALL_PANEL.width);
      expect(layout.gridTop).toBeGreaterThan(WALL_PANEL.y);
    }
  });
});

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

  it('closes the silhouette along the floor when asked, for the completion trace', () => {
    const closed = holeEdges(T, LAYOUT, true);
    expect(closed).toHaveLength(12);
    expect(closed.filter((s) => s.y1 === LAYOUT.floor && s.y2 === LAYOUT.floor)).toHaveLength(3);
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

describe('gridLines', () => {
  it('lines the whole wall every cell, through the pose grid and up from the floor', () => {
    expect(gridLines(LAYOUT)).toEqual({ xs: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], ys: [60, 50, 40, 30, 20, 10, 0] });
  });

  it('runs along every edge of the hole', () => {
    const { xs, ys } = gridLines(LAYOUT);
    for (const s of holeEdges(T, LAYOUT, true)) {
      if (s.x1 === s.x2) expect(xs).toContain(s.x1);
      else expect(ys).toContain(s.y1);
    }
  });

  it('moves with the hole as it slides, staying inside the wall', () => {
    const { xs } = gridLines({ ...LAYOUT, gridLeft: 43.5 });
    expect(xs[0]).toBeCloseTo(3.5);
    expect(xs.at(-1)).toBeCloseTo(93.5);
    for (const [a, b] of xs.slice(1).map((x, i) => [xs[i]!, x] as const)) expect(b - a).toBeCloseTo(10);
  });

  it('lines the real wall on the figure cells in every lane', () => {
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const layout = wallLayout(lane);
      const { xs, ys } = gridLines(layout);
      expect(xs).toContain(layout.gridLeft);
      expect(ys).toContain(layout.gridTop);
      expect(xs.every((x) => x >= layout.left && x <= layout.right)).toBe(true);
    }
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
