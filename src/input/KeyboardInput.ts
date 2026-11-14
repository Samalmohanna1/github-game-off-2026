export interface KeyboardHandlers {
  onSpace(): void;
  onKeyDown(key: string, code: string): void;
  onKeyUp(code: string): void;
  onBlur(): void;
  onCapsLock(on: boolean): void;
  onToggleDebug(): void;
}

// Native window listeners rather than Phaser key objects, as PLAN.md §2
// requires, so event.key / event.code / event.repeat behave as specced.
export class KeyboardInput {
  // Every key physically down, by event.code, so the game-over screen can wait
  // for them all to be released (PLAN.md §7).
  private readonly down = new Set<string>();

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.down.add(event.code);
    // Caps Lock's state is only readable from an input event, so every key reports it.
    this.handlers.onCapsLock(event.getModifierState('CapsLock'));
    if (event.repeat) return;
    // Browser and OS shortcuts (Ctrl/Cmd/Alt + key) are never gameplay.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // Space is the only move. Arrows, like any other non-letter, fall through
    // to the letter rules, which ignore them.
    if (event.code === 'Space') this.handlers.onSpace();
    // F2 is the debug overlay and never reaches the letter rules (PLAN.md §8).
    else if (event.code === 'F2') this.handlers.onToggleDebug();
    else this.handlers.onKeyDown(event.key, event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.down.delete(event.code);
    this.handlers.onCapsLock(event.getModifierState('CapsLock'));
    this.handlers.onKeyUp(event.code);
  };

  private readonly onBlur = (): void => {
    // Keyups that happen while unfocused never arrive.
    this.down.clear();
    this.handlers.onBlur();
  };

  constructor(private readonly handlers: KeyboardHandlers) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  heldCodes(): string[] {
    return [...this.down];
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
