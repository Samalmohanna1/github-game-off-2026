import Phaser from 'phaser';
import {
  COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  LABEL_POP_FROM,
  LABEL_POP_MS,
  SCREEN_LAYOUT,
  SHIFT_CALLOUT_ARROW,
  TEXT_OUTLINE,
} from '@/config';
import { outlinedStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// A Shift Wall's "SHIFT" callout (PLAN.md §5) with an arrow on the side the
// hole is going. Both are yellow inside the same thick dark outline (M10), so
// they read over anything. The scene shows it while the wall holds, then
// hides it at once, so it never fades below its contrast.
export class ShiftCallout extends Phaser.GameObjects.Container {
  private readonly text: Phaser.GameObjects.Text;
  private readonly arrow: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT * SCREEN_LAYOUT.shiftCalloutY);
    scene.add.existing(this);
    this.text = new Phaser.GameObjects.Text(scene, 0, 0, 'SHIFT', outlinedStyle('heading', 'shift')).setOrigin(0.5);
    this.arrow = new Phaser.GameObjects.Graphics(scene);
    this.add([this.text, this.arrow]);
    this.setVisible(false);
  }

  show(dir: -1 | 1): void {
    this.layOut(dir);
    this.setVisible(true).setScale(1);
    if (prefersReducedMotion()) return;
    this.setScale(LABEL_POP_FROM);
    this.scene.tweens.add({ targets: this, scale: 1, duration: LABEL_POP_MS, ease: 'Back.easeOut' });
  }

  // The text and the arrow sit side by side, centered together.
  private layOut(dir: -1 | 1): void {
    const { gap, length, shaftThickness, headLength, headWidth } = SHIFT_CALLOUT_ARROW;
    const contentWidth = this.text.width + gap + length;
    this.text.setX(-dir * (contentWidth / 2 - this.text.width / 2));
    const base = this.text.x + dir * (this.text.width / 2 + gap);
    const at = (along: number, across: number) => new Phaser.Math.Vector2(base + dir * along, across);
    const shaftEnd = length - headLength;
    const points = [
      at(0, -shaftThickness / 2),
      at(shaftEnd, -shaftThickness / 2),
      at(shaftEnd, -headWidth / 2),
      at(length, 0),
      at(shaftEnd, headWidth / 2),
      at(shaftEnd, shaftThickness / 2),
      at(0, shaftThickness / 2),
    ];
    // Stroke, then fill over its inner half, as the text's outline is drawn.
    this.arrow.clear();
    this.arrow.lineStyle(TEXT_OUTLINE.heading, COLORS.textOutline);
    this.arrow.strokePoints(points, true);
    this.arrow.fillStyle(COLORS.shiftArrow);
    this.arrow.fillPoints(points, true);
  }
}
