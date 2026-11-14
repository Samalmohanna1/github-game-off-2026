import Phaser from 'phaser';
import { COLORS, GAME_OVER, GAME_WIDTH } from '@/config';
import { RestartGate } from '@/logic/restart';
import { cardSlant, drawCard, type CardSpec } from '@/objects/card';
import { GridVoid } from '@/objects/GridVoid';
import { PromptBadge } from '@/objects/PromptBadge';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { centerGlyphs, textStyle } from '@/scenes/text-styles';
import { formatNumber, onWindowKeys } from '@/scenes/ui';

// The game-over screen (M11), after the mock's layout in the play screen's
// language: on the grid stage, GAME OVER on a card on the left and the run's
// results on a card on the right, their slashes facing across the gap, and
// the Play again button below once a restart is allowed (PLAN.md §7).
export class GameOverScene extends Phaser.Scene {
  private result!: RunResult;
  private gate!: RestartGate;
  private restarting = false;
  private prompt!: PromptBadge;
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
    centerGlyphs(this.add.text(x, card.y + GAME_OVER.captionY, caption, textStyle('hudLabel', 'ink', true)).setOrigin(0, 0.5));
    ['GAME', 'OVER'].forEach((word, i) => {
      centerGlyphs(this.add.text(x, card.y + (GAME_OVER.posterY[i] ?? 0), word, textStyle('poster', 'ink')).setOrigin(0, 0.5));
    });
  }

  // The right card, right-aligned: this run's score, a rule, and the walls
  // it cleared.
  private addScores(card: CardSpec, g: Phaser.GameObjects.Graphics): void {
    const s = GAME_OVER.score;
    const x = card.x + card.width - GAME_OVER.padX;
    const at = (dy: number) => card.y + dy;
    const label = (dy: number, text: string) =>
      centerGlyphs(this.add.text(x, at(dy), text, textStyle('hudLabel', 'ink', true)).setOrigin(1, 0.5));
    const value = (dy: number, n: number) => centerGlyphs(this.add.text(x, at(dy), formatNumber(n), textStyle('title', 'ink')).setOrigin(1, 0.5));

    label(GAME_OVER.captionY, 'SCORE');
    value(s.valueY, this.result.score);
    // From just inside the slanted edge, where it crosses the rule's row.
    const ruleFrom = card.x + (cardSlant(card.height) * s.ruleY) / card.height + GAME_OVER.padX;
    g.fillStyle(COLORS.cardRule);
    g.fillRect(ruleFrom, at(s.ruleY) - s.ruleWidth / 2, x - ruleFrom, s.ruleWidth);
    label(s.wallsCaptionY, 'WALLS CLEARED');
    value(s.wallsY, this.result.wallsCleared);
  }

  private restart(): void {
    if (this.restarting) return;
    this.restarting = true;
    this.scene.start(SceneKeys.Play);
  }
}
