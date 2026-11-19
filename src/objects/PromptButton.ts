import Phaser from 'phaser';
import { COLORS, DARK_CARD, FONT_SIZES, HINT_CARD, PROMPT_BUTTON, PROMPT_PULSE_MS, PROMPT_PULSE_SCALE } from '@/config';
import { fillEdgedKeyCap } from '@/objects/keycap';
import { drawFocusRing } from '@/objects/MenuFocus';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// How far a button reaches below what comes before it, its edge included.
export const BUTTON_REACH = PROMPT_BUTTON.gapAbove + 2 * PROMPT_BUTTON.edgeWidth + PROMPT_BUTTON.height;

// The middle of a button set below something ending at `bottom`.
export function buttonYBelow(bottom: number): number {
  return bottom + BUTTON_REACH - PROMPT_BUTTON.edgeWidth - PROMPT_BUTTON.height / 2;
}

// How far a button and the hint under it reach below what comes before
// them (the hint's small text is at most its size tall).
export const HINT_REACH = buttonYBelow(0) + PROMPT_BUTTON.hintBelow + FONT_SIZES.small / 2;

// The hint under a button that is ready: every button takes Space or Enter
// (menu-keys.ts), and a click still works. (It read PRESS ANY KEY OR CLICK
// until a review asked that only Space or Enter press a button.)
export const PRESS_HINT = 'PRESS SPACE OR ENTER';

// A screen's button (M11 review 2): dark Anton on a lime key cap shape, the
// top-left and bottom-right corners cut like the how-to's Space key, in a
// closed cream edge, the letters centered on it. The shape pulses in size
// (never in alpha, so its contrast holds) unless the player prefers reduced
// motion; the letters hold still, since a scaled text is resampled and
// blurs (M11 review 3). Centered on x, y. (M11 drew it as a lime badge in
// an ink edge.)
export class PromptButton extends Phaser.GameObjects.Container {
  private readonly ring: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
    super(scene, x, y);
    scene.add.existing(this);
    const text = centerGlyphs(new Phaser.GameObjects.Text(scene, 0, 0, label, textStyle('hud', 'ink')).setOrigin(0.5));
    const { height, padX, cut, edgeWidth } = PROMPT_BUTTON;
    const width = text.width + 2 * padX;
    const plate = new Phaser.GameObjects.Graphics(scene);
    fillEdgedKeyCap(plate, { x: -width / 2, y: -height / 2, width, height, cut, edgeWidth, edge: COLORS.buttonEdge, fill: COLORS.button });
    // The focus ring stays clear of the plate at the top of its pulse, which
    // grows it further across than down, so the ring clears the hint below.
    const pulseX = (PROMPT_PULSE_SCALE - 1) * (width / 2 + edgeWidth);
    const pulseY = (PROMPT_PULSE_SCALE - 1) * (height / 2 + edgeWidth);
    this.ring = new Phaser.GameObjects.Graphics(scene).setVisible(false);
    drawFocusRing(this.ring, width + 2 * (pulseX - pulseY), height, cut, edgeWidth + pulseY);
    this.add([this.ring, plate, text]);

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

  setFocusRing(on: boolean): void {
    this.ring.setVisible(on);
  }

  // A hint under the button, in small cream text on the stage.
  addHint(label: string): Phaser.GameObjects.Text {
    return this.scene.add.text(this.x, this.y + PROMPT_BUTTON.hintBelow, label, textStyle('small', 'light')).setOrigin(0.5);
  }
}

// A small dark card fitted to a hint's words, cut and edged like the dark
// cards, for a hint over the cream runway or the pause veil, where the cream
// words would lose their contrast (HINT_CARD). Redraw it when the words change.
export function fitHintCard(g: Phaser.GameObjects.Graphics, hint: Phaser.GameObjects.Text): void {
  const { height, padX, cut } = HINT_CARD;
  const width = hint.width + 2 * padX;
  g.clear();
  fillEdgedKeyCap(g, {
    x: hint.x - width / 2,
    y: hint.y - height / 2,
    width,
    height,
    cut,
    edgeWidth: DARK_CARD.edgeWidth,
    edge: COLORS.darkCardEdge,
    fill: COLORS.darkCard,
  });
}
