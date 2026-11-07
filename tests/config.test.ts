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

  it('keeps the lane markers on the floor, above the tray', () => {
    expect(C.LANE_MARKER_FRONT_Y).toBeGreaterThan(C.FIGURE_FLOOR_Y);
    expect(C.LANE_MARKER_FRONT_Y).toBeLessThanOrEqual(C.STAGE_BOTTOM_Y);
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

  it('slides the Shift Wall hole at least one lane', () => {
    expect(C.SHIFT_WALL_SLIDE[0]).toBeGreaterThanOrEqual(1);
  });
});

describe('graphics contrast', () => {
  it.each(['wall', 'floorLine', 'trayEdge', 'laneMarker', 'laneMarkerLit', 'figure'] as const)(
    '%s stands out from the stage',
    (name) => {
      expect(contrastRatio(C.COLORS[name], C.COLORS.stage)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    },
  );

  it('keeps the figure readable in front of the wall', () => {
    expect(contrastRatio(C.COLORS.figure, C.COLORS.wall)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it('keeps the Shift Wall warning readable: wall on the stage, arrow on the wall', () => {
    expect(contrastRatio(C.COLORS.wallWarning, C.COLORS.stage)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
    expect(contrastRatio(C.COLORS.shiftArrow, C.COLORS.wallWarning)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it.each(['chipHeld', 'chipCurrent', 'chipSlipped'] as const)('%s chips stand out from the tray', (name) => {
    expect(contrastRatio(C.COLORS[name], C.COLORS.tray)).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });

  it.each(['chipHeld', 'chipCurrent', 'chipSlipped'] as const)('the Shift mark reads on %s chips', (name) => {
    expect(contrastRatio(C.COLORS.chipShiftMark, C.COLORS[name])).toBeGreaterThanOrEqual(NON_TEXT_RATIO);
  });
});

const css = (color: string) => parseInt(color.slice(1), 16);

// Every place each text color is drawn.
const TEXT_ON = {
  stage: ['ink', 'muted', 'accent', 'danger'],
  panel: ['ink', 'muted', 'accent', 'danger'],
  labelStroke: ['ink', 'accent', 'danger'],
  chipHeld: ['onChip'],
  chipCurrent: ['onChip'],
  chipSlipped: ['onChip'],
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
