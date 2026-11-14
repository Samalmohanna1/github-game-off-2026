import Phaser from 'phaser';
import { COLORS, PROMPT_BADGE, PROMPT_PULSE_MS, PROMPT_PULSE_SCALE } from '@/config';
import { badgeLean, drawBadge } from '@/objects/badge';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// A screen's button (M11): dark Anton on a lime badge in a closed ink edge,
// the letters centered on it, pulsing in size (never in alpha, so its
// contrast holds) unless the player prefers reduced motion. Centered on x, y.
export class PromptBadge extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
    super(scene, x, y);
    scene.add.existing(this);
    const text = centerGlyphs(new Phaser.GameObjects.Text(scene, 0, 0, label, textStyle('hud', 'ink')).setOrigin(0.5));
    const { height } = PROMPT_BADGE;
    const g = new Phaser.GameObjects.Graphics(scene);
    drawBadge(g, { x: 0, y: 0, width: text.width + 2 * PROMPT_BADGE.padX + badgeLean(height), height, fill: COLORS.promptCard });
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
