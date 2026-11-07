import Phaser from 'phaser';
import {
  CELL_SIZE,
  COLORS,
  FIGURE_FLOOR_Y,
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  SHIFT_ARROW,
  SHIFT_WALL_SLIDE_MS,
  WALL_EDGE_WIDTH,
  WALL_FLASH_MS,
  WALL_HEIGHT,
} from '@/config';
import { laneCenterX } from '@/logic/lanes';
import { FLOOR_HALF_WIDTH, VANISHING_POINT } from '@/logic/perspective';
import { holeOutline, type HoleGrid } from '@/logic/wall-gen';

const FLOOR = FIGURE_FLOOR_Y - VANISHING_POINT.y;
const TOP = FLOOR - WALL_HEIGHT;
const LEFT = -FLOOR_HALF_WIDTH;
const RIGHT = FLOOR_HALF_WIDTH;
const GRID_TOP = FLOOR - FIGURE_HEIGHT;
const ARROW_Y = (TOP + GRID_TOP) / 2;

// Drawn at full size, in coordinates relative to the vanishing point, so
// setScale(s) places it at depth s exactly as project() does. The hole is cut
// from the same pose grid the figure uses (PLAN.md §3), at the hole's lane;
// during a Shift Wall slide that lane is fractional. It is redrawn only when
// something changes, never every frame.
export class Wall extends Phaser.GameObjects.Graphics {
  private holeLane = 0;
  private grid: HoleGrid = [];
  private warningDir: -1 | 1 | null = null;
  private flashing = false;
  private flashTimer?: Phaser.Time.TimerEvent;
  private slide?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.setPosition(VANISHING_POINT.x, VANISHING_POINT.y);
  }

  setHole(lane: number, grid: HoleGrid): void {
    this.slide?.stop();
    this.holeLane = lane;
    this.grid = grid;
    this.warningDir = null;
    this.redraw();
  }

  flash(): void {
    this.flashing = true;
    this.redraw();
    this.flashTimer?.remove();
    this.flashTimer = this.scene.time.delayedCall(WALL_FLASH_MS, () => {
      this.flashing = false;
      this.redraw();
    });
  }

  // Shift Wall warning (PLAN.md §5): the wall changes color and an arrow shows
  // which way the hole is about to slide.
  warn(dir: -1 | 1): void {
    this.warningDir = dir;
    this.redraw();
  }

  slideHoleTo(lane: number): void {
    this.warningDir = null;
    this.slide?.stop();
    this.slide = this.scene.tweens.addCounter({
      from: this.holeLane,
      to: lane,
      duration: SHIFT_WALL_SLIDE_MS,
      ease: 'Quad.easeInOut',
      onUpdate: (tween) => {
        this.holeLane = tween.getValue() ?? lane;
        this.redraw();
      },
    });
  }

  private redraw(): void {
    const fill = this.flashing ? COLORS.wallFlash : this.warningDir !== null ? COLORS.wallWarning : COLORS.wall;
    const holeCenter = laneCenterX(this.holeLane) - VANISHING_POINT.x;
    const gridLeft = holeCenter - FIGURE_WIDTH / 2;
    const cellX = (col: number) => gridLeft + col * CELL_SIZE;
    const cellY = (row: number) => GRID_TOP + row * CELL_SIZE;
    // The wall's solid stretches along one row of the grid, edge to edge.
    const solidSpans = (cells: readonly boolean[]): [number, number][] => {
      const spans: [number, number][] = [];
      let start = LEFT;
      cells.forEach((hole, col) => {
        if (!hole) return;
        if (cellX(col) > start) spans.push([start, cellX(col)]);
        start = cellX(col + 1);
      });
      spans.push([start, RIGHT]);
      return spans;
    };

    this.clear();

    this.fillStyle(fill);
    this.fillRect(LEFT, TOP, RIGHT - LEFT, GRID_TOP - TOP);
    this.grid.forEach((cells, row) => {
      for (const [x1, x2] of solidSpans(cells)) this.fillRect(x1, cellY(row), x2 - x1, CELL_SIZE);
    });

    this.lineStyle(WALL_EDGE_WIDTH, COLORS.wallEdge);
    this.lineBetween(LEFT, FLOOR, LEFT, TOP);
    this.lineBetween(LEFT, TOP, RIGHT, TOP);
    this.lineBetween(RIGHT, TOP, RIGHT, FLOOR);
    for (const [x1, x2] of solidSpans(this.grid[this.grid.length - 1] ?? [])) this.lineBetween(x1, FLOOR, x2, FLOOR);
    for (const s of holeOutline(this.grid)) this.lineBetween(cellX(s.x1), cellY(s.y1), cellX(s.x2), cellY(s.y2));

    if (this.warningDir !== null) this.drawArrow(holeCenter, this.warningDir);
  }

  // Over the hole, kept inside the wall when the hole is near an edge.
  private drawArrow(holeCenter: number, dir: -1 | 1): void {
    const { length, shaftThickness, headLength, headWidth } = SHIFT_ARROW;
    const center = Phaser.Math.Clamp(holeCenter, LEFT + length / 2 + WALL_EDGE_WIDTH, RIGHT - length / 2 - WALL_EDGE_WIDTH);
    const tail = center - (dir * length) / 2;
    const tip = center + (dir * length) / 2;
    const headBase = tip - dir * headLength;

    this.fillStyle(COLORS.shiftArrow);
    this.fillRect(Math.min(tail, headBase), ARROW_Y - shaftThickness / 2, Math.abs(headBase - tail), shaftThickness);
    this.fillTriangle(headBase, ARROW_Y - headWidth / 2, headBase, ARROW_Y + headWidth / 2, tip, ARROW_Y);
  }
}
