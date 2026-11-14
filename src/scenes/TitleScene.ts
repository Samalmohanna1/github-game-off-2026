import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, TITLE } from '@/config';
import { cardSlant, drawCard } from '@/objects/card';
import { GridVoid } from '@/objects/GridVoid';
import { PromptBadge } from '@/objects/PromptBadge';
import { SceneKeys } from '@/scenes/scene-keys';
import { centerGlyphs, glyphHeight, textStyle } from '@/scenes/text-styles';

// The title (M11 review): the grid stage, the lockup after the mock (SHAPE
// stacked over SHIFT on a cream card, tilted like the mock's paper), and the
// Click to play button. Starting needs a click, not a key: inside the itch.io
// iframe the page has no keyboard focus until the player clicks into it
// (PLAN.md §2). The click leads to the how-to screen.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.void);
    new GridVoid(this);
    this.addLockup();
    new PromptBadge(this, GAME_WIDTH / 2, TITLE.promptY, 'CLICK TO PLAY');

    this.input.once('pointerdown', () => {
      window.focus();
      this.scene.start(SceneKeys.HowTo);
    });
  }

  // The two lines' letters lineGap apart, centered as a block on the card,
  // which slants both ways and is wide enough that its slanted sides clear
  // the lower line too.
  private addLockup(): void {
    const { centerY, padX, padY, lineGap, tiltDeg } = TITLE.lockup;
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
    this.add.container(GAME_WIDTH / 2, centerY, [card, top, bottom]).setAngle(tiltDeg);
  }
}
