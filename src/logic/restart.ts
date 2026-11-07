import { RESTART_LOCKOUT } from '@/config';

// PLAN.md §7: after a fail, input is ignored for RESTART_LOCKOUT, then every
// key must be up before a fresh key press or a click restarts, so keys still
// held from the failed wall can't restart the game by accident.
export class RestartGate {
  private elapsed = 0;
  private readonly down: Set<string>;

  constructor(keysDown: Iterable<string>) {
    this.down = new Set(keysDown);
  }

  get lockoutOver(): boolean {
    return this.elapsed >= RESTART_LOCKOUT;
  }

  get ready(): boolean {
    return this.lockoutOver && this.down.size === 0;
  }

  tick(dtMs: number): void {
    this.elapsed += dtMs;
  }

  // True when this press should restart.
  press(code: string): boolean {
    const restart = this.ready;
    this.down.add(code);
    return restart;
  }

  // A key repeat proves the key is down without being a new press.
  holding(code: string): void {
    this.down.add(code);
  }

  release(code: string): void {
    this.down.delete(code);
  }

  // Keyups that happen while the window is unfocused never arrive.
  forgetKeys(): void {
    this.down.clear();
  }

  click(): boolean {
    return this.ready;
  }
}
