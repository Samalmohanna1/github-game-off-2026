import Phaser from 'phaser';
import { Music } from '@/audio/Music';
import { AUDIO, COLORS, GAME_HEIGHT, GAME_OVER, GAME_WIDTH } from '@/config';
import { BAR_SLASHES_REACH, BAR_STEP, drawBarLine } from '@/objects/bar-line';
import { drawDarkCard } from '@/objects/card';
import { GatedPrompt } from '@/objects/GatedPrompt';
import { GridVoid } from '@/objects/GridVoid';
import { buttonYBelow, HINT_REACH, PRESS_HINT } from '@/objects/PromptButton';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { alignGlyphs, centerGlyphs, glyphWidth, textStyle } from '@/scenes/text-styles';
import { formatNumber, webAudio } from '@/scenes/ui';

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
// and its hint. Only Space or Enter restarts: the user asked that a click
// not, so a stray click can't throw the player straight back into a run.
export class GameOverScene extends Phaser.Scene {
  private result!: RunResult;

  constructor() {
    super(SceneKeys.GameOver);
  }

  init(data: RunResult): void {
    this.result = data;
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

    const text = { button: 'PLAY AGAIN', waiting: 'LET GO OF EVERY KEY TO PLAY AGAIN', ready: PRESS_HINT };
    new GatedPrompt(this, GAME_WIDTH / 2, buttonYBelow(card.y + card.height), text, {
      keysDown: this.result.keysDown,
      clicks: false,
      onGo: () => this.scene.start(SceneKeys.Play),
    });
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
}
