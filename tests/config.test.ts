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
  const { master, tick, click, slip, fanfare, shiftAlert, whoosh, hit, whomp } = C.AUDIO;

  it('keeps every gain above silence and at most full scale', () => {
    // Above zero too: the envelopes ramp exponentially, which can't reach 0.
    const gains = [master, tick.gain, click.gain, slip.gain, fanfare.gain, shiftAlert.gain, whoosh.gain, hit.gain, whomp.gain];
    for (const gain of gains) {
      expect(gain).toBeGreaterThan(0);
      expect(gain).toBeLessThanOrEqual(1);
    }
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
    expect(whomp.wahLowHz).toBeLessThan(whomp.wahHighHz);
    expect(whomp.wahOpenMs).toBeLessThan(whomp.noteMs * whomp.holdShare);
    expect(whomp.holdShare).toBeGreaterThan(0);
    expect(whomp.holdShare).toBeLessThan(1);
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
  it.each(['gradePerfect', 'gradeGreat', 'gradeCloseCall', 'calloutCard', 'promptCard'] as const)(
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

  // The cream cards stand on the void, and the score card's rule reads on
  // them; the bar's line, slashes and its letter squares, lit and unlit, all
  // read on the bar.
  it('sets the cards off from the void, and their rule on them', () => {
    expect(contrastRatio(C.COLORS.card, C.COLORS.void)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.cardRule, C.COLORS.card)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it.each(['trayLine', 'trayAccent', 'trayDim'] as const)('%s reads on the bar', (name) => {
    expect(contrastRatio(C.COLORS[name], C.COLORS.tray)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it.each(['chipHeld', 'chipHeldEdge', 'chipCurrent', 'chipSlipped', 'chipFocus'] as const)(
    '%s stands out from the bar',
    (name) => {
      expect(contrastRatio(C.COLORS[name], C.COLORS.tray)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    },
  );

  it.each(['chipHeld', 'chipCurrent', 'chipSlipped'] as const)('the Shift mark reads on %s chips', (name) => {
    expect(contrastRatio(C.COLORS.chipShiftMark, C.COLORS[name])).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it('outlines the next-letter preview, and its Shift mark, clearly on the bar', () => {
    expect(contrastRatio(C.COLORS.chipNextEdge, C.COLORS.tray)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.chipNextEdge, C.COLORS.chipNext)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });
});

const css = (color: string) => parseInt(color.slice(1), 16);

// Every place each text color is drawn. Outlined text is measured against its
// outline, which is all that touches it.
const TEXT_ON = {
  textOutline: ['light', 'good', 'alert'],
  // The badges (M10b review 4), the timing label's points tab and NEW BEST.
  gradePerfect: ['ink'],
  gradeGreat: ['ink'],
  gradeCloseCall: ['ink'],
  calloutCard: ['ink'],
  promptCard: ['ink'],
  badgeTab: ['light', 'good'],
  debugPanel: ['ink'],
  // The HUD's, the logo's, the pause card's and the game-over cards' text.
  card: ['ink'],
  // The title's controls (M11) on the bar, and the game-over hint on the void.
  tray: ['light'],
  void: ['light'],
  chipNext: ['light'],
  chipHeld: ['ink'],
  chipCurrent: ['ink'],
  chipSlipped: ['ink'],
} as const satisfies Partial<Record<keyof typeof C.COLORS, readonly (keyof typeof C.TEXT_COLORS)[]>>;

const TEXT_PAIRS = Object.entries(TEXT_ON).flatMap(([bg, texts]) => texts.map((text) => [text, bg] as const));

// The screens (M11) keep their parts clear of each other.
describe('screen layouts', () => {
  const k = (height: number) => height / C.CARD.height;
  const slashReach = (height: number) => (C.CARD.slashGap + C.SLASH.width + C.SLASH.gap + C.SLASH.width / 3) * k(height);

  // The wall's top stands just below the horizon at any depth.
  it('sets the title logo above the wall, and the prompt between the figure and the bar', () => {
    const wallTop = C.HORIZON_Y + C.TITLE.wallScale * (C.FIGURE_FLOOR_Y - C.HORIZON_Y - C.WALL_HEIGHT);
    expect(C.TITLE.logo.y + C.TITLE.logo.height).toBeLessThan(wallTop);
    const feet = C.HORIZON_Y + C.TITLE.figureScale * (C.FIGURE_FLOOR_Y - C.HORIZON_Y);
    expect(C.TITLE.promptY - C.PROMPT_BADGE.height / 2).toBeGreaterThan(feet);
    expect(C.TITLE.promptY + C.PROMPT_BADGE.height / 2).toBeLessThan(C.STAGE_BOTTOM_Y);
    expect(C.TITLE.wallScale).toBeLessThan(C.TITLE.figureScale);
    expect(Math.floor(C.LANE_COUNT / 2) + C.TITLE.holeLanes).toBeLessThan(C.LANE_COUNT);
  });

  it('fits the title controls in the bar', () => {
    expect(C.TRAY.rowY + C.CONTROLS.capHeight / 2).toBeLessThan(C.TRAY.lowY);
    expect(C.TRAY.rowY - C.CONTROLS.capHeight / 2).toBeGreaterThan(0);
  });

  it('keeps the game-over cards apart, with Play again below them', () => {
    const { top, cardHeight, middleGap, promptY, hintY } = C.GAME_OVER;
    expect(2 * slashReach(cardHeight)).toBeLessThan(middleGap);
    expect(top + cardHeight).toBeLessThan(promptY - C.PROMPT_BADGE.height / 2);
    expect(promptY + C.PROMPT_BADGE.height / 2).toBeLessThan(hintY);
    expect(hintY).toBeLessThan(C.GAME_HEIGHT);
  });

  it('sets the pause card above its prompt', () => {
    expect(C.PAUSE.cardY + C.PAUSE.cardHeight / 2).toBeLessThan(C.PAUSE.promptY - C.PROMPT_BADGE.height / 2);
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
