import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCREEN_LAYOUT, WALL_TIME } from '@/config';
import { advanceT, wallScale } from '@/logic/approach';
import { Floor } from '@/objects/Floor';
import { PromptTray } from '@/objects/PromptTray';
import { Wall } from '@/objects/Wall';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';
import { onWindowKeyDown } from '@/scenes/ui';

export class PlayScene extends Phaser.Scene {
  private ended = false;
  private t = 0;
  private wall!: Wall;

  constructor() {
    super(SceneKeys.Play);
  }

  create(): void {
    this.ended = false;
    this.t = 0;

    new Floor(this);
    this.wall = new Wall(this);
    new PromptTray(this);
    this.wall.setScale(wallScale(this.t));

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * SCREEN_LAYOUT.playHintY, 'Placeholder: click or press any key to end the run', textStyle('small', 'muted'))
      .setOrigin(0.5);

    this.input.once('pointerdown', () => this.endRun());
    onWindowKeyDown(this, () => this.endRun());
  }

  update(_time: number, deltaMs: number): void {
    this.t = advanceT(this.t, deltaMs / 1000, WALL_TIME);
    // M1 loops the approach; from M4, reaching t = 1 is a fail.
    if (this.t >= 1) this.t = 0;
    this.wall.setScale(wallScale(this.t));
  }

  private endRun(): void {
    if (this.ended) return;
    this.ended = true;
    const result: RunResult = { wallsCleared: 0, score: 0, best: 0, endedOnWall: 1 };
    this.scene.start(SceneKeys.GameOver, result);
  }
}
