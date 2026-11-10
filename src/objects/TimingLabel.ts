import Phaser from 'phaser';
import { GAME_WIDTH, LABEL_EDGE_MARGIN, LABEL_HOLD_MS, LABEL_POP_FROM, LABEL_POP_MS, LABEL_Y, TEXT_COLORS } from '@/config';
import type { Grade, WallScore } from '@/logic/scoring';
import { outlinedStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

const GRADE_TEXT: Record<Grade, string> = { perfect: 'PERFECT', great: 'GREAT', closeCall: 'CLOSE CALL' };
const GRADE_COLOR: Record<Grade, keyof typeof TEXT_COLORS> = { perfect: 'good', great: 'light', closeCall: 'alert' };

// PLAN.md §6: the timing grade pops up big over the figure as the wall rushes
// past. Bright letters in a thick dark outline (M10) read over the wall, the
// figure or the stage. It hides at once rather than fading, so it never drops
// below AA.
export class TimingLabel extends Phaser.GameObjects.Container {
  private readonly gradeText: Phaser.GameObjects.Text;
  private readonly pointsText: Phaser.GameObjects.Text;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.gradeText = new Phaser.GameObjects.Text(scene, 0, 0, '', outlinedStyle('heading', 'light')).setOrigin(0.5);
    this.pointsText = new Phaser.GameObjects.Text(scene, 0, 0, '', outlinedStyle('body', 'light', true)).setOrigin(0.5);
    this.add([this.gradeText, this.pointsText]);
    this.setVisible(false);
  }

  show(score: WallScore, x: number): void {
    this.gradeText.setText(GRADE_TEXT[score.grade]).setColor(TEXT_COLORS[GRADE_COLOR[score.grade]]);
    this.pointsText.setText(score.multiplier > 1 ? `+${score.points}  ×${score.multiplier}` : `+${score.points}`);

    // The grade above the points, centered together.
    const textHeight = this.gradeText.height + this.pointsText.height;
    this.gradeText.setY(-textHeight / 2 + this.gradeText.height / 2);
    this.pointsText.setY(textHeight / 2 - this.pointsText.height / 2);

    const halfWidth = Math.max(this.gradeText.width, this.pointsText.width) / 2 + LABEL_EDGE_MARGIN;
    this.setPosition(Phaser.Math.Clamp(x, halfWidth, GAME_WIDTH - halfWidth), LABEL_Y);
    this.setVisible(true).setScale(1);
    if (!prefersReducedMotion()) {
      this.setScale(LABEL_POP_FROM);
      this.scene.tweens.add({ targets: this, scale: 1, duration: LABEL_POP_MS, ease: 'Back.easeOut' });
    }

    this.hideTimer?.remove();
    this.hideTimer = this.scene.time.delayedCall(LABEL_HOLD_MS, () => this.setVisible(false));
  }
}
