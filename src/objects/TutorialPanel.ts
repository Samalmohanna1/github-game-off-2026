import Phaser from 'phaser';
import { GAME_WIDTH, TUTORIAL } from '@/config';
import { TUTORIAL_CARDS } from '@/data/tutorial';
import { TUTORIAL_STEPS, type TutorialStep } from '@/logic/tutorial';
import type { CardPlace } from '@/logic/tutorial-layout';
import { drawDarkCard } from '@/objects/card';
import { addKeyCap } from '@/objects/keycap';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';

// The interactive tutorial's step, one at a time, each on a dark card where
// src/logic/tutorial-layout.ts places it, by what it is about: the step's
// number (1., 2., 3.) in lime, its name and any keys it uses, and its
// sentence under them. A card fades out before the next fades in (fades are
// not motion, so they play for reduced motion too). Until the last step,
// ENTER TO SKIP sits in the top-right corner, where the HUD's WALL card
// shows from step 3.
export class TutorialPanel extends Phaser.GameObjects.Container {
  private card: Phaser.GameObjects.Container | null = null;
  private readonly skip: Phaser.GameObjects.Container;
  private cardBottom = 0;

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

  show(step: TutorialStep, place: CardPlace): void {
    const hadCard = this.fadeOutCard();
    this.card = this.makeCard(step, place);
    this.add(this.card);
    this.card.setAlpha(0);
    this.scene.tweens.add({ targets: this.card, alpha: 1, duration: TUTORIAL.fadeMs, delay: hadCard ? TUTORIAL.fadeMs : 0 });
    if (step === 'score') this.fade(this.skip);
  }

  // Everything fades away: the tutorial is over, or its wall hit.
  hide(): void {
    this.fadeOutCard();
    this.fade(this.skip);
  }

  // Fades the current card out and lets it go; false if there was none.
  private fadeOutCard(): boolean {
    const old = this.card;
    if (old === null) return false;
    this.card = null;
    this.scene.tweens.killTweensOf(old);
    this.scene.tweens.add({ targets: old, alpha: 0, duration: TUTORIAL.fadeMs, onComplete: () => old.destroy() });
    return true;
  }

  private fade(target: Phaser.GameObjects.Container): void {
    this.scene.tweens.add({ targets: target, alpha: 0, duration: TUTORIAL.fadeMs });
  }

  private makeCard(step: TutorialStep, place: CardPlace): Phaser.GameObjects.Container {
    const { padX, titleY, textY, padBottom } = TUTORIAL.card;
    const { left, width } = place;
    const { name, keys, text } = TUTORIAL_CARDS[step];

    // Measured first: the card's height, and so where its top goes, is the
    // sentence's.
    const sentence = new Phaser.GameObjects.Text(this.scene, left + padX, 0, text, {
      ...textStyle('small', 'light'),
      align: 'left',
      wordWrap: { width: width - 2 * padX },
    });
    const height = textY + sentence.height + padBottom;
    const top = place.from === 'top' ? place.y : place.y - height;
    this.cardBottom = top + height;
    sentence.setY(top + textY);

    const card = new Phaser.GameObjects.Container(this.scene);
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
    const right = GAME_WIDTH - TUTORIAL.marginX;
    const words = new Phaser.GameObjects.Text(this.scene, right, TUTORIAL.skipY, 'TO SKIP', textStyle('small', 'light')).setOrigin(1, 0.5);
    const key = new Phaser.GameObjects.Container(this.scene);
    const keyWidth = addKeyCap(this.scene, key, 0, 0, 'ENTER');
    key.setPosition(right - words.width - TUTORIAL.skipGap - keyWidth, TUTORIAL.skipY);
    skip.add([key, words]);
    return skip;
  }
}
