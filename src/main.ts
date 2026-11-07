import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { BootScene } from '@/scenes/BootScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { PlayScene } from '@/scenes/PlayScene';
import { TitleScene } from '@/scenes/TitleScene';

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
