import type Phaser from 'phaser';
import { GAME_WIDTH, PROMPT_PULSE_MS, PROMPT_PULSE_SCALE } from '@/config';
import { textStyle } from '@/scenes/text-styles';

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function addPulsingPrompt(scene: Phaser.Scene, y: number, label: string): Phaser.GameObjects.Text {
  const text = scene.add.text(GAME_WIDTH / 2, y, label, textStyle('body', 'accent', true)).setOrigin(0.5);
  if (!prefersReducedMotion()) {
    scene.tweens.add({
      targets: text,
      scale: PROMPT_PULSE_SCALE,
      duration: PROMPT_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  return text;
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
