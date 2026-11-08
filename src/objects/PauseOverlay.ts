import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PAUSE_DIM_ALPHA, PAUSE_PANEL, SCREEN_LAYOUT } from '@/config';
import { drawTornCard } from '@/objects/paper';
import { textStyle } from '@/scenes/text-styles';
import { addPulsingPrompt } from '@/scenes/ui';

// Text sits on an opaque paper card (M10) so its contrast never depends on
// what the veil is covering.
export class PauseOverlay extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const veil = new Phaser.GameObjects.Rectangle(scene, 0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.stage, PAUSE_DIM_ALPHA);
    veil.setOrigin(0, 0);
    const panel = new Phaser.GameObjects.Graphics(scene).setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    drawTornCard(panel, PAUSE_PANEL.width, PAUSE_PANEL.height, Math.random);
    const heading = new Phaser.GameObjects.Text(
      scene,
      GAME_WIDTH / 2,
      GAME_HEIGHT * SCREEN_LAYOUT.pauseHeadingY,
      'Paused',
      textStyle('body', 'ink', true),
    );
    heading.setOrigin(0.5);
    const prompt = addPulsingPrompt(scene, GAME_HEIGHT * SCREEN_LAYOUT.pausePromptY, 'Click to resume');

    this.add([veil, panel, heading, prompt]);
    this.setVisible(false);
  }
}
