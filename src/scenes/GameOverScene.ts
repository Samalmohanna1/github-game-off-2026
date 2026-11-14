import Phaser from 'phaser';
import { COLORS, GAME_OVER, GAME_WIDTH } from '@/config';
import { RestartGate } from '@/logic/restart';
import { badgeLean, drawBadge } from '@/objects/badge';
import { cardSlant, drawCard, type CardSpec } from '@/objects/card';
import { GridVoid } from '@/objects/GridVoid';
import { PromptBadge } from '@/objects/PromptBadge';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';
import { formatNumber, onWindowKeys } from '@/scenes/ui';
import { loadBest, recordBest } from '@/storage/best-score';

// The game-over screen (M11), after the mock's layout in the play screen's
// language: on the grid stage, GAME OVER on a card on the left and the scores
// on a card on the right, their slashes facing across the gap, and the Play
// again badge below once a restart is allowed (PLAN.md §7).
export class GameOverScene extends Phaser.Scene {
  private result!: RunResult;
  private gate!: RestartGate;
  private best = 0;
  private newBest = false;
  private restarting = false;
  private prompt!: PromptBadge;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.GameOver);
  }

  init(data: RunResult): void {
    this.result = data;
    this.gate = new RestartGate(data.keysDown);
    this.newBest = data.score > loadBest();
    this.best = recordBest(data.score);
    this.restarting = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.void);
    new GridVoid(this);

    const { marginX, top, cardHeight, leftWidth, middleGap } = GAME_OVER;
    const rightX = marginX + leftWidth + middleGap;
    const left: CardSpec = { x: marginX, y: top, width: leftWidth, height: cardHeight, slant: 'right' };
    const right: CardSpec = { x: rightX, y: top, width: GAME_WIDTH - marginX - rightX, height: cardHeight, slant: 'left' };
    const cards = this.add.graphics();
    drawCard(cards, left);
    drawCard(cards, right);
    this.addRun(left);
    this.addScores(right, cards);

    this.prompt = new PromptBadge(this, GAME_WIDTH / 2, GAME_OVER.promptY, 'PLAY AGAIN').setVisible(false);
    this.hint = this.add.text(GAME_WIDTH / 2, GAME_OVER.hintY, '', textStyle('small', 'light')).setOrigin(0.5).setVisible(false);

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
    this.prompt.setVisible(this.gate.ready);
    this.hint.setVisible(this.gate.lockoutOver);
    this.hint.setText(this.gate.ready ? 'CLICK OR PRESS ANY KEY' : 'LET GO OF EVERY KEY TO PLAY AGAIN');
  }

  // The left card: where the run ended, over GAME OVER.
  private addRun(card: CardSpec): void {
    const x = card.x + GAME_OVER.padX;
    const caption = `ENDED ON WALL ${this.result.endedOnWall}`;
    this.add.text(x, card.y + GAME_OVER.captionY, caption, textStyle('hudLabel', 'ink', true)).setOrigin(0, 0.5);
    ['GAME', 'OVER'].forEach((word, i) => {
      this.add.text(x, card.y + (GAME_OVER.posterY[i] ?? 0), word, textStyle('poster', 'ink')).setOrigin(0, 0.5);
    });
  }

  // The right card, right-aligned: the final score, a rule, the best (with
  // NEW BEST beside it when this run set it) and the walls cleared.
  private addScores(card: CardSpec, g: Phaser.GameObjects.Graphics): void {
    const s = GAME_OVER.score;
    const x = card.x + card.width - GAME_OVER.padX;
    const at = (dy: number) => card.y + dy;
    const label = (dy: number, text: string) =>
      this.add.text(x, at(dy), text, textStyle('hudLabel', 'ink', true)).setOrigin(1, 0.5);

    label(GAME_OVER.captionY, 'FINAL SCORE');
    this.add.text(x, at(s.valueY), formatNumber(this.result.score), textStyle('title', 'ink')).setOrigin(1, 0.5);
    // From just inside the slanted edge, where it crosses the rule's row.
    const ruleFrom = card.x + (cardSlant(card.height) * s.ruleY) / card.height + GAME_OVER.padX;
    g.fillStyle(COLORS.cardRule);
    g.fillRect(ruleFrom, at(s.ruleY) - s.ruleWidth / 2, x - ruleFrom, s.ruleWidth);
    label(s.bestCaptionY, 'BEST');
    const best = this.add.text(x, at(s.bestY), formatNumber(this.best), textStyle('hud', 'ink')).setOrigin(1, 0.5);
    if (this.newBest) this.addNewBest(best.x - best.width - GAME_OVER.newBest.gap, at(s.bestY), g);
    const walls = this.result.wallsCleared;
    label(s.statsY, `${formatNumber(walls)} ${walls === 1 ? 'WALL' : 'WALLS'} CLEARED`);
  }

  // NEW BEST in lime on an ink tab, ending at `right`.
  private addNewBest(right: number, y: number, g: Phaser.GameObjects.Graphics): void {
    const { height, padX } = GAME_OVER.newBest;
    const text = this.add.text(0, y, 'NEW BEST', textStyle('small', 'good', true)).setOrigin(0.5);
    const width = text.width + 2 * padX + badgeLean(height);
    text.setX(right - width / 2);
    drawBadge(g, { x: right - width / 2, y, width, height, fill: COLORS.badgeTab });
  }

  private restart(): void {
    if (this.restarting) return;
    this.restarting = true;
    this.scene.start(SceneKeys.Play);
  }
}
