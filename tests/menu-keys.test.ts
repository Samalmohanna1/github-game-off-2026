import { describe, expect, it } from 'vitest';
import { focusStep, isPressKey, stepFocus } from '@/logic/menu-keys';

describe('the screens keys', () => {
  it.each(['Space', 'Enter', 'NumpadEnter'])('presses a button with %s', (code) => {
    expect(isPressKey(code)).toBe(true);
  });

  it.each(['KeyA', 'ShiftLeft', 'Tab', 'Escape', 'ArrowRight', 'F2'])('never presses one with %s', (code) => {
    expect(isPressKey(code)).toBe(false);
  });

  it('moves the focus on with the right and down arrows, back with the left and up', () => {
    expect(focusStep('ArrowRight')).toBe(1);
    expect(focusStep('ArrowDown')).toBe(1);
    expect(focusStep('ArrowLeft')).toBe(-1);
    expect(focusStep('ArrowUp')).toBe(-1);
  });

  it('leaves Tab to the browser, and the focus where it is on any other key', () => {
    for (const code of ['Tab', 'Space', 'Enter', 'KeyA']) expect(focusStep(code)).toBe(0);
  });

  it('wraps the focus round both ways', () => {
    expect(stepFocus(0, 2, 1)).toBe(1);
    expect(stepFocus(1, 2, 1)).toBe(0);
    expect(stepFocus(0, 2, -1)).toBe(1);
    expect(stepFocus(2, 3, 1)).toBe(0);
    expect(stepFocus(0, 3, -1)).toBe(2);
  });
});
