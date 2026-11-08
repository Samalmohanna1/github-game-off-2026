import Phaser from 'phaser';
import { makeGrainTexture } from '@/objects/paper';
import { loadFonts } from '@/scenes/fonts';
import { SceneKeys } from '@/scenes/scene-keys';

// Waits for the bundled fonts and makes the shared paper texture (M10), then
// hands off to Title.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    makeGrainTexture(this);
    void loadFonts().then(() => this.scene.start(SceneKeys.Title));
  }
}
