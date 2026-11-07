import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCREEN_LAYOUT } from '@/config';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';
import { addPulsingPrompt, onWindowKeyDown } from '@/scenes/ui';

export class PlayScene extends Phaser.Scene {
  private ended = false;

  constructor() {
    super(SceneKeys.Play);
  }

  create(): void {
    this.ended = false;
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, GAME_HEIGHT * SCREEN_LAYOUT.playPlaceholderY, 'PLAY', textStyle('heading', 'ink', true)).setOrigin(0.5);
    addPulsingPrompt(this, GAME_HEIGHT * SCREEN_LAYOUT.playHintY, 'Placeholder: click or press any key to end the run');

    this.input.once('pointerdown', () => this.endRun());
    onWindowKeyDown(this, () => this.endRun());
  }

  private endRun(): void {
    if (this.ended) return;
    this.ended = true;
    const result: RunResult = { wallsCleared: 0, score: 0, best: 0, endedOnWall: 1 };
    this.scene.start(SceneKeys.GameOver, result);
  }
}
