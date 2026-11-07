export interface KeyboardHandlers {
  onMove(dir: -1 | 1): void;
}

// Native window listeners rather than Phaser key objects, as PLAN.md §2
// requires, so event.key / event.code / event.repeat behave as specced.
export class KeyboardInput {
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    if (event.key === 'ArrowLeft') this.handlers.onMove(-1);
    else if (event.key === 'ArrowRight') this.handlers.onMove(1);
  };

  constructor(private readonly handlers: KeyboardHandlers) {
    window.addEventListener('keydown', this.onKeyDown);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
  }
}
