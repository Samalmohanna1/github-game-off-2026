import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PAUSE } from '@/config';
import { cardSlant, drawCard } from '@/objects/card';
import { PromptBadge } from '@/objects/PromptBadge';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';

// The pause screen (M11): a void-colored veil over the paused game, PAUSED on
// a card slanting both ways, and the Click to resume badge, all of them solid,
// so their contrast never depends on what the veil is covering.
export class PauseOverlay extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const veil = new Phaser.GameObjects.Rectangle(scene, 0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.veil, PAUSE.veilAlpha);
    veil.setOrigin(0, 0);
    const heading = centerGlyphs(
      new Phaser.GameObjects.Text(scene, GAME_WIDTH / 2, PAUSE.cardY, 'PAUSED', textStyle('heading', 'ink')).setOrigin(0.5),
    );
    const height = PAUSE.cardHeight;
    const width = heading.width + 2 * PAUSE.padX + 2 * cardSlant(height);
    const card = new Phaser.GameObjects.Graphics(scene);
    drawCard(card, { x: (GAME_WIDTH - width) / 2, y: PAUSE.cardY - height / 2, width, height, slant: 'both' });
    const prompt = new PromptBadge(scene, GAME_WIDTH / 2, PAUSE.promptY, 'CLICK TO RESUME');

    this.add([veil, card, heading, prompt]);
    this.setVisible(false);
  }
}
