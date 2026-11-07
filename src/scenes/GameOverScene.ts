import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCREEN_LAYOUT } from '@/config';
import { RestartGate } from '@/logic/restart';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';
import { addPulsingPrompt, onWindowKeys } from '@/scenes/ui';
import { recordBest } from '@/storage/best-score';

export class GameOverScene extends Phaser.Scene {
  private result!: RunResult;
  private gate!: RestartGate;
  private best = 0;
  private restarting = false;
  private prompt!: Phaser.GameObjects.Text;
  private releaseHint!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.GameOver);
  }

  init(data: RunResult): void {
    this.result = data;
    this.gate = new RestartGate(data.keysDown);
    this.best = recordBest(data.score);
    this.restarting = false;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const { wallsCleared, score, endedOnWall } = this.result;

    this.add.text(cx, GAME_HEIGHT * SCREEN_LAYOUT.gameOverHeadingY, 'GAME OVER', textStyle('heading', 'danger', true)).setOrigin(0.5);

    const lines = [
      `Walls cleared: ${wallsCleared}`,
      `Score: ${score}`,
      `Best: ${this.best}`,
      `Ended on wall ${endedOnWall}`,
    ];
    lines.forEach((line, i) => {
      const y = GAME_HEIGHT * (SCREEN_LAYOUT.gameOverStatsTopY + i * SCREEN_LAYOUT.gameOverStatsLineGap);
      this.add.text(cx, y, line, textStyle('body')).setOrigin(0.5);
    });

    const promptY = GAME_HEIGHT * SCREEN_LAYOUT.gameOverPromptY;
    this.prompt = addPulsingPrompt(this, promptY, 'Click or press any key to play again').setVisible(false);
    this.releaseHint = this.add
      .text(cx, promptY, 'Let go of every key to play again', textStyle('body', 'muted'))
      .setOrigin(0.5)
      .setVisible(false);

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
    this.releaseHint.setVisible(this.gate.lockoutOver && !this.gate.ready);
  }

  private restart(): void {
    if (this.restarting) return;
    this.restarting = true;
    this.scene.start(SceneKeys.Play);
  }
}
