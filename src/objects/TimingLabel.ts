import Phaser from 'phaser';
import { BADGE, COLORS, GAME_WIDTH, LABEL_EDGE_MARGIN, LABEL_HOLD_MS, LABEL_POP_FROM, LABEL_POP_MS, LABEL_Y } from '@/config';
import type { Grade, WallScore } from '@/logic/scoring';
import { badgeReach, drawBadge, drawBadgeSlashes } from '@/objects/badge';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

const GRADE_TEXT: Record<Grade, string> = { perfect: 'PERFECT', great: 'GREAT', closeCall: 'CLOSE CALL' };
const GRADE_CARD: Record<Grade, number> = {
  perfect: COLORS.gradePerfect,
  great: COLORS.gradeGreat,
  closeCall: COLORS.gradeCloseCall,
};

// PLAN.md §6: the timing grade pops up over the figure as the wall reaches it.
// Since M10b review 4 it sits on a card, so it reads over any wall: the grade
// in dark Anton on a card in the grade's color (lime PERFECT, cream GREAT,
// coral CLOSE CALL) with two slashes of it beside, and the points on a dark
// tab under it. It hides at once rather than fading, so it never drops below
// AA.
export class TimingLabel extends Phaser.GameObjects.Container {
  private readonly cards: Phaser.GameObjects.Graphics;
  private readonly gradeText: Phaser.GameObjects.Text;
  private readonly pointsText: Phaser.GameObjects.Text;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.cards = new Phaser.GameObjects.Graphics(scene);
    this.gradeText = new Phaser.GameObjects.Text(scene, 0, 0, '', textStyle('heading', 'ink')).setOrigin(0.5);
    this.pointsText = new Phaser.GameObjects.Text(scene, 0, 0, '', textStyle('body', 'light', true)).setOrigin(0.5);
    this.add([this.cards, this.gradeText, this.pointsText]);
    this.setVisible(false);
  }

  show(score: WallScore, x: number): void {
    this.gradeText.setText(GRADE_TEXT[score.grade]);
    this.pointsText.setText(score.multiplier > 1 ? `+${score.points}  ×${score.multiplier}` : `+${score.points}`);

    const card = {
      x: 0,
      y: 0,
      width: this.gradeText.width + 2 * BADGE.padX + BADGE.slant,
      height: BADGE.height,
      fill: GRADE_CARD[score.grade],
    };
    const tab = {
      x: BADGE.slant / 2,
      y: card.height / 2 + BADGE.tabHeight / 2 - BADGE.tabOverlap,
      width: this.pointsText.width + 2 * BADGE.tabPadX + BADGE.slant,
      height: BADGE.tabHeight,
      fill: COLORS.badgeTab,
    };
    this.cards.clear();
    drawBadgeSlashes(this.cards, card, GRADE_CARD[score.grade]);
    drawBadge(this.cards, tab);
    drawBadge(this.cards, card);
    this.gradeText.setPosition(0, BADGE.textNudge);
    this.pointsText.setPosition(tab.x, tab.y);

    const reach = Math.max(badgeReach(card.width), tab.x + tab.width / 2) + LABEL_EDGE_MARGIN;
    const half = card.width / 2 + LABEL_EDGE_MARGIN;
    this.setPosition(Phaser.Math.Clamp(x, half, GAME_WIDTH - reach), LABEL_Y);
    this.setVisible(true).setScale(1);
    if (!prefersReducedMotion()) {
      this.setScale(LABEL_POP_FROM);
      this.scene.tweens.add({ targets: this, scale: 1, duration: LABEL_POP_MS, ease: 'Back.easeOut' });
    }

    this.hideTimer?.remove();
    this.hideTimer = this.scene.time.delayedCall(LABEL_HOLD_MS, () => this.setVisible(false));
  }
}
