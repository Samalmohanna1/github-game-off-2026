import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCREEN_LAYOUT } from '@/config';
import { SceneKeys } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';
import { addPulsingPrompt } from '@/scenes/ui';

// Starting needs a click, not a key: inside the itch.io iframe the page has
// no keyboard focus until the player clicks into it (PLAN.md §2).
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, GAME_HEIGHT * SCREEN_LAYOUT.titleY, 'SHAPE SHIFT', textStyle('title', 'ink', true)).setOrigin(0.5);
    this.add
      .text(cx, GAME_HEIGHT * SCREEN_LAYOUT.subtitleY, '← → to line up · hold letters · Shift for CAPS', textStyle('small', 'muted'))
      .setOrigin(0.5);
    addPulsingPrompt(this, GAME_HEIGHT * SCREEN_LAYOUT.promptY, 'Click to play');

    this.input.once('pointerdown', () => {
      window.focus();
      this.scene.start(SceneKeys.Play);
    });
  }
}
