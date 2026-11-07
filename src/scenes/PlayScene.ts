import Phaser from 'phaser';
import {
  FAIL_SHAKE_INTENSITY,
  FAIL_SHAKE_MS,
  FAIL_TO_GAME_OVER_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  LOCK_RUSH_DURATION,
  RUSH_END_SCALE,
  SCREEN_LAYOUT,
  STAGE_BOTTOM_Y,
  WRONG_KEY_SHAKE_INTENSITY,
  WRONG_KEY_SHAKE_MS,
} from '@/config';
import { NEUTRAL_POSE } from '@/data/poses';
import { KeyboardInput } from '@/input/KeyboardInput';
import { advanceT, jumpT, wallScale } from '@/logic/approach';
import { planWall, type WallPlan } from '@/logic/difficulty';
import { CENTER_LANE, isAligned, laneCenterX, moveLane } from '@/logic/lanes';
import { generateLetters } from '@/logic/letters';
import { ScoreKeeper } from '@/logic/scoring';
import { LetterSequence, type SequenceEffect } from '@/logic/sequence';
import { ShiftWall, type ShiftWallEvent } from '@/logic/shift-wall';
import { generateWall, holeGrid, type WallSpec } from '@/logic/wall-gen';
import { Figure } from '@/objects/Figure';
import { Floor } from '@/objects/Floor';
import { LaneMarkers } from '@/objects/LaneMarkers';
import { PauseOverlay } from '@/objects/PauseOverlay';
import { PromptTray } from '@/objects/PromptTray';
import { playSplash } from '@/objects/splash';
import { TimingLabel } from '@/objects/TimingLabel';
import { Wall } from '@/objects/Wall';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// Draw order. The wall moves from behind the figure to in front of it once it
// rushes past the figure's plane.
const LAYER = {
  floor: 0,
  laneMarkers: 1,
  wall: 2,
  figure: 3,
  wallPassed: 4,
  splash: 5,
  label: 6,
  tray: 7,
  hud: 8,
  pause: 9,
} as const;

// approach: the wall is coming and the player can act. rush: the pose locked
// and the wall is passing. failing: the wall reached the figure first.
type Phase = 'approach' | 'rush' | 'failing';

export class PlayScene extends Phaser.Scene {
  private phase: Phase = 'approach';
  private t = 0;
  private figureLane = CENTER_LANE;
  // Starts as spec.holeLane and moves if this wall is a Shift Wall.
  private holeLane = CENTER_LANE;
  private plan!: WallPlan;
  private spec!: WallSpec;
  private shiftWall!: ShiftWall;
  private sequence!: LetterSequence;
  private scoreKeeper!: ScoreKeeper;
  private keyboard!: KeyboardInput;
  private wall!: Wall;
  private figure!: Figure;
  private laneMarkers!: LaneMarkers;
  private tray!: PromptTray;
  private label!: TimingLabel;
  private capsWarning!: Phaser.GameObjects.Text;
  private pauseOverlay!: PauseOverlay;

  constructor() {
    super(SceneKeys.Play);
  }

  create(): void {
    this.figureLane = CENTER_LANE;
    this.sequence = new LetterSequence();
    this.scoreKeeper = new ScoreKeeper();

    new Floor(this).setDepth(LAYER.floor);
    this.laneMarkers = new LaneMarkers(this).setDepth(LAYER.laneMarkers);
    this.wall = new Wall(this).setDepth(LAYER.wall);
    this.figure = new Figure(this, this.figureLane).setDepth(LAYER.figure);
    this.label = new TimingLabel(this).setDepth(LAYER.label);
    this.tray = new PromptTray(this).setDepth(LAYER.tray);
    this.capsWarning = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * SCREEN_LAYOUT.capsWarningY,
        'Caps Lock is on. Turn it off and use Shift for capitals.',
        textStyle('body', 'danger', true),
      )
      .setOrigin(0.5)
      .setDepth(LAYER.hud)
      .setVisible(false);
    this.pauseOverlay = new PauseOverlay(this).setDepth(LAYER.pause);

    this.input.on('pointerdown', () => {
      if (this.sequence.paused) this.resume();
    });
    this.keyboard = new KeyboardInput({
      onMove: (dir) => this.moveFigure(dir),
      onKeyDown: (key, code) => this.apply(this.sequence.press(key, code)),
      onKeyUp: (code) => this.apply(this.sequence.release(code)),
      onBlur: () => this.pause(),
      onCapsLock: (on) => this.capsWarning.setVisible(on),
    });
    this.events.once('shutdown', () => this.keyboard.destroy());

    this.startWall();
  }

  update(_time: number, deltaMs: number): void {
    if (this.sequence.paused) return;
    if (this.phase === 'approach') {
      this.sequence.tick(deltaMs);
      this.applyShift(this.shiftWall.update(this.t, this.sequence.heldCount, deltaMs));
      this.setT(advanceT(this.t, deltaMs / 1000, this.plan.wallTime));
    }
    this.tray.show(this.sequence.view());
  }

  // PLAN.md §2 step 4: held letters keep their blocks, but no new letter shows
  // until the figure is lined up with the moved hole.
  private applyShift(event: ShiftWallEvent | null): void {
    if (event === null) return;
    if (event.type === 'warn') {
      this.wall.warn(event.dir);
      return;
    }
    this.holeLane = event.toLane;
    this.wall.slideHoleTo(event.toLane);
    this.refreshAlignment();
  }

  private setT(t: number): void {
    this.t = t;
    this.wall.setScale(wallScale(t));
    if (t >= 1) this.fail();
  }

  private startWall(): void {
    this.plan = planWall(this.scoreKeeper.wallNumber);
    const { letters } = generateLetters(this.plan);
    this.spec = generateWall(this.figureLane, letters, this.plan.holeDistance);
    this.holeLane = this.spec.holeLane;
    this.shiftWall = new ShiftWall(this.plan.shiftWall, this.holeLane);
    this.wall.setHole(this.holeLane, holeGrid(this.spec.targets));
    this.wall.setAlpha(1).setDepth(LAYER.wall);
    this.figure.resetPose();
    this.sequence.startWall(letters);
    this.phase = 'approach';
    this.setT(0);
    this.refreshAlignment();
    // A blur during the rush was ignored, so catch it here.
    if (!document.hasFocus()) this.pause();
  }

  private apply(effect: SequenceEffect | null): void {
    if (effect === null || this.phase !== 'approach') return;
    if (effect.type === 'wrongKey') {
      this.wall.flash();
      if (!prefersReducedMotion()) this.cameras.main.shake(WRONG_KEY_SHAKE_MS, WRONG_KEY_SHAKE_INTENSITY);
      this.setT(jumpT(this.t));
      return;
    }
    const block = this.spec.blockFor[effect.letter];
    if (block === undefined) return;
    this.figure.setBlockPose(block, effect.type === 'held' ? this.spec.targets[block] : NEUTRAL_POSE[block]);
    this.maybeLock();
  }

  private moveFigure(dir: -1 | 1): void {
    if (this.phase !== 'approach' || this.sequence.paused) return;
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
    this.maybeLock();
  }

  // PLAN.md §3: pass = lined up and every letter held, decided from game
  // state, never from pixels.
  private maybeLock(): void {
    if (this.phase !== 'approach' || !this.sequence.complete) return;
    if (!isAligned(this.figureLane, this.holeLane)) return;

    this.phase = 'rush';
    this.sequence.lock();
    this.label.show(this.scoreKeeper.clearWall(this.t), laneCenterX(this.figureLane));
    this.tweens.addCounter({
      from: wallScale(this.t),
      to: RUSH_END_SCALE,
      duration: LOCK_RUSH_DURATION,
      ease: 'Quad.easeIn',
      onUpdate: (tween) => this.rushWall(tween.getValue() ?? RUSH_END_SCALE),
      onComplete: () => this.startWall(),
    });
  }

  private rushWall(scale: number): void {
    this.wall.setScale(scale);
    // Past the figure's plane the wall is in front of it, fading toward the camera.
    if (scale >= 1) {
      this.wall.setDepth(LAYER.wallPassed).setAlpha(1 - (scale - 1) / (RUSH_END_SCALE - 1));
    }
  }

  private fail(): void {
    if (this.phase === 'failing') return;
    this.phase = 'failing';
    this.sequence.lock();
    this.figure.shove(() => {
      playSplash(this, this.figure.x, STAGE_BOTTOM_Y, LAYER.splash);
      if (!prefersReducedMotion()) this.cameras.main.shake(FAIL_SHAKE_MS, FAIL_SHAKE_INTENSITY);
    });
    this.time.delayedCall(FAIL_TO_GAME_OVER_MS, () => this.endRun());
  }

  private pause(): void {
    if (this.phase !== 'approach' || this.sequence.paused) return;
    for (const effect of this.sequence.blur()) this.apply(effect);
    this.tray.show(this.sequence.view());
    this.pauseOverlay.setVisible(true);
  }

  private resume(): void {
    window.focus();
    this.sequence.resume();
    this.pauseOverlay.setVisible(false);
  }

  private endRun(): void {
    const result: RunResult = {
      wallsCleared: this.scoreKeeper.wallsCleared,
      score: this.scoreKeeper.score,
      endedOnWall: this.scoreKeeper.wallNumber,
      keysDown: this.keyboard.heldCodes(),
    };
    this.scene.start(SceneKeys.GameOver, result);
  }
}
