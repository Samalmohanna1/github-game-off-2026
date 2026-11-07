export interface KeyboardHandlers {
  onMove(dir: -1 | 1): void;
  onKeyDown(key: string, code: string): void;
  onKeyUp(code: string): void;
  onBlur(): void;
  onCapsLock(on: boolean): void;
}

// Native window listeners rather than Phaser key objects, as PLAN.md §2
// requires, so event.key / event.code / event.repeat behave as specced.
export class KeyboardInput {
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    // Caps Lock's state is only readable from an input event, so every key reports it.
    this.handlers.onCapsLock(event.getModifierState('CapsLock'));
    if (event.repeat) return;
    // Browser and OS shortcuts (Ctrl/Cmd/Alt + key) are never gameplay.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'ArrowLeft') this.handlers.onMove(-1);
    else if (event.key === 'ArrowRight') this.handlers.onMove(1);
    else this.handlers.onKeyDown(event.key, event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.handlers.onCapsLock(event.getModifierState('CapsLock'));
    this.handlers.onKeyUp(event.code);
  };

  private readonly onBlur = (): void => {
    this.handlers.onBlur();
  };

  constructor(private readonly handlers: KeyboardHandlers) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
