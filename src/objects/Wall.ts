import Phaser from 'phaser';
import {
  CELL_SIZE,
  COLORS,
  FIGURE_FLOOR_Y,
  GRAIN,
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  SHIFT_ARROW,
  SHIFT_WALL_SLIDE_MS,
  WALL_EDGE_WIDTH,
  WALL_FLASH_MS,
  WALL_HEIGHT,
  WALL_RATTLE,
} from '@/config';
import { laneCenterX } from '@/logic/lanes';
import { FLOOR_HALF_WIDTH, VANISHING_POINT } from '@/logic/perspective';
import type { HoleGrid } from '@/logic/wall-gen';
import { addGrain } from '@/objects/grain';

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
// something changes, never every frame. The hole is really cut out: the floor
// and the background show through it, and the figure does once the wall has
// passed it (M10 review 5). The wall's surface carries a faint paper texture
// (src/objects/grain.ts) in its own space, so it shrinks with distance.
export class Wall extends Phaser.GameObjects.Container {
  private readonly face: Phaser.GameObjects.Graphics;
  private holeLane = 0;
  private grid: HoleGrid = [];
  private warningDir: -1 | 1 | null = null;
  private flashing = false;
  private flashTimer?: Phaser.Time.TimerEvent;
  private slide?: Phaser.Tweens.Tween;
  private rattling?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    super(scene, VANISHING_POINT.x, VANISHING_POINT.y);
    scene.add.existing(this);
    this.face = new Phaser.GameObjects.Graphics(scene);
    // Sized to the drawing, centered on its origin at the vanishing point and
    // reaching the floor below it, so its texture frames the wall itself.
    const surface = new Phaser.GameObjects.Container(scene, 0, 0, [this.face]);
    surface.setSize(2 * (RIGHT + WALL_EDGE_WIDTH), 2 * (FLOOR + WALL_EDGE_WIDTH));
    this.add(surface);
    addGrain(surface, GRAIN.wall);
  }

  setHole(lane: number, grid: HoleGrid): void {
    this.slide?.stop();
    this.rattling?.stop();
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

  // Wrong key (M8): the wall shakes side to side, dying away. Only its
  // position moves, so the hole stays where the rules have it.
  rattle(): void {
    this.rattling?.stop();
    const { distance, ms, swings } = WALL_RATTLE;
    this.rattling = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: ms,
      onUpdate: (tween) => {
        const p = tween.getValue() ?? 1;
        this.setX(VANISHING_POINT.x + distance * Math.sin(p * swings * 2 * Math.PI) * (1 - p));
      },
      onComplete: () => this.setX(VANISHING_POINT.x),
      onStop: () => this.setX(VANISHING_POINT.x),
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

    const g = this.face;
    g.clear();
    g.fillStyle(fill);
    g.fillRect(LEFT, TOP, RIGHT - LEFT, GRID_TOP - TOP);
    this.grid.forEach((cells, row) => {
      for (const [x1, x2] of solidSpans(cells)) g.fillRect(x1, cellY(row), x2 - x1, CELL_SIZE);
    });
    g.lineStyle(WALL_EDGE_WIDTH, COLORS.outline);
    edge(g, LEFT, FLOOR, LEFT, TOP);
    edge(g, LEFT, TOP, RIGHT, TOP);
    edge(g, RIGHT, TOP, RIGHT, FLOOR);
    for (const [x1, x2] of solidSpans(this.grid[this.grid.length - 1] ?? [])) edge(g, x1, FLOOR, x2, FLOOR);
    if (this.warningDir !== null) this.drawArrow(holeCenter, this.warningDir);
  }

  // Over the hole, kept inside the wall when the hole is near an edge.
  private drawArrow(holeCenter: number, dir: -1 | 1): void {
    const { length, shaftThickness, headLength, headWidth } = SHIFT_ARROW;
    const center = Phaser.Math.Clamp(holeCenter, LEFT + length / 2 + WALL_EDGE_WIDTH, RIGHT - length / 2 - WALL_EDGE_WIDTH);
    const tail = center - (dir * length) / 2;
    const tip = center + (dir * length) / 2;
    const headBase = tip - dir * headLength;

    const g = this.face;
    g.fillStyle(COLORS.shiftArrow);
    g.fillRect(Math.min(tail, headBase), ARROW_Y - shaftThickness / 2, Math.abs(headBase - tail), shaftThickness);
    g.fillTriangle(headBase, ARROW_Y - headWidth / 2, headBase, ARROW_Y + headWidth / 2, tip, ARROW_Y);
  }
}

// A straight edge in the current line style, run on by half its width at both
// ends, so two edges meeting at a corner close it.
function edge(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number): void {
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length === 0) return;
  const runX = ((x2 - x1) / length) * (WALL_EDGE_WIDTH / 2);
  const runY = ((y2 - y1) / length) * (WALL_EDGE_WIDTH / 2);
  g.lineBetween(x1 - runX, y1 - runY, x2 + runX, y2 + runY);
}
