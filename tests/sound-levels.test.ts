import { describe, expect, it } from 'vitest';
import { AUDIO, MAX_LETTERS } from '@/config';
import { clickHz, fanfareHz, midiHz, noteHz, scaleHz, whompHz } from '@/logic/sound-levels';

const { key } = AUDIO;

// Within a few cents of a note of the music's key (its pentatonic scale).
function inKey(hz: number): boolean {
  const semitones = 12 * Math.log2(hz / key.rootHz);
  const nearest = Math.round(semitones);
  const pitchClass = ((nearest % 12) + 12) % 12;
  return Math.abs(semitones - nearest) < 0.05 && (key.scale as readonly number[]).includes(pitchClass);
}

describe('noteHz', () => {
  it('doubles the pitch every 12 semitones', () => {
    expect(noteHz(440, 12)).toBeCloseTo(880);
    expect(noteHz(440, -12)).toBeCloseTo(220);
    expect(noteHz(440, 0)).toBe(440);
  });
});

describe('midiHz', () => {
  it('puts A4 at 440 Hz and middle C on the key root', () => {
    expect(midiHz(69)).toBeCloseTo(440);
    expect(midiHz(60)).toBeCloseTo(key.rootHz, 1);
    expect(midiHz(81)).toBeCloseTo(880);
  });
});

describe('scaleHz', () => {
  it('walks the key scale from the root, an octave up each time round', () => {
    key.scale.forEach((semitones, degree) => expect(scaleHz(key.rootHz, degree)).toBeCloseTo(noteHz(key.rootHz, semitones)));
    expect(scaleHz(key.rootHz, key.scale.length)).toBeCloseTo(key.rootHz * 2);
  });
});

describe('the held-letter click (M9)', () => {
  it('starts at the base pitch and steps up with each letter held', () => {
    expect(clickHz(1)).toBeCloseTo(AUDIO.click.baseHz);
    for (let held = 2; held <= MAX_LETTERS; held++) expect(clickHz(held)).toBeGreaterThan(clickHz(held - 1));
  });
});

// The music plays under every wall, so every pitched effect heard over it
// keeps to its key, and so does the fail's whomp, sag and all, which closes
// the run on it. (The slip, the whoosh and the hit's thump are glides.)
describe('the effects heard over the music', () => {
  it('play notes of its key', () => {
    const whomp = whompHz();
    const sag = noteHz(whomp.at(-1) ?? NaN, -AUDIO.whomp.sagSemitones);
    const notes = [
      AUDIO.tick.tickHz,
      AUDIO.tick.tockHz,
      ...Array.from({ length: MAX_LETTERS }, (_, i) => clickHz(i + 1)),
      ...fanfareHz(),
      AUDIO.shiftAlert.fromHz,
      AUDIO.shiftAlert.toHz,
      ...whomp,
      sag,
    ];
    for (const hz of notes) expect(inKey(hz), `${hz.toFixed(1)} Hz`).toBe(true);
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

describe('the fail whomp (M9)', () => {
  it('starts at the root and steps down note by note', () => {
    const notes = whompHz();
    expect(notes.length).toBeGreaterThanOrEqual(3);
    expect(notes[0]).toBeCloseTo(AUDIO.whomp.rootHz);
    notes.slice(1).forEach((hz, i) => expect(hz).toBeLessThan(notes[i]!));
  });
});
