import Phaser from 'phaser';
import { CELL_SIZE, COLORS, FIGURE_FLOOR_Y, FIGURE_GRID, WALL_EDGE_WIDTH, WALL_HEIGHT } from '@/config';
import { FLOOR_HALF_WIDTH, VANISHING_POINT } from '@/logic/perspective';

// Drawn once at full size, in coordinates relative to the vanishing point, so
// setScale(s) places it at depth s exactly as project() does.
export class Wall extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.setPosition(VANISHING_POINT.x, VANISHING_POINT.y);
    this.drawWithPlaceholderHole();
  }

  private drawWithPlaceholderHole(): void {
    const floor = FIGURE_FLOOR_Y - VANISHING_POINT.y;
    const top = floor - WALL_HEIGHT;
    const left = -FLOOR_HALF_WIDTH;
    const right = FLOOR_HALF_WIDTH;
    const holeHalfWidth = (FIGURE_GRID.cols * CELL_SIZE) / 2;
    const holeTop = floor - FIGURE_GRID.rows * CELL_SIZE;

    // The pieces overlap so no hairline seams show between them when scaled.
    this.fillStyle(COLORS.wall);
    this.fillRect(left, top, right - left, holeTop - top);
    this.fillRect(left, top, -holeHalfWidth - left, WALL_HEIGHT);
    this.fillRect(holeHalfWidth, top, right - holeHalfWidth, WALL_HEIGHT);

    const outline: [number, number][] = [
      [left, floor],
      [left, top],
      [right, top],
      [right, floor],
      [holeHalfWidth, floor],
      [holeHalfWidth, holeTop],
      [-holeHalfWidth, holeTop],
      [-holeHalfWidth, floor],
    ];
    this.lineStyle(WALL_EDGE_WIDTH, COLORS.wallEdge);
    this.strokePoints(
      outline.map(([x, y]) => new Phaser.Math.Vector2(x, y)),
      true,
    );
  }
}
