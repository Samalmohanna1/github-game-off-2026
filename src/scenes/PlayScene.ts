import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, HOLE_DISTANCE, SCREEN_LAYOUT, WALL_TIME } from '@/config';
import { KeyboardInput } from '@/input/KeyboardInput';
import { advanceT, wallScale } from '@/logic/approach';
import { CENTER_LANE, isAligned, moveLane, pickHoleLane } from '@/logic/lanes';
import { Figure } from '@/objects/Figure';
import { Floor } from '@/objects/Floor';
import { LaneMarkers } from '@/objects/LaneMarkers';
import { PromptTray } from '@/objects/PromptTray';
import { Wall } from '@/objects/Wall';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';

export class PlayScene extends Phaser.Scene {
  private ended = false;
  private t = 0;
  private figureLane = CENTER_LANE;
  private holeLane = CENTER_LANE;
  private wall!: Wall;
  private figure!: Figure;
  private laneMarkers!: LaneMarkers;

  constructor() {
    super(SceneKeys.Play);
  }

  create(): void {
    this.ended = false;
    this.t = 0;
    this.figureLane = CENTER_LANE;
    this.holeLane = pickHoleLane(this.figureLane, HOLE_DISTANCE);

    new Floor(this);
    this.laneMarkers = new LaneMarkers(this);
    this.wall = new Wall(this, this.holeLane);
    this.figure = new Figure(this, this.figureLane);
    new PromptTray(this);
    this.wall.setScale(wallScale(this.t));
    this.refreshAlignment();

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * SCREEN_LAYOUT.playHintY, 'Placeholder: click to end the run', textStyle('small', 'muted'))
      .setOrigin(0.5);

    this.input.once('pointerdown', () => this.endRun());
    const keyboard = new KeyboardInput({ onMove: (dir) => this.moveFigure(dir) });
    this.events.once('shutdown', () => keyboard.destroy());
  }

  update(_time: number, deltaMs: number): void {
    this.t = advanceT(this.t, deltaMs / 1000, WALL_TIME);
    // Until M4 the approach loops into the next wall; from M4, t = 1 is a fail.
    if (this.t >= 1) this.startNextWall();
    this.wall.setScale(wallScale(this.t));
  }

  private startNextWall(): void {
    this.t = 0;
    this.holeLane = pickHoleLane(this.figureLane, HOLE_DISTANCE);
    this.wall.setHoleLane(this.holeLane);
    this.refreshAlignment();
  }

  private moveFigure(dir: -1 | 1): void {
    const lane = moveLane(this.figureLane, dir);
    if (lane === this.figureLane) return;
    this.figureLane = lane;
    this.figure.slideToLane(lane);
    this.refreshAlignment();
  }

  private refreshAlignment(): void {
    this.laneMarkers.setLit(isAligned(this.figureLane, this.holeLane) ? this.figureLane : null);
  }

  private endRun(): void {
    if (this.ended) return;
    this.ended = true;
    const result: RunResult = { wallsCleared: 0, score: 0, best: 0, endedOnWall: 1 };
    this.scene.start(SceneKeys.GameOver, result);
  }
}
