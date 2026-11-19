import Phaser from 'phaser';
import { startMenuMusic } from '@/audio/standby';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SPLASH } from '@/config';
import { GridVoid } from '@/objects/GridVoid';
import { MenuFocus } from '@/objects/MenuFocus';
import { MuteToggle } from '@/objects/MuteToggle';
import { buttonYBelow, HINT_REACH, PRESS_HINT, PromptButton } from '@/objects/PromptButton';
import { TitleLockup } from '@/objects/TitleLockup';
import { SceneKeys, type PlayStart } from '@/scenes/scene-keys';
import { rgb, webAudio } from '@/scenes/ui';

// The title (M11 review 5): the grid stage, the lockup on its dark card
// (TitleLockup), and the Play button below it over its hint, centered as one
// block, with the sound switch in the corner. Space or Enter plays (a review
// asked that the mouse never be needed), and so does a click anywhere but on
// the sound switch, which inside the itch.io iframe also gives the page
// keyboard focus (PLAN.md §2). The arrow keys move the focus to the sound
// switch and back (MenuFocus), where Space or Enter flips it; the hint shows
// only while Play has the focus. Playing leads to the interactive tutorial.
// The menus' Standby starts here and plays on through the tutorial, once the
// browser lets audio play: on a fresh page, from the first key or click.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.void);
    // Boot, or the splash when it shows, hands over in the void's color.
    this.cameras.main.fadeIn(SPLASH.fadeMs, ...rgb(COLORS.void));
    new GridVoid(this);
    const audio = webAudio(this);
    if (audio !== null) startMenuMusic(audio.ctx, audio.destination);
    const lockup = new TitleLockup(this);
    const top = Math.round((GAME_HEIGHT - lockup.height - HINT_REACH) / 2);
    lockup.setPosition(Math.round((GAME_WIDTH - lockup.width) / 2), top);
    const button = new PromptButton(this, GAME_WIDTH / 2, buttonYBelow(top + lockup.height), 'PLAY');
    const hint = button.addHint(PRESS_HINT);

    let starting = false;
    const play = () => {
      if (starting) return;
      starting = true;
      window.focus();
      this.scene.start(SceneKeys.Play, { mode: 'tutorial' } satisfies PlayStart);
    };
    const mute = new MuteToggle(this);
    const playControl = { setFocusRing: (on: boolean) => button.setFocusRing(on), press: play };
    new MenuFocus(this, [playControl, mute], (control) => hint.setVisible(control === playControl));
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, over: readonly Phaser.GameObjects.GameObject[]) => {
      if (!over.includes(mute)) play();
    });
  }
}
