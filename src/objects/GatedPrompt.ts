import Phaser from 'phaser';
import { RestartGate } from '@/logic/restart';
import { fitHintCard, PromptButton } from '@/objects/PromptButton';
import { onWindowKeys } from '@/scenes/ui';

export interface GatedPromptText {
  readonly button: string;
  // The hint while keys from before are still held.
  readonly waiting: string;
  readonly ready: string;
}

export interface GatedPromptOptions {
  readonly keysDown: Iterable<string>;
  // RESTART_LOCKOUT when left out.
  readonly lockoutMs?: number;
  // Over the cream runway the cream hint would vanish, so it sits on a
  // small dark card (HINT_CARD).
  readonly hintOnCard?: boolean;
  // Whether a click presses it too (yes when left out). Play again takes
  // only Space or Enter, at the user's request.
  readonly clicks?: boolean;
  readonly onGo: () => void;
}

// A button that waits (PLAN.md §7, RestartGate): nothing shows for the
// lockout, then the `waiting` hint until every key held from before is let
// go, then the button over the `ready` hint; a fresh Space or Enter (or a
// click, unless `clicks` is false) then calls onGo, once. Play again on the
// game over, and Start on the tutorial's last step.
export class GatedPrompt {
  private readonly gate: RestartGate;
  private readonly button: PromptButton;
  private readonly hintCard: Phaser.GameObjects.Graphics | null;
  private readonly hint: Phaser.GameObjects.Text;
  private gone = false;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly text: GatedPromptText,
    private readonly options: GatedPromptOptions,
  ) {
    this.gate = new RestartGate(options.keysDown, options.lockoutMs);
    this.button = new PromptButton(scene, x, y, text.button).setVisible(false);
    // Added before the hint, so it draws under it at the same depth.
    this.hintCard = options.hintOnCard === true ? scene.add.graphics().setVisible(false) : null;
    this.hint = this.button.addHint('').setVisible(false);

    if (options.clicks !== false) {
      scene.input.on('pointerdown', () => {
        if (this.gate.click()) this.go();
      });
    }
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
    this.hintCard?.setDepth(depth);
    this.hint.setDepth(depth);
    return this;
  }

  // Fades away, and no longer answers keys or clicks.
  fadeOut(ms: number): void {
    this.gone = true;
    const parts: Phaser.GameObjects.GameObject[] = [this.button, this.hint];
    if (this.hintCard !== null) parts.push(this.hintCard);
    this.scene.tweens.add({ targets: parts, alpha: 0, duration: ms });
  }

  private update(deltaMs: number): void {
    this.gate.tick(deltaMs);
    this.button.setVisible(this.gate.ready);
    const label = this.gate.ready ? this.text.ready : this.text.waiting;
    if (label !== this.hint.text) {
      this.hint.setText(label);
      if (this.hintCard !== null) fitHintCard(this.hintCard, this.hint);
    }
    this.hint.setVisible(this.gate.lockoutOver);
    this.hintCard?.setVisible(this.gate.lockoutOver);
  }

  private go(): void {
    if (this.gone) return;
    this.gone = true;
    this.options.onGo();
  }
}
