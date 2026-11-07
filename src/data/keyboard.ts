export type Hand = 'left' | 'right';
export type Finger = 'leftPinky' | 'leftRing' | 'leftMiddle' | 'leftIndex' | 'rightIndex' | 'rightMiddle' | 'rightRing' | 'rightPinky';

export interface KeyPosition {
  // 0 = top (QWERTY...), 1 = home (ASDF...), 2 = bottom (ZXCV...).
  readonly row: number;
  // In key widths from the left of the top row, including each row's stagger.
  readonly x: number;
  readonly hand: Hand;
  readonly finger: Finger;
}

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;
// The physical stagger of a standard QWERTY keyboard, in key widths.
const ROW_OFFSETS = [0, 0.25, 0.75] as const;

// Standard touch-typing assignment.
const FINGER_KEYS: Readonly<Record<Finger, string>> = {
  leftPinky: 'qaz',
  leftRing: 'wsx',
  leftMiddle: 'edc',
  leftIndex: 'rfvtgb',
  rightIndex: 'yhnujm',
  rightMiddle: 'ik',
  rightRing: 'ol',
  rightPinky: 'p',
};

function buildKeyboard(): Readonly<Record<string, KeyPosition>> {
  const keys: Record<string, KeyPosition> = {};
  for (const [finger, letters] of Object.entries(FINGER_KEYS) as [Finger, string][]) {
    for (const letter of letters) {
      const row = ROWS.findIndex((r) => r.includes(letter));
      const x = ROW_OFFSETS[row as 0 | 1 | 2] + ROWS[row as 0 | 1 | 2].indexOf(letter);
      keys[letter] = { row, x, hand: finger.startsWith('left') ? 'left' : 'right', finger };
    }
  }
  return keys;
}

// QWERTY positions for a-z, keyed by lowercase letter (PLAN.md §4).
export const KEYBOARD = buildKeyboard();
