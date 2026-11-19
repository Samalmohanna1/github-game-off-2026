import { AUDIO } from '@/config';
import { STANDBY_CHORDS } from '@/data/standby';

// When each note of Standby, the title and tutorial music, plays (times in
// s from the first chord), kept pure so it can be tested without a browser;
// src/audio/standby.ts renders it.

const BEATS_PER_BAR = 4;

// A note that swells in and out: the pad's chord notes and the bass.
export interface Swell {
  readonly midi: number;
  readonly pan: number;
  readonly from: number;
  readonly peak: number;
  readonly holdUntil: number;
  readonly to: number;
}

export interface Bell {
  readonly midi: number;
  readonly at: number;
  readonly pan: number;
}

export interface StandbyNotes {
  readonly pads: readonly Swell[];
  readonly bass: readonly Swell[];
  readonly bells: readonly Bell[];
}

interface SwellShape {
  readonly leadInMs: number;
  readonly attackMs: number;
  readonly releaseMs: number;
}

export function standbyBeat(): number {
  return 60 / AUDIO.standby.bpm;
}

export function standbyChordSeconds(): number {
  return AUDIO.standby.chordBars * BEATS_PER_BAR * standbyBeat();
}

export function standbyLoopSeconds(): number {
  return STANDBY_CHORDS.length * standbyChordSeconds();
}

// A swell for the chord starting at `at`: it starts leadInMs early, peaks
// attackMs later, and fades over releaseMs from leadInMs before the chord
// ends, so each chord melts into the next.
function swell(midi: number, pan: number, at: number, shape: SwellShape): Swell {
  const leadIn = shape.leadInMs / 1000;
  const from = at - leadIn;
  const holdUntil = at + standbyChordSeconds() - leadIn;
  return { midi, pan, from, peak: from + shape.attackMs / 1000, holdUntil, to: holdUntil + shape.releaseMs / 1000 };
}

// `loops` loops back to back, the first chord at 0. Bells alternate sides.
export function standbyNotes(loops: number): StandbyNotes {
  const { pad, bass, bells } = AUDIO.standby;
  const pads: Swell[] = [];
  const bassNotes: Swell[] = [];
  const bellNotes: Bell[] = [];
  for (let loop = 0; loop < loops; loop++) {
    STANDBY_CHORDS.forEach((chord, i) => {
      const at = loop * standbyLoopSeconds() + i * standbyChordSeconds();
      chord.pad.forEach((midi, k) => pads.push(swell(midi, pad.pans[k % pad.pans.length] ?? 0, at, pad)));
      bassNotes.push(swell(chord.bass, 0, at, bass));
      chord.bells.forEach(([beats, midi], k) =>
        bellNotes.push({ midi, at: at + beats * standbyBeat(), pan: k % 2 === 0 ? -bells.pan : bells.pan }),
      );
    });
  }
  return { pads, bass: bassNotes, bells: bellNotes };
}
