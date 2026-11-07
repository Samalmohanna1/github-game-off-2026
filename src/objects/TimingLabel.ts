import Phaser from 'phaser';
import {
  COLORS,
  GAME_WIDTH,
  LABEL_EDGE_MARGIN,
  LABEL_HOLD_MS,
  LABEL_POP_FROM,
  LABEL_POP_MS,
  LABEL_STROKE_WIDTH,
  LABEL_Y,
  TEXT_COLORS,
} from '@/config';
import type { Grade, WallScore } from '@/logic/scoring';
import { textStyle, toCss } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

const GRADE_TEXT: Record<Grade, string> = { perfect: 'PERFECT', great: 'GREAT', closeCall: 'CLOSE CALL' };
const GRADE_COLOR: Record<Grade, keyof typeof TEXT_COLORS> = { perfect: 'accent', great: 'ink', closeCall: 'danger' };

// A thick white stroke gives the label its own background, so it reads over
// the wall, the figure or the stage.
const stroked = (size: 'heading' | 'body') => ({
  ...textStyle(size, 'ink', true),
  stroke: toCss(COLORS.labelStroke),
  strokeThickness: LABEL_STROKE_WIDTH,
});

// PLAN.md §6: the timing grade pops up big over the figure as the wall rushes
// past. It hides at once rather than fading, so it never drops below AA.
export class TimingLabel extends Phaser.GameObjects.Container {
  private readonly gradeText: Phaser.GameObjects.Text;
  private readonly pointsText: Phaser.GameObjects.Text;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.gradeText = new Phaser.GameObjects.Text(scene, 0, 0, '', stroked('heading')).setOrigin(0.5, 1);
    this.pointsText = new Phaser.GameObjects.Text(scene, 0, 0, '', stroked('body')).setOrigin(0.5, 0);
    this.add([this.gradeText, this.pointsText]);
    this.setVisible(false);
  }

  show(score: WallScore, x: number): void {
    this.gradeText.setText(GRADE_TEXT[score.grade]).setColor(TEXT_COLORS[GRADE_COLOR[score.grade]]);
    this.pointsText.setText(score.multiplier > 1 ? `+${score.points}  ×${score.multiplier}` : `+${score.points}`);

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
