import { describe, expect, it } from 'vitest';
import { PROMPT_APPEAR_DELAY } from '@/config';
import { LetterSequence, isLetterKey, matchesPrompt } from '@/logic/sequence';

const code = (letter: string) => `Key${letter.toUpperCase()}`;

function lineUp(letters: string[]): LetterSequence {
  const seq = new LetterSequence();
  seq.startWall(letters);
  seq.setAligned(true);
  return seq;
}

// Press the current prompt as a player would (Shift only for capitals), then
// wait out the appear delay.
function hold(seq: LetterSequence, letter: string) {
  const effect = seq.press(letter, code(letter));
  seq.tick(PROMPT_APPEAR_DELAY);
  return effect;
}

describe('a normal run', () => {
  it('prompts one letter at a time and holds each in turn', () => {
    const seq = lineUp(['a', 's', 'd']);
    expect(seq.view()).toEqual({ held: [], current: 'a', slipped: [] });

    expect(hold(seq, 'a')).toEqual({ type: 'held', letter: 'a' });
    expect(seq.view()).toEqual({ held: ['a'], current: 's', slipped: [] });

    hold(seq, 's');
    hold(seq, 'd');
    expect(seq.complete).toBe(true);
    expect(seq.view()).toEqual({ held: ['a', 's', 'd'], current: null, slipped: [] });
  });

  it('waits PROMPT_APPEAR_DELAY before showing the next letter', () => {
    const seq = lineUp(['a', 's']);
    seq.press('a', 'KeyA');
    expect(seq.current).toBeNull();
    seq.tick(PROMPT_APPEAR_DELAY - 1);
    expect(seq.current).toBeNull();
    seq.tick(1);
    expect(seq.current).toBe('s');
  });
});

describe('lining up', () => {
  it('shows no letters until the figure is lined up', () => {
    const seq = new LetterSequence();
    seq.startWall(['a', 's']);
    expect(seq.current).toBeNull();
    seq.setAligned(true);
    expect(seq.current).toBe('a');
  });

  it('counts a letter pressed while not lined up as a wrong key', () => {
    const seq = new LetterSequence();
    seq.startWall(['a', 's']);
    expect(seq.press('a', 'KeyA')).toEqual({ type: 'wrongKey', key: 'a' });
  });

  it('keeps held letters when the figure moves away, but hides the prompt', () => {
    const seq = lineUp(['a', 's']);
    hold(seq, 'a');
    seq.setAligned(false);
    expect(seq.view()).toEqual({ held: ['a'], current: null, slipped: [] });
  });
});

describe('slips', () => {
  it('sends a letter slipped in the middle to the back of the queue', () => {
    const seq = lineUp(['a', 's', 'd']);
    hold(seq, 'a');
    hold(seq, 's');

    expect(seq.release('KeyS')).toEqual({ type: 'slipped', letter: 's' });
    expect(seq.view()).toEqual({ held: ['a'], current: 'd', slipped: ['s'] });

    hold(seq, 'd');
    expect(seq.view()).toEqual({ held: ['a', 'd'], current: 's', slipped: [] });
    hold(seq, 's');
    expect(seq.complete).toBe(true);
  });

  it('brings back a slip on the last letter as the current prompt', () => {
    const seq = lineUp(['a', 's', 'd']);
    hold(seq, 'a');
    hold(seq, 's');
    hold(seq, 'd');
    expect(seq.complete).toBe(true);

    expect(seq.release('KeyD')).toEqual({ type: 'slipped', letter: 'd' });
    expect(seq.complete).toBe(false);
    expect(seq.view()).toEqual({ held: ['a', 's'], current: 'd', slipped: [] });
    expect(hold(seq, 'd')).toEqual({ type: 'held', letter: 'd' });
    expect(seq.complete).toBe(true);
  });

  it('counts re-pressing a slipped letter before its turn as a wrong key', () => {
    const seq = lineUp(['a', 's', 'd']);
    hold(seq, 'a');
    seq.release('KeyA');
    expect(seq.view().current).toBe('s');

    expect(seq.press('a', 'KeyA')).toEqual({ type: 'wrongKey', key: 'a' });
    expect(seq.view()).toEqual({ held: [], current: 's', slipped: ['a'] });
  });

  it('ignores releasing a key that was never held', () => {
    const seq = lineUp(['a', 's']);
    seq.press('q', 'KeyQ');
    expect(seq.release('KeyQ')).toBeNull();
  });
});

describe('case and Shift', () => {
  it('counts an uppercase prompt pressed without Shift as a wrong key', () => {
    const seq = lineUp(['J', 'k']);
    expect(seq.press('j', 'KeyJ')).toEqual({ type: 'wrongKey', key: 'j' });
    expect(seq.current).toBe('J');
    expect(seq.press('J', 'KeyJ')).toEqual({ type: 'held', letter: 'J' });
  });

  it('keeps an uppercase letter held after Shift is released', () => {
    const seq = lineUp(['J', 'k']);
    hold(seq, 'J');
    expect(seq.release('ShiftLeft')).toBeNull();
    expect(seq.view().held).toEqual(['J']);
    expect(seq.release('KeyJ')).toEqual({ type: 'slipped', letter: 'J' });
  });

  it('accepts a lowercase prompt pressed with Shift still down', () => {
    const seq = lineUp(['J', 'k']);
    hold(seq, 'J');
    expect(seq.press('K', 'KeyK')).toEqual({ type: 'held', letter: 'k' });
  });

  it('matches prompts by the rules', () => {
    expect(matchesPrompt('a', 'a')).toBe(true);
    expect(matchesPrompt('a', 'A')).toBe(true);
    expect(matchesPrompt('A', 'A')).toBe(true);
    expect(matchesPrompt('A', 'a')).toBe(false);
    expect(matchesPrompt('a', 'b')).toBe(false);
  });
});

describe('wrong keys', () => {
  it('counts any letter that is not the prompt and not held', () => {
    const seq = lineUp(['a', 's']);
    expect(seq.press('z', 'KeyZ')).toEqual({ type: 'wrongKey', key: 'z' });
    expect(seq.current).toBe('a');
  });

  it('counts a letter pressed during the appear delay', () => {
    const seq = lineUp(['a', 's']);
    seq.press('a', 'KeyA');
    expect(seq.press('s', 'KeyS')).toEqual({ type: 'wrongKey', key: 's' });
  });

  it('never counts Shift, digits, Space or other non-letter keys', () => {
    const seq = lineUp(['a', 's']);
    for (const [key, keyCode] of [
      ['Shift', 'ShiftLeft'],
      ['1', 'Digit1'],
      [' ', 'Space'],
      ['Enter', 'Enter'],
      ['F2', 'F2'],
      ['ArrowUp', 'ArrowUp'],
    ] as const) {
      expect(seq.press(key, keyCode)).toBeNull();
    }
    expect(seq.current).toBe('a');
  });

  it('only treats single A-Z characters as letters', () => {
    expect(isLetterKey('a')).toBe(true);
    expect(isLetterKey('Z')).toBe(true);
    expect(isLetterKey('é')).toBe(false);
    expect(isLetterKey('Escape')).toBe(false);
  });
});

describe('blur', () => {
  it('pauses and slips every held letter, in the order they were held', () => {
    const seq = lineUp(['a', 's', 'd']);
    hold(seq, 'a');
    hold(seq, 's');

    expect(seq.blur()).toEqual([
      { type: 'slipped', letter: 'a' },
      { type: 'slipped', letter: 's' },
    ]);
    expect(seq.paused).toBe(true);
    expect(seq.view()).toEqual({ held: [], current: null, slipped: ['a', 's'] });
  });

  it('ignores every key while paused, then picks up where it left off', () => {
    const seq = lineUp(['a', 's', 'd']);
    hold(seq, 'a');
    seq.blur();
    expect(seq.press('s', 'KeyS')).toBeNull();
    expect(seq.release('KeyA')).toBeNull();

    seq.resume();
    expect(seq.view()).toEqual({ held: [], current: 's', slipped: ['a'] });
  });

  it('does nothing on a second blur', () => {
    const seq = lineUp(['a', 's']);
    hold(seq, 'a');
    seq.blur();
    expect(seq.blur()).toEqual([]);
  });
});

describe('a new wall', () => {
  it('ignores keys still held from the last wall until they are released', () => {
    const seq = lineUp(['a', 's']);
    hold(seq, 'a');
    seq.startWall(['q', 'w']);
    seq.setAligned(true);

    expect(seq.release('KeyA')).toBeNull();
    expect(seq.view()).toEqual({ held: [], current: 'q', slipped: [] });
    expect(seq.press('a', 'KeyA')).toEqual({ type: 'wrongKey', key: 'a' });
  });

  it('starts with an empty tray and no delay', () => {
    const seq = lineUp(['a', 's']);
    seq.press('a', 'KeyA');
    seq.startWall(['q', 'w']);
    expect(seq.view()).toEqual({ held: [], current: 'q', slipped: [] });
  });
});
