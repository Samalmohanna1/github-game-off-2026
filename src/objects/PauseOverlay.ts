import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PAUSE_DIM_ALPHA, SCREEN_LAYOUT } from '@/config';
import { outlinedStyle } from '@/scenes/text-styles';
import { addPulsingPrompt } from '@/scenes/ui';

// A stage-colored veil over the paused game, with outlined text (M10) so its
// contrast never depends on what the veil is covering.
export class PauseOverlay extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const veil = new Phaser.GameObjects.Rectangle(scene, 0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.stage, PAUSE_DIM_ALPHA);
    veil.setOrigin(0, 0);
    const heading = new Phaser.GameObjects.Text(
      scene,
      GAME_WIDTH / 2,
      GAME_HEIGHT * SCREEN_LAYOUT.pauseHeadingY,
      'PAUSED',
      outlinedStyle('heading', 'light'),
    );
    heading.setOrigin(0.5);
    const prompt = addPulsingPrompt(
      scene,
      GAME_HEIGHT * SCREEN_LAYOUT.pausePromptY,
      'Click to resume',
      outlinedStyle('body', 'good', true),
    );

    this.add([veil, heading, prompt]);
    this.setVisible(false);
  }
}
