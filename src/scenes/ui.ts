import type Phaser from 'phaser';
import { GAME_WIDTH, PROMPT_PULSE_MS, PROMPT_PULSE_SCALE } from '@/config';
import { textStyle } from '@/scenes/text-styles';

function prefersReducedMotion(): boolean {
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

// Native window listener rather than Phaser key objects: PLAN.md §2 reads
// letters from browser events so event.key/event.code behave exactly as specced.
export function onWindowKeyDown(scene: Phaser.Scene, handler: (event: KeyboardEvent) => void): void {
  const listener = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    handler(event);
  };
  window.addEventListener('keydown', listener);
  scene.events.once('shutdown', () => window.removeEventListener('keydown', listener));
}
