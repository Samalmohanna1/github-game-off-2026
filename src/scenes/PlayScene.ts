import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  HOLE_DISTANCE,
  PLACEHOLDER_LETTER_COUNT,
  PLACEHOLDER_SHIFT_LETTERS,
  SCREEN_LAYOUT,
  WALL_TIME,
  WRONG_KEY_SHAKE_INTENSITY,
  WRONG_KEY_SHAKE_MS,
} from '@/config';
import { KeyboardInput } from '@/input/KeyboardInput';
import { advanceT, jumpT, wallScale } from '@/logic/approach';
import { CENTER_LANE, isAligned, moveLane, pickHoleLane } from '@/logic/lanes';
import { randomLetters } from '@/logic/letters';
import { LetterSequence, type SequenceEffect } from '@/logic/sequence';
import { Figure } from '@/objects/Figure';
import { Floor } from '@/objects/Floor';
import { LaneMarkers } from '@/objects/LaneMarkers';
import { PauseOverlay } from '@/objects/PauseOverlay';
import { PromptTray } from '@/objects/PromptTray';
import { Wall } from '@/objects/Wall';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

export class PlayScene extends Phaser.Scene {
  private ended = false;
  private t = 0;
  private figureLane = CENTER_LANE;
  private holeLane = CENTER_LANE;
  private sequence!: LetterSequence;
  private wall!: Wall;
  private figure!: Figure;
  private laneMarkers!: LaneMarkers;
  private tray!: PromptTray;
  private pauseOverlay!: PauseOverlay;

  constructor() {
    super(SceneKeys.Play);
  }

  create(): void {
    this.ended = false;
    this.figureLane = CENTER_LANE;
    this.sequence = new LetterSequence();

    new Floor(this);
    this.laneMarkers = new LaneMarkers(this);
    this.wall = new Wall(this);
    this.figure = new Figure(this, this.figureLane);
    this.tray = new PromptTray(this);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * SCREEN_LAYOUT.playHintY, 'Placeholder: click to end the run', textStyle('small', 'muted'))
      .setOrigin(0.5);
    this.pauseOverlay = new PauseOverlay(this);
    this.startWall();

    this.input.on('pointerdown', () => (this.sequence.paused ? this.resume() : this.endRun()));
    const keyboard = new KeyboardInput({
      onMove: (dir) => this.moveFigure(dir),
      onKeyDown: (key, code) => this.apply(this.sequence.press(key, code)),
      onKeyUp: (code) => this.apply(this.sequence.release(code)),
      onBlur: () => this.pause(),
    });
    this.events.once('shutdown', () => keyboard.destroy());
  }

  update(_time: number, deltaMs: number): void {
    if (this.sequence.paused) return;
    this.sequence.tick(deltaMs);
    this.setT(advanceT(this.t, deltaMs / 1000, WALL_TIME));
    this.tray.show(this.sequence.view());
  }

  private setT(t: number): void {
    this.t = t;
    // Until M4 the approach loops into the next wall; from M4, t = 1 is a fail.
    if (this.t >= 1) this.startWall();
    this.wall.setScale(wallScale(this.t));
  }

  private startWall(): void {
    this.t = 0;
    this.holeLane = pickHoleLane(this.figureLane, HOLE_DISTANCE);
    this.wall.setHoleLane(this.holeLane);
    this.sequence.startWall(randomLetters(PLACEHOLDER_LETTER_COUNT, PLACEHOLDER_SHIFT_LETTERS));
    this.refreshAlignment();
  }

  private apply(effect: SequenceEffect | null): void {
    if (effect?.type !== 'wrongKey') return;
    this.setT(jumpT(this.t));
    this.wall.flash();
    if (!prefersReducedMotion()) this.cameras.main.shake(WRONG_KEY_SHAKE_MS, WRONG_KEY_SHAKE_INTENSITY);
  }

  private moveFigure(dir: -1 | 1): void {
    if (this.sequence.paused) return;
    const lane = moveLane(this.figureLane, dir);
    if (lane === this.figureLane) return;
    this.figureLane = lane;
    this.figure.slideToLane(lane);
    this.refreshAlignment();
  }

  private refreshAlignment(): void {
    const aligned = isAligned(this.figureLane, this.holeLane);
    this.sequence.setAligned(aligned);
    this.laneMarkers.setLit(aligned ? this.figureLane : null);
  }

  private pause(): void {
    if (this.ended || this.sequence.paused) return;
    this.sequence.blur();
    this.tray.show(this.sequence.view());
    this.pauseOverlay.setVisible(true);
  }

  private resume(): void {
    window.focus();
    this.sequence.resume();
    this.pauseOverlay.setVisible(false);
  }

  private endRun(): void {
    if (this.ended) return;
    this.ended = true;
    const result: RunResult = { wallsCleared: 0, score: 0, best: 0, endedOnWall: 1 };
    this.scene.start(SceneKeys.GameOver, result);
  }
}
