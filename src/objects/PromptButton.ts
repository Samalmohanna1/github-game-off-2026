import Phaser from 'phaser';
import { COLORS, PROMPT_BUTTON, PROMPT_PULSE_MS, PROMPT_PULSE_SCALE } from '@/config';
import { fillEdgedKeyCap } from '@/objects/keycap';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// How far a button reaches below what comes before it, its edge included.
export const BUTTON_REACH = PROMPT_BUTTON.gapAbove + 2 * PROMPT_BUTTON.edgeWidth + PROMPT_BUTTON.height;

// The middle of a button set below something ending at `bottom`.
export function buttonYBelow(bottom: number): number {
  return bottom + BUTTON_REACH - PROMPT_BUTTON.edgeWidth - PROMPT_BUTTON.height / 2;
}

// A screen's button (M11 review 2): dark Anton on a lime key cap shape, the
// top-left and bottom-right corners cut like the how-to's Space key, in a
// closed cream edge, the letters centered on it. The shape pulses in size
// (never in alpha, so its contrast holds) unless the player prefers reduced
// motion; the letters hold still, since a scaled text is resampled and
// blurs (M11 review 3). Centered on x, y. (M11 drew it as a lime badge in
// an ink edge.)
export class PromptButton extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
    super(scene, x, y);
    scene.add.existing(this);
    const text = centerGlyphs(new Phaser.GameObjects.Text(scene, 0, 0, label, textStyle('hud', 'ink')).setOrigin(0.5));
    const { height, padX, cut, edgeWidth } = PROMPT_BUTTON;
    const width = text.width + 2 * padX;
    const plate = new Phaser.GameObjects.Graphics(scene);
    fillEdgedKeyCap(plate, { x: -width / 2, y: -height / 2, width, height, cut, edgeWidth, edge: COLORS.buttonEdge, fill: COLORS.button });
    this.add([plate, text]);

    if (prefersReducedMotion()) return;
    scene.tweens.add({
      targets: plate,
      scale: PROMPT_PULSE_SCALE,
      duration: PROMPT_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // A hint under the button, in small cream text on the stage.
  addHint(label: string): Phaser.GameObjects.Text {
    return this.scene.add.text(this.x, this.y + PROMPT_BUTTON.hintBelow, label, textStyle('small', 'light')).setOrigin(0.5);
  }
}
