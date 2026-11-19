import Phaser from 'phaser';
import { RestartGate } from '@/logic/restart';
import { PromptButton } from '@/objects/PromptButton';
import { onWindowKeys } from '@/scenes/ui';

export interface GatedPromptText {
  readonly button: string;
  // The hint while keys from before are still held.
  readonly waiting: string;
  readonly ready: string;
}

// A button that waits (PLAN.md §7, RestartGate): nothing shows for the
// lockout, then the `waiting` hint until every key held from before is let
// go, then the button over the `ready` hint; a fresh key or a click then
// calls onGo, once. Play again on the game over, and Start on the
// tutorial's last step.
export class GatedPrompt {
  private readonly gate: RestartGate;
  private readonly button: PromptButton;
  private readonly hint: Phaser.GameObjects.Text;
  private gone = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly text: GatedPromptText,
    keysDown: Iterable<string>,
    lockoutMs: number | undefined,
    private readonly onGo: () => void,
  ) {
    this.gate = new RestartGate(keysDown, lockoutMs);
    this.button = new PromptButton(scene, x, y, text.button).setVisible(false);
    this.hint = this.button.addHint('').setVisible(false);

    scene.input.on('pointerdown', () => {
      if (this.gate.click()) this.go();
    });
    onWindowKeys(scene, {
      down: (event) => {
        if (event.repeat) this.gate.holding(event.code);
        else if (this.gate.press(event.code)) this.go();
      },
      up: (event) => this.gate.release(event.code),
      blur: () => this.gate.forgetKeys(),
    });
    const tick = (_time: number, deltaMs: number) => this.update(deltaMs);
    scene.events.on(Phaser.Scenes.Events.UPDATE, tick);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, tick));
  }

  setDepth(depth: number): this {
    this.button.setDepth(depth);
    this.hint.setDepth(depth);
    return this;
  }

  private update(deltaMs: number): void {
    this.gate.tick(deltaMs);
    this.button.setVisible(this.gate.ready);
    this.hint.setVisible(this.gate.lockoutOver);
    this.hint.setText(this.gate.ready ? this.text.ready : this.text.waiting);
  }

  private go(): void {
    if (this.gone) return;
    this.gone = true;
    this.onGo();
  }
}
