import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, FIGURE_HEIGHT, FIGURE_WIDTH, WALL_EDGE_WIDTH, WALL_FLASH_MS, WALL_HEIGHT } from '@/config';
import { laneCenterX } from '@/logic/lanes';
import { FLOOR_HALF_WIDTH, VANISHING_POINT } from '@/logic/perspective';

// Drawn at full size, in coordinates relative to the vanishing point, so
// setScale(s) places it at depth s exactly as project() does. It is redrawn
// only when the hole moves or the wall flashes, never per frame.
export class Wall extends Phaser.GameObjects.Graphics {
  private holeLane = 0;
  private flashTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.setPosition(VANISHING_POINT.x, VANISHING_POINT.y);
  }

  setHoleLane(lane: number): void {
    this.holeLane = lane;
    this.draw(COLORS.wall);
  }

  flash(): void {
    this.draw(COLORS.wallFlash);
    this.flashTimer?.remove();
    this.flashTimer = this.scene.time.delayedCall(WALL_FLASH_MS, () => this.draw(COLORS.wall));
  }

  private draw(fill: number): void {
    const floor = FIGURE_FLOOR_Y - VANISHING_POINT.y;
    const top = floor - WALL_HEIGHT;
    const left = -FLOOR_HALF_WIDTH;
    const right = FLOOR_HALF_WIDTH;
    const holeCenter = laneCenterX(this.holeLane) - VANISHING_POINT.x;
    const holeLeft = holeCenter - FIGURE_WIDTH / 2;
    const holeRight = holeCenter + FIGURE_WIDTH / 2;
    const holeTop = floor - FIGURE_HEIGHT;

    this.clear();

    // The pieces overlap so no hairline seams show between them when scaled.
    this.fillStyle(fill);
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
