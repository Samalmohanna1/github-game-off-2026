// The display and UI fonts of the design mocks (M10), bundled so the game never
// fetches them at runtime. Latin subsets only: the game's text is English.
import '@fontsource/anton/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-700.css';
import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { preventPageScroll } from '@/input/prevent-page-scroll';
import { BootScene } from '@/scenes/BootScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { PlayScene } from '@/scenes/PlayScene';
import { TitleScene } from '@/scenes/TitleScene';

preventPageScroll();

new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.stage,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, PlayScene, GameOverScene],
});
