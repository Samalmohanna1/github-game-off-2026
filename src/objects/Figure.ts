import Phaser from 'phaser';
import {
  CELL_SIZE,
  COLORS,
  FIGURE_EDGE_WIDTH,
  FIGURE_FLOOR_Y,
  FIGURE_HEIGHT,
  FIGURE_SLIDE_MS,
  FIGURE_WIDTH,
} from '@/config';
import { BLOCK_IDS, NEUTRAL_POSE } from '@/data/poses';
import { laneCenterX } from '@/logic/lanes';

// Positioned at the bottom center of its pose grid, standing on the floor.
export class Figure extends Phaser.GameObjects.Container {
  private slide?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, lane: number) {
    super(scene, laneCenterX(lane), FIGURE_FLOOR_Y);
    scene.add.existing(this);

    for (const id of BLOCK_IDS) {
      const cell = NEUTRAL_POSE[id];
      const block = new Phaser.GameObjects.Rectangle(
        scene,
        cell.col * CELL_SIZE - FIGURE_WIDTH / 2,
        cell.row * CELL_SIZE - FIGURE_HEIGHT,
        cell.cols * CELL_SIZE,
        cell.rows * CELL_SIZE,
        COLORS.figure,
      );
      block.setOrigin(0, 0).setStrokeStyle(FIGURE_EDGE_WIDTH, COLORS.figureEdge);
      this.add(block);
    }
  }

  slideToLane(lane: number): void {
    this.slide?.stop();
    this.slide = this.scene.tweens.add({
      targets: this,
      x: laneCenterX(lane),
      duration: FIGURE_SLIDE_MS,
      ease: 'Quad.easeOut',
    });
  }
}
