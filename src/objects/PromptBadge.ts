import Phaser from 'phaser';
import { COLORS, PROMPT_BADGE, PROMPT_PULSE_MS, PROMPT_PULSE_SCALE } from '@/config';
import { badgeLean, badgeReach, drawBadge, drawBadgeSlashes } from '@/objects/badge';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// A screen's call to action (M11): dark Anton on a lime badge in an ink edge,
// with two lime slashes beside it, like the PERFECT label, pulsing in size
// (never in alpha, so its contrast holds) unless the player prefers reduced
// motion. Centered on x with its slashes.
export class PromptBadge extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
    super(scene, x, y);
    scene.add.existing(this);
    const text = new Phaser.GameObjects.Text(scene, 0, PROMPT_BADGE.textNudge, label, textStyle('hud', 'ink')).setOrigin(0.5);
    const { height } = PROMPT_BADGE;
    const width = text.width + 2 * PROMPT_BADGE.padX + badgeLean(height);
    // Shifted left by half of what the slashes add on the right.
    const middle = -(badgeReach(width) - width / 2) / 2;
    const badge = { x: middle, y: 0, width, height, fill: COLORS.promptCard };
    const g = new Phaser.GameObjects.Graphics(scene);
    drawBadgeSlashes(g, badge, COLORS.promptCard);
    drawBadge(g, badge);
    text.setX(middle);
    this.add([g, text]);

    if (prefersReducedMotion()) return;
    scene.tweens.add({
      targets: this,
      scale: PROMPT_PULSE_SCALE,
      duration: PROMPT_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
