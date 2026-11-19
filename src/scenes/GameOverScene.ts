import Phaser from 'phaser';
import { Music } from '@/audio/Music';
import { AUDIO, COLORS, GAME_HEIGHT, GAME_OVER, GAME_WIDTH } from '@/config';
import { RestartGate } from '@/logic/restart';
import { BAR_SLASHES_REACH, BAR_STEP, drawBarLine } from '@/objects/bar-line';
import { drawDarkCard } from '@/objects/card';
import { GridVoid } from '@/objects/GridVoid';
import { buttonYBelow, HINT_REACH, PromptButton } from '@/objects/PromptButton';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { alignGlyphs, centerGlyphs, glyphWidth, textStyle } from '@/scenes/text-styles';
import { formatNumber, onWindowKeys, webAudio } from '@/scenes/ui';

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// The game-over screen (M11 review 4), after the user's mock, on the grid
// stage: one dark card in a lime edge, centered, with GAME OVER over a lime
// rule, then the run's score and walls cleared parted by the bar's line;
// below it the Play again button once a restart is allowed (PLAN.md §7),
// and its hint.
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

    const audio = webAudio(this);
    if (audio !== null) {
      const music = new Music(audio.ctx, audio.destination, AUDIO.gameOverMusic);
      music.start();
      this.events.once('shutdown', () => music.stop());
    }

    // The card's graphics go first, under its text, though it is sized to
    // fit that text.
    const g = this.add.graphics();
    const { cardHeight, minCardWidth, padX } = GAME_OVER;
    const rows = this.addRows();
    const width = Math.max(minCardWidth, ...rows.map((row) => glyphWidth(row) + 2 * padX));
    const card: Box = { x: (GAME_WIDTH - width) / 2, y: (GAME_HEIGHT - cardHeight - HINT_REACH) / 2, width, height: cardHeight };
    drawDarkCard(g, card.x, card.y, card.width, card.height);
    this.placeRows(rows, card, g);

    this.button = new PromptButton(this, GAME_WIDTH / 2, buttonYBelow(card.y + card.height), 'PLAY AGAIN').setVisible(false);
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

  // The card's text, top to bottom, made before the card so it can grow to
  // fit them: GAME OVER, then each result's caption over its number.
  private addRows(): Phaser.GameObjects.Text[] {
    const caption = (label: string) => this.add.text(0, 0, label, textStyle('hudLabel', 'good', true));
    const value = (n: number, size: 'title' | 'hud') => this.add.text(0, 0, formatNumber(n), textStyle(size, 'light'));
    return [
      this.add.text(0, 0, 'GAME OVER', textStyle('heading', 'light')),
      caption('SCORE'),
      value(this.result.score, 'title'),
      caption('WALLS CLEARED'),
      value(this.result.wallsCleared, 'hud'),
    ];
  }

  // Each row's letters padX in from the card's left, centered on its y; the
  // lime rule under GAME OVER, across the card; and the bar's line between
  // the score and the walls cleared.
  private placeRows(rows: readonly Phaser.GameObjects.Text[], card: Box, g: Phaser.GameObjects.Graphics): void {
    const { padX, rows: at, ruleWidth, barRun } = GAME_OVER;
    const ys = [at.headingY, at.scoreCaptionY, at.scoreY, at.wallsCaptionY, at.wallsY];
    const [left, right] = [card.x + padX, card.x + card.width - padX];
    rows.forEach((row, i) => alignGlyphs(centerGlyphs(row), 'left').setPosition(left, card.y + (ys[i] ?? 0)));

    g.fillStyle(COLORS.gameOverRule);
    g.fillRect(left, card.y + at.ruleY - ruleWidth / 2, right - left, ruleWidth);

    const from = left + BAR_SLASHES_REACH;
    const y = card.y + at.barY;
    const stepAt = from + barRun;
    drawBarLine(g, [
      { x: from, y },
      { x: stepAt, y },
      { x: stepAt + BAR_STEP.across, y: y + BAR_STEP.drop },
      { x: right, y: y + BAR_STEP.drop },
    ]);
  }

  private restart(): void {
    if (this.restarting) return;
    this.restarting = true;
    this.scene.start(SceneKeys.Play);
  }
}
