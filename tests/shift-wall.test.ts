import { describe, expect, it } from 'vitest';
import { LANE_COUNT, PROMPT_APPEAR_DELAY, SHIFT_WALL_SLIDE, SHIFT_WALL_TELEGRAPH, SHIFT_WALL_T_RANGE } from '@/config';
import { isAligned, moveLane } from '@/logic/lanes';
import { LetterSequence } from '@/logic/sequence';
import { ShiftWall, pickSlideLane } from '@/logic/shift-wall';
import { seeded } from './seeded';

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);
const FRAME = 16;

describe('ShiftWall', () => {
  it('picks its trigger inside SHIFT_WALL_T_RANGE', () => {
    for (const seed of SEEDS) {
      const { triggerT } = new ShiftWall(true, 3, seeded(seed));
      expect(triggerT).toBeGreaterThanOrEqual(SHIFT_WALL_T_RANGE[0]);
      expect(triggerT).toBeLessThanOrEqual(SHIFT_WALL_T_RANGE[1]);
    }
  });

  it('never fires on an ordinary wall', () => {
    const shift = new ShiftWall(false, 3, seeded(1));
    expect(shift.update(0.99, 3, FRAME)).toBeNull();
  });

  it('waits for the trigger point', () => {
    const shift = new ShiftWall(true, 3, seeded(1));
    expect(shift.update(shift.triggerT - 0.01, 2, FRAME)).toBeNull();
    expect(shift.update(shift.triggerT, 2, FRAME)?.type).toBe('warn');
  });

  it('waits until at least one letter is held, even past the trigger point', () => {
    const shift = new ShiftWall(true, 3, seeded(1));
    expect(shift.update(0.7, 0, FRAME)).toBeNull();
    expect(shift.update(0.8, 1, FRAME)?.type).toBe('warn');
  });

  it('warns for SHIFT_WALL_TELEGRAPH, then slides to the lane it warned about, once', () => {
    const shift = new ShiftWall(true, 3, seeded(5));
    const warn = shift.update(1, 1, FRAME);
    if (warn?.type !== 'warn') throw new Error('expected a warning');
    expect(shift.warning).toBe(true);

    let elapsed = 0;
    let slide = null;
    while (slide === null) {
      slide = shift.update(1, 1, FRAME);
      elapsed += FRAME;
    }
    expect(elapsed).toBeGreaterThanOrEqual(SHIFT_WALL_TELEGRAPH);
    expect(elapsed).toBeLessThan(SHIFT_WALL_TELEGRAPH + FRAME);
    expect(slide).toEqual({ type: 'slide', toLane: warn.toLane });
    expect(shift.warning).toBe(false);
    expect(shift.update(1, 1, FRAME)).toBeNull();
  });

  it('points its arrow toward the new lane', () => {
    for (const seed of SEEDS) {
      const warn = new ShiftWall(true, 3, seeded(seed)).update(1, 1, FRAME);
      if (warn?.type !== 'warn') throw new Error('expected a warning');
      expect(Math.sign(warn.toLane - 3)).toBe(warn.dir);
    }
  });
});

describe('pickSlideLane', () => {
  it('slides 1-2 lanes and stays on the stage, from every lane', () => {
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      for (const seed of SEEDS.slice(0, 40)) {
        const to = pickSlideLane(lane, seeded(seed));
        expect(to).toBeGreaterThanOrEqual(0);
        expect(to).toBeLessThan(LANE_COUNT);
        expect(Math.abs(to - lane)).toBeGreaterThanOrEqual(SHIFT_WALL_SLIDE[0]);
        expect(Math.abs(to - lane)).toBeLessThanOrEqual(SHIFT_WALL_SLIDE[1]);
      }
    }
  });
});

// PLAN.md M6 done-when: holding 3 letters while tapping an arrow to line up
// again works, and the next letter appears right away.
describe('lining up again after a Shift Wall', () => {
  it('keeps the held letters and shows the next prompt the moment the figure is lined up', () => {
    let figureLane = 3;
    let holeLane = 3;
    const seq = new LetterSequence();
    seq.startWall(['a', 'k', 'v', 'p']);
    seq.setAligned(true);
    for (const [letter, code] of [
      ['a', 'KeyA'],
      ['k', 'KeyK'],
      ['v', 'KeyV'],
    ] as const) {
      seq.press(letter, code);
      seq.tick(PROMPT_APPEAR_DELAY);
    }
    expect(seq.heldCount).toBe(3);

    const shift = new ShiftWall(true, holeLane, seeded(2));
    shift.update(1, seq.heldCount, FRAME);
    let slide = null;
    while (slide === null) slide = shift.update(1, seq.heldCount, FRAME);
    if (slide.type !== 'slide') throw new Error('expected a slide');
    holeLane = slide.toLane;
    seq.setAligned(isAligned(figureLane, holeLane));

    expect(seq.current).toBeNull();
    expect(seq.view().held).toEqual(['a', 'k', 'v']);
    expect(seq.press('p', 'KeyP')).toEqual({ type: 'wrongKey', key: 'p' });

    const dir = holeLane > figureLane ? 1 : -1;
    while (figureLane !== holeLane) {
      figureLane = moveLane(figureLane, dir);
      seq.setAligned(isAligned(figureLane, holeLane));
    }
    expect(seq.current).toBe('p');
    expect(seq.view().held).toEqual(['a', 'k', 'v']);
  });
});
