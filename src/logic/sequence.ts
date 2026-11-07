import { PROMPT_APPEAR_DELAY } from '@/config';

export type SequenceEffect =
  | { readonly type: 'held'; readonly letter: string }
  | { readonly type: 'slipped'; readonly letter: string }
  | { readonly type: 'wrongKey'; readonly key: string };

export interface SequenceView {
  readonly held: readonly string[];
  readonly current: string | null;
  readonly slipped: readonly string[];
}

interface HeldLetter {
  readonly letter: string;
  readonly code: string;
}

export function isLetterKey(key: string): boolean {
  return /^[a-z]$/i.test(key);
}

export function isUppercaseLetter(letter: string): boolean {
  return /^[A-Z]$/.test(letter);
}

// PLAN.md §2: an uppercase prompt needs the exact key, so Shift must be down at
// press time. A lowercase prompt takes either case, so a Shift still held from
// an earlier letter isn't punished.
export function matchesPrompt(prompt: string, key: string): boolean {
  return isUppercaseLetter(prompt) ? key === prompt : key.toLowerCase() === prompt;
}

// Held keys are tracked by event.code, so letting go of Shift never looks like
// a letter being released.
export class LetterSequence {
  // queue[0] is the current prompt. It only shows while lined up, not paused,
  // and once PROMPT_APPEAR_DELAY has passed since the previous hold.
  private queue: string[] = [];
  private held: HeldLetter[] = [];
  private readonly slippedLetters = new Set<string>();
  // Codes still down from before this wall are ignored until released.
  private readonly stale = new Set<string>();
  private aligned = false;
  private delayLeft = 0;
  private isPaused = false;

  get paused(): boolean {
    return this.isPaused;
  }

  get complete(): boolean {
    return this.queue.length === 0;
  }

  get current(): string | null {
    const next = this.queue[0];
    if (next === undefined || !this.aligned || this.isPaused || this.delayLeft > 0) return null;
    return next;
  }

  startWall(letters: readonly string[]): void {
    for (const h of this.held) this.stale.add(h.code);
    this.queue = [...letters];
    this.held = [];
    this.slippedLetters.clear();
    this.delayLeft = 0;
  }

  setAligned(aligned: boolean): void {
    this.aligned = aligned;
  }

  tick(dtMs: number): void {
    if (this.isPaused) return;
    this.delayLeft = Math.max(0, this.delayLeft - dtMs);
  }

  press(key: string, code: string): SequenceEffect | null {
    if (this.isPaused || !isLetterKey(key)) return null;
    // A keydown proves the key was released, even if its keyup never arrived.
    this.stale.delete(code);
    if (this.held.some((h) => h.code === code)) return null;

    const prompt = this.current;
    if (prompt === null || !matchesPrompt(prompt, key)) return { type: 'wrongKey', key };

    this.queue.shift();
    this.held.push({ letter: prompt, code });
    this.slippedLetters.delete(prompt);
    this.delayLeft = PROMPT_APPEAR_DELAY;
    return { type: 'held', letter: prompt };
  }

  release(code: string): SequenceEffect | null {
    if (this.stale.delete(code)) return null;
    const index = this.held.findIndex((h) => h.code === code);
    const slipped = this.held[index];
    if (slipped === undefined) return null;
    this.held.splice(index, 1);
    return this.slip(slipped);
  }

  // PLAN.md §2: losing focus pauses the game and every held letter slips.
  blur(): SequenceEffect[] {
    if (this.isPaused) return [];
    const effects = this.held.map((h) => this.slip(h));
    this.held = [];
    // Keyups that happen while unfocused never arrive.
    this.stale.clear();
    this.isPaused = true;
    return effects;
  }

  resume(): void {
    this.isPaused = false;
  }

  view(): SequenceView {
    const current = this.current;
    return {
      held: this.held.map((h) => h.letter),
      current,
      slipped: this.queue.filter((letter, i) => this.slippedLetters.has(letter) && !(i === 0 && current !== null)),
    };
  }

  private slip(h: HeldLetter): SequenceEffect {
    this.queue.push(h.letter);
    this.slippedLetters.add(h.letter);
    return { type: 'slipped', letter: h.letter };
  }
}
