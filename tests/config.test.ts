import { describe, expect, it } from 'vitest';
import * as C from '@/config';

// WCAG "large text" is >= 24px; AAA for large text is 4.5:1, and meaningful
// non-text graphics need 3:1 (AGENTS.md).
const LARGE_TEXT_PX = 24;
const AAA_LARGE_TEXT_RATIO = 4.5;
const NON_TEXT_RATIO = 3;

function relativeLuminance(rgb: number): number {
  const channels = [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff].map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: number, b: number): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('config', () => {
  it('runs at 1280×720', () => {
    expect([C.GAME_WIDTH, C.GAME_HEIGHT]).toEqual([1280, 720]);
  });

  it('has a center lane', () => {
    expect(C.LANE_COUNT % 2).toBe(1);
  });

  it('starts the wall smaller than full size', () => {
    expect(C.WALL_START_SCALE).toBeGreaterThan(0);
    expect(C.WALL_START_SCALE).toBeLessThan(1);
  });

  it('orders the timing thresholds PERFECT < GREAT < 1', () => {
    expect(C.PERFECT_T).toBeLessThan(C.GREAT_T);
    expect(C.GREAT_T).toBeLessThan(1);
  });

  it('keeps the Shift Wall trigger range inside the approach', () => {
    const [lo, hi] = C.SHIFT_WALL_T_RANGE;
    expect(lo).toBeGreaterThan(0);
    expect(lo).toBeLessThan(hi);
    expect(hi).toBeLessThan(1);
  });

  it('never asks for more keys than keyboards can handle (PLAN.md §4)', () => {
    expect(C.MAX_LETTERS).toBeLessThanOrEqual(5);
    expect(C.MAX_LETTERS_SHIFT_WALL).toBeLessThanOrEqual(C.MAX_LETTERS);
    expect(C.MAX_LETTERS_SHIFT_WALL).toBeLessThanOrEqual(4);
  });

  it('keeps a wrong key costly but survivable', () => {
    expect(C.WRONG_KEY_JUMP).toBeGreaterThan(0);
    expect(C.WRONG_KEY_JUMP).toBeLessThan(C.PERFECT_T);
  });

  it('puts the figure floor between the horizon and the tray', () => {
    expect(C.HORIZON_Y).toBeLessThan(C.FIGURE_FLOOR_Y);
    expect(C.FIGURE_FLOOR_Y).toBeLessThan(C.STAGE_BOTTOM_Y);
  });

  it('makes the wall taller than the figure grid, so a hole fits', () => {
    expect(C.FIGURE_HEIGHT).toBeLessThan(C.WALL_HEIGHT);
  });

  // M10b: the bar sits below the runway, so it never covers it or the
  // figure, and the current key cap's lime frame stays clear of the
  // runway above and of the bar's line below.
  it('fits every chip, and the current one with its frame, between the runway and the bar line', () => {
    const framedHalf = C.CHIP.currentSize / 2 + C.CHIP.focusGap + C.CHIP.focusWidth / 2;
    expect(C.CHIP.size).toBeLessThan(C.CHIP.currentSize);
    expect(C.TRAY.rowY - framedHalf).toBeGreaterThanOrEqual(0);
    expect(C.TRAY.rowY + framedHalf).toBeLessThanOrEqual(C.TRAY.lowY - C.TRAY.lineWidth / 2);
    expect(C.TRAY.lowY).toBeLessThanOrEqual(C.TRAY_HEIGHT);
  });

  // A review asked for more room between letters: the row, at its widest (the
  // current cap with MAX_LETTERS - 1 caps either side), still clears the
  // bar's slashes on the left and its letter squares on the right, and the
  // bar's line still steps down under it after a flat run.
  it("fits the widest row of caps between the bar's slashes and its letter squares", () => {
    const { size, currentSize, gap } = C.CHIP;
    const reach = currentSize / 2 + 2 * gap + size / 2 + (C.MAX_LETTERS - 1) * (size + gap) + size / 2;
    const { squares } = C.TRAY;
    const squaresLeft = C.GAME_WIDTH - squares.rightX - C.MAX_LETTERS * squares.size - (C.MAX_LETTERS - 1) * squares.gap;
    expect(C.GAME_WIDTH / 2 + reach).toBeLessThan(squaresLeft);
    expect(C.GAME_WIDTH / 2 - reach - C.TRAY.padX - C.TRAY.ramp).toBeGreaterThan(C.TRAY.lineFromX);
  });

  it('keeps the HUD above the horizon, where nothing that moves reaches', () => {
    expect(C.HUD.top + C.HUD.height).toBeLessThan(C.HORIZON_Y);
  });

  it('keeps the Shift mark inside its chip corner', () => {
    expect(C.SHIFT_MARK.size + C.SHIFT_MARK.inset).toBeLessThan(0.5);
  });

  it('fits the Shift Wall arrow in the band of wall above the hole', () => {
    expect(C.SHIFT_ARROW.headWidth).toBeLessThan(C.WALL_HEIGHT - C.FIGURE_HEIGHT);
    expect(C.SHIFT_ARROW.headLength).toBeLessThan(C.SHIFT_ARROW.length);
    expect(C.SHIFT_ARROW.shaftThickness).toBeLessThan(C.SHIFT_ARROW.headWidth);
  });

  it('holds the wall through the Shift Wall warning and slide, with time to spare', () => {
    expect(C.SHIFT_WALL_PAUSE).toBeGreaterThan(C.SHIFT_WALL_TELEGRAPH + C.SHIFT_WALL_SLIDE_MS);
  });

  it('slides the Shift Wall hole at least one lane', () => {
    expect(C.SHIFT_WALL_SLIDE[0]).toBeGreaterThanOrEqual(1);
  });
});

describe('feel (M8)', () => {
  it('squashes and tilts blocks only a little, so a pose still reads', () => {
    expect(C.BLOCK_SNAP.squash).toBeGreaterThan(0);
    expect(C.BLOCK_SNAP.squash).toBeLessThan(0.5);
    expect(C.BLOCK_LIMP.tiltDeg).toBeLessThan(45);
  });

  it('rattles the wall by less than one cell, so the hole never looks moved', () => {
    expect(C.WALL_RATTLE.distance).toBeLessThan(C.CELL_SIZE);
  });

  it('ends the CLOSE CALL slow motion before the rush does, so the next wall runs at full speed', () => {
    expect(C.CLOSE_CALL_SLOWMO.scale).toBeGreaterThan(0);
    expect(C.CLOSE_CALL_SLOWMO.scale).toBeLessThan(1);
    expect(C.CLOSE_CALL_SLOWMO.ms * C.CLOSE_CALL_SLOWMO.scale).toBeLessThan(C.LOCK_RUSH_DURATION);
  });

  // M10 review 5: wood, not rubber.
  it('bounces the fallen blocks low and lets each bounce lose speed', () => {
    const { restitution, friction, spinKeep } = C.FAIL_TUMBLE;
    expect(restitution).toBeGreaterThan(0);
    expect(restitution).toBeLessThanOrEqual(0.5);
    for (const share of [friction, spinKeep]) {
      expect(share).toBeGreaterThan(0);
      expect(share).toBeLessThan(1);
    }
  });

  it('flails the arms only a little', () => {
    expect(C.FAIL_TUMBLE.flailDeg).toBeGreaterThan(0);
    expect(C.FAIL_TUMBLE.flailDeg).toBeLessThan(45);
  });
});

describe('audio (M9)', () => {
  const { master, music, gameOverMusic, standby, ready, tick, click, slip, fanfare, shiftAlert, whoosh, hit, whomp } = C.AUDIO;

  it('keeps every gain above silence and at most full scale', () => {
    // Above zero too: the envelopes ramp exponentially, which can't reach 0.
    const gains = [
      master,
      music.gain,
      gameOverMusic.gain,
      standby.gain,
      standby.pad.level,
      standby.bass.level,
      standby.bass.octaveLevel,
      standby.bells.level,
      ...standby.bells.partials.map(([, level]) => level),
      standby.reverb.wet,
      ready.gain,
      tick.gain,
      click.gain,
      slip.gain,
      fanfare.gain,
      shiftAlert.gain,
      whoosh.gain,
      hit.gain,
      hit.smackGain,
      whomp.gain,
    ];
    for (const gain of gains) {
      expect(gain).toBeGreaterThan(0);
      expect(gain).toBeLessThanOrEqual(1);
    }
  });

  it('fades the music out under the hit', () => {
    expect(music.stopMs).toBeGreaterThan(0);
    expect(music.stopMs).toBeLessThanOrEqual(hit.ms);
  });

  it('gives the pulse wave a duty strictly between silent and always on', () => {
    expect(C.AUDIO.pulseDuty).toBeGreaterThan(0);
    expect(C.AUDIO.pulseDuty).toBeLessThan(1);
  });

  it('finishes the PERFECT fanfare while the PERFECT label is still up', () => {
    const length = (fanfare.semitones.length - 1) * fanfare.noteMs + fanfare.lastMs;
    expect(length).toBeLessThanOrEqual(C.LABEL_HOLD_MS);
  });

  it('finishes the Shift Wall alert as the hole slides, and the whoosh while the wall holds', () => {
    expect((shiftAlert.chirps - 1) * shiftAlert.gapMs + shiftAlert.chirpMs).toBeLessThanOrEqual(C.SHIFT_WALL_TELEGRAPH);
    expect(C.SHIFT_WALL_TELEGRAPH + whoosh.ms).toBeLessThanOrEqual(C.SHIFT_WALL_PAUSE);
  });

  it('plays the whomp as separate notes, the last one long and sagging', () => {
    expect(whomp.noteMs).toBeLessThanOrEqual(whomp.gapMs);
    expect(whomp.lastMs).toBeGreaterThan(whomp.noteMs);
    expect(whomp.sagSemitones).toBeGreaterThan(0);
    expect(whomp.holdShare).toBeGreaterThan(0);
    expect(whomp.holdShare).toBeLessThan(1);
  });

  it('bends each whomp note down into its pitch before it holds', () => {
    expect(whomp.bendSemitones).toBeGreaterThan(0);
    expect(whomp.bendMs).toBeLessThan(whomp.noteMs * whomp.holdShare);
  });

  it('crunches the hit noise below the sample rate, so it is held for whole samples', () => {
    expect(hit.smackCrushHz).toBeGreaterThan(0);
    expect(hit.smackCrushHz).toBeLessThan(44100);
  });

  it("keeps Standby's breathing lowpass above 0 Hz and its sends at most full", () => {
    expect(standby.pad.cutoffHz - standby.pad.breatheHz).toBeGreaterThan(0);
    const sends = [standby.pad.reverb, standby.bells.reverb, standby.bells.echo, standby.echo.reverb];
    for (const send of sends) {
      expect(send).toBeGreaterThan(0);
      expect(send).toBeLessThanOrEqual(1);
    }
  });

  it('plays the game-over music slower, muffled, with an echo that dies away', () => {
    expect(gameOverMusic.rate).toBeGreaterThan(0);
    expect(gameOverMusic.rate).toBeLessThan(1);
    expect(gameOverMusic.cutoffHz).toBeGreaterThan(0);
    expect(gameOverMusic.echo.ms).toBeGreaterThan(0);
    expect(gameOverMusic.echo.feedback).toBeGreaterThan(0);
    expect(gameOverMusic.echo.feedback).toBeLessThan(1);
    expect(gameOverMusic.fadeInMs).toBeGreaterThan(0);
  });
});

// M10: one color system. Every role takes its color from PALETTE, so no
// one-off value can creep in.
describe('color system', () => {
  const palette = new Set<number>(Object.values(C.PALETTE));

  it.each(Object.entries(C.COLORS))('COLORS.%s comes from the palette', (_name, color) => {
    expect(palette.has(color)).toBe(true);
  });

  it.each(Object.entries(C.TEXT_COLORS))('TEXT_COLORS.%s comes from the palette', (_name, color) => {
    expect(palette.has(css(color))).toBe(true);
  });

  it('names every palette color once', () => {
    expect(palette.size).toBe(Object.keys(C.PALETTE).length);
  });
});

describe('graphics contrast', () => {
  // The wall stands in the dark void, with a glow behind it, and its panel is
  // dark too, so its lime frame is what sets it apart.
  it.each(['void', 'voidGlow'] as const)('frames the wall clearly against the %s', (name) => {
    expect(contrastRatio(C.COLORS.wallFrame, C.COLORS[name])).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // While the wall is far off, the hole shows the void, as dark as the
  // panel; its lime edge reads there. Nearer, it shows the cream runway,
  // which the panel's darks set off.
  it.each(['void', 'voidGlow', 'wall', 'panelTop', 'panelFoot'] as const)('edges the hole clearly against the %s', (name) => {
    expect(contrastRatio(C.COLORS.holeEdge, C.COLORS[name])).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it.each(['panelTop', 'panelFoot', 'wall'] as const)('the %s sets the hole off from the runway it shows', (name) => {
    expect(contrastRatio(C.COLORS[name], C.COLORS.floor)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // A completion's lit cells part by dark seams, like the panel's pixels.
  it('parts the completion cells clearly by their seams', () => {
    expect(contrastRatio(C.COLORS.completionCell, C.COLORS.completionSeam)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // The lined-up marker and the Shift Wall's target outline sit on the runway.
  it.each(['laneLit', 'wallWarning', 'figure'] as const)('%s stands out from the runway', (name) => {
    expect(contrastRatio(C.COLORS[name], C.COLORS.floor)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // The black figure is only 1.5:1 on a dark wall and less on the void, so
  // its cream edge is what outlines it there.
  it.each(['void', 'wall', 'figure'] as const)('outlines the figure clearly against the %s by its edge', (name) => {
    expect(contrastRatio(C.COLORS.figureEdge, C.COLORS[name])).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // Over the glow, the wall's frame carries the alert walls too.
  it.each(['wallWarning', 'wallFlash'] as const)('the %s wall stands out from the void', (name) => {
    expect(contrastRatio(C.COLORS[name], C.COLORS.void)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it('keeps the Shift Wall arrows readable: on the wall, and on the callout card', () => {
    expect(contrastRatio(C.COLORS.shiftArrow, C.COLORS.wallWarning)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.calloutInk, C.COLORS.calloutCard)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // M10b review 4: the badges pop up over the dark panel, and over the cream
  // runway, where their ink edge sets them off.
  it.each(['gradePerfect', 'gradeGreat', 'gradeCloseCall', 'calloutCard'] as const)(
    'the %s badge stands out from the wall panel',
    (name) => {
      for (const panel of [C.COLORS.panelTop, C.COLORS.panelFoot]) {
        expect(contrastRatio(C.COLORS[name], panel)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
      }
    },
  );

  it('edges the badges clearly against the runway', () => {
    expect(contrastRatio(C.COLORS.badgeEdge, C.COLORS.floor)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // M11 review 2: the buttons sit on the stage (or the pause veil, which is
  // the void's color), where their cream edge sets them off.
  it('edges the buttons clearly against the stage', () => {
    expect(contrastRatio(C.COLORS.buttonEdge, C.COLORS.void)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.buttonEdge, C.COLORS.veil)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // The cream cards stand on the void; the bar's line, slashes and its letter
  // squares, lit and unlit, all read on the bar.
  it('sets the cards off from the void', () => {
    expect(contrastRatio(C.COLORS.card, C.COLORS.void)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // The dark cards are as dark as the void, so their edge outlines them; the
  // how-to's key caps and the game-over card's line read on them.
  it('edges the dark cards clearly on the void, with key caps and the bar line that read on them', () => {
    expect(contrastRatio(C.COLORS.darkCardEdge, C.COLORS.void)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.darkCardEdge, C.COLORS.darkCard)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.chipCurrent, C.COLORS.darkCard)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    for (const line of [C.COLORS.trayLine, C.COLORS.trayAccent]) {
      expect(contrastRatio(line, C.COLORS.darkCard)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    }
  });

  // M11 review 4: the rule under GAME OVER.
  it('reads the game-over rule on its card', () => {
    expect(contrastRatio(C.COLORS.gameOverRule, C.COLORS.darkCard)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it("shows the splash's words, faded in, a good while before it leaves", () => {
    const { textDelayMs, textFadeMs, leaveMs, imageY, textY } = C.SPLASH;
    expect(textDelayMs + textFadeMs).toBeLessThan(leaveMs / 2);
    expect(textY).toBeGreaterThan(imageY);
    expect(textY).toBeLessThan(C.GAME_HEIGHT);
  });

  // The title's sound switch: its lime track (with sound) and the dark one's
  // cream edge (muted) read on the stage; its knob reads on either track (by
  // its fill on the dark one, by its ink edge on the lime), and its speaker
  // on the knob.
  it("reads the title's sound switch, on and muted, and its knob and speaker", () => {
    expect(contrastRatio(C.COLORS.muteOn, C.COLORS.void)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.muteOffEdge, C.COLORS.void)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.muteKnob, C.COLORS.muteOff)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.muteKnobEdge, C.COLORS.muteOn)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.muteIcon, C.COLORS.muteKnob)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it.each(['trayLine', 'trayAccent', 'trayDim'] as const)('%s reads on the bar', (name) => {
    expect(contrastRatio(C.COLORS[name], C.COLORS.tray)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it.each(['chipHeld', 'chipCurrent', 'chipNext', 'chipSlipped', 'chipFocus', 'chipDropEdge'] as const)(
    '%s stands out from the bar',
    (name) => {
      expect(contrastRatio(C.COLORS[name], C.COLORS.tray)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    },
  );

  it.each(['chipHeld', 'chipCurrent', 'chipNext', 'chipSlipped'] as const)('the Shift mark reads on %s chips', (name) => {
    expect(contrastRatio(C.COLORS.chipShiftMark, C.COLORS[name])).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // A review asked for a clearer bar: only the current letter is bright; the
  // rest are faded, by color rather than opacity, so their letters keep AAA
  // (TEXT_ON below).
  it.each(['chipNext', 'chipHeld', 'chipSlipped'] as const)('fades %s chips below the current one', (name) => {
    expect(relativeLuminance(C.COLORS[name])).toBeLessThan(relativeLuminance(C.COLORS.chipCurrent) * 0.6);
  });
});

const css = (color: string) => parseInt(color.slice(1), 16);

// Every place each text color is drawn. Outlined text is measured against its
// outline, which is all that touches it.
const TEXT_ON = {
  textOutline: ['light', 'good', 'alert'],
  // The badges (M10b review 4) and the timing label's points tab.
  gradePerfect: ['ink'],
  gradeGreat: ['ink'],
  gradeCloseCall: ['ink'],
  readyBadge: ['ink'],
  calloutCard: ['ink'],
  badgeTab: ['light'],
  debugPanel: ['ink'],
  // The buttons (M11 review 2).
  button: ['ink'],
  // The HUD's, the lockup's and the screens' cards.
  card: ['ink'],
  // The dark cards: the how-to steps' lime numbers and cream names and text
  // (M11 review), the game-over card's lime captions and cream numbers.
  darkCard: ['light', 'good'],
  // A SLEEPYSAM GAME on the splash.
  splash: ['light'],
  // GAME OVER and the screens' hints on the void.
  void: ['light'],
  chipNext: ['ink'],
  chipHeld: ['ink'],
  chipCurrent: ['ink'],
  chipSlipped: ['ink'],
} as const satisfies Partial<Record<keyof typeof C.COLORS, readonly (keyof typeof C.TEXT_COLORS)[]>>;

const TEXT_PAIRS = Object.entries(TEXT_ON).flatMap(([bg, texts]) => texts.map((text) => [text, bg] as const));

// The screens (M11) keep their parts clear of each other.
describe('screen layouts', () => {
  // Anton's capitals stand about 0.9 of its size.
  const ANTON_CAPS = 0.9;
  const B = C.PROMPT_BUTTON;
  // A button's reach below what comes before it, and its hint's middle below
  // that same edge (the hint is small text, half its size tall).
  const buttonReach = B.gapAbove + 2 * B.edgeWidth + B.height;
  const hintFoot = B.gapAbove + B.edgeWidth + B.height / 2 + B.hintBelow + C.FONT_SIZES.small / 2;

  it('keeps a button\'s hint clear of the button as it pulses', () => {
    const pulsedHalf = (B.height / 2 + B.edgeWidth) * C.PROMPT_PULSE_SCALE;
    expect(B.hintBelow - C.FONT_SIZES.small / 2).toBeGreaterThan(pulsedHalf);
  });

  it('fits the title lockup and its button on screen', () => {
    const { padY, lineGap } = C.TITLE;
    const lockup = ANTON_CAPS * (C.FONT_SIZES.lockup + C.FONT_SIZES.lockupSub) + lineGap + 2 * padY;
    expect(lockup + buttonReach).toBeLessThan(C.GAME_HEIGHT);
  });

  // M11 review 5: the title leans like the badges.
  it('leans the title like the badges', () => {
    expect(C.TITLE.lean).toBeCloseTo(C.BADGE.slant / C.BADGE.height);
  });

  // The interactive tutorial's step card sits in the band above the wall that
  // the HUD leaves free until step 3, then between the HUD's cards; step 3's
  // Start button and hint go under it, on a clear stage, above the figure.
  // The interactive tutorial; where its cards go is in tests/tutorial-layout.test.ts.
  describe('the tutorial', () => {
    const T = C.TUTORIAL;
    const figureTop = C.FIGURE_FLOOR_Y - C.FIGURE_HEIGHT;

    it("keeps the Start hint's card clear of the button as it pulses, and roomy for its words", () => {
      const pulsedHalf = (B.height / 2 + B.edgeWidth) * C.PROMPT_PULSE_SCALE;
      expect(B.hintBelow - C.HINT_CARD.height / 2 - C.DARK_CARD.edgeWidth).toBeGreaterThan(pulsedHalf);
      expect(C.HINT_CARD.height).toBeGreaterThan(C.FONT_SIZES.small);
      expect(C.HINT_CARD.cut).toBeLessThan(C.HINT_CARD.height / 2);
    });

    it('waits on step 3 until the cleared wall has played out', () => {
      const { pixelMs, restoreMs, holdMs, exitMs } = C.WALL_COMPLETE;
      expect(T.continueLockoutMs).toBeGreaterThanOrEqual(C.LOCK_RUSH_DURATION + pixelMs + restoreMs + holdMs + exitMs);
    });

    it('counts READY?, 3, 2, 1 on beats of the game track, over the stage and above the figure', () => {
      const beatMs = 60000 / C.AUDIO.standby.bpm;
      expect(C.READY_COUNT.stepMs).toBeCloseTo(beatMs, 0);
      expect(C.READY_COUNT.readyMs).toBeCloseTo(2 * beatMs, 0);
      expect(C.READY_COUNT.y - C.BADGE.height / 2).toBeGreaterThan(C.HUD.top + C.HUD.height);
      expect(C.READY_COUNT.y + C.BADGE.height / 2).toBeLessThan(figureTop);
    });
  });

  // M11 review 4 asked for room to breathe: the card, Play again and its
  // hint keep a margin above and below them.
  it('fits the game-over card, its button and hint on screen with room to spare', () => {
    const { cardHeight, minCardWidth } = C.GAME_OVER;
    const margin = (C.GAME_HEIGHT - cardHeight - hintFoot) / 2;
    expect(margin).toBeGreaterThanOrEqual(32);
    expect(minCardWidth).toBeLessThan(C.GAME_WIDTH);
  });

  it('stacks the game-over rows inside their card, each clear of the next', () => {
    const { cardHeight, rows, ruleWidth } = C.GAME_OVER;
    const heading = (ANTON_CAPS * C.FONT_SIZES.heading) / 2;
    const caption = C.FONT_SIZES.hudLabel / 2;
    const score = (ANTON_CAPS * C.FONT_SIZES.title) / 2;
    const walls = (ANTON_CAPS * C.FONT_SIZES.hud) / 2;
    const drop = C.TRAY.lowY - C.TRAY.highY;
    // On top of these generous letter heights, so the real gaps are wider.
    const gap = 8;
    expect(rows.headingY - heading).toBeGreaterThanOrEqual(gap);
    expect(rows.headingY + heading + gap).toBeLessThanOrEqual(rows.ruleY - ruleWidth / 2);
    expect(rows.ruleY + ruleWidth / 2 + gap).toBeLessThanOrEqual(rows.scoreCaptionY - caption);
    expect(rows.scoreCaptionY + caption + gap).toBeLessThanOrEqual(rows.scoreY - score);
    expect(rows.scoreY + score + gap).toBeLessThanOrEqual(rows.barY - C.SLASH.height / 2);
    expect(rows.barY + Math.max(drop, C.SLASH.height / 2) + gap).toBeLessThanOrEqual(rows.wallsCaptionY - caption);
    expect(rows.wallsCaptionY + caption + gap).toBeLessThanOrEqual(rows.wallsY - walls);
    expect(rows.wallsY + walls + gap).toBeLessThanOrEqual(cardHeight);
  });

  it('fits the pause heading and its button on screen', () => {
    const half = C.HEADING_CARD.height / 2;
    expect(C.PAUSE.headingY - half).toBeGreaterThan(0);
    expect(C.PAUSE.headingY + half + buttonReach).toBeLessThan(C.GAME_HEIGHT);
  });
});

describe('text contrast', () => {
  it('keeps every font size at WCAG large-text size', () => {
    expect(Math.min(...Object.values(C.FONT_SIZES))).toBeGreaterThanOrEqual(LARGE_TEXT_PX);
  });

  it('checks every text color somewhere', () => {
    const covered = new Set(TEXT_PAIRS.map(([text]) => text));
    expect([...covered].sort()).toEqual(Object.keys(C.TEXT_COLORS).sort());
  });

  it.each(TEXT_PAIRS)('%s text meets AAA on %s', (text, bg) => {
    const ratio = contrastRatio(css(C.TEXT_COLORS[text]), C.COLORS[bg as keyof typeof TEXT_ON]);
    expect(ratio).toBeGreaterThanOrEqual(AAA_LARGE_TEXT_RATIO);
  });

  it('measures known pairs correctly', () => {
    expect(contrastRatio(0x000000, 0xffffff)).toBeCloseTo(21, 5);
    expect(contrastRatio(0x777777, 0xffffff)).toBeCloseTo(4.48, 2);
  });
});
