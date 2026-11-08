import Phaser from 'phaser';
import {
  CELL_SIZE,
  COLORS,
  FAIL_FALL_DISTANCE,
  FAIL_SHOVE_MS,
  FAIL_SHOVE_SCALE,
  FAIL_SPIN_DEG,
  FIGURE_EDGE_WIDTH,
  FIGURE_FLOOR_Y,
  FIGURE_HEIGHT,
  FIGURE_SLIDE_MS,
  FIGURE_WIDTH,
} from '@/config';
import { BLOCK_IDS, NEUTRAL_POSE, type BlockId, type CellRect } from '@/data/poses';
import { laneCenterX } from '@/logic/lanes';

// Positioned at the bottom center of its pose grid, standing on the floor.
// Blocks snap between poses in Week 1; squash and stretch is Week 2 polish.
export class Figure extends Phaser.GameObjects.Container {
  private readonly blocks: Record<BlockId, Phaser.GameObjects.Rectangle>;
  private slide?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, lane: number) {
    super(scene, laneCenterX(lane), FIGURE_FLOOR_Y);
    scene.add.existing(this);

    const block = () => {
      const rect = new Phaser.GameObjects.Rectangle(scene, 0, 0, CELL_SIZE, CELL_SIZE, COLORS.figure);
      rect.setOrigin(0, 0).setStrokeStyle(FIGURE_EDGE_WIDTH, COLORS.figureEdge);
      this.add(rect);
      return rect;
    };
    this.blocks = { head: block(), torso: block(), armL: block(), armR: block(), legs: block() };
    this.resetPose();
  }

  setBlockPose(id: BlockId, cell: CellRect): void {
    this.blocks[id]
      .setPosition(cell.col * CELL_SIZE - FIGURE_WIDTH / 2, cell.row * CELL_SIZE - FIGURE_HEIGHT)
      .setSize(cell.cols * CELL_SIZE, cell.rows * CELL_SIZE);
  }

  resetPose(): void {
    for (const id of BLOCK_IDS) this.setBlockPose(id, NEUTRAL_POSE[id]);
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

  jumpToLane(lane: number): void {
    this.slide?.stop();
    this.setX(laneCenterX(lane));
  }

  // PLAN.md §7: the wall shoves the figure toward the camera and it tips over
  // into the pool below the stage.
  shove(onLanded: () => void): void {
    this.slide?.stop();
    this.scene.tweens.add({
      targets: this,
      y: this.y + FAIL_FALL_DISTANCE,
      angle: FAIL_SPIN_DEG,
      scale: FAIL_SHOVE_SCALE,
      duration: FAIL_SHOVE_MS,
      ease: 'Quad.easeIn',
      onComplete: onLanded,
    });
  }
}
