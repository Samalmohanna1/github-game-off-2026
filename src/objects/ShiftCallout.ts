import Phaser from 'phaser';
import {
  COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  LABEL_POP_FROM,
  LABEL_POP_MS,
  LABEL_STROKE_WIDTH,
  SCREEN_LAYOUT,
  SHIFT_CALLOUT_ARROW,
} from '@/config';
import { textStyle, toCss } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// A Shift Wall's "SHIFT" callout (PLAN.md §5) with an arrow on the side the
// hole is going. Styled like the timing label: a thick white stroke so it reads
// over anything. The scene shows it while the wall holds, then hides it at
// once, so it never fades below its contrast.
export class ShiftCallout extends Phaser.GameObjects.Container {
  private readonly text: Phaser.GameObjects.Text;
  private readonly arrow: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT * SCREEN_LAYOUT.shiftCalloutY);
    scene.add.existing(this);
    this.text = new Phaser.GameObjects.Text(scene, 0, 0, 'SHIFT', {
      ...textStyle('heading', 'warning', true),
      stroke: toCss(COLORS.labelStroke),
      strokeThickness: LABEL_STROKE_WIDTH,
    }).setOrigin(0.5);
    this.arrow = new Phaser.GameObjects.Graphics(scene);
    this.add([this.text, this.arrow]);
    this.setVisible(false);
  }

  show(dir: -1 | 1): void {
    this.drawArrow(dir);
    this.setVisible(true).setScale(1);
    if (prefersReducedMotion()) return;
    this.setScale(LABEL_POP_FROM);
    this.scene.tweens.add({ targets: this, scale: 1, duration: LABEL_POP_MS, ease: 'Back.easeOut' });
  }

  // Stroked first and filled on top, so the white edge sits outside the shape
  // like the text's stroke.
  private drawArrow(dir: -1 | 1): void {
    const { gap, length, shaftThickness, headLength, headWidth } = SHIFT_CALLOUT_ARROW;
    const base = dir * (this.text.width / 2 + gap);
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
    this.arrow.clear();
    this.arrow.lineStyle(LABEL_STROKE_WIDTH, COLORS.labelStroke);
    this.arrow.strokePoints(points, true);
    this.arrow.fillStyle(COLORS.wallWarning);
    this.arrow.fillPoints(points, true);
  }
}
