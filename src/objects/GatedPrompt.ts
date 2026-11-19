import Phaser from 'phaser';
import { COLORS, DARK_CARD, HINT_CARD } from '@/config';
import { RestartGate } from '@/logic/restart';
import { fillEdgedKeyCap } from '@/objects/keycap';
import { PromptButton } from '@/objects/PromptButton';
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
  readonly onGo: () => void;
}

// A button that waits (PLAN.md §7, RestartGate): nothing shows for the
// lockout, then the `waiting` hint until every key held from before is let
// go, then the button over the `ready` hint; a fresh key or a click then
// calls onGo, once. Play again on the game over, and Start on the
// tutorial's last step.
export class GatedPrompt {
  private readonly gate: RestartGate;
  private readonly button: PromptButton;
  private readonly hintCard: Phaser.GameObjects.Graphics | null;
  private readonly hint: Phaser.GameObjects.Text;
  private gone = false;

  constructor(
    scene: Phaser.Scene,
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
    this.hintCard?.setDepth(depth);
    this.hint.setDepth(depth);
    return this;
  }

  private update(deltaMs: number): void {
    this.gate.tick(deltaMs);
    this.button.setVisible(this.gate.ready);
    const label = this.gate.ready ? this.text.ready : this.text.waiting;
    if (label !== this.hint.text) {
      this.hint.setText(label);
      this.drawHintCard();
    }
    this.hint.setVisible(this.gate.lockoutOver);
    this.hintCard?.setVisible(this.gate.lockoutOver);
  }

  // A dark card fitted to the hint's words, cut and edged like the others.
  private drawHintCard(): void {
    if (this.hintCard === null) return;
    const { height, padX, cut } = HINT_CARD;
    const width = this.hint.width + 2 * padX;
    this.hintCard.clear();
    fillEdgedKeyCap(this.hintCard, {
      x: this.hint.x - width / 2,
      y: this.hint.y - height / 2,
      width,
      height,
      cut,
      edgeWidth: DARK_CARD.edgeWidth,
      edge: COLORS.darkCardEdge,
      fill: COLORS.darkCard,
    });
  }

  private go(): void {
    if (this.gone) return;
    this.gone = true;
    this.options.onGo();
  }
}
