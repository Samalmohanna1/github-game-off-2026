import Phaser from 'phaser';
import { COLORS, GAME_OVER, GAME_WIDTH, LOCKUP } from '@/config';
import { RestartGate } from '@/logic/restart';
import { BAR_SLASHES_REACH, BAR_STEP, drawBarLine } from '@/objects/bar-line';
import { drawDarkCard } from '@/objects/card';
import { GridVoid } from '@/objects/GridVoid';
import { buttonYBelow, PromptButton } from '@/objects/PromptButton';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { alignGlyphs, centerGlyphs, fitLockupLine, glyphHeight, glyphWidth, textStyle } from '@/scenes/text-styles';
import { formatNumber, onWindowKeys } from '@/scenes/ui';

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// The game-over screen (M11 review 2), laid out after the user's reference
// on the grid stage: GAME over OVER in big cream letters on the left, a
// stacked lockup flush on both sides (M11 review 3), as tall as the dark
// card on its right with the run's score and walls cleared, and the Play
// again button under the card once a restart is allowed (PLAN.md §7).
export class GameOverScene extends Phaser.Scene {
  private result!: RunResult;
  private gate!: RestartGate;
  private restarting = false;
  private button!: PromptButton;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.GameOver);
  }

  init(data: RunResult): void {
    this.result = data;
    this.gate = new RestartGate(data.keysDown);
    this.restarting = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.void);
    new GridVoid(this);

    // The card's graphics go first, under its text, though it is sized to
    // fit that text.
    const g = this.add.graphics();
    const { top, middleGap, cardHeight, minCardWidth, padX } = GAME_OVER;
    const heading = ['GAME', 'OVER'].map((word) => this.add.text(0, 0, word, textStyle('poster', 'light')));
    const headingWidth = this.fitHeading(heading, cardHeight);
    const rows = this.addResults();
    const cardWidth = Math.max(minCardWidth, ...rows.map((row) => glyphWidth(row) + 2 * padX));
    const headingLeft = (GAME_WIDTH - headingWidth - middleGap - cardWidth) / 2;
    const card: Box = { x: headingLeft + headingWidth + middleGap, y: top, width: cardWidth, height: cardHeight };

    const [game, over] = heading as [Phaser.GameObjects.Text, Phaser.GameObjects.Text];
    game.setPosition(headingLeft, card.y + glyphHeight(game) / 2);
    over.setPosition(headingLeft, card.y + card.height - glyphHeight(over) / 2);
    drawDarkCard(g, card.x, card.y, card.width, card.height);
    this.placeResults(rows, card, g);

    this.button = new PromptButton(this, card.x + card.width / 2, buttonYBelow(card.y + card.height), 'PLAY AGAIN').setVisible(false);
    this.hint = this.button.addHint('').setVisible(false);

    this.input.on('pointerdown', () => {
      if (this.gate.click()) this.restart();
    });
    onWindowKeys(this, {
      down: (event) => {
        if (event.repeat) this.gate.holding(event.code);
        else if (this.gate.press(event.code)) this.restart();
      },
      up: (event) => this.gate.release(event.code),
      blur: () => this.gate.forgetKeys(),
    });
  }

  update(_time: number, deltaMs: number): void {
    this.gate.tick(deltaMs);
    this.button.setVisible(this.gate.ready);
    this.hint.setVisible(this.gate.lockoutOver);
    this.hint.setText(this.gate.ready ? 'PRESS ANY KEY OR CLICK' : 'LET GO OF EVERY KEY TO PLAY AGAIN');
  }

  // Sizes GAME over OVER as a stacked lockup exactly `height` tall: at one
  // width, each line's letters stand that width times their own height to
  // width ratio, so the width follows from the lines' ratios at the base
  // size. Returns that width.
  private fitHeading(lines: readonly Phaser.GameObjects.Text[], height: number): number {
    const ratios = lines.map((line) => glyphHeight(line) / glyphWidth(line));
    const span = (height - LOCKUP.lineGap * (lines.length - 1)) / ratios.reduce((sum, r) => sum + r, 0);
    for (const line of lines) fitLockupLine(line, span);
    return span;
  }

  // The card's captions and numbers, in GAME_OVER.rows order, made before the
  // card so it can grow to fit them.
  private addResults(): Phaser.GameObjects.Text[] {
    const caption = (label: string) => this.add.text(0, 0, label, textStyle('hudLabel', 'good', true));
    const value = (n: number, size: 'title' | 'heading') => this.add.text(0, 0, formatNumber(n), textStyle(size, 'light'));
    return [caption('SCORE'), value(this.result.score, 'title'), caption('WALLS CLEARED'), value(this.result.wallsCleared, 'heading')];
  }

  // Each row's letters padX in from the card's left, centered on its y, and
  // the bar's line between the score and the walls cleared.
  private placeResults(rows: readonly Phaser.GameObjects.Text[], card: Box, g: Phaser.GameObjects.Graphics): void {
    const { padX, rows: at, ruleRun } = GAME_OVER;
    const ys = [at.scoreCaptionY, at.scoreY, at.wallsCaptionY, at.wallsY];
    const left = card.x + padX;
    rows.forEach((row, i) => alignGlyphs(centerGlyphs(row), 'left').setPosition(left, card.y + (ys[i] ?? 0)));

    const from = left + BAR_SLASHES_REACH;
    const y = card.y + at.ruleY;
    const stepAt = from + ruleRun;
    drawBarLine(g, [
      { x: from, y },
      { x: stepAt, y },
      { x: stepAt + BAR_STEP.across, y: y + BAR_STEP.drop },
      { x: card.x + card.width - padX, y: y + BAR_STEP.drop },
    ]);
  }

  private restart(): void {
    if (this.restarting) return;
    this.restarting = true;
    this.scene.start(SceneKeys.Play);
  }
}
