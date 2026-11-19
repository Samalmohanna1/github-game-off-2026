import Phaser from 'phaser';
import { GAME_WIDTH, HUD, TUTORIAL } from '@/config';
import { TUTORIAL_CARDS } from '@/data/tutorial';
import { TUTORIAL_STEPS, type TutorialStep } from '@/logic/tutorial';
import { drawDarkCard } from '@/objects/card';
import { addKeyCap } from '@/objects/keycap';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';

const CARD_FADE_MS = 200;

// The interactive tutorial's step, one at a time: a dark card centered in
// the band above the wall, with the step's number (1., 2., 3.) in lime, its
// name and any keys it uses, and one sentence under them; and, until the
// last step, ENTER TO SKIP in the top-right corner, where the HUD's WALL
// card shows from step 3.
export class TutorialPanel extends Phaser.GameObjects.Container {
  private card: Phaser.GameObjects.Container | null = null;
  private readonly skip: Phaser.GameObjects.Container;
  private cardBottom: number = TUTORIAL.card.top;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    this.skip = this.makeSkip();
    this.add(this.skip);
  }

  // The current card's foot, for what goes under it.
  get bottom(): number {
    return this.cardBottom;
  }

  show(step: TutorialStep): void {
    this.card?.destroy();
    this.card = this.makeCard(step);
    this.add(this.card);
    this.skip.setVisible(step !== 'score');
    // A fade, not motion, so it plays for reduced motion too.
    this.card.setAlpha(0);
    this.scene.tweens.add({ targets: this.card, alpha: 1, duration: CARD_FADE_MS });
  }

  private makeCard(step: TutorialStep): Phaser.GameObjects.Container {
    const { top, width, padX, titleY, textY, padBottom } = TUTORIAL.card;
    const card = new Phaser.GameObjects.Container(this.scene);
    const left = (GAME_WIDTH - width) / 2;
    const { name, keys, text } = TUTORIAL_CARDS[step];

    const sentence = new Phaser.GameObjects.Text(this.scene, left + padX, top + textY, text, {
      ...textStyle('small', 'light'),
      align: 'left',
      wordWrap: { width: width - 2 * padX },
    });
    const height = textY + sentence.height + padBottom;
    this.cardBottom = top + height;
    const shape = new Phaser.GameObjects.Graphics(this.scene);
    drawDarkCard(shape, left, top, width, height);
    card.add([shape, sentence]);

    const y = top + titleY;
    const number = centerGlyphs(new Phaser.GameObjects.Text(this.scene, left + padX, y, `${TUTORIAL_STEPS.indexOf(step) + 1}.`, textStyle('subheading', 'good')));
    number.setOrigin(0, number.originY);
    const title = centerGlyphs(new Phaser.GameObjects.Text(this.scene, number.x + number.width + TUTORIAL.numberGap, y, name, textStyle('subheading', 'light')));
    title.setOrigin(0, title.originY);
    card.add([number, title]);
    let keyX = title.x + title.width + TUTORIAL.keyGap;
    for (const key of keys) keyX += addKeyCap(this.scene, card, keyX, y, key) + TUTORIAL.keyGap;
    return card;
  }

  // ENTER TO SKIP: the key cap, then the words, right-aligned.
  private makeSkip(): Phaser.GameObjects.Container {
    const skip = new Phaser.GameObjects.Container(this.scene);
    const right = GAME_WIDTH - HUD.marginX;
    const words = new Phaser.GameObjects.Text(this.scene, right, TUTORIAL.skipY, 'TO SKIP', textStyle('small', 'light')).setOrigin(1, 0.5);
    const key = new Phaser.GameObjects.Container(this.scene);
    const keyWidth = addKeyCap(this.scene, key, 0, 0, 'ENTER');
    key.setPosition(right - words.width - TUTORIAL.skipGap - keyWidth, TUTORIAL.skipY);
    skip.add([key, words]);
    return skip;
  }
}
