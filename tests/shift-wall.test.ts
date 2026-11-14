import { describe, expect, it } from 'vitest';
import {
  LANE_COUNT,
  PROMPT_APPEAR_DELAY,
  SHIFT_WALL_PAUSE,
  SHIFT_WALL_SLIDE,
  SHIFT_WALL_TELEGRAPH,
  SHIFT_WALL_T_RANGE,
} from '@/config';
import { isAligned, stepToward } from '@/logic/lanes';
import { LetterSequence } from '@/logic/sequence';
import { ShiftWall, pickSlideLane } from '@/logic/shift-wall';
import { seeded } from './seeded';

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);
const FRAME = 16;
// Letters still to hold: more than one, so only the trigger point can fire.
const MANY_LEFT = 3;

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
    expect(shift.update(0.99, 3, MANY_LEFT, FRAME)).toBeNull();
  });

  it('waits for the trigger point', () => {
    const shift = new ShiftWall(true, 3, seeded(1));
    expect(shift.update(shift.triggerT - 0.01, 2, MANY_LEFT, FRAME)).toBeNull();
    expect(shift.update(shift.triggerT, 2, MANY_LEFT, FRAME)?.type).toBe('warn');
  });

  it('waits until at least one letter is held, even past the trigger point', () => {
    const shift = new ShiftWall(true, 3, seeded(1));
    expect(shift.update(0.7, 0, MANY_LEFT, FRAME)).toBeNull();
    expect(shift.update(0.8, 1, MANY_LEFT, FRAME)?.type).toBe('warn');
  });

  it('fires before the trigger point once only one letter is left', () => {
    const shift = new ShiftWall(true, 3, seeded(1));
    expect(shift.update(0.05, 1, 2, FRAME)).toBeNull();
    expect(shift.update(0.06, 2, 1, FRAME)?.type).toBe('warn');
  });

  it('holds the pose lock back only while it warns', () => {
    const shift = new ShiftWall(true, 3, seeded(5));
    expect(shift.letsPoseLock).toBe(true);
    shift.update(1, 1, MANY_LEFT, FRAME);
    expect(shift.letsPoseLock).toBe(false);
    let slid = false;
    while (!slid) slid = shift.update(1, 1, MANY_LEFT, FRAME)?.type === 'slide';
    expect(shift.letsPoseLock).toBe(true);
    expect(new ShiftWall(false, 3, seeded(1)).letsPoseLock).toBe(true);
  });

  it('warns for SHIFT_WALL_TELEGRAPH, then slides to the lane it warned about, once', () => {
    const shift = new ShiftWall(true, 3, seeded(5));
    const warn = shift.update(1, 1, MANY_LEFT, FRAME);
    if (warn?.type !== 'warn') throw new Error('expected a warning');
    expect(shift.warning).toBe(true);

    let elapsed = 0;
    let slide = null;
    while (slide === null) {
      slide = shift.update(1, 1, MANY_LEFT, FRAME);
      elapsed += FRAME;
    }
    expect(elapsed).toBeGreaterThanOrEqual(SHIFT_WALL_TELEGRAPH);
    expect(elapsed).toBeLessThan(SHIFT_WALL_TELEGRAPH + FRAME);
    expect(slide).toEqual({ type: 'slide', toLane: warn.toLane });
    expect(shift.warning).toBe(false);
    expect(shift.update(1, 1, MANY_LEFT, FRAME)).toBeNull();
  });

  it('holds the wall still for SHIFT_WALL_PAUSE from the warning, past the slide', () => {
    const shift = new ShiftWall(true, 3, seeded(5));
    expect(shift.holding).toBe(false);
    shift.update(1, 1, MANY_LEFT, FRAME);
    expect(shift.holding).toBe(true);

    let elapsed = 0;
    let slidAt: number | null = null;
    while (shift.holding) {
      if (shift.update(1, 1, MANY_LEFT, FRAME)?.type === 'slide') slidAt = elapsed;
      elapsed += FRAME;
    }
    expect(slidAt).not.toBeNull();
    expect(elapsed).toBeGreaterThan(slidAt!);
    expect(elapsed).toBeGreaterThanOrEqual(SHIFT_WALL_PAUSE);
    expect(elapsed).toBeLessThan(SHIFT_WALL_PAUSE + FRAME);
  });

  it('never holds an ordinary wall, or before the warning', () => {
    const plain = new ShiftWall(false, 3, seeded(1));
    plain.update(0.99, 3, MANY_LEFT, FRAME);
    expect(plain.holding).toBe(false);

    const waiting = new ShiftWall(true, 3, seeded(1));
    waiting.update(waiting.triggerT - 0.01, 2, MANY_LEFT, FRAME);
    expect(waiting.holding).toBe(false);
  });

  it('points its arrow toward the new lane', () => {
    for (const seed of SEEDS) {
      const warn = new ShiftWall(true, 3, seeded(seed)).update(1, 1, MANY_LEFT, FRAME);
      if (warn?.type !== 'warn') throw new Error('expected a warning');
      expect(Math.sign(warn.toLane - 3)).toBe(warn.dir);
    }
  });

  it('names the upcoming lane only while it warns', () => {
    const shift = new ShiftWall(true, 3, seeded(5));
    expect(shift.upcomingLane).toBeNull();
    const warn = shift.update(1, 1, MANY_LEFT, FRAME);
    if (warn?.type !== 'warn') throw new Error('expected a warning');
    expect(shift.upcomingLane).toBe(warn.toLane);
    let slid = false;
    while (!slid) slid = shift.update(1, 1, MANY_LEFT, FRAME)?.type === 'slide';
    expect(shift.upcomingLane).toBeNull();
    expect(new ShiftWall(false, 3, seeded(1)).upcomingLane).toBeNull();
  });
});

describe('pickSlideLane', () => {
  it('slides SHIFT_WALL_SLIDE lanes and stays on the stage, from every lane', () => {
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

// PLAN.md M6 done-when: holding 3 letters while pressing Space to line up
// again works, and the next letter appears right away.
describe('lining up again after a Shift Wall', () => {
  it('takes one Space press, made during the warning or after the slide', () => {
    for (let hole = 0; hole < LANE_COUNT; hole++) {
      for (const seed of SEEDS.slice(0, 20)) {
        const shift = new ShiftWall(true, hole, seeded(seed));
        shift.update(1, 1, MANY_LEFT, FRAME);
        const early = stepToward(hole, shift.upcomingLane ?? hole);
        let slide = null;
        while (slide === null) slide = shift.update(1, 1, MANY_LEFT, FRAME);
        if (slide.type !== 'slide') throw new Error('expected a slide');
        const late = stepToward(hole, slide.toLane);
        expect(early).toBe(slide.toLane);
        expect(late).toBe(slide.toLane);
      }
    }
  });

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
    shift.update(1, seq.heldCount, seq.leftCount, FRAME);
    let slide = null;
    while (slide === null) slide = shift.update(1, seq.heldCount, seq.leftCount, FRAME);
    if (slide.type !== 'slide') throw new Error('expected a slide');
    holeLane = slide.toLane;
    seq.setAligned(isAligned(figureLane, holeLane));

    expect(seq.current).toBeNull();
    expect(seq.view().held).toEqual(['a', 'k', 'v']);
    expect(seq.press('p', 'KeyP')).toEqual({ type: 'wrongKey', key: 'p' });

    while (figureLane !== holeLane) {
      figureLane = stepToward(figureLane, holeLane);
      seq.setAligned(isAligned(figureLane, holeLane));
    }
    expect(seq.current).toBe('p');
    expect(seq.view().held).toEqual(['a', 'k', 'v']);
  });
});
