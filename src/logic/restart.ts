import { RESTART_LOCKOUT } from '@/config';
import { isPressKey } from '@/logic/menu-keys';

// PLAN.md §7: after a fail, input is ignored for RESTART_LOCKOUT, then every
// key must be up before a fresh Space or Enter, or a click, restarts, so
// keys still held from the failed wall can't restart the game by accident.
// Any other key restarts nothing, and must be let go again first. (Until a
// review asked for Space or Enter, any key restarted.) The tutorial's last
// step waits the same way, with its own lockout.
export class RestartGate {
  private elapsed = 0;
  private readonly down: Set<string>;

  constructor(
    keysDown: Iterable<string>,
    private readonly lockoutMs: number = RESTART_LOCKOUT,
  ) {
    this.down = new Set(keysDown);
  }

  get lockoutOver(): boolean {
    return this.elapsed >= this.lockoutMs;
  }

  get ready(): boolean {
    return this.lockoutOver && this.down.size === 0;
  }

  tick(dtMs: number): void {
    this.elapsed += dtMs;
  }

  // True when this press should restart.
  press(code: string): boolean {
    const restart = this.ready && isPressKey(code);
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
