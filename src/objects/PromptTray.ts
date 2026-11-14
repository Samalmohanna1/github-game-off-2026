import Phaser from 'phaser';
import {
  CHIP,
  CHIP_FONT_FAMILY,
  COLORS,
  CONSOLE,
  GAME_WIDTH,
  MAX_LETTERS,
  SHIFT_MARK,
  STAGE_BOTTOM_Y,
  TEXT_COLORS,
  TRAY_HEIGHT,
} from '@/config';
import { chamferedRect } from '@/logic/convex';
import type { Point } from '@/logic/perspective';
import { isUppercaseLetter, type SequenceView } from '@/logic/sequence';
import { drawPanel } from '@/objects/panel';
import { toVectors } from '@/objects/vectors';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

const CENTER_X = GAME_WIDTH / 2;
const MID_Y = STAGE_BOTTOM_Y + TRAY_HEIGHT / 2;
const STEP = CHIP.size + CHIP.gap;
// From the center to the nearest chip on either side.
const SIDE_OFFSET = CHIP.currentSize / 2 + 2 * CHIP.gap + CHIP.size / 2;
// Wide enough for every letter held, beside the current prompt's slot.
const CONSOLE_HALF_WIDTH = SIDE_OFFSET + (MAX_LETTERS - 1) * STEP + CHIP.size / 2 + CONSOLE.padX;

type ChipKind = 'held' | 'current' | 'next' | 'slipped';

interface ChipLook {
  readonly fill: number;
  readonly edge: number | null;
  readonly text: keyof typeof TEXT_COLORS;
  readonly mark: number;
}

// Key caps on the console (M10b): cream for the current letter, lime once
// held, coral when slipped, and a hollow cream outline for the preview.
const LOOKS: Readonly<Record<ChipKind, ChipLook>> = {
  held: { fill: COLORS.chipHeld, edge: null, text: 'ink', mark: COLORS.chipShiftMark },
  current: { fill: COLORS.chipCurrent, edge: null, text: 'ink', mark: COLORS.chipShiftMark },
  next: { fill: COLORS.chipNext, edge: COLORS.chipNextEdge, text: 'light', mark: COLORS.chipNextEdge },
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
// (o/O, s/S, x/X differ only in size). The console's center socket is the
// current prompt's slot; a prompt there gets a lime frame over it.
export class PromptTray extends Phaser.GameObjects.Container {
  private chips: Phaser.GameObjects.Container[] = [];
  // Where each letter sat last time, and how big, so a moved chip can glide
  // from there.
  private lastLayout = new Map<string, ChipSpec>();
  private shown = '';

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    const panel = new Phaser.GameObjects.Graphics(scene);
    const height = CONSOLE.height;
    const shape = chamferedRect(CENTER_X - CONSOLE_HALF_WIDTH, MID_Y - height / 2, 2 * CONSOLE_HALF_WIDTH, height, {
      topLeft: CONSOLE.cut,
      bottomRight: CONSOLE.cut,
    });
    drawPanel(panel, shape, { side: 'top', fromEnd: true, length: CONSOLE.accentLength });
    const socket = capShape(CHIP.currentSize, CHIP.focusGap).map((p) => ({ x: p.x + CENTER_X, y: p.y + MID_Y }));
    panel.lineStyle(CONSOLE.socketWidth, COLORS.panelEdge);
    panel.strokePoints(toVectors(socket), true, true);
    this.add(panel);
  }

  show(view: SequenceView): void {
    const key = JSON.stringify(view);
    if (key === this.shown) return;
    this.shown = key;

    for (const chip of this.chips) {
      this.scene.tweens.killTweensOf(chip);
      chip.destroy();
    }
    const specs = layout(view);
    this.chips = specs.map((spec) => this.addChip(spec));
    this.lastLayout = new Map(specs.map((spec) => [spec.letter, spec]));
  }

  private addChip(spec: ChipSpec): Phaser.GameObjects.Container {
    const look = LOOKS[spec.kind];
    const shape = new Phaser.GameObjects.Graphics(this.scene);
    const cap = toVectors(capShape(spec.size));
    shape.fillStyle(look.fill);
    shape.fillPoints(cap, true);
    if (look.edge !== null) {
      shape.lineStyle(CHIP.nextEdgeWidth, look.edge);
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
