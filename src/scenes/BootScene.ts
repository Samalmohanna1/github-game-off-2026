import Phaser from 'phaser';
import { loadMusic } from '@/audio/Music';
import { loadStandby } from '@/audio/standby';
import { loadFonts } from '@/scenes/fonts';
import { SceneKeys } from '@/scenes/scene-keys';
import { webAudio } from '@/scenes/ui';

// Starts loading the track and rendering the menus' Standby in the
// background, so neither holds the title up, and waits for the bundled
// fonts, then hands off to Title.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    const audio = webAudio(this);
    if (audio !== null) {
      void loadMusic(audio.ctx);
      void loadStandby(audio.ctx);
    }
    void loadFonts().then(() => this.scene.start(SceneKeys.Title));
  }
}
