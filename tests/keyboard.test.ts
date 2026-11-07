import { describe, expect, it } from 'vitest';
import { KEYBOARD } from '@/data/keyboard';

const letters = (filter: (l: string) => boolean) =>
  Object.keys(KEYBOARD)
    .filter(filter)
    .sort()
    .join('');

describe('KEYBOARD', () => {
  it('maps all 26 letters', () => {
    expect(letters(() => true)).toBe('abcdefghijklmnopqrstuvwxyz');
  });

  it('splits the hands as touch typing does', () => {
    expect(letters((l) => KEYBOARD[l]!.hand === 'left')).toBe('abcdefgqrstvwxz');
    expect(letters((l) => KEYBOARD[l]!.hand === 'right')).toBe('hijklmnopuy');
  });

  it('places rows top to bottom with the QWERTY stagger', () => {
    expect(KEYBOARD.q).toMatchObject({ row: 0, x: 0 });
    expect(KEYBOARD.a).toMatchObject({ row: 1, x: 0.25 });
    expect(KEYBOARD.z).toMatchObject({ row: 2, x: 0.75 });
    expect(KEYBOARD.p).toMatchObject({ row: 0, x: 9 });
    expect(KEYBOARD.m).toMatchObject({ row: 2, x: 6.75 });
  });

  it('gives each index finger two columns', () => {
    expect(letters((l) => KEYBOARD[l]!.finger === 'leftIndex')).toBe('bfgrtv');
    expect(letters((l) => KEYBOARD[l]!.finger === 'rightIndex')).toBe('hjmnuy');
  });
});
