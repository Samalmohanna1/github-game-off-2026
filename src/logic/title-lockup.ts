import type { Point } from '@/logic/perspective';

// The title lockup's geometry (M11 review 5, the user's pick from the title
// concepts): SHAPE over SHIFT, both leaning, on a dark card, with the bar's
// line leading into SHIFT. Pure, so it is tested without a canvas; the words'
// measurements come in from the renderer.

// One word's ink, measured upright from its pen start on its baseline: how
// far its letters reach left and right, and up and down (down positive).
export interface WordInk {
  readonly inkLeft: number;
  readonly inkRight: number;
  readonly ascent: number;
  readonly descent: number;
}

export interface TitleLockupSpec {
  readonly lean: number; // px across per px up
  readonly lineGap: number; // between SHAPE's baseline and SHIFT's tallest letter
  readonly padX: number; // the card's padding round the lockup's leftmost and rightmost reach
  readonly padY: number;
  readonly stepGap: number; // between the line's end and SHIFT
  readonly lowRun: number; // the line's run after its step, before that gap
  readonly lineRise: number; // the line's height after its step, above SHIFT's baseline
  readonly step: { readonly across: number; readonly drop: number }; // the bar's step
  readonly slashesReach: number; // how far the bar's slashes reach left of its line's start
}

export interface TitleLockupLayout {
  // Each word's pen start on its baseline, in the card's own space (its
  // top-left corner at 0, 0).
  readonly shape: Point;
  readonly shift: Point;
  readonly line: readonly Point[]; // the bar's line, its slashes before its first point
  readonly width: number;
  readonly height: number;
}

// Where a leaning edge through x at height y0 crosses height y (y down).
export function alongLean(x: number, y0: number, y: number, lean: number): number {
  return x - (y - y0) * lean;
}

// Lays the lockup out on its card. `sLeft` is where SHAPE's letters reach
// furthest left once leaning, from its pen start: the foot of its S's curve,
// which the renderer finds by looking.
//  - SHIFT's right edge lies on the E's leaning right edge.
//  - The line's slashes start under the S: their feet reach as far left as
//    the S does.
//  - The line runs, steps down by the bar's step to lineRise above SHIFT's
//    baseline (the top of its S's lower tail), and ends stepGap short of
//    SHIFT's leaning left edge.
export function layoutTitleLockup(shape: WordInk, shift: WordInk, sLeft: number, spec: TitleLockupSpec): TitleLockupLayout {
  const { lean } = spec;
  // Upright frame: SHAPE's pen start on its baseline at 0, 0.
  const shiftBaseline = spec.lineGap + shift.ascent;
  const shiftX = alongLean(shape.inkRight, 0, shiftBaseline, lean) - shift.inkRight;
  const low = shiftBaseline - spec.lineRise;
  const high = low - spec.step.drop;
  const end = alongLean(shiftX + shift.inkLeft, shiftBaseline, low, lean) - spec.stepGap;
  const stepEnd = end - spec.lowRun;
  const start = sLeft + spec.slashesReach;
  const line = [
    { x: start, y: high },
    { x: stepEnd - spec.step.across, y: high },
    { x: stepEnd, y: low },
    { x: end, y: low },
  ];

  const left = sLeft;
  const right = shape.inkRight + shape.ascent * lean; // the E's top-right corner
  const top = -shape.ascent;
  const bottom = Math.max(shiftBaseline + shift.descent, low);
  const dx = spec.padX - left;
  const dy = spec.padY - top;
  const move = (p: Point): Point => ({ x: p.x + dx, y: p.y + dy });
  return {
    shape: move({ x: 0, y: 0 }),
    shift: move({ x: shiftX, y: shiftBaseline }),
    line: line.map(move),
    width: right - left + 2 * spec.padX,
    height: bottom - top + 2 * spec.padY,
  };
}
