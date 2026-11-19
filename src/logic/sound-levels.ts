import { AUDIO } from '@/config';

// The numbers behind the synthesized sounds (PLAN.md §10, M9), kept pure so
// they can be tested without a browser; src/audio/Synth.ts plays them.

export function noteHz(baseHz: number, semitones: number): number {
  return baseHz * 2 ** (semitones / 12);
}

// A MIDI note number's pitch: 69 is A4, 440 Hz.
export function midiHz(midi: number): number {
  return noteHz(440, midi - 69);
}

// The note `degree` steps up the key's scale from a note of the key's root,
// going up an octave each time round the scale.
export function scaleHz(rootHz: number, degree: number): number {
  const { scale } = AUDIO.key;
  return noteHz(rootHz, 12 * Math.floor(degree / scale.length) + scale[degree % scale.length]!);
}

// heldCount includes the letter just held, so the first click is baseHz.
export function clickHz(heldCount: number): number {
  return scaleHz(AUDIO.click.baseHz, Math.max(0, heldCount - 1));
}

export function fanfareHz(): number[] {
  return AUDIO.fanfare.semitones.map((s) => noteHz(AUDIO.fanfare.rootHz, s));
}

// The fail jingle's notes, each a step lower than the last.
export function whompHz(): number[] {
  return AUDIO.whomp.semitones.map((s) => noteHz(AUDIO.whomp.rootHz, s));
}
