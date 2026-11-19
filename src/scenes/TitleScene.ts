import Phaser from 'phaser';
import { startMenuMusic } from '@/audio/standby';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SPLASH } from '@/config';
import { GridVoid } from '@/objects/GridVoid';
import { MuteButton } from '@/objects/MuteButton';
import { BUTTON_REACH, buttonYBelow, PromptButton } from '@/objects/PromptButton';
import { TitleLockup } from '@/objects/TitleLockup';
import { SceneKeys, type PlayStart } from '@/scenes/scene-keys';
import { rgb, webAudio } from '@/scenes/ui';

// The title (M11 review 5): the grid stage, the lockup on its dark card
// (TitleLockup), and the Click to play button below it, centered as one
// block. Starting needs a click, not a key: inside the itch.io iframe the
// page has no keyboard focus until the player clicks into it (PLAN.md §2).
// The click leads to the interactive tutorial. The menus' Standby starts
// here and plays on through the tutorial, once the browser lets audio play.
// The mute button in the corner toggles all sound; a click on it never
// starts the game.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.void);
    // The splash dissolves into the title through the void's color.
    this.cameras.main.fadeIn(SPLASH.fadeMs, ...rgb(COLORS.void));
    new GridVoid(this);
    const audio = webAudio(this);
    if (audio !== null) startMenuMusic(audio.ctx, audio.destination);
    const lockup = new TitleLockup(this);
    const top = Math.round((GAME_HEIGHT - lockup.height - BUTTON_REACH) / 2);
    lockup.setPosition(Math.round((GAME_WIDTH - lockup.width) / 2), top);
    new PromptButton(this, GAME_WIDTH / 2, buttonYBelow(top + lockup.height), 'CLICK TO PLAY');

    const mute = new MuteButton(this);
    let starting = false;
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, over: readonly Phaser.GameObjects.GameObject[]) => {
      if (starting || over.includes(mute)) return;
      starting = true;
      window.focus();
      this.scene.start(SceneKeys.Play, { mode: 'tutorial' } satisfies PlayStart);
    });
  }
}
