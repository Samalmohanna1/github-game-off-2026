import type { TutorialStep } from '@/logic/tutorial';

// Each tutorial step's card: its name, the keys it uses, and one sentence.
// The sentences are short enough for their cards' places
// (tests/tutorial-layout.test.ts): step 1's wraps to two lines on its
// narrower card beside the runway, and step 3's fits one line, so its Start
// and hint clear the figure. (Step 3 said "The faster you clear a wall, the
// more points you score." over two lines until its hint went on a card.)
export interface TutorialCard {
  readonly name: string;
  readonly keys: readonly string[];
  readonly text: string;
}

export const TUTORIAL_CARDS: Readonly<Record<TutorialStep, TutorialCard>> = {
  lineUp: { name: 'LINE UP', keys: ['SPACE'], text: 'Press Space to line up with the hole.' },
  hold: { name: 'HOLD ON', keys: [], text: 'Hold each letter. Shift for capitals.' },
  score: { name: 'SCORE', keys: [], text: 'Clear walls faster for more points.' },
};
