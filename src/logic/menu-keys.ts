// The screens' keys, by event.code: Space or Enter presses a button, as on
// a web page (a review asked that every button take them, so the mouse is
// never needed); no other key does. On the title, which has two controls,
// the arrow keys move between them. Tab is left to the browser, so a
// keyboard player can always leave the game's frame.
const PRESS_KEYS = new Set(['Space', 'Enter', 'NumpadEnter']);
const FOCUS_STEPS: Readonly<Record<string, -1 | 1>> = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
};

export function isPressKey(code: string): boolean {
  return PRESS_KEYS.has(code);
}

// Which way a key moves the focus: back, on, or not at all (0).
export function focusStep(code: string): -1 | 0 | 1 {
  return FOCUS_STEPS[code] ?? 0;
}

// The control `step` away from `index` among `count`, wrapping round.
export function stepFocus(index: number, count: number, step: number): number {
  return (((index + step) % count) + count) % count;
}
