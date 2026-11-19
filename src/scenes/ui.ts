import Phaser from 'phaser';

export interface WebAudio {
  readonly ctx: BaseAudioContext;
  readonly destination: AudioNode;
}

// Phaser's audio context and master node, which all the game's sound goes
// through: Phaser unlocks it on the first click and suspends it while the
// window is blurred, and its mute and volume apply (PLAN.md §10, M9). Null
// when the browser has no Web Audio; the game then plays silent.
export function webAudio(scene: Phaser.Scene): WebAudio | null {
  const sound = scene.sound;
  return sound instanceof Phaser.Sound.WebAudioSoundManager ? { ctx: sound.context, destination: sound.destination } : null;
}

// A color as the three channels Phaser's camera fades take.
export function rgb(color: number): [number, number, number] {
  return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
}

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
