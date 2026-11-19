import Phaser from 'phaser';
import { Music } from '@/audio/Music';
import { stopMenuMusic } from '@/audio/standby';
import { Synth } from '@/audio/Synth';
import {
  CLOSE_CALL_SLOWMO,
  COLORS,
  FAIL_SHAKE_INTENSITY,
  FAIL_SHAKE_MS,
  FAIL_TO_GAME_OVER_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  LOCK_RUSH_DURATION,
  SCREEN_LAYOUT,
  SHIFT_JOLT,
  TUTORIAL,
  WALL_COMPLETE,
} from '@/config';
import { NEUTRAL_POSE } from '@/data/poses';
import { KeyboardInput } from '@/input/KeyboardInput';
import { advanceT, jumpT, wallScale } from '@/logic/approach';
import { Countdown } from '@/logic/countdown';
import { NO_DEV_OPTIONS, parseDevOptions, type DevOptions } from '@/logic/dev-options';
import { planWall, type WallPlan } from '@/logic/difficulty';
import { CENTER_LANE, fallDirection, isAligned, laneCenterX, stepToward } from '@/logic/lanes';
import { generateLetters } from '@/logic/letters';
import { ScoreKeeper, gradeFor } from '@/logic/scoring';
import { LetterSequence, type SequenceEffect } from '@/logic/sequence';
import { ShiftWall, type ShiftWallEvent } from '@/logic/shift-wall';
import { TutorialSteps, type TutorialStep } from '@/logic/tutorial';
import { tutorialCardPlace, type CardPlace, type Side } from '@/logic/tutorial-layout';
import { generateWall, holeGrid, type WallSpec } from '@/logic/wall-gen';
import { Completion } from '@/objects/Completion';
import { DebugOverlay, type DebugRow } from '@/objects/DebugOverlay';
import { Figure } from '@/objects/Figure';
import { Floor } from '@/objects/Floor';
import { GatedPrompt } from '@/objects/GatedPrompt';
import { GridVoid } from '@/objects/GridVoid';
import { Hud } from '@/objects/Hud';
import { LaneTiles } from '@/objects/LaneTiles';
import { PauseOverlay } from '@/objects/PauseOverlay';
import { buttonYBelow } from '@/objects/PromptButton';
import { PromptTray } from '@/objects/PromptTray';
import { ReadyCount } from '@/objects/ReadyCount';
import { ShiftCallout } from '@/objects/ShiftCallout';
import { TimingLabel } from '@/objects/TimingLabel';
import { TutorialPanel } from '@/objects/TutorialPanel';
import { Wall } from '@/objects/Wall';
import { SceneKeys, type PlayMode, type PlayStart, type RunResult } from '@/scenes/scene-keys';
import { outlinedStyle } from '@/scenes/text-styles';
import { prefersReducedMotion, webAudio } from '@/scenes/ui';

// Draw order. The wall stays behind the figure; a cleared wall's completion
// is drawn over the figure, where the hole and the pose line up.
const LAYER = {
  background: 0,
  floor: 1,
  laneTiles: 2,
  wall: 3,
  figure: 4,
  completion: 5,
  label: 6,
  tray: 7,
  hud: 8,
  pause: 9,
  debug: 10,
} as const;

// Kept in the game registry so the overlay stays on across walls and restarts.
const DEBUG_VISIBLE = 'debugOverlayVisible';

// ready: the count into the first wall, before there is one. approach: the
// wall is coming and the player can act. rush: the pose locked, and the wall
// comes to the figure, completes and leaves (and, in the tutorial, the stage
// then stays clear for its last step). failing: the wall reached the figure
// first.
type Phase = 'ready' | 'approach' | 'rush' | 'failing';

// One scene for the game and its tutorial, so the tutorial plays by the real
// rules on the real stage. Its modes (PlayStart): the interactive tutorial,
// after the title, where a fail replays the tutorial wall and the HUD shows
// from its last step; the count into the first wall, after the tutorial or
// skipping it; and a run at once, for Play again.
export class PlayScene extends Phaser.Scene {
  private mode: PlayMode = 'run';
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
  private completion!: Completion;
  private figure!: Figure;
  private laneTiles!: LaneTiles;
  private tray!: PromptTray;
  private label!: TimingLabel;
  private callout!: ShiftCallout;
  private capsWarning!: Phaser.GameObjects.Text;
  private hud!: Hud;
  private pauseOverlay!: PauseOverlay;
  private debug!: DebugOverlay;
  // Null when the browser has no Web Audio; the game then plays silent.
  private synth: Synth | null = null;
  private music: Music | null = null;
  private countdown = new Countdown();
  // The tutorial's steps and their card; null outside the tutorial.
  private tutorial: TutorialSteps | null = null;
  private panel: TutorialPanel | null = null;
  private startPrompt: GatedPrompt | null = null;
  private readyCount: ReadyCount | null = null;
  // Set once the scene has asked to restart, so a second ask can't.
  private leaving = false;
  // The URL's playtest shortcuts, honored on the dev server only, so a
  // published build always plays a normal run.
  private readonly dev = import.meta.env.DEV ? parseDevOptions(window.location.search) : NO_DEV_OPTIONS;

  constructor() {
    super(SceneKeys.Play);
  }

  // Scene data is a boundary: anything but a known mode starts a run.
  init(data: PlayStart): void {
    this.mode = data.mode === 'tutorial' || data.mode === 'countdown' ? data.mode : 'run';
  }

  create(): void {
    // A restart can land mid slow-motion; the tween clock outlives the run.
    this.tweens.timeScale = 1;
    this.figureLane = CENTER_LANE;
    this.leaving = false;
    this.sequence = new LetterSequence();
    // The tutorial is practice: wall 1's plan, wherever the URL starts runs.
    this.scoreKeeper = new ScoreKeeper(this.mode === 'tutorial' ? 1 : this.dev.startWall);

    // The Shift Wall jolt and the fail's shake move the camera past the
    // scene's edge, where the void should go on.
    this.cameras.main.setBackgroundColor(COLORS.void);
    new GridVoid(this).setDepth(LAYER.background);
    new Floor(this).setDepth(LAYER.floor);
    this.laneTiles = new LaneTiles(this).setDepth(LAYER.laneTiles);
    this.wall = new Wall(this).setDepth(LAYER.wall);
    this.figure = new Figure(this, this.figureLane).setDepth(LAYER.figure);
    this.completion = new Completion(this).setDepth(LAYER.completion);
    this.label = new TimingLabel(this).setDepth(LAYER.label);
    this.callout = new ShiftCallout(this).setDepth(LAYER.label);
    this.tray = new PromptTray(this).setDepth(LAYER.tray);
    this.hud = new Hud(this).setDepth(LAYER.hud);
    // Sized to fit between SCORE and WALL.
    const capsText = 'Caps Lock is on. Use Shift for capitals.';
    this.capsWarning = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * SCREEN_LAYOUT.capsWarningY, capsText, outlinedStyle('small', 'alert', true))
      .setOrigin(0.5)
      .setDepth(LAYER.hud)
      .setVisible(false);
    this.pauseOverlay = new PauseOverlay(this).setDepth(LAYER.pause);
    this.debug = new DebugOverlay(this).setDepth(LAYER.debug).setVisible(this.registry.get(DEBUG_VISIBLE) === true);

    this.input.on('pointerdown', () => {
      if (this.sequence.paused) this.resume();
    });
    this.keyboard = new KeyboardInput({
      // There is no wall, and no Shift Wall to ask, during the count.
      onSpace: () => {
        if (this.phase === 'approach') this.moveFigure(stepToward(this.figureLane, this.shiftWall.upcomingLane ?? this.holeLane));
      },
      onKeyDown: (key, code) => this.apply(this.sequence.press(key, code)),
      onKeyUp: (code) => this.apply(this.sequence.release(code)),
      onBlur: () => this.pause(),
      onCapsLock: (on) => this.capsWarning.setVisible(on),
      onToggleDebug: () => this.toggleDebug(),
      onEnter: () => this.skipTutorial(),
    });
    // The tutorial plays to the menus' Standby; a run has the track.
    const audio = webAudio(this);
    this.synth = audio === null ? null : new Synth(audio.ctx, audio.destination);
    this.music = audio === null || this.mode === 'tutorial' ? null : new Music(audio.ctx, audio.destination);
    this.events.once('shutdown', () => this.keyboard.destroy());

    this.tutorial = null;
    this.panel = null;
    this.startPrompt = null;
    this.readyCount = null;
    if (this.mode === 'tutorial') this.startTutorial();
    else if (this.mode === 'countdown') this.startCount();
    else this.beginRun();
  }

  // The tutorial: the HUD waits for the last step, and step 1's card goes up
  // once the wall says which side the hole is on.
  private startTutorial(): void {
    this.hud.setVisible(false);
    this.tutorial = new TutorialSteps();
    this.panel = new TutorialPanel(this).setDepth(LAYER.hud);
    this.startWall();
    this.panel.show(this.tutorial.step, this.cardPlace(this.tutorial.step));
  }

  // Which halves of the stage the hole and the figure are in, for where a
  // step's card goes. The hole is never in the figure's lane at the start,
  // and the figure is never centered once lined up; right breaks a tie.
  private cardPlace(step: TutorialStep): CardPlace {
    const side = (d: number): Side => (d < 0 ? -1 : 1);
    return tutorialCardPlace(step, side(this.holeLane - this.figureLane), side(this.figureLane - CENTER_LANE));
  }

  // READY?, 3, 2, 1 on an empty stage, a beep on each number and a higher one
  // as the first wall comes with the music.
  private startCount(): void {
    stopMenuMusic();
    this.phase = 'ready';
    this.hud.setWall(this.scoreKeeper.wallNumber);
    this.wall.setAlpha(0);
    this.readyCount = new ReadyCount(
      this,
      (step) => {
        if (step > 0) this.synth?.readyBeep(false);
      },
      () => {
        this.synth?.readyBeep(true);
        this.beginRun();
      },
    ).setDepth(LAYER.label);
  }

  private beginRun(): void {
    stopMenuMusic();
    this.music?.start();
    this.startWall();
  }

  update(_time: number, deltaMs: number): void {
    if (this.debug.visible) this.debug.show(this.debugRows());
    if (this.phase === 'ready') this.readyCount?.advance(deltaMs);
    if (this.sequence.paused) return;
    if (this.phase === 'failing') this.figure.updateTumble(deltaMs);
    if (this.phase === 'approach') {
      this.sequence.tick(deltaMs);
      this.applyShift(this.shiftWall.update(this.t, this.sequence.heldCount, this.sequence.leftCount, deltaMs));
      if (!this.shiftWall.holding && !this.wallWaits) this.setT(advanceT(this.t, deltaMs / 1000, this.plan.wallTime));
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
      this.laneTiles.setTarget({ lane: event.toLane, dir: event.dir });
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
    // The tutorial wall is wall 1, which never shifts, whatever the URL asks.
    this.plan = planWall(this.scoreKeeper.wallNumber, Math.random, this.mode !== 'tutorial' && this.dev.forceShiftWall);
    this.hud.setWall(this.scoreKeeper.wallNumber);
    const { letters, stretch } = generateLetters(this.plan);
    this.stretch = stretch;
    this.spec = generateWall(this.figureLane, letters, this.plan.holeDistance);
    this.holeLane = this.spec.holeLane;
    this.shiftWall = new ShiftWall(this.plan.shiftWall, this.holeLane);
    this.countdown = new Countdown();
    this.wall.setHole(this.holeLane, holeGrid(this.spec.targets));
    this.wall.appear();
    this.completion.reset();
    this.figure.resetPose();
    this.laneTiles.setTarget(null);
    this.sequence.startWall(letters);
    this.tray.setLetters(letters.length);
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
      if (!this.wallWaits) this.setT(jumpT(this.t));
      return;
    }
    const block = this.spec.blockFor[effect.letter];
    if (block === undefined) return;
    if (effect.type === 'held') {
      this.figure.snapBlock(block, this.spec.targets[block]);
      this.synth?.click(this.sequence.heldCount);
      // The tutorial wall starts coming with the first letter held.
      this.advanceTutorial();
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
    this.laneTiles.setLit(aligned ? this.figureLane : null);
    // The target stays through the warning, while the old lane still counts.
    if (aligned && !this.shiftWall.warning) this.laneTiles.setTarget(null);
    this.advanceTutorial();
    this.maybeLock();
  }

  // Each step's card shows until the player has done it; the last step
  // brings the HUD in and waits for Start.
  private advanceTutorial(): void {
    const aligned = isAligned(this.figureLane, this.holeLane);
    const step = this.tutorial?.update(aligned, this.sequence.locked, this.sequence.heldCount) ?? null;
    if (step === null || this.panel === null) return;
    this.panel.show(step, this.cardPlace(step));
    if (step !== 'score') return;
    this.hud.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.hud, alpha: 1, duration: TUTORIAL.hudFadeMs });
    // Step 3's card takes the top band, so the warning goes under it.
    this.capsWarning.setY(TUTORIAL.capsWarningY);
    const text = { button: 'START', waiting: 'LET GO OF EVERY KEY', ready: 'PRESS ANY KEY OR CLICK' };
    this.startPrompt = new GatedPrompt(this, GAME_WIDTH / 2, buttonYBelow(this.panel.bottom), text, {
      keysDown: this.keyboard.heldCodes(),
      lockoutMs: TUTORIAL.continueLockoutMs,
      hintOnCard: true,
      onGo: () => this.leave('countdown'),
    }).setDepth(LAYER.hud);
  }

  // The tutorial wall waits until the first letter is held.
  private get wallWaits(): boolean {
    return this.tutorial?.wallWaits ?? false;
  }

  // Enter skips the tutorial to the count, until its last step, whose Start
  // waits for every key to be let go.
  private skipTutorial(): void {
    if (this.mode !== 'tutorial' || this.tutorial?.step === 'score') return;
    this.leave('countdown');
  }

  // The tutorial's cards and Start fade away before the scene restarts.
  private leave(mode: PlayMode): void {
    if (this.leaving) return;
    this.leaving = true;
    this.panel?.hide();
    this.startPrompt?.fadeOut(TUTORIAL.fadeMs);
    this.time.delayedCall(TUTORIAL.fadeMs, () => this.scene.restart({ mode } satisfies PlayStart));
  }

  // PLAN.md §3: pass = lined up and every letter held, decided from game
  // state, never from pixels. A Shift Wall's warning holds the lock back, so
  // the hole still slides; the slide then re-checks.
  private maybeLock(): void {
    if (this.phase !== 'approach' || !this.sequence.complete) return;
    if (!isAligned(this.figureLane, this.holeLane) || !this.shiftWall.letsPoseLock) return;

    this.phase = 'rush';
    this.sequence.lock();
    this.advanceTutorial();
    const score = this.scoreKeeper.clearWall(this.t);
    this.hud.setScore(this.scoreKeeper.score);
    this.label.show(score, laneCenterX(this.figureLane));
    if (score.grade === 'closeCall') this.slowMotion();
    if (score.grade === 'perfect') this.synth?.fanfare();
    // The wall comes the rest of the way to the figure, where its hole and
    // the pose line up exactly, completes there, and leaves (M10b review).
    // All of it runs on tweens, so a CLOSE CALL slows it too.
    this.tweens.addCounter({
      from: wallScale(this.t),
      to: 1,
      duration: LOCK_RUSH_DURATION,
      ease: 'Quad.easeIn',
      onUpdate: (tween) => this.wall.setScale(tween.getValue() ?? 1),
      onComplete: () => this.completion.play(this.wall.textureKey, this.spec.targets, this.holeLane, () => this.clearWall()),
    });
  }

  // The completed wall fades, growing a little toward the camera unless the
  // player prefers reduced motion, taking the completion with it, and the
  // figure is itself again. The tutorial's last step keeps the stage clear.
  private clearWall(): void {
    const { exitGrow, exitMs } = WALL_COMPLETE;
    this.tweens.add({
      targets: [this.wall, this.completion],
      alpha: 0,
      scale: prefersReducedMotion() ? 1 : exitGrow,
      duration: exitMs,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.mode !== 'tutorial') this.startWall();
      },
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

  private fail(): void {
    if (this.phase === 'failing') return;
    this.phase = 'failing';
    this.sequence.lock();
    this.music?.stop();
    this.synth?.hit();
    this.figure.topple(fallDirection(this.figureLane), () => {
      this.synth?.whomp();
      if (!prefersReducedMotion()) this.cameras.main.shake(FAIL_SHAKE_MS, FAIL_SHAKE_INTENSITY);
    });
    // A fail in the tutorial fades its card as the wall hits, plays out, then
    // replays the tutorial wall.
    this.panel?.hide();
    this.time.delayedCall(FAIL_TO_GAME_OVER_MS, () => (this.mode === 'tutorial' ? this.leave('tutorial') : this.endRun()));
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
    if (this.phase === 'ready') return [['state', 'ready count']];
    const flags = [
      this.mode === 'run' ? '' : `${this.mode}${this.tutorial === null ? '' : ` (${this.tutorial.step})`}`,
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
      keysDown: this.keyboard.heldCodes(),
    };
    this.scene.start(SceneKeys.GameOver, result);
  }
}

function devRow({ startWall, forceShiftWall }: DevOptions): DebugRow {
  return ['dev url', [`runs start at wall ${startWall}`, forceShiftWall ? 'every wall shifts' : ''].filter(Boolean).join(', ')];
}
