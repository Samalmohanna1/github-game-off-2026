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
import { CENTER_LANE, cycleLane, isAligned, laneCenterX, moveLane } from '@/logic/lanes';
import { generateLetters } from '@/logic/letters';
import { ScoreKeeper, gradeFor } from '@/logic/scoring';
import { LetterSequence, type SequenceEffect } from '@/logic/sequence';
import { ShiftWall, type ShiftWallEvent } from '@/logic/shift-wall';
import { generateWall, holeGrid, type WallSpec } from '@/logic/wall-gen';
import { DebugOverlay, type DebugRow } from '@/objects/DebugOverlay';
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
  debug: 10,
} as const;

// Kept in the game registry so the overlay stays on across walls and restarts.
const DEBUG_VISIBLE = 'debugOverlayVisible';

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
  private stretch = 0;
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
  private debug!: DebugOverlay;

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
    this.debug = new DebugOverlay(this).setDepth(LAYER.debug).setVisible(this.registry.get(DEBUG_VISIBLE) === true);

    this.input.on('pointerdown', () => {
      if (this.sequence.paused) this.resume();
    });
    this.keyboard = new KeyboardInput({
      onMove: (dir) => this.moveFigure(moveLane(this.figureLane, dir)),
      onCycle: () => this.moveFigure(cycleLane(this.figureLane)),
      onKeyDown: (key, code) => this.apply(this.sequence.press(key, code)),
      onKeyUp: (code) => this.apply(this.sequence.release(code)),
      onBlur: () => this.pause(),
      onCapsLock: (on) => this.capsWarning.setVisible(on),
      onToggleDebug: () => this.toggleDebug(),
    });
    this.events.once('shutdown', () => this.keyboard.destroy());

    this.startWall();
  }

  update(_time: number, deltaMs: number): void {
    if (this.debug.visible) this.debug.show(this.debugRows());
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
    const { letters, stretch } = generateLetters(this.plan);
    this.stretch = stretch;
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

  private moveFigure(lane: number): void {
    if (this.phase !== 'approach' || this.sequence.paused) return;
    if (lane === this.figureLane) return;
    // A wrap from the last lane to the first jumps rather than gliding back
    // across the whole stage.
    const wrapped = Math.abs(lane - this.figureLane) > 1;
    this.figureLane = lane;
    if (wrapped) this.figure.jumpToLane(lane);
    else this.figure.slideToLane(lane);
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

  private toggleDebug(): void {
    const visible = !this.debug.visible;
    this.debug.setVisible(visible);
    this.registry.set(DEBUG_VISIBLE, visible);
  }

  // PLAN.md §8's list, plus the tier, wall time and score for tuning.
  private debugRows(): DebugRow[] {
    const flags = [
      this.phase,
      this.sequence.paused ? 'paused' : '',
      this.sequence.locked ? 'locked' : '',
      this.shiftWall.warning ? 'shift warning' : '',
    ].filter((flag) => flag !== '');
    const aligned = isAligned(this.figureLane, this.holeLane);
    const [lo, hi] = this.plan.stretch;
    const list = (items: readonly string[]) => (items.length > 0 ? items.join(' ') : '-');
    return [
      ['state', flags.join(', ')],
      ['wall', `#${this.plan.wall}  ${this.plan.tier}  ${this.plan.wallTime.toFixed(2)} s`],
      ['t', `${this.t.toFixed(3)}  (${gradeFor(this.t)} if locked now)`],
      ['lanes', `figure ${this.figureLane}  hole ${this.holeLane}  ${aligned ? 'lined up' : 'not lined up'}`],
      ['prompt', this.sequence.current ?? '-'],
      ['queue', list(this.sequence.queued)],
      ['held', list(this.sequence.heldKeys.map((h) => `${h.letter}:${h.code}`))],
      ['stretch', `${this.stretch.toFixed(2)}  (tier ${lo}-${hi})`],
      ['shift wall', this.plan.shiftWall ? `yes, at t ${this.shiftWall.triggerT.toFixed(2)}` : 'no'],
      ['score', `${this.scoreKeeper.score}  streak ${this.scoreKeeper.streak}`],
    ];
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
