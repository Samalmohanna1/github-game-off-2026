import Phaser from 'phaser';
import {
  CHIP,
  CHIP_FONT_FAMILY,
  COLORS,
  GAME_WIDTH,
  MAX_LETTERS,
  SHIFT_MARK,
  STAGE_BOTTOM_Y,
  TEXT_COLORS,
  TRAY,
  TRAY_HEIGHT,
} from '@/config';
import { isUppercaseLetter, type SequenceView } from '@/logic/sequence';
import { drawBarLine } from '@/objects/bar-line';
import { keyCapShape } from '@/objects/keycap';
import { toVectors } from '@/objects/vectors';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

const CENTER_X = GAME_WIDTH / 2;
// The middle of the bar's row of key caps.
const BAR_ROW_Y = STAGE_BOTTOM_Y + TRAY.rowY;
const STEP = CHIP.size + CHIP.gap;
// From the center to the nearest chip on either side.
const SIDE_OFFSET = CHIP.currentSize / 2 + 2 * CHIP.gap + CHIP.size / 2;
// The caps' reach: every letter held, beside the current prompt's slot.
const ROW_HALF_WIDTH = SIDE_OFFSET + (MAX_LETTERS - 1) * STEP + CHIP.size / 2 + TRAY.padX;

type ChipKind = 'held' | 'current' | 'next' | 'slipped';

interface ChipLook {
  readonly fill: number;
  readonly text: keyof typeof TEXT_COLORS;
}

// Key caps in the bar (a review asked for a clearer bar), every one with a
// dark letter on a fill that says where it stands: bright cream for the
// current one (with a lime frame, addChip), faded white for the next and
// for slipped letters waiting their turn, faded green once held. (Until
// then: cream caps, held ones edged in lime, slipped ones coral, and the
// next a hollow outline.)
const LOOKS: Readonly<Record<ChipKind, ChipLook>> = {
  held: { fill: COLORS.chipHeld, text: 'ink' },
  current: { fill: COLORS.chipCurrent, text: 'ink' },
  next: { fill: COLORS.chipNext, text: 'ink' },
  slipped: { fill: COLORS.chipSlipped, text: 'ink' },
};

// A dropped letter's flash: it slides to its new place in line, shakes in a
// red edge, then settles.
const DROP_SHAKE_FROM = CHIP.slideMs;
const DROP_SETTLE_FROM = DROP_SHAKE_FROM + CHIP.drop.shakeMs;
const DROP_MS = DROP_SETTLE_FROM + CHIP.drop.settleMs;

interface ChipSpec {
  readonly letter: string;
  readonly kind: ChipKind;
  readonly x: number;
  readonly size: number;
}

// The Shift key's hollow up arrow, in a unit square. Drawn rather than typed so
// it never depends on a font having the ⇧ glyph.
const SHIFT_ARROW: readonly [number, number][] = [
  [0.5, 0],
  [1, 0.55],
  [0.72, 0.55],
  [0.72, 1],
  [0.28, 1],
  [0.28, 0.55],
  [0, 0.55],
];

// Letters flow right to left: the preview and slipped letters wait on the
// right, the current prompt sits in the center, and held letters line up on
// its left, the latest nearest the center (PLAN.md §3).
function layout(view: SequenceView): ChipSpec[] {
  const upcoming: ChipSpec[] = [
    ...(view.next !== null ? [{ letter: view.next, kind: 'next' as const }] : []),
    ...view.slipped.map((letter) => ({ letter, kind: 'slipped' as const })),
  ].map((chip, i) => ({ ...chip, x: CENTER_X + SIDE_OFFSET + i * STEP, size: CHIP.size }));
  const last = view.held.length - 1;
  return [
    ...view.held.map((letter, i) => ({
      letter,
      kind: 'held' as const,
      x: CENTER_X - SIDE_OFFSET - (last - i) * STEP,
      size: CHIP.size,
    })),
    ...(view.current !== null ? [{ letter: view.current, kind: 'current' as const, x: CENTER_X, size: CHIP.currentSize }] : []),
    ...upcoming,
  ];
}

// A square key cap, grown by `grow` on every side.
const capShape = (size: number, grow = 0) => keyCapShape(size, size, grow);

// Letters keep their case: uppercase means "hold Shift" (AGENTS.md). Capitals
// also carry the Shift mark, because case alone is hard to read in a lone chip
// (o/O, s/S, x/X differ only in size).
// The bar itself (M10b, after the mockup): a dark band under the runway with
// a thin stepped line along its foot, lime slashes at its left end, a faint
// socket for the current prompt, and at its right end one square per letter
// of the wall, lit lime as each is held.
export class PromptTray extends Phaser.GameObjects.Container {
  private chips: Phaser.GameObjects.Container[] = [];
  private readonly progress: Phaser.GameObjects.Graphics;
  private letters = 0;
  // Where each letter sat last time, and how big, so a moved chip can glide
  // from there.
  private lastLayout = new Map<string, ChipSpec>();
  // When each letter still flashing was dropped (scene time, ms). Chips are
  // rebuilt whenever the bar changes, so the flash runs from this, not from
  // the chip, and carries on across rebuilds.
  private readonly drops = new Map<string, number>();
  private shown = '';

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    const bar = new Phaser.GameObjects.Graphics(scene);
    drawBar(bar);
    this.progress = new Phaser.GameObjects.Graphics(scene);
    this.add([bar, this.progress]);
  }

  // A new wall: how many letters it asks for, one square each. Its letters
  // may repeat the last wall's, which mustn't glide or flash from there.
  setLetters(count: number): void {
    this.letters = count;
    this.shown = '';
    this.lastLayout.clear();
    this.drops.clear();
  }

  show(view: SequenceView): void {
    const key = JSON.stringify(view);
    if (key === this.shown) return;
    this.shown = key;
    this.drawProgress(view.held.length);

    for (const chip of this.chips) {
      this.scene.tweens.killTweensOf(chip);
      chip.destroy();
    }
    const specs = layout(view);
    const now = this.scene.time.now;
    for (const spec of specs) {
      if (spec.kind !== 'held' && this.lastLayout.get(spec.letter)?.kind === 'held') this.drops.set(spec.letter, now);
    }
    for (const [letter, at] of this.drops) {
      if (now - at >= DROP_MS || !specs.some((spec) => spec.letter === letter && spec.kind !== 'held')) this.drops.delete(letter);
    }
    this.chips = specs.map((spec) => this.addChip(spec, now));
    this.lastLayout = new Map(specs.map((spec) => [spec.letter, spec]));
  }

  // One square per letter, right-aligned at the bar's right end, the first
  // `held` of them lit.
  private drawProgress(held: number): void {
    const { size, gap, rightX, y } = TRAY.squares;
    const g = this.progress;
    g.clear();
    for (let i = 0; i < this.letters; i++) {
      const x = GAME_WIDTH - rightX - (this.letters - i) * size - (this.letters - 1 - i) * gap;
      g.fillStyle(i < held ? COLORS.trayAccent : COLORS.trayDim);
      g.fillRect(x, STAGE_BOTTOM_Y + y, size, size);
    }
  }

  // The cap (and its lime frame, if current), a dropped letter's flash over
  // it, the Shift mark and the letter, on a face that can shake inside the
  // chip while the chip itself slides.
  private addChip(spec: ChipSpec, now: number): Phaser.GameObjects.Container {
    const look = LOOKS[spec.kind];
    const cap = toVectors(capShape(spec.size));
    const base = new Phaser.GameObjects.Graphics(this.scene);
    base.fillStyle(look.fill);
    base.fillPoints(cap, true);
    if (spec.kind === 'current') {
      base.lineStyle(CHIP.focusWidth, COLORS.chipFocus);
      base.strokePoints(toVectors(capShape(spec.size, CHIP.focusGap)), true, true);
    }
    const face = new Phaser.GameObjects.Container(this.scene, 0, 0, [base]);

    const droppedAt = this.drops.get(spec.letter);
    const flash = droppedAt === undefined ? null : new Phaser.GameObjects.Graphics(this.scene);
    if (flash !== null) {
      flash.fillStyle(COLORS.chipHeld);
      flash.fillPoints(cap, true);
      flash.lineStyle(CHIP.drop.edgeWidth, COLORS.chipDropEdge);
      flash.strokePoints(cap, true, true);
      face.add(flash);
    }
    if (isUppercaseLetter(spec.letter)) {
      const mark = new Phaser.GameObjects.Graphics(this.scene);
      drawShiftMark(mark, spec.size, COLORS.chipShiftMark);
      face.add(mark);
    }
    face.add(
      new Phaser.GameObjects.Text(this.scene, 0, 0, spec.letter, {
        ...textStyle('chip', look.text, true),
        fontFamily: CHIP_FONT_FAMILY,
      }).setOrigin(0.5),
    );

    const chip = new Phaser.GameObjects.Container(this.scene, spec.x, BAR_ROW_Y, [face]);
    this.add(chip);
    this.animate(chip, spec);
    if (flash !== null && droppedAt !== undefined) this.playDrop(chip, face, flash, now - droppedAt);
    return chip;
  }

  // A dropped letter, `elapsed` ms after the drop: once at its new place in
  // line, it shows its held green in a red edge and shakes, then settles to
  // the look of its place, so it reads as "press this again". The flash
  // fades between two opaque fills, so the letter never loses contrast. No
  // shake for reduced motion; the edge and the fade stay.
  private playDrop(chip: Phaser.GameObjects.Container, face: Phaser.GameObjects.Container, flash: Phaser.GameObjects.Graphics, elapsed: number): void {
    const { px, swings, shakeMs, settleMs } = CHIP.drop;
    const still = prefersReducedMotion();
    const step = (t: number) => {
      const shake = (t - DROP_SHAKE_FROM) / shakeMs;
      face.setX(still || shake <= 0 || shake >= 1 ? 0 : px * Math.sin(shake * swings * 2 * Math.PI) * (1 - shake));
      flash.setAlpha(1 - Phaser.Math.Clamp((t - DROP_SETTLE_FROM) / settleMs, 0, 1));
    };
    step(elapsed);
    const run = this.scene.tweens.addCounter({
      from: elapsed,
      to: DROP_MS,
      duration: Math.max(0, DROP_MS - elapsed),
      onUpdate: (tween) => step(tween.getValue() ?? DROP_MS),
    });
    chip.once(Phaser.GameObjects.Events.DESTROY, () => run.stop());
  }

  // A chip that changed place glides there from its old spot, resizing as it
  // goes, and a letter just held pops into place. All still for reduced
  // motion.
  private animate(chip: Phaser.GameObjects.Container, spec: ChipSpec): void {
    const before = this.lastLayout.get(spec.letter);
    if (before === undefined || prefersReducedMotion()) return;
    const tweens = this.scene.tweens;
    if (before.x !== spec.x) {
      chip.setX(before.x);
      tweens.add({ targets: chip, x: spec.x, duration: CHIP.slideMs, ease: 'Quad.easeOut' });
    }
    if (spec.kind === 'held' && before.kind !== 'held') {
      chip.setScale(CHIP.popScale);
      tweens.add({ targets: chip, scale: 1, duration: CHIP.popMs, ease: 'Back.easeOut' });
    } else if (before.size !== spec.size) {
      chip.setScale(before.size / spec.size);
      tweens.add({ targets: chip, scale: 1, duration: CHIP.slideMs, ease: 'Quad.easeOut' });
    }
  }
}

function drawShiftMark(shape: Phaser.GameObjects.Graphics, chipSize: number, color: number): void {
  const markSize = chipSize * SHIFT_MARK.size;
  const inset = chipSize * SHIFT_MARK.inset;
  const left = chipSize / 2 - inset - markSize;
  const top = -chipSize / 2 + inset;
  shape.lineStyle(SHIFT_MARK.lineWidth, color);
  shape.strokePoints(
    SHIFT_ARROW.map(([u, v]) => new Phaser.Math.Vector2(left + u * markSize, top + v * markSize)),
    true,
  );
}

// The band, its stepped line, the left slashes and the current prompt's socket.
function drawBar(g: Phaser.GameObjects.Graphics): void {
  const top = STAGE_BOTTOM_Y;
  g.fillStyle(COLORS.tray);
  g.fillRect(0, top, GAME_WIDTH, TRAY_HEIGHT);
  const tint = COLORS.voidGlow;
  g.fillGradientStyle(tint, tint, tint, tint, TRAY.tintAlpha, TRAY.tintAlpha, 0, 0);
  g.fillRect(0, top, GAME_WIDTH, TRAY.tintHeight);

  const [low, high] = [top + TRAY.lowY, top + TRAY.highY];
  const line = [
    { x: TRAY.lineFromX, y: high },
    { x: CENTER_X - ROW_HALF_WIDTH - TRAY.ramp, y: high },
    { x: CENTER_X - ROW_HALF_WIDTH, y: low },
    { x: CENTER_X + ROW_HALF_WIDTH, y: low },
    { x: CENTER_X + ROW_HALF_WIDTH + TRAY.ramp, y: high },
    { x: GAME_WIDTH - TRAY.lineEndInset, y: high },
  ];
  drawBarLine(g, line);

  const outline = capShape(CHIP.currentSize, CHIP.focusGap).map((p) => ({ x: p.x + CENTER_X, y: p.y + BAR_ROW_Y }));
  g.lineStyle(TRAY.socketWidth, COLORS.trayLine, TRAY.socketAlpha);
  g.strokePoints(toVectors(outline), true, true);
}
