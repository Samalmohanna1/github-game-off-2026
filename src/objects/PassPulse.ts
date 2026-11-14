import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, FIGURE_HEIGHT, FIGURE_WIDTH, PASS_PULSE } from '@/config';
import { laneCenterX } from '@/logic/lanes';
import { prefersReducedMotion } from '@/scenes/ui';

// As a cleared wall passes the figure (M10b): a lime frame round the figure's
// pose grid grows and fades, a geometric pulse that never touches the figure.
// It only fades for reduced motion.
export class PassPulse extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.lineStyle(PASS_PULSE.lineWidth, COLORS.passPulse);
    this.strokeRect(-FIGURE_WIDTH / 2, -FIGURE_HEIGHT / 2, FIGURE_WIDTH, FIGURE_HEIGHT);
    this.setVisible(false);
  }

  play(lane: number): void {
    this.scene.tweens.killTweensOf(this);
    this.setPosition(laneCenterX(lane), FIGURE_FLOOR_Y - FIGURE_HEIGHT / 2).setScale(1).setAlpha(1).setVisible(true);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: prefersReducedMotion() ? 1 : PASS_PULSE.grow,
      duration: PASS_PULSE.ms,
      ease: 'Quad.easeOut',
      onComplete: () => this.setVisible(false),
    });
  }
}
