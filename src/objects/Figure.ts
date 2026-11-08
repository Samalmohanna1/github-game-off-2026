import Phaser from 'phaser';
import {
  BLOCK_LIMP,
  BLOCK_SNAP,
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
import { prefersReducedMotion } from '@/scenes/ui';

// Positioned at the bottom center of its pose grid, standing on the floor.
// Each block is centered on its cell rect, so it squashes and tilts about its
// middle. The pose itself always lands at once (the hole fit comes from game
// state); the squash and the limp slump only play on top, and are skipped for
// reduced motion.
export class Figure extends Phaser.GameObjects.Container {
  private readonly blocks: Record<BlockId, Phaser.GameObjects.Rectangle>;
  private slide?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, lane: number) {
    super(scene, laneCenterX(lane), FIGURE_FLOOR_Y);
    scene.add.existing(this);

    const block = () => {
      const rect = new Phaser.GameObjects.Rectangle(scene, 0, 0, CELL_SIZE, CELL_SIZE, COLORS.figure);
      rect.setStrokeStyle(FIGURE_EDGE_WIDTH, COLORS.figureEdge);
      this.add(rect);
      return rect;
    };
    this.blocks = { head: block(), torso: block(), armL: block(), armR: block(), legs: block() };
    this.resetPose();
  }

  // A held letter: the block lands in its pose squashed, then springs back.
  snapBlock(id: BlockId, cell: CellRect): void {
    const block = this.placeBlock(id, cell);
    if (prefersReducedMotion()) return;
    block.setScale(1 + BLOCK_SNAP.squash, 1 - BLOCK_SNAP.squash);
    this.scene.tweens.add({ targets: block, scaleX: 1, scaleY: 1, duration: BLOCK_SNAP.ms, ease: 'Back.easeOut' });
  }

  // A slip: the block goes limp, slumping from where it was back to its
  // neutral cell with a bounce, tilted away and settling upright.
  slumpBlock(id: BlockId, cell: CellRect): void {
    const from = { x: this.blocks[id].x, y: this.blocks[id].y };
    const block = this.placeBlock(id, cell);
    if (prefersReducedMotion()) return;
    const to = { x: block.x, y: block.y };
    const away = Math.sign(from.x - to.x) || 1;
    block.setPosition(from.x, from.y).setAngle(away * BLOCK_LIMP.tiltDeg);
    this.scene.tweens.add({ targets: block, x: to.x, duration: BLOCK_LIMP.ms, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: block, y: to.y, angle: 0, duration: BLOCK_LIMP.ms, ease: 'Bounce.easeOut' });
  }

  resetPose(): void {
    for (const id of BLOCK_IDS) this.placeBlock(id, NEUTRAL_POSE[id]);
  }

  // Stops any squash or slump in progress and puts the block square on its cell.
  private placeBlock(id: BlockId, cell: CellRect): Phaser.GameObjects.Rectangle {
    const block = this.blocks[id];
    this.scene.tweens.killTweensOf(block);
    const centerX = (cell.col + cell.cols / 2) * CELL_SIZE - FIGURE_WIDTH / 2;
    const centerY = (cell.row + cell.rows / 2) * CELL_SIZE - FIGURE_HEIGHT;
    return block
      .setScale(1)
      .setAngle(0)
      .setPosition(centerX, centerY)
      .setSize(cell.cols * CELL_SIZE, cell.rows * CELL_SIZE);
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
