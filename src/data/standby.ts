// Standby, the title and tutorial music (AUDIO.standby): four chords of
// AUDIO.standby.chordBars each, in C minor, as MIDI note numbers (60 is C4).
// Each has its pad voicing, its bass note, and a bell melody as
// [beats into the chord, note].
export interface StandbyChord {
  readonly pad: readonly number[];
  readonly bass: number;
  readonly bells: readonly (readonly [beats: number, midi: number])[];
}

export const STANDBY_CHORDS: readonly StandbyChord[] = [
  // Cm7; the bells add its 9th, D
  { pad: [55, 60, 63, 70], bass: 48, bells: [[0, 79], [1.5, 82], [3, 86], [5, 84]] },
  // Abmaj7
  { pad: [56, 60, 63, 67], bass: 44, bells: [[0, 84], [1.5, 79], [3, 87], [5, 84]] },
  // Ebmaj9
  { pad: [55, 58, 62, 65], bass: 51, bells: [[0, 82], [1.5, 86], [3, 89], [5, 87]] },
  // Bbsus2
  { pad: [53, 58, 60, 65], bass: 46, bells: [[0, 84], [1.5, 77], [3, 82], [5, 77]] },
];
