import Phaser from 'phaser';
import { loadMusic } from '@/audio/Music';
import { loadFonts } from '@/scenes/fonts';
import { SceneKeys } from '@/scenes/scene-keys';

// Starts loading the music in the background, for the first run, and waits
// for the bundled fonts, then hands off to Title.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    const sound = this.sound;
    if (sound instanceof Phaser.Sound.WebAudioSoundManager) void loadMusic(sound.context);
    void loadFonts().then(() => this.scene.start(SceneKeys.Title));
  }
}
