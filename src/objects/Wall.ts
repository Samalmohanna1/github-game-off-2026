import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, FIGURE_HEIGHT, FIGURE_WIDTH, WALL_EDGE_WIDTH, WALL_HEIGHT } from '@/config';
import { laneCenterX } from '@/logic/lanes';
import { FLOOR_HALF_WIDTH, VANISHING_POINT } from '@/logic/perspective';

// Drawn at full size, in coordinates relative to the vanishing point, so
// setScale(s) places it at depth s exactly as project() does. It is redrawn
// only when the hole moves, never per frame.
export class Wall extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene, holeLane: number) {
    super(scene);
    scene.add.existing(this);
    this.setPosition(VANISHING_POINT.x, VANISHING_POINT.y);
    this.setHoleLane(holeLane);
  }

  setHoleLane(lane: number): void {
    const floor = FIGURE_FLOOR_Y - VANISHING_POINT.y;
    const top = floor - WALL_HEIGHT;
    const left = -FLOOR_HALF_WIDTH;
    const right = FLOOR_HALF_WIDTH;
    const holeCenter = laneCenterX(lane) - VANISHING_POINT.x;
    const holeLeft = holeCenter - FIGURE_WIDTH / 2;
    const holeRight = holeCenter + FIGURE_WIDTH / 2;
    const holeTop = floor - FIGURE_HEIGHT;

    this.clear();

    // The pieces overlap so no hairline seams show between them when scaled.
    this.fillStyle(COLORS.wall);
    this.fillRect(left, top, right - left, holeTop - top);
    this.fillRect(left, top, holeLeft - left, WALL_HEIGHT);
    this.fillRect(holeRight, top, right - holeRight, WALL_HEIGHT);

    const outline: [number, number][] = [
      [left, floor],
      [left, top],
      [right, top],
      [right, floor],
      [holeRight, floor],
      [holeRight, holeTop],
      [holeLeft, holeTop],
      [holeLeft, floor],
    ];
    this.lineStyle(WALL_EDGE_WIDTH, COLORS.wallEdge);
    this.strokePoints(
      outline.map(([x, y]) => new Phaser.Math.Vector2(x, y)),
      true,
    );
  }
}
