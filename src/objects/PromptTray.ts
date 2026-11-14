import Phaser from 'phaser';
import {
  CHIP,
  CHIP_FONT_FAMILY,
  COLORS,
  GAME_WIDTH,
  MAX_LETTERS,
  SHIFT_MARK,
  SLASH,
  STAGE_BOTTOM_Y,
  TEXT_COLORS,
  TRAY,
  TRAY_HEIGHT,
} from '@/config';
import { chamferedRect } from '@/logic/convex';
import type { Point } from '@/logic/perspective';
import { isUppercaseLetter, type SequenceView } from '@/logic/sequence';
import { fillSlash } from '@/objects/slash';
import { toVectors } from '@/objects/vectors';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

const CENTER_X = GAME_WIDTH / 2;
const MID_Y = STAGE_BOTTOM_Y + TRAY.rowY;
const STEP = CHIP.size + CHIP.gap;
// From the center to the nearest chip on either side.
const SIDE_OFFSET = CHIP.currentSize / 2 + 2 * CHIP.gap + CHIP.size / 2;
// The caps' reach: every letter held, beside the current prompt's slot.
const ROW_HALF_WIDTH = SIDE_OFFSET + (MAX_LETTERS - 1) * STEP + CHIP.size / 2 + TRAY.padX;

type ChipKind = 'held' | 'current' | 'next' | 'slipped';

interface ChipLook {
  readonly fill: number;
  readonly edge: { readonly color: number; readonly width: number } | null;
  readonly text: keyof typeof TEXT_COLORS;
  readonly mark: number;
}

// Key caps in the bar (M10b review): cream with dark letters, edged in
// lime once held, coral when slipped, and a hollow cream outline for the
// preview. The current cap gets a lime frame round it (addChip).
const LOOKS: Readonly<Record<ChipKind, ChipLook>> = {
  held: {
    fill: COLORS.chipHeld,
    edge: { color: COLORS.chipHeldEdge, width: CHIP.heldEdgeWidth },
    text: 'ink',
    mark: COLORS.chipShiftMark,
  },
  current: { fill: COLORS.chipCurrent, edge: null, text: 'ink', mark: COLORS.chipShiftMark },
  next: {
    fill: COLORS.chipNext,
    edge: { color: COLORS.chipNextEdge, width: CHIP.nextEdgeWidth },
    text: 'light',
    mark: COLORS.chipNextEdge,
  },
  slipped: { fill: COLORS.chipSlipped, edge: null, text: 'ink', mark: COLORS.chipShiftMark },
};

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

// A square with its top-left and bottom-right corners cut, centered on 0, 0.
// `grow` pushes every edge out by that much, keeping the cuts parallel.
function capShape(size: number, grow = 0): Point[] {
  const half = size / 2 + grow;
  // An edge pushed out by g lengthens a 45-degree cut by g * (2 - sqrt 2).
  const cut = CHIP.cut + grow * (2 - Math.SQRT2);
  return chamferedRect(-half, -half, 2 * half, 2 * half, { topLeft: cut, bottomRight: cut });
}

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
  private shown = '';

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    const bar = new Phaser.GameObjects.Graphics(scene);
    drawBar(bar);
    this.progress = new Phaser.GameObjects.Graphics(scene);
    this.add([bar, this.progress]);
  }

  // A new wall: how many letters it asks for, one square each.
  setLetters(count: number): void {
    this.letters = count;
    this.shown = '';
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
    this.chips = specs.map((spec) => this.addChip(spec));
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

  private addChip(spec: ChipSpec): Phaser.GameObjects.Container {
    const look = LOOKS[spec.kind];
    const shape = new Phaser.GameObjects.Graphics(this.scene);
    const cap = toVectors(capShape(spec.size));
    shape.fillStyle(look.fill);
    shape.fillPoints(cap, true);
    if (look.edge !== null) {
      shape.lineStyle(look.edge.width, look.edge.color);
      shape.strokePoints(cap, true, true);
    }
    if (spec.kind === 'current') {
      shape.lineStyle(CHIP.focusWidth, COLORS.chipFocus);
      shape.strokePoints(toVectors(capShape(spec.size, CHIP.focusGap)), true, true);
    }
    if (isUppercaseLetter(spec.letter)) drawShiftMark(shape, spec.size, look.mark);

    const text = new Phaser.GameObjects.Text(this.scene, 0, 0, spec.letter, {
      ...textStyle('chip', look.text, true),
      fontFamily: CHIP_FONT_FAMILY,
    }).setOrigin(0.5);

    const chip = new Phaser.GameObjects.Container(this.scene, spec.x, MID_Y, [shape, text]);
    this.add(chip);
    this.animate(chip, spec);
    return chip;
  }

  // A chip that changed place glides there from its old spot, resizing as it
  // goes. Feedback on top: a letter just held pops into place, and one just
  // slipped wobbles. All still for reduced motion.
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
    if (spec.kind === 'slipped' && before.kind !== 'slipped') {
      const { deg, ms, swings } = CHIP.wobble;
      const wobble = tweens.addCounter({
        from: 0,
        to: 1,
        duration: ms,
        onUpdate: (tween) => {
          const p = tween.getValue() ?? 1;
          chip.setAngle(deg * Math.sin(p * swings * 2 * Math.PI) * (1 - p));
        },
      });
      chip.once(Phaser.GameObjects.Events.DESTROY, () => wobble.stop());
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
  g.lineStyle(TRAY.lineWidth, COLORS.trayLine, TRAY.lineAlpha);
  g.strokePoints(toVectors(line));

  const slash = { y: top + TRAY.slashY, width: SLASH.width, height: SLASH.height, lean: SLASH.lean, slices: 1 };
  const firstX = TRAY.lineFromX - SLASH.gap - 2 * SLASH.width - SLASH.gap + SLASH.lean;
  for (const x of [firstX, firstX + SLASH.width + SLASH.gap]) {
    fillSlash(g, { ...slash, x, top: COLORS.trayAccent, foot: COLORS.trayAccent });
  }

  const socket = capShape(CHIP.currentSize, CHIP.focusGap).map((p) => ({ x: p.x + CENTER_X, y: p.y + MID_Y }));
  g.lineStyle(TRAY.socketWidth, COLORS.trayLine, TRAY.socketAlpha);
  g.strokePoints(toVectors(socket), true, true);
}
