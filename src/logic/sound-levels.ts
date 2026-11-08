import { AUDIO } from '@/config';

// The numbers behind the synthesized sounds (PLAN.md §10, M9), kept pure so
// they can be tested without a browser; src/audio/Synth.ts plays them.

export function noteHz(baseHz: number, semitones: number): number {
  return baseHz * 2 ** (semitones / 12);
}

// heldCount includes the letter just held, so the first click is baseHz.
export function clickHz(heldCount: number): number {
  return noteHz(AUDIO.click.baseHz, Math.max(0, heldCount - 1) * AUDIO.click.stepSemitones);
}

export function fanfareHz(): number[] {
  return AUDIO.fanfare.semitones.map((s) => noteHz(AUDIO.fanfare.rootHz, s));
}
