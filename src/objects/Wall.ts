import Phaser from 'phaser';
import {
  CELL_SIZE,
  COLORS,
  FIGURE_FLOOR_Y,
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
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

// Drawn at full size, in coordinates relative to the vanishing point, so
// setScale(s) places it at depth s exactly as project() does. The hole is cut
// from the same pose grid the figure uses (PLAN.md §3), at the hole's lane.
// It is redrawn only when the hole changes or the wall flashes, never per frame.
export class Wall extends Phaser.GameObjects.Graphics {
  private holeLane = 0;
  private grid: HoleGrid = [];
  private flashTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.setPosition(VANISHING_POINT.x, VANISHING_POINT.y);
  }

  setHole(lane: number, grid: HoleGrid): void {
    this.holeLane = lane;
    this.grid = grid;
    this.draw(COLORS.wall);
  }

  flash(): void {
    this.draw(COLORS.wallFlash);
    this.flashTimer?.remove();
    this.flashTimer = this.scene.time.delayedCall(WALL_FLASH_MS, () => this.draw(COLORS.wall));
  }

  private draw(fill: number): void {
    const gridLeft = laneCenterX(this.holeLane) - VANISHING_POINT.x - FIGURE_WIDTH / 2;
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
  }
}
