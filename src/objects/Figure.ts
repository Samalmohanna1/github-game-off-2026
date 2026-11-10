import Phaser from 'phaser';
import {
  BLOCK_LIMP,
  BLOCK_SNAP,
  CELL_SIZE,
  COLORS,
  FAIL_TUMBLE,
  FIGURE_EDGE_WIDTH,
  FIGURE_FLOOR_Y,
  FIGURE_SEAM_WIDTH,
  FIGURE_SHADOW,
  FIGURE_SLIDE_MS,
} from '@/config';
import { BLOCK_IDS, NEUTRAL_POSE, type BlockId, type CellRect } from '@/data/poses';
import { laneCenterX } from '@/logic/lanes';
import { project } from '@/logic/perspective';
import { Tumble, blockBox, tumblePart, type TumblePart } from '@/logic/tumble';
import { prefersReducedMotion } from '@/scenes/ui';

// Positioned at the bottom center of its pose grid, standing on the floor.
// Each block is black with cream seams between its cells and a cream edge, as
// in the design mocks (M10), over a soft shadow. Each block is centered on its
// cell rect, so it squashes and tilts about its middle. The pose itself always
// lands at once (the hole fit comes from game state); the squash and the limp
// slump only play on top, and are skipped for reduced motion.
export class Figure extends Phaser.GameObjects.Container {
  private readonly blocks: Record<BlockId, Phaser.GameObjects.Graphics>;
  private readonly cells: Record<BlockId, CellRect> = { ...NEUTRAL_POSE };
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private slide?: Phaser.Tweens.Tween;
  private tumble: Tumble | null = null;
  private onLanded: () => void = () => {};

  constructor(scene: Phaser.Scene, lane: number) {
    super(scene, laneCenterX(lane), FIGURE_FLOOR_Y);
    scene.add.existing(this);

    const { width, height, alpha } = FIGURE_SHADOW;
    this.shadow = new Phaser.GameObjects.Ellipse(scene, 0, 0, width, height, COLORS.figureShadow, alpha);
    this.add(this.shadow);
    const block = () => {
      const g = new Phaser.GameObjects.Graphics(scene);
      this.add(g);
      return g;
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
  private placeBlock(id: BlockId, cell: CellRect): Phaser.GameObjects.Graphics {
    const block = this.blocks[id];
    this.scene.tweens.killTweensOf(block);
    this.cells[id] = cell;
    const { x, y } = blockBox(cell);
    drawBlock(block, cell);
    return block.setScale(1).setAngle(0).setPosition(x, y);
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

  // PLAN.md §7 (M10 review 5): the wall knocks the figure off its feet and
  // toward the camera, along the floor. It topples the way dir points with its
  // arms flailing, then its blocks come apart on the floor and bounce to a
  // stop (src/logic/tumble.ts). The arms keep still for reduced motion.
  topple(dir: -1 | 1, onLanded: () => void): void {
    this.slide?.stop();
    this.shadow.setVisible(false);
    const parts = BLOCK_IDS.map((id) => this.partAsFallStarts(id));
    const flailDeg = prefersReducedMotion() ? 0 : FAIL_TUMBLE.flailDeg;
    this.tumble = new Tumble(parts, dir, { ...FAIL_TUMBLE, flailDeg });
    this.onLanded = onLanded;
    const feet = { x: this.x, y: FIGURE_FLOOR_Y };
    this.scene.tweens.addCounter({
      from: 1,
      to: FAIL_TUMBLE.landScale,
      duration: FAIL_TUMBLE.shoveMs,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        const scale = tween.getValue() ?? FAIL_TUMBLE.landScale;
        const at = project(feet, scale);
        this.setPosition(at.x, at.y).setScale(scale);
      },
    });
  }

  // Every frame of the fall; onLanded fires the moment it hits the floor.
  updateTumble(deltaMs: number): void {
    if (this.tumble === null) return;
    if (this.tumble.advance(deltaMs / 1000)) this.onLanded();
    const poses = this.tumble.poses();
    BLOCK_IDS.forEach((id, i) => {
      const pose = poses[i];
      if (pose !== undefined) this.blocks[id].setPosition(pose.x, pose.y).setRotation(pose.angle);
    });
  }

  // A block as the fall starts, from wherever a squash or slump left it.
  private partAsFallStarts(id: BlockId): TumblePart {
    const block = this.blocks[id];
    this.scene.tweens.killTweensOf(block);
    block.setScale(1);
    return tumblePart(id, this.cells[id], { x: block.x, y: block.y, angle: block.rotation });
  }
}

// A block centered on (0, 0): black, with a seam between each of its cells and
// a cream edge all round.
function drawBlock(g: Phaser.GameObjects.Graphics, cell: CellRect): void {
  const w = cell.cols * CELL_SIZE;
  const h = cell.rows * CELL_SIZE;
  g.clear();
  g.fillStyle(COLORS.figure);
  g.fillRect(-w / 2, -h / 2, w, h);
  g.lineStyle(FIGURE_SEAM_WIDTH, COLORS.figureEdge);
  for (let c = 1; c < cell.cols; c++) g.lineBetween(-w / 2 + c * CELL_SIZE, -h / 2, -w / 2 + c * CELL_SIZE, h / 2);
  for (let r = 1; r < cell.rows; r++) g.lineBetween(-w / 2, -h / 2 + r * CELL_SIZE, w / 2, -h / 2 + r * CELL_SIZE);
  g.lineStyle(FIGURE_EDGE_WIDTH, COLORS.figureEdge);
  g.strokeRect(-w / 2, -h / 2, w, h);
}
