import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, HEADING_CARD, PAUSE } from '@/config';
import { makeHeadingCard } from '@/objects/card';
import { buttonYBelow, PromptButton } from '@/objects/PromptButton';

// The pause screen (M11): a void-colored veil over the paused game, the
// PAUSED heading, and the Click to resume button, all of them solid, so their
// contrast never depends on what the veil is covering.
export class PauseOverlay extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const veil = new Phaser.GameObjects.Rectangle(scene, 0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.veil, PAUSE.veilAlpha);
    veil.setOrigin(0, 0);
    const heading = makeHeadingCard(scene, GAME_WIDTH / 2, PAUSE.headingY, 'PAUSED');
    const buttonY = buttonYBelow(PAUSE.headingY + HEADING_CARD.height / 2);
    const button = new PromptButton(scene, GAME_WIDTH / 2, buttonY, 'CLICK TO RESUME');

    this.add([veil, heading, button]);
    this.setVisible(false);
  }
}
