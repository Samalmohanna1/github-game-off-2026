import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TITLE } from '@/config';
import { cardSlant, drawCard } from '@/objects/card';
import { GridVoid } from '@/objects/GridVoid';
import { BUTTON_REACH, buttonYBelow, PromptButton } from '@/objects/PromptButton';
import { SceneKeys } from '@/scenes/scene-keys';
import { centerGlyphs, glyphHeight, textStyle } from '@/scenes/text-styles';

// The title (M11 review): the grid stage, the lockup after the mock (SHAPE
// stacked over SHIFT on a cream card, upright since M11 review 2), and the
// Click to play button, centered as one block. Starting needs a click, not a
// key: inside the itch.io iframe the page has no keyboard focus until the
// player clicks into it (PLAN.md §2). The click leads to the how-to screen.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.void);
    new GridVoid(this);
    const lockupBottom = this.addLockup();
    new PromptButton(this, GAME_WIDTH / 2, buttonYBelow(lockupBottom), 'CLICK TO PLAY');

    this.input.once('pointerdown', () => {
      window.focus();
      this.scene.start(SceneKeys.HowTo);
    });
  }

  // The two lines' letters lineGap apart, centered as a block on the card,
  // which slants both ways and is wide enough that its slanted sides clear
  // the lower line too. Returns the card's foot.
  private addLockup(): number {
    const { padX, padY, lineGap } = TITLE.lockup;
    const lines = ['SHAPE', 'SHIFT'].map((word) => centerGlyphs(this.make.text({ text: word, style: textStyle('lockup', 'ink') }, false).setOrigin(0.5)));
    const [top, bottom] = lines as [Phaser.GameObjects.Text, Phaser.GameObjects.Text];
    const [topHeight, bottomHeight] = [glyphHeight(top), glyphHeight(bottom)];
    const block = topHeight + lineGap + bottomHeight;
    top.setY(-block / 2 + topHeight / 2);
    bottom.setY(block / 2 - bottomHeight / 2);

    const height = block + 2 * padY;
    const width = Math.max(top.width, bottom.width) + 2 * padX + 2 * cardSlant(height);
    const card = this.make.graphics({}, false);
    drawCard(card, { x: -width / 2, y: -height / 2, width, height, slant: 'both' });
    const centerY = (GAME_HEIGHT - BUTTON_REACH) / 2;
    this.add.container(GAME_WIDTH / 2, centerY, [card, top, bottom]);
    return centerY + height / 2;
  }
}
