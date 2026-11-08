import Phaser from 'phaser';
import { Synth } from '@/audio/Synth';
import {
  CLOSE_CALL_SLOWMO,
  FAIL_SHAKE_INTENSITY,
  FAIL_SHAKE_MS,
  FAIL_TO_GAME_OVER_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRAIN,
  LOCK_RUSH_DURATION,
  RUSH_END_SCALE,
  SCREEN_LAYOUT,
  SHIFT_JOLT,
  STAGE_BOTTOM_Y,
} from '@/config';
import { NEUTRAL_POSE } from '@/data/poses';
import { KeyboardInput } from '@/input/KeyboardInput';
import { advanceT, jumpT, wallScale } from '@/logic/approach';
import { Countdown } from '@/logic/countdown';
import { NO_DEV_OPTIONS, parseDevOptions, type DevOptions } from '@/logic/dev-options';
import { planWall, type WallPlan } from '@/logic/difficulty';
import { CENTER_LANE, isAligned, laneCenterX, moveLane, stepToward } from '@/logic/lanes';
import { generateLetters } from '@/logic/letters';
import { ScoreKeeper, gradeFor } from '@/logic/scoring';
import { LetterSequence, type SequenceEffect } from '@/logic/sequence';
import { ShiftWall, type ShiftWallEvent } from '@/logic/shift-wall';
import { generateWall, holeGrid, type WallSpec } from '@/logic/wall-gen';
import { Backdrop } from '@/objects/Backdrop';
import { DebugOverlay, type DebugRow } from '@/objects/DebugOverlay';
import { Figure } from '@/objects/Figure';
import { Floor } from '@/objects/Floor';
import { Hud } from '@/objects/Hud';
import { LaneMarkers } from '@/objects/LaneMarkers';
import { GRAIN_TEXTURE, paperLabel } from '@/objects/paper';
import { PauseOverlay } from '@/objects/PauseOverlay';
import { PromptTray } from '@/objects/PromptTray';
import { ShiftCallout } from '@/objects/ShiftCallout';
import { playSplash } from '@/objects/splash';
import { TimingLabel } from '@/objects/TimingLabel';
import { Wall } from '@/objects/Wall';
import { SceneKeys, type RunResult } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

// Draw order. The wall moves from behind the figure to in front of it once it
// rushes past the figure's plane. The paper grain lies over the scene but
// under the cards, tray and HUD, so their text stays crisp.
const LAYER = {
  backdrop: 0,
  floor: 1,
  laneMarkers: 2,
  wall: 3,
  figure: 4,
  wallPassed: 5,
  splash: 6,
  grain: 7,
  label: 8,
  tray: 9,
  hud: 10,
  pause: 11,
  debug: 12,
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
  private callout!: ShiftCallout;
  private capsWarning!: Phaser.GameObjects.Container;
  private hud!: Hud;
  private pauseOverlay!: PauseOverlay;
  private debug!: DebugOverlay;
  // Null when the browser has no Web Audio; the game then plays silent.
  private synth: Synth | null = null;
  private countdown = new Countdown();
  // The URL's playtest shortcuts, honored on the dev server only, so a
  // published build always plays a normal run.
  private readonly dev = import.meta.env.DEV ? parseDevOptions(window.location.search) : NO_DEV_OPTIONS;

  constructor() {
    super(SceneKeys.Play);
  }

  create(): void {
    // A restart can land mid slow-motion; the tween clock outlives the run.
    this.tweens.timeScale = 1;
    this.figureLane = CENTER_LANE;
    this.sequence = new LetterSequence();
    this.scoreKeeper = new ScoreKeeper(this.dev.startWall);

    new Backdrop(this).setDepth(LAYER.backdrop);
    new Floor(this).setDepth(LAYER.floor);
    this.boilGrain(this.add.tileSprite(0, 0, GAME_WIDTH, STAGE_BOTTOM_Y, GRAIN_TEXTURE).setOrigin(0).setDepth(LAYER.grain));
    this.laneMarkers = new LaneMarkers(this).setDepth(LAYER.laneMarkers);
    this.wall = new Wall(this).setDepth(LAYER.wall);
    this.figure = new Figure(this, this.figureLane).setDepth(LAYER.figure);
    this.label = new TimingLabel(this).setDepth(LAYER.label);
    this.callout = new ShiftCallout(this).setDepth(LAYER.label);
    this.tray = new PromptTray(this).setDepth(LAYER.tray);
    this.hud = new Hud(this).setDepth(LAYER.hud);
    // Sized to fit between the two HUD cards.
    const capsText = 'Caps Lock is on. Use Shift for capitals.';
    this.capsWarning = paperLabel(this, GAME_WIDTH / 2, GAME_HEIGHT * SCREEN_LAYOUT.capsWarningY, capsText, textStyle('small', 'danger', true))
      .setDepth(LAYER.hud)
      .setVisible(false);
    this.pauseOverlay = new PauseOverlay(this).setDepth(LAYER.pause);
    this.debug = new DebugOverlay(this).setDepth(LAYER.debug).setVisible(this.registry.get(DEBUG_VISIBLE) === true);

    this.input.on('pointerdown', () => {
      if (this.sequence.paused) this.resume();
    });
    this.keyboard = new KeyboardInput({
      onMove: (dir) => this.moveFigure(moveLane(this.figureLane, dir)),
      onSpace: () => this.moveFigure(stepToward(this.figureLane, this.shiftWall.upcomingLane ?? this.holeLane)),
      onKeyDown: (key, code) => this.apply(this.sequence.press(key, code)),
      onKeyUp: (code) => this.apply(this.sequence.release(code)),
      onBlur: () => this.pause(),
      onCapsLock: (on) => this.capsWarning.setVisible(on),
      onToggleDebug: () => this.toggleDebug(),
    });
    // Phaser's own context and master node: Phaser unlocks audio on the first
    // click and suspends it while the window is blurred (PLAN.md §10, M9).
    const sound = this.sound;
    this.synth = sound instanceof Phaser.Sound.WebAudioSoundManager ? new Synth(sound.context, sound.destination) : null;
    this.events.once('shutdown', () => this.keyboard.destroy());

    this.startWall();
  }

  update(_time: number, deltaMs: number): void {
    if (this.debug.visible) this.debug.show(this.debugRows());
    if (this.sequence.paused) return;
    if (this.phase === 'approach') {
      this.sequence.tick(deltaMs);
      this.applyShift(this.shiftWall.update(this.t, this.sequence.heldCount, this.sequence.leftCount, deltaMs));
      if (!this.shiftWall.holding) this.setT(advanceT(this.t, deltaMs / 1000, this.plan.wallTime));
      // setT may have just failed the wall.
      const tick = this.phase === 'approach' ? this.countdown.update(this.t, deltaMs) : null;
      if (tick !== null) this.synth?.tick(tick);
    }
    this.callout.setVisible(this.phase === 'approach' && this.shiftWall.holding);
    this.tray.show(this.sequence.view());
  }

  // PLAN.md §2 step 4: held letters keep their blocks, but no new letter shows
  // until the figure is lined up with the moved hole. PLAN.md §5: the wall
  // holds still behind a SHIFT callout, the target lane is marked, and the
  // screen jolts the slide's way.
  private applyShift(event: ShiftWallEvent | null): void {
    if (event === null) return;
    if (event.type === 'warn') {
      this.wall.warn(event.dir);
      this.callout.show(event.dir);
      this.synth?.shiftAlert(event.dir);
      this.laneMarkers.setTarget({ lane: event.toLane, dir: event.dir });
      return;
    }
    const dir = event.toLane > this.holeLane ? 1 : -1;
    this.holeLane = event.toLane;
    this.wall.slideHoleTo(event.toLane);
    this.synth?.whoosh(dir);
    if (!prefersReducedMotion()) {
      // Scrolling the camera against dir moves the scene toward it.
      this.tweens.add({
        targets: this.cameras.main,
        scrollX: -dir * SHIFT_JOLT.distance,
        duration: SHIFT_JOLT.ms,
        ease: 'Quad.easeOut',
        yoyo: true,
      });
    }
    this.refreshAlignment();
  }

  private setT(t: number): void {
    this.t = t;
    this.wall.setScale(wallScale(t));
    if (t >= 1) this.fail();
  }

  private startWall(): void {
    this.plan = planWall(this.scoreKeeper.wallNumber, Math.random, this.dev.forceShiftWall);
    this.hud.setWall(this.scoreKeeper.wallNumber);
    const { letters, stretch } = generateLetters(this.plan);
    this.stretch = stretch;
    this.spec = generateWall(this.figureLane, letters, this.plan.holeDistance);
    this.holeLane = this.spec.holeLane;
    this.shiftWall = new ShiftWall(this.plan.shiftWall, this.holeLane);
    this.countdown = new Countdown();
    this.wall.setHole(this.holeLane, holeGrid(this.spec.targets));
    this.wall.setAlpha(1).setDepth(LAYER.wall);
    this.figure.resetPose();
    this.laneMarkers.setTarget(null);
    this.sequence.startWall(letters);
    this.phase = 'approach';
    this.setT(0);
    this.refreshAlignment();
    // A blur during the rush was ignored, so catch it here.
    if (!document.hasFocus()) this.pause();
  }

  // quiet: the slips a blur forces are part of pausing, not the player's doing.
  private apply(effect: SequenceEffect | null, quiet = false): void {
    if (effect === null || this.phase !== 'approach') return;
    if (effect.type === 'wrongKey') {
      this.wall.flash();
      if (!prefersReducedMotion()) this.wall.rattle();
      this.setT(jumpT(this.t));
      return;
    }
    const block = this.spec.blockFor[effect.letter];
    if (block === undefined) return;
    if (effect.type === 'held') {
      this.figure.snapBlock(block, this.spec.targets[block]);
      this.synth?.click(this.sequence.heldCount);
    } else {
      this.figure.slumpBlock(block, NEUTRAL_POSE[block]);
      if (!quiet) this.synth?.slip();
    }
    this.maybeLock();
  }

  private moveFigure(lane: number): void {
    if (this.phase !== 'approach' || this.sequence.paused) return;
    if (lane === this.figureLane) return;
    this.figureLane = lane;
    this.figure.slideToLane(lane);
    this.refreshAlignment();
  }

  private refreshAlignment(): void {
    const aligned = isAligned(this.figureLane, this.holeLane);
    this.sequence.setAligned(aligned);
    this.laneMarkers.setLit(aligned ? this.figureLane : null);
    // The target stays through the warning, while the old lane still counts.
    if (aligned && !this.shiftWall.warning) this.laneMarkers.setTarget(null);
    this.maybeLock();
  }

  // PLAN.md §3: pass = lined up and every letter held, decided from game
  // state, never from pixels. A Shift Wall's warning holds the lock back, so
  // the hole still slides; the slide then re-checks.
  private maybeLock(): void {
    if (this.phase !== 'approach' || !this.sequence.complete) return;
    if (!isAligned(this.figureLane, this.holeLane) || !this.shiftWall.letsPoseLock) return;

    this.phase = 'rush';
    this.sequence.lock();
    const score = this.scoreKeeper.clearWall(this.t);
    this.hud.setScore(this.scoreKeeper.score);
    this.label.show(score, laneCenterX(this.figureLane));
    if (score.grade === 'closeCall') this.slowMotion();
    if (score.grade === 'perfect') this.synth?.fanfare();
    this.tweens.addCounter({
      from: wallScale(this.t),
      to: RUSH_END_SCALE,
      duration: LOCK_RUSH_DURATION,
      ease: 'Quad.easeIn',
      onUpdate: (tween) => this.rushWall(tween.getValue() ?? RUSH_END_SCALE),
      onComplete: () => this.startWall(),
    });
  }

  // CLOSE CALL (M8): the rush and the label pop play in slow motion for a
  // moment of real time. The pose is already locked, so no rule is affected.
  private slowMotion(): void {
    this.tweens.timeScale = CLOSE_CALL_SLOWMO.scale;
    this.time.delayedCall(CLOSE_CALL_SLOWMO.ms, () => {
      this.tweens.timeScale = 1;
    });
  }

  private rushWall(scale: number): void {
    this.wall.setScale(scale);
    // Past the figure's plane the wall is in front of it, fading toward the
    // camera, and its hole opens so the figure shows through.
    if (scale >= 1) {
      this.wall.setHoleFilled(false);
      this.wall.setDepth(LAYER.wallPassed).setAlpha(1 - (scale - 1) / (RUSH_END_SCALE - 1));
    }
  }

  // The paper grain jumps to a new offset every GRAIN.boilMs, like the boil of
  // hand-drawn animation (M10). Still for reduced motion.
  private boilGrain(grain: Phaser.GameObjects.TileSprite): void {
    if (prefersReducedMotion()) return;
    this.time.addEvent({
      delay: GRAIN.boilMs,
      loop: true,
      callback: () => grain.setTilePosition(Phaser.Math.Between(0, GRAIN.size), Phaser.Math.Between(0, GRAIN.size)),
    });
  }

  private fail(): void {
    if (this.phase === 'failing') return;
    this.phase = 'failing';
    this.sequence.lock();
    this.synth?.hit();
    this.figure.shove(() => {
      playSplash(this, this.figure.x, STAGE_BOTTOM_Y, LAYER.splash);
      this.synth?.whomp();
      if (!prefersReducedMotion()) this.cameras.main.shake(FAIL_SHAKE_MS, FAIL_SHAKE_INTENSITY);
    });
    this.time.delayedCall(FAIL_TO_GAME_OVER_MS, () => this.endRun());
  }

  private pause(): void {
    if (this.phase !== 'approach' || this.sequence.paused) return;
    for (const effect of this.sequence.blur()) this.apply(effect, true);
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
      this.shiftWall.holding ? 'wall holding' : '',
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
      ['shift wall', this.plan.shiftWall ? `yes, at t ${this.shiftWall.triggerT.toFixed(2)} or the last letter` : 'no'],
      ['score', `${this.scoreKeeper.score}  streak ${this.scoreKeeper.streak}`],
      ...(this.dev === NO_DEV_OPTIONS ? [] : [devRow(this.dev)]),
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

function devRow({ startWall, forceShiftWall }: DevOptions): DebugRow {
  return ['dev url', [`runs start at wall ${startWall}`, forceShiftWall ? 'every wall shifts' : ''].filter(Boolean).join(', ')];
}
