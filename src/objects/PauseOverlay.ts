import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, HEADING_CARD, PAUSE } from '@/config';
import { makeHeadingCard } from '@/objects/card';
import { buttonYBelow, fitHintCard, PRESS_HINT, PromptButton } from '@/objects/PromptButton';

// The pause screen (M11): a void-colored veil over the paused game, the
// PAUSED heading, and the Resume button over its hint, on a small dark card,
// all of them solid, so their contrast never depends on what the veil is
// covering. Space or Enter resumes, as does a click (PlayScene). (The button
// read CLICK TO RESUME, with no hint, until a review asked that Space or
// Enter press every button.)
export class PauseOverlay extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const veil = new Phaser.GameObjects.Rectangle(scene, 0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.veil, PAUSE.veilAlpha);
    veil.setOrigin(0, 0);
    const heading = makeHeadingCard(scene, GAME_WIDTH / 2, PAUSE.headingY, 'PAUSED');
    const buttonY = buttonYBelow(PAUSE.headingY + HEADING_CARD.height / 2);
    const button = new PromptButton(scene, GAME_WIDTH / 2, buttonY, 'RESUME');
    const hint = button.addHint(PRESS_HINT);
    const hintCard = new Phaser.GameObjects.Graphics(scene);
    fitHintCard(hintCard, hint);

    this.add([veil, heading, button, hintCard, hint]);
    this.setVisible(false);
  }
}
