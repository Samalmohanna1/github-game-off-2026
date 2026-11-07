import { describe, expect, it } from 'vitest';
import { NO_DEV_OPTIONS, parseDevOptions } from '@/logic/dev-options';

describe('parseDevOptions', () => {
  it('plays a normal run with no options', () => {
    expect(parseDevOptions('')).toBe(NO_DEV_OPTIONS);
    expect(parseDevOptions('?other=1')).toBe(NO_DEV_OPTIONS);
  });

  it('starts at the wall asked for', () => {
    expect(parseDevOptions('?wall=13')).toEqual({ startWall: 13, forceShiftWall: false });
  });

  it('ignores a wall that is not a whole number from 1 up', () => {
    for (const bad of ['?wall=0', '?wall=-3', '?wall=2.5', '?wall=abc', '?wall=']) {
      expect(parseDevOptions(bad)).toBe(NO_DEV_OPTIONS);
    }
  });

  it('forces Shift Walls with ?shiftwall, with or without a value, but not =0', () => {
    expect(parseDevOptions('?shiftwall').forceShiftWall).toBe(true);
    expect(parseDevOptions('?shiftwall=1').forceShiftWall).toBe(true);
    expect(parseDevOptions('?shiftwall=0')).toBe(NO_DEV_OPTIONS);
  });

  it('combines both', () => {
    expect(parseDevOptions('?wall=12&shiftwall')).toEqual({ startWall: 12, forceShiftWall: true });
  });
});
