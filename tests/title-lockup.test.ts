import { describe, expect, it } from 'vitest';
import { alongLean, layoutTitleLockup, type TitleLockupSpec, type WordInk } from '@/logic/title-lockup';

// Anton's measurements at the title's sizes, roughly: SHAPE at 214 px and
// SHIFT at 92 px.
const SHAPE: WordInk = { inkLeft: 4.4, inkRight: 494.4, ascent: 185.6, descent: 1.7 };
const SHIFT: WordInk = { inkLeft: 1.9, inkRight: 181.4, ascent: 79.8, descent: 0.7 };
const S_LEFT = 13;
const SPEC: TitleLockupSpec = {
  lean: 24 / 92,
  lineGap: 20,
  padX: 48,
  padY: 40,
  stepGap: 22,
  lowRun: 28,
  step: { across: 14, drop: 16 },
  slashesReach: 32,
};

const layout = layoutTitleLockup(SHAPE, SHIFT, S_LEFT, SPEC);
const shapeTop = layout.shape.y - SHAPE.ascent;

describe('layoutTitleLockup', () => {
  it("puts SHIFT's top-right corner on the E's leaning right edge", () => {
    const eRight = layout.shape.x + SHAPE.inkRight;
    const tTop = layout.shift.y - SHIFT.ascent;
    const tRight = layout.shift.x + SHIFT.inkRight + SHIFT.ascent * SPEC.lean;
    expect(tRight).toBeCloseTo(alongLean(eRight, layout.shape.y, tTop, SPEC.lean));
  });

  it('sets SHIFT lineGap below SHAPE', () => {
    expect(layout.shift.y - SHIFT.ascent - layout.shape.y).toBeCloseTo(SPEC.lineGap);
  });

  it("starts the line's slashes where the S reaches furthest left", () => {
    const first = layout.line[0]!;
    expect(first.x - SPEC.slashesReach).toBeCloseTo(layout.shape.x + S_LEFT);
  });

  it("steps the line down by the bar's step to SHIFT's middle, ending stepGap short of SHIFT", () => {
    const [start, stepFrom, stepTo, end] = layout.line as [
      { x: number; y: number },
      { x: number; y: number },
      { x: number; y: number },
      { x: number; y: number },
    ];
    const middle = layout.shift.y - SHIFT.ascent / 2;
    expect(start.y).toBe(stepFrom.y);
    expect(stepTo.y - stepFrom.y).toBeCloseTo(SPEC.step.drop);
    expect(stepTo.x - stepFrom.x).toBeCloseTo(SPEC.step.across);
    expect(end.y).toBeCloseTo(middle);
    expect(end.x - stepTo.x).toBeCloseTo(SPEC.lowRun);
    const shiftLeft = alongLean(layout.shift.x + SHIFT.inkLeft, layout.shift.y, middle, SPEC.lean);
    expect(shiftLeft - end.x).toBeCloseTo(SPEC.stepGap);
    expect(start.x).toBeLessThan(stepFrom.x);
  });

  it('pads the card evenly round the lockup', () => {
    expect(shapeTop).toBeCloseTo(SPEC.padY);
    expect(layout.shape.x + S_LEFT).toBeCloseTo(SPEC.padX);
    const eTopRight = layout.shape.x + SHAPE.inkRight + SHAPE.ascent * SPEC.lean;
    expect(layout.width - eTopRight).toBeCloseTo(SPEC.padX);
    expect(layout.height - (layout.shift.y + SHIFT.descent)).toBeCloseTo(SPEC.padY);
  });
});
