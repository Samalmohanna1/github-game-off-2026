import { describe, expect, it } from 'vitest';
import { AUDIO } from '@/config';
import { STANDBY_CHORDS } from '@/data/standby';
import { standbyBeat, standbyChordSeconds, standbyLoopSeconds, standbyNotes, type Swell } from '@/logic/standby-schedule';

const C_NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10]; // semitones above C
const { standby } = AUDIO;

describe('Standby, the title and How to play music', () => {
  const one = standbyNotes(1);

  it("loops every 8 bars at the game track's 90 BPM", () => {
    expect(standby.bpm).toBe(90);
    expect(standbyLoopSeconds()).toBeCloseTo((8 * 4 * 60) / 90);
    expect(STANDBY_CHORDS.length * standby.chordBars).toBe(8);
  });

  it("keeps to the game track's key, C minor", () => {
    const notes = [...one.pads, ...one.bass, ...one.bells].map((note) => note.midi);
    for (const midi of notes) expect(C_NATURAL_MINOR, `MIDI ${midi}`).toContain(((midi % 12) + 12) % 12);
  });

  it('repeats exactly, one loop later', () => {
    const two = standbyNotes(2);
    const shifted = <T extends { midi: number }>(notes: readonly T[], key: (note: T) => number) =>
      notes.map((note) => [note.midi, key(note) - standbyLoopSeconds()]);
    const half = (notes: readonly unknown[]) => notes.length / 2;
    expect(two.pads.length).toBe(2 * one.pads.length);
    expect(shifted(two.pads.slice(half(two.pads)), (n) => n.from)).toEqual(one.pads.map((n) => [n.midi, expect.closeTo(n.from)]));
    expect(shifted(two.bells.slice(half(two.bells)), (n) => n.at)).toEqual(one.bells.map((n) => [n.midi, expect.closeTo(n.at)]));
  });

  it.each([
    ['pad', one.pads, standby.pad.pans.length],
    ['bass', one.bass, 1],
  ] as const)('melts each %s chord into the next, with no gap', (_name, swells: readonly Swell[], perChord) => {
    swells.forEach((note, i) => {
      const chordAt = Math.floor(i / perChord) * standbyChordSeconds();
      expect(note.from).toBeLessThan(chordAt);
      expect(note.peak).toBeGreaterThan(note.from);
      expect(note.holdUntil).toBeGreaterThanOrEqual(note.peak);
      expect(note.to).toBeGreaterThan(chordAt + standbyChordSeconds());
    });
  });

  it('rings every bell inside its chord, alternating sides', () => {
    const perChord = STANDBY_CHORDS[0]?.bells.length ?? 0;
    one.bells.forEach((bell, i) => {
      const chordAt = Math.floor(i / perChord) * standbyChordSeconds();
      expect(bell.at).toBeGreaterThanOrEqual(chordAt);
      expect(bell.at).toBeLessThan(chordAt + standbyChordSeconds());
      expect(Math.abs(bell.pan)).toBe(standby.bells.pan);
      if (i % perChord > 0) expect(Math.sign(bell.pan)).toBe(-Math.sign(one.bells[i - 1]?.pan ?? 0));
    });
  });

  // The render keeps the middle of three loops, so a tail longer than a loop
  // would be cut off at the seam.
  it('lets every note, echo and the reverb die away within one loop', () => {
    for (const note of [...one.pads, ...one.bass]) expect(note.to - note.from).toBeLessThan(standbyLoopSeconds());
    expect(standby.bells.decayMs / 1000).toBeLessThan(standbyLoopSeconds());
    expect(standby.reverb.seconds).toBeLessThan(standbyLoopSeconds());
    // Each repeat at feedback of the last: below -60 dB within a loop.
    const repeats = standbyLoopSeconds() / (standby.echo.beats * standbyBeat());
    expect(standby.echo.feedback ** repeats).toBeLessThan(0.001);
  });
});
