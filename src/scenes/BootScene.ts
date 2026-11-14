import Phaser from 'phaser';
import { WALL_IMAGES } from '@/data/wall-images';
import { loadFonts } from '@/scenes/fonts';
import { SceneKeys } from '@/scenes/scene-keys';

// Loads the wall images (M10b) and waits for the bundled fonts, then hands
// off to Title. An image that fails to load is left out; the walls fall back
// to a plain panel when none load.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  preload(): void {
    for (const { key, url } of WALL_IMAGES) this.load.image(key, url);
  }

  create(): void {
    void loadFonts().then(() => this.scene.start(SceneKeys.Title));
  }
}
