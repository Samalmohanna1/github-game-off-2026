import { describe, expect, it } from 'vitest';
import { AUDIO } from '@/config';
import { clickHz, fanfareHz, noteHz } from '@/logic/sound-levels';

describe('noteHz', () => {
  it('doubles the pitch every 12 semitones', () => {
    expect(noteHz(440, 12)).toBeCloseTo(880);
    expect(noteHz(440, -12)).toBeCloseTo(220);
    expect(noteHz(440, 0)).toBe(440);
  });
});

describe('the held-letter click (M9)', () => {
  it('starts at the base pitch and steps up with each letter held', () => {
    expect(clickHz(1)).toBeCloseTo(AUDIO.click.baseHz);
    for (let held = 2; held <= 5; held++) {
      expect(clickHz(held) / clickHz(held - 1)).toBeCloseTo(2 ** (AUDIO.click.stepSemitones / 12));
    }
  });
});

describe('the PERFECT fanfare (M9)', () => {
  it('rises note by note from the root to an octave above it', () => {
    const notes = fanfareHz();
    expect(notes[0]).toBeCloseTo(AUDIO.fanfare.rootHz);
    expect(notes.at(-1)).toBeCloseTo(AUDIO.fanfare.rootHz * 2);
    notes.slice(1).forEach((hz, i) => expect(hz).toBeGreaterThan(notes[i]!));
  });
});
