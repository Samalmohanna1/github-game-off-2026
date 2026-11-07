import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCREEN_LAYOUT } from '@/config';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';
import { addPulsingPrompt, onWindowKeyDown } from '@/scenes/ui';

export class GameOverScene extends Phaser.Scene {
  private result!: RunResult;
  private restarting = false;

  constructor() {
    super(SceneKeys.GameOver);
  }

  init(data: RunResult): void {
    this.result = data;
    this.restarting = false;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const { wallsCleared, score, best, endedOnWall } = this.result;

    this.add.text(cx, GAME_HEIGHT * SCREEN_LAYOUT.gameOverHeadingY, 'GAME OVER', textStyle('heading', 'danger', true)).setOrigin(0.5);

    const lines = [
      `Walls cleared: ${wallsCleared}`,
      `Score: ${score}`,
      `Best: ${best}`,
      `Ended on wall ${endedOnWall}`,
    ];
    lines.forEach((line, i) => {
      const y = GAME_HEIGHT * (SCREEN_LAYOUT.gameOverStatsTopY + i * SCREEN_LAYOUT.gameOverStatsLineGap);
      this.add.text(cx, y, line, textStyle('body')).setOrigin(0.5);
    });

    addPulsingPrompt(this, GAME_HEIGHT * SCREEN_LAYOUT.gameOverPromptY, 'Click or press any key to play again');

    this.input.once('pointerdown', () => this.restart());
    onWindowKeyDown(this, () => this.restart());
  }

  private restart(): void {
    if (this.restarting) return;
    this.restarting = true;
    this.scene.start(SceneKeys.Play);
  }
}
