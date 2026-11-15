import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, HOW_TO } from '@/config';
import { badgeLean, drawBadge } from '@/objects/badge';
import { drawDarkCard, makeHeadingCard } from '@/objects/card';
import { GridVoid } from '@/objects/GridVoid';
import { addKeyCap } from '@/objects/keycap';
import { buttonYBelow, PromptButton } from '@/objects/PromptButton';
import { SceneKeys } from '@/scenes/scene-keys';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';
import { onWindowKeys } from '@/scenes/ui';

interface Step {
  readonly name: string;
  readonly keys?: readonly string[];
  readonly badge?: string;
  readonly text: string;
}

const STEPS: readonly Step[] = [
  { name: 'LINE UP', keys: ['SPACE'], text: 'Press Space to line up with the hole in the wall.' },
  { name: 'HOLD ON', keys: ['a', 's', 'd'], text: 'Press and hold each letter that appears. Case matters, so use Shift for capitals.' },
  { name: 'FIT THROUGH', badge: 'PERFECT', text: 'The faster you clear a wall, the higher you score.' },
];

// How to play (M11 review), between the title and the first wall: the game
// in three numbered steps, each on a dark card with the keys it uses, then
// Start. Any key or a click starts the run; the page already has keyboard
// focus from the title's click.
export class HowToScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super(SceneKeys.HowTo);
  }

  create(): void {
    this.started = false;
    this.cameras.main.setBackgroundColor(COLORS.void);
    new GridVoid(this);
    this.add.existing(makeHeadingCard(this, GAME_WIDTH / 2, HOW_TO.headingY, 'HOW TO PLAY'));
    const { marginX, gap, top, height } = HOW_TO.cards;
    const width = (GAME_WIDTH - 2 * marginX - (STEPS.length - 1) * gap) / STEPS.length;
    STEPS.forEach((step, i) => this.addStep(step, i, marginX + i * (width + gap), width));
    new PromptButton(this, GAME_WIDTH / 2, buttonYBelow(top + height), 'START').addHint('PRESS ANY KEY OR CLICK');

    this.time.delayedCall(HOW_TO.inputDelayMs, () => {
      this.input.once('pointerdown', () => this.start());
      onWindowKeys(this, {
        down: (event) => {
          if (!event.repeat) this.start();
        },
        up: () => {},
        blur: () => {},
      });
    });
  }

  // A dark card: the step's number in lime and its name, its keys (or the
  // badge it earns), and its sentence, wrapped to the card.
  private addStep(step: Step, index: number, x: number, width: number): void {
    const c = HOW_TO.cards;
    const card = this.add.container(0, 0);
    const shape = this.make.graphics({}, false);
    drawDarkCard(shape, x, c.top, width, c.height);
    card.add(shape);

    const left = x + c.padX;
    const titleY = c.top + c.titleY;
    const number = centerGlyphs(this.make.text({ x: left, y: titleY, text: `0${index + 1}`, style: textStyle('subheading', 'good') }, false));
    number.setOrigin(0, number.originY);
    const name = centerGlyphs(this.make.text({ x: number.x + number.width + HOW_TO.numberGap, y: titleY, text: step.name, style: textStyle('subheading', 'light') }, false));
    name.setOrigin(0, name.originY);
    card.add([number, name]);

    const keysY = c.top + c.keysY;
    let keyX = left;
    for (const key of step.keys ?? []) keyX += addKeyCap(this, card, keyX, keysY, key) + HOW_TO.keyGap;
    if (step.badge !== undefined) this.addBadge(card, left, keysY, step.badge);

    const text = this.make.text(
      { x: left, y: c.top + c.textY, text: step.text, style: { ...textStyle('small', 'light'), align: 'left', wordWrap: { width: width - 2 * c.padX } } },
      false,
    );
    card.add(text);
  }

  // A small lime badge, like the timing label's, its left edge at x.
  private addBadge(parent: Phaser.GameObjects.Container, x: number, y: number, label: string): void {
    const { height, padX } = HOW_TO.badge;
    const text = centerGlyphs(this.make.text({ x: 0, y, text: label, style: textStyle('subheading', 'ink') }, false).setOrigin(0.5));
    const width = text.width + 2 * padX + badgeLean(height);
    const g = this.make.graphics({}, false);
    drawBadge(g, { x: x + width / 2, y, width, height, fill: COLORS.gradePerfect });
    text.setX(x + width / 2);
    parent.add([g, text]);
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    window.focus();
    this.scene.start(SceneKeys.Play);
  }
}
