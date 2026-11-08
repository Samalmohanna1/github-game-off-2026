import Phaser from 'phaser';
import { CARD, GAME_WIDTH, LABEL_EDGE_MARGIN, LABEL_HOLD_MS, LABEL_POP_FROM, LABEL_POP_MS, LABEL_Y, TEXT_COLORS } from '@/config';
import type { Grade, WallScore } from '@/logic/scoring';
import { drawTornCard } from '@/objects/paper';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

const GRADE_TEXT: Record<Grade, string> = { perfect: 'PERFECT', great: 'GREAT', closeCall: 'CLOSE CALL' };
const GRADE_COLOR: Record<Grade, keyof typeof TEXT_COLORS> = { perfect: 'accent', great: 'ink', closeCall: 'danger' };

// PLAN.md §6: the timing grade pops up big over the figure as the wall rushes
// past. M10 sets it on a torn paper card, tilted a little differently each
// time, so it reads over the wall, the figure or the stage. It hides at once
// rather than fading, so it never drops below AA.
export class TimingLabel extends Phaser.GameObjects.Container {
  private readonly card: Phaser.GameObjects.Graphics;
  private readonly gradeText: Phaser.GameObjects.Text;
  private readonly pointsText: Phaser.GameObjects.Text;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.card = new Phaser.GameObjects.Graphics(scene);
    this.gradeText = new Phaser.GameObjects.Text(scene, 0, 0, '', textStyle('heading')).setOrigin(0.5);
    this.pointsText = new Phaser.GameObjects.Text(scene, 0, 0, '', textStyle('body', 'ink', true)).setOrigin(0.5);
    this.add([this.card, this.gradeText, this.pointsText]);
    this.setVisible(false);
  }

  show(score: WallScore, x: number): void {
    this.gradeText.setText(GRADE_TEXT[score.grade]).setColor(TEXT_COLORS[GRADE_COLOR[score.grade]]);
    this.pointsText.setText(score.multiplier > 1 ? `+${score.points}  ×${score.multiplier}` : `+${score.points}`);

    // The grade above the points, both centered on a card that fits them.
    const textHeight = this.gradeText.height + this.pointsText.height;
    this.gradeText.setY(-textHeight / 2 + this.gradeText.height / 2);
    this.pointsText.setY(textHeight / 2 - this.pointsText.height / 2);
    const width = Math.max(this.gradeText.width, this.pointsText.width) + 2 * CARD.padX;
    this.card.clear();
    drawTornCard(this.card, width, textHeight + 2 * CARD.padY, Math.random);

    const halfWidth = width / 2 + LABEL_EDGE_MARGIN;
    this.setPosition(Phaser.Math.Clamp(x, halfWidth, GAME_WIDTH - halfWidth), LABEL_Y);
    this.setAngle(Phaser.Math.FloatBetween(-CARD.tiltDeg, CARD.tiltDeg));
    this.setVisible(true).setScale(1);
    if (!prefersReducedMotion()) {
      this.setScale(LABEL_POP_FROM);
      this.scene.tweens.add({ targets: this, scale: 1, duration: LABEL_POP_MS, ease: 'Back.easeOut' });
    }

    this.hideTimer?.remove();
    this.hideTimer = this.scene.time.delayedCall(LABEL_HOLD_MS, () => this.setVisible(false));
  }
}
