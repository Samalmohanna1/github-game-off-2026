import Phaser from 'phaser';
import { loadFonts } from '@/scenes/fonts';
import { SceneKeys } from '@/scenes/scene-keys';
import { loadWallImages } from '@/scenes/wall-images';

// Starts the wall images loading in the background (M10b review) and waits
// for the bundled fonts, then hands off to Title.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    loadWallImages(this.textures);
    void loadFonts().then(() => this.scene.start(SceneKeys.Title));
  }
}
