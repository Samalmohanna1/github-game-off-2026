import { CELL_SIZE, FIGURE_FLOOR_Y, FIGURE_HEIGHT, FIGURE_WIDTH, WALL_HEIGHT } from '@/config';
import { laneCenterX } from '@/logic/lanes';
import { FLOOR_HALF_WIDTH, VANISHING_POINT } from '@/logic/perspective';
import type { HoleGrid } from '@/logic/wall-gen';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Segment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

// The wall in its own space: its outer edges, and where the hole's pose grid
// sits in it (gridLeft is fractional while a Shift Wall's hole slides).
export interface WallLayout {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly floor: number;
  readonly gridLeft: number;
  readonly gridTop: number;
  readonly cell: number;
}

// The wall at full size, relative to the vanishing point: scaled by s about
// it, it sits at depth s, exactly as project() places things. Its floor is
// the figure's, so at scale 1 its hole lines up with the figure's pose.
const FLOOR = FIGURE_FLOOR_Y - VANISHING_POINT.y;
export const WALL_PANEL: Rect = { x: -FLOOR_HALF_WIDTH, y: FLOOR - WALL_HEIGHT, width: 2 * FLOOR_HALF_WIDTH, height: WALL_HEIGHT };

// The wall with its hole's pose grid at a lane (fractional during a Shift
// Wall's slide).
export function wallLayout(holeLane: number): WallLayout {
  return {
    left: WALL_PANEL.x,
    right: WALL_PANEL.x + WALL_PANEL.width,
    top: WALL_PANEL.y,
    floor: FLOOR,
    gridLeft: laneCenterX(holeLane) - VANISHING_POINT.x - FIGURE_WIDTH / 2,
    gridTop: FLOOR - FIGURE_HEIGHT,
    cell: CELL_SIZE,
  };
}

type Span = readonly [number, number];

// One grid row's stretches of solid wall, edge to edge, or of hole.
function rowSpans(cells: readonly boolean[], layout: WallLayout, hole: boolean): Span[] {
  const cellX = (col: number) => layout.gridLeft + col * layout.cell;
  const spans: Span[] = [];
  if (hole) {
    let start: number | null = null;
    cells.forEach((isHole, col) => {
      if (isHole && start === null) start = col;
      if (!isHole && start !== null) {
        spans.push([cellX(start), cellX(col)]);
        start = null;
      }
    });
    if (start !== null) spans.push([cellX(start), cellX(cells.length)]);
    return spans;
  }
  let start = layout.left;
  cells.forEach((isHole, col) => {
    if (!isHole) return;
    if (cellX(col) > start) spans.push([start, cellX(col)]);
    start = cellX(col + 1);
  });
  if (layout.right > start) spans.push([start, layout.right]);
  return spans;
}

const sameSpans = (a: readonly Span[], b: readonly Span[]) =>
  a.length === b.length && a.every(([x1, x2], i) => x1 === b[i]?.[0] && x2 === b[i]?.[1]);

// Rows with the same spans stack into one rect each, so the wall is drawn in
// as few pieces as it can be.
function stackRows(grid: HoleGrid, layout: WallLayout, hole: boolean): Rect[] {
  const rects: Rect[] = [];
  let spans: Span[] = [];
  let fromRow = 0;
  const flush = (toRow: number) => {
    const y = layout.gridTop + fromRow * layout.cell;
    const height = (toRow - fromRow) * layout.cell;
    for (const [x1, x2] of spans) rects.push({ x: x1, y, width: x2 - x1, height });
  };
  grid.forEach((cells, row) => {
    const next = rowSpans(cells, layout, hole);
    if (row > 0 && sameSpans(next, spans)) return;
    if (row > 0) flush(row);
    spans = next;
    fromRow = row;
  });
  if (grid.length > 0) flush(grid.length);
  return rects;
}

// The wall's solid area: the band above the pose grid, then each row's solid
// stretches. With the hole's rects, it tiles the whole wall.
export function solidRects(grid: HoleGrid, layout: WallLayout): Rect[] {
  const band = { x: layout.left, y: layout.top, width: layout.right - layout.left, height: layout.gridTop - layout.top };
  return [band, ...stackRows(grid, layout, false)];
}

export function holeRects(grid: HoleGrid, layout: WallLayout): Rect[] {
  return stackRows(grid, layout, true);
}

// Every cell side between the hole and the wall, one cell long. The hole is
// open at the bottom, where it meets the floor, so the bottom row's lower
// sides have none, unless `closed` asks for the whole silhouette.
export function holeEdges(grid: HoleGrid, layout: WallLayout, closed = false): Segment[] {
  const isHole = (row: number, col: number) => grid[row]?.[col] === true;
  const lastRow = grid.length - 1;
  const segments: Segment[] = [];
  grid.forEach((cells, row) =>
    cells.forEach((hole, col) => {
      if (!hole) return;
      const x1 = layout.gridLeft + col * layout.cell;
      const y1 = layout.gridTop + row * layout.cell;
      const x2 = x1 + layout.cell;
      const y2 = y1 + layout.cell;
      if (!isHole(row - 1, col)) segments.push({ x1, y1, x2, y2: y1 });
      if ((row < lastRow || closed) && !isHole(row + 1, col)) segments.push({ x1, y1: y2, x2, y2 });
      if (!isHole(row, col - 1)) segments.push({ x1, y1, x2: x1, y2 });
      if (!isHole(row, col + 1)) segments.push({ x1: x2, y1, x2, y2 });
    }),
  );
  return segments;
}

// The wall's frame: its sides and top. Its foot stands on the runway, so it
// needs none.
export function frameEdges({ left, right, top, floor }: WallLayout): Segment[] {
  return [
    { x1: left, y1: floor, x2: left, y2: top },
    { x1: left, y1: top, x2: right, y2: top },
    { x1: right, y1: top, x2: right, y2: floor },
  ];
}

// An image scaled to cover a box, centered: x and y are its top-left corner.
export interface Fit {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export function coverFit(width: number, height: number, box: Rect): Fit {
  const scale = Math.max(box.width / width, box.height / height);
  return { scale, x: box.x + (box.width - width * scale) / 2, y: box.y + (box.height - height * scale) / 2 };
}

// The part of a fitted image, in its own pixels, that lands on rect.
export function cropOf(rect: Rect, fit: Fit): Rect {
  return {
    x: (rect.x - fit.x) / fit.scale,
    y: (rect.y - fit.y) / fit.scale,
    width: rect.width / fit.scale,
    height: rect.height / fit.scale,
  };
}
