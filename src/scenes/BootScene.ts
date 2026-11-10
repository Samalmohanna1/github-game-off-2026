import Phaser from 'phaser';
import { registerGrain } from '@/objects/grain';
import { loadFonts } from '@/scenes/fonts';
import { SceneKeys } from '@/scenes/scene-keys';

// Waits for the bundled fonts and registers the grain filter (M10), then hands
// off to Title.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    registerGrain(this.renderer);
    void loadFonts().then(() => this.scene.start(SceneKeys.Title));
  }
}
