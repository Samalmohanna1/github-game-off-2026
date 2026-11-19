import Phaser from 'phaser';
import { COLORS, FOCUS_RING } from '@/config';
import { keyCapRect } from '@/logic/convex';
import { focusStep, isPressKey, stepFocus } from '@/logic/menu-keys';
import { toVectors } from '@/objects/vectors';
import { onWindowKeys } from '@/scenes/ui';

// The focus ring round a key cap shape `width` by `height` centered on 0, 0,
// its corners cut by `cut`: an outline FOCUS_RING.gap px outside `reach`,
// which is how far the control's edge (and any pulse) reaches past the shape.
export function drawFocusRing(g: Phaser.GameObjects.Graphics, width: number, height: number, cut: number, reach: number): void {
  const grow = reach + FOCUS_RING.gap + FOCUS_RING.width / 2;
  g.lineStyle(FOCUS_RING.width, COLORS.focusRing);
  g.strokePoints(toVectors(keyCapRect(-width / 2, -height / 2, width, height, cut, grow)), true, true);
}

export interface Focusable {
  setFocusRing(on: boolean): void;
  // What Space or Enter does with the focus on it.
  press(): void;
}

// Keyboard focus for a screen with more than one control (the title): the
// first control has the focus, Space or Enter presses the focused one, and
// the arrow keys move the focus among them, wrapping round. The ring only
// shows once the arrows have moved it, as a browser shows a focus ring only
// to keyboard users, so the screen looks as it always did until then.
// onFocus hears each move.
export class MenuFocus {
  private index = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly controls: readonly Focusable[],
    private readonly onFocus: (control: Focusable) => void = () => {},
  ) {
    onWindowKeys(scene, {
      down: (event) => {
        if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
        const step = focusStep(event.code);
        if (step !== 0) this.move(step);
        else if (isPressKey(event.code)) this.focused.press();
      },
      up: () => {},
      blur: () => {},
    });
  }

  get focused(): Focusable {
    const control = this.controls[this.index];
    if (control === undefined) throw new Error('MenuFocus has no controls');
    return control;
  }

  private move(step: -1 | 1): void {
    this.focused.setFocusRing(false);
    this.index = stepFocus(this.index, this.controls.length, step);
    this.focused.setFocusRing(true);
    this.onFocus(this.focused);
  }
}
