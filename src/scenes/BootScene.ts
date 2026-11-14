import Phaser from 'phaser';
import { loadFonts } from '@/scenes/fonts';
import { SceneKeys } from '@/scenes/scene-keys';

// Waits for the bundled fonts, then hands off to Title.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    void loadFonts().then(() => this.scene.start(SceneKeys.Title));
  }
}
