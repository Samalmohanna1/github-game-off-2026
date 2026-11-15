import type Phaser from 'phaser';

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Scores and counts with thousands separators, as the mocks show them.
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export interface WindowKeyHandlers {
  down(event: KeyboardEvent): void;
  up(event: KeyboardEvent): void;
  blur(): void;
}

// Native window listeners for the scene's lifetime (PLAN.md §2 reads keys from
// browser events, not Phaser key objects), removed when the scene shuts down.
export function onWindowKeys(scene: Phaser.Scene, handlers: WindowKeyHandlers): void {
  const down = (event: KeyboardEvent) => handlers.down(event);
  const up = (event: KeyboardEvent) => handlers.up(event);
  const blur = () => handlers.blur();
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  scene.events.once('shutdown', () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
  });
}
