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

  it('fits every chip inside the tray', () => {
    expect(C.CHIP.size).toBeLessThan(C.TRAY_HEIGHT);
    expect(C.CHIP.currentSize).toBeLessThan(C.TRAY_HEIGHT);
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
  it.each(['wall', 'floorLine', 'tray', 'figure', 'outline'] as const)('%s stands out from the stage', (name) => {
    expect(contrastRatio(C.COLORS[name], C.COLORS.stage)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // The lit tile and the Shift Wall's target outline sit on the floor, and
  // the floor's edge lines run along it.
  it.each(['laneLit', 'wallWarning', 'floorLine', 'figure'] as const)('%s stands out from the floor', (name) => {
    expect(contrastRatio(C.COLORS[name], C.COLORS.floor)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  // M10: the mocks' black figure is only 1.5:1 on the dark green wall, so its
  // cream edge is what outlines it there.
  it('keeps the figure readable in front of the wall by its edge', () => {
    expect(contrastRatio(C.COLORS.figureEdge, C.COLORS.wall)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.figureEdge, C.COLORS.figure)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it('keeps the Shift Wall warning readable: wall on the stage, arrow on the wall, callout arrow in its outline', () => {
    expect(contrastRatio(C.COLORS.wallWarning, C.COLORS.stage)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.shiftArrow, C.COLORS.wallWarning)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.shiftArrow, C.COLORS.textOutline)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it.each(['chipHeld', 'chipCurrent', 'chipSlipped'] as const)('%s chips stand out from the tray', (name) => {
    expect(contrastRatio(C.COLORS[name], C.COLORS.tray)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it.each(['chipHeld', 'chipCurrent', 'chipSlipped'] as const)('the Shift mark reads on %s chips', (name) => {
    expect(contrastRatio(C.COLORS.chipShiftMark, C.COLORS[name])).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it('outlines the next-letter preview, and its Shift mark, clearly on the tray', () => {
    expect(contrastRatio(C.COLORS.chipNextEdge, C.COLORS.tray)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.chipNextEdge, C.COLORS.chipNext)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });
});

const css = (color: string) => parseInt(color.slice(1), 16);

// Every place each text color is drawn. Outlined text is measured against its
// outline, which is all that touches it.
const TEXT_ON = {
  stage: ['ink', 'muted', 'accent', 'danger'],
  textOutline: ['light', 'good', 'alert', 'shift'],
  debugPanel: ['ink'],
  // The HUD sits on the pale sheets in the top corners; a long score reaches
  // the sage disc.
  collagePaper: ['ink'],
  collageSage: ['ink'],
  tray: ['light'],
  chipNext: ['light'],
  chipHeld: ['ink'],
  chipCurrent: ['ink'],
  chipSlipped: ['ink'],
} as const satisfies Partial<Record<keyof typeof C.COLORS, readonly (keyof typeof C.TEXT_COLORS)[]>>;

const TEXT_PAIRS = Object.entries(TEXT_ON).flatMap(([bg, texts]) => texts.map((text) => [text, bg] as const));

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
