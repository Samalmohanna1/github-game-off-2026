import Phaser from 'phaser';
import {
  BADGE,
  COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  LABEL_POP_FROM,
  LABEL_POP_MS,
  SCREEN_LAYOUT,
  SHIFT_CALLOUT_ARROW,
} from '@/config';
import { drawBadge } from '@/objects/badge';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// A Shift Wall's "SHIFT" callout (PLAN.md §5) with an arrow on the side the
// hole is going. Since M10b review 4 both are dark on a yellow card in a thick
// ink edge, the popups' look, so they read over anything. The scene shows it
// while the wall holds, then hides it at once, so it never fades below its
// contrast.
export class ShiftCallout extends Phaser.GameObjects.Container {
  private readonly card: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT * SCREEN_LAYOUT.shiftCalloutY);
    scene.add.existing(this);
    this.card = new Phaser.GameObjects.Graphics(scene);
    this.text = centerGlyphs(new Phaser.GameObjects.Text(scene, 0, 0, 'SHIFT', textStyle('heading', 'ink')).setOrigin(0.5));
    this.add([this.card, this.text]);
    this.setVisible(false);
  }

  show(dir: -1 | 1): void {
    this.layOut(dir);
    this.setVisible(true).setScale(1);
    if (prefersReducedMotion()) return;
    this.setScale(LABEL_POP_FROM);
    this.scene.tweens.add({ targets: this, scale: 1, duration: LABEL_POP_MS, ease: 'Back.easeOut' });
  }

  // The card, then the text and the arrow side by side on it, centered
  // together, the arrow on the side the hole is going.
  private layOut(dir: -1 | 1): void {
    const { gap, length, shaftThickness, headLength, headWidth } = SHIFT_CALLOUT_ARROW;
    const contentWidth = this.text.width + gap + length;
    this.card.clear();
    drawBadge(this.card, {
      x: 0,
      y: 0,
      width: contentWidth + 2 * BADGE.padX + BADGE.slant,
      height: BADGE.height,
      fill: COLORS.calloutCard,
    });
    this.text.setX(-dir * (contentWidth / 2 - this.text.width / 2));
    const base = this.text.x + dir * (this.text.width / 2 + gap);
    const at = (along: number, across: number) => new Phaser.Math.Vector2(base + dir * along, across);
    const shaftEnd = length - headLength;
    this.card.fillStyle(COLORS.calloutInk);
    this.card.fillPoints(
      [
        at(0, -shaftThickness / 2),
        at(shaftEnd, -shaftThickness / 2),
        at(shaftEnd, -headWidth / 2),
        at(length, 0),
        at(shaftEnd, headWidth / 2),
        at(shaftEnd, shaftThickness / 2),
        at(0, shaftThickness / 2),
      ],
      true,
    );
  }
}
