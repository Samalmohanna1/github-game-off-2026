import Phaser from 'phaser';
import { playMusic } from '@/audio/music';
import { loadFonts } from '@/scenes/fonts';
import { SceneKeys } from '@/scenes/scene-keys';

// Starts the music, which loads in the background, and waits for the bundled
// fonts, then hands off to Title. Boot runs once, so the music starts once.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    const sound = this.sound;
    if (sound instanceof Phaser.Sound.WebAudioSoundManager) void playMusic(sound.context, sound.destination);
    void loadFonts().then(() => this.scene.start(SceneKeys.Title));
  }
}
